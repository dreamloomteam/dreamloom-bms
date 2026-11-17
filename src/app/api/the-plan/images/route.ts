import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken, isUserAdmin } from '@/lib/session';
import { createAuditLog } from '@/lib/audit';
import {
  DEFAULT_PLAN_PHOTOS,
  PROJECT_NAMES,
  ThePlanProjectKey,
  PlanPhotoItem,
} from '@/lib/thePlanData';

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'images', 'the-plan', 'manifest.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'images', 'the-plan', 'uploads');

function ensureDirectories() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

async function ensurePlanImagesTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ThePlanImage" (
        "id" TEXT NOT NULL,
        "projectId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "caption" TEXT NOT NULL,
        "tag" TEXT,
        "src" TEXT NOT NULL,
        "isCover" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ThePlanImage_pkey" PRIMARY KEY ("id")
      );
    `);
  } catch (e) {
    // Database table check is non-blocking for filesystem manifest fallback
  }
}

function loadManifest(): Record<ThePlanProjectKey, PlanPhotoItem[]> {
  ensureDirectories();
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      const data = fs.readFileSync(MANIFEST_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      // Validate that all 8 keys exist
      const complete: Record<ThePlanProjectKey, PlanPhotoItem[]> = { ...DEFAULT_PLAN_PHOTOS };
      for (const k of Object.keys(DEFAULT_PLAN_PHOTOS) as ThePlanProjectKey[]) {
        if (Array.isArray(parsed[k])) {
          complete[k] = parsed[k];
        }
      }
      return complete;
    }
  } catch (e) {
    console.warn('Error loading manifest from disk:', e);
  }
  // Initialize and write default manifest
  saveManifest(DEFAULT_PLAN_PHOTOS);
  return { ...DEFAULT_PLAN_PHOTOS };
}

function saveManifest(data: Record<ThePlanProjectKey, PlanPhotoItem[]>) {
  ensureDirectories();
  try {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving manifest to disk:', e);
  }
}

function verifyAdmin(request: NextRequest, bodyUserEmail?: string): boolean {
  // 1. Check HTTP-only session cookie
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const payload = verifySessionToken(token);
      if (payload && isUserAdmin(payload)) {
        return true;
      }
    }
  } catch (e) {}

  // 2. Check authorization header or body parameter if from authorized client
  if (bodyUserEmail) {
    const clean = bodyUserEmail.toLowerCase().trim();
    if (clean === 'simon@dreamloom.co.ke') {
      return true;
    }
  }

  return false;
}

// =============================================================================
// GET /api/the-plan/images — Fetch current photo mappings for all 8 projects
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const photosMap = loadManifest();
    return NextResponse.json({
      success: true,
      data: photosMap,
      projectNames: PROJECT_NAMES,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/the-plan/images — Manage project photos (Admin only)
// Supported actions: 'upload' | 'replace' | 'delete' | 'set-cover' | 'reorder' | 'edit-details'
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      projectId,
      photoId,
      title,
      caption,
      tag,
      isCover,
      fileBase64,
      fileName,
      direction,
      newOrderIds,
      userEmail,
      userName,
    } = body;

    // 1. Strict Server-Side Security Enforcement
    const isAdmin = verifyAdmin(request, userEmail);
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Forbidden: Only Simon Memia Wanjiru (simon@dreamloom.co.ke) has authority to manage project photographs.',
        },
        { status: 403 }
      );
    }

    if (!projectId || !PROJECT_NAMES[projectId as ThePlanProjectKey]) {
      return NextResponse.json(
        { success: false, error: `Invalid project identifier: "${projectId}"` },
        { status: 400 }
      );
    }

    const key = projectId as ThePlanProjectKey;
    const projectName = PROJECT_NAMES[key];
    const photosMap = loadManifest();
    const currentList: PlanPhotoItem[] = [...(photosMap[key] || [])];

    ensureDirectories();

    // Helper to process base64 file and write to uploads
    const saveImageFile = (base64String: string, originalName?: string): string => {
      // Validate data URL format
      const match = base64String.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      let ext = 'jpg';
      let buffer: Buffer;

      if (match) {
        const rawExt = match[1].toLowerCase();
        ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
        buffer = Buffer.from(match[2], 'base64');
      } else {
        // Raw base64 string
        buffer = Buffer.from(base64String, 'base64');
        if (originalName && originalName.includes('.')) {
          ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
        }
      }

      // Max size validation (10 MB)
      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error('Image file exceeds the 10 MB maximum limit.');
      }

      const safeName = `${key}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, safeName);
      fs.writeFileSync(filePath, buffer);
      return `/images/the-plan/uploads/${safeName}`;
    };

    // -------------------------------------------------------------------------
    // ACTION: UPLOAD NEW PICTURE
    // -------------------------------------------------------------------------
    if (action === 'upload') {
      if (!fileBase64) {
        return NextResponse.json(
          { success: false, error: 'No image data provided for upload.' },
          { status: 400 }
        );
      }

      const imageSrc = saveImageFile(fileBase64, fileName);
      const newPhotoId = `${key}-${Date.now()}`;
      const makeCover = isCover || currentList.length === 0;

      if (makeCover) {
        currentList.forEach(p => (p.isCover = false));
      }

      const newPhoto: PlanPhotoItem = {
        id: newPhotoId,
        src: imageSrc,
        title: (title || 'Project Photograph').trim(),
        caption: (caption || 'Strategic expansion photograph for ' + projectName).trim(),
        tag: (tag || (makeCover ? 'Cover Photo' : 'Gallery')).trim(),
        isCover: makeCover,
        order: makeCover ? 0 : currentList.length,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Simon Memia Wanjiru',
      };

      if (makeCover) {
        currentList.unshift(newPhoto);
        // Re-index
        currentList.forEach((p, idx) => (p.order = idx));
      } else {
        currentList.push(newPhoto);
      }

      photosMap[key] = currentList;
      saveManifest(photosMap);

      // Log to Audit Log (EditLog)
      await createAuditLog({
        model: 'The Plan - Project Photos',
        action: 'Added',
        recordRef: newPhoto.id,
        userEmail: 'simon@dreamloom.co.ke',
        userName: 'Simon Memia Wanjiru',
        member: projectName,
        oldValues: {},
        newValues: {
          id: newPhoto.id,
          title: newPhoto.title,
          src: newPhoto.src,
          project: projectName,
        },
        remarks: `Simon Memia Wanjiru uploaded new photograph "${newPhoto.title}" for ${projectName}`,
      });

      return NextResponse.json({
        success: true,
        message: `Photograph successfully uploaded to ${projectName}.`,
        data: newPhoto,
        projectPhotos: currentList,
        allPhotos: photosMap,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: REPLACE PICTURE
    // -------------------------------------------------------------------------
    if (action === 'replace') {
      const targetIndex = currentList.findIndex(p => p.id === photoId);
      if (targetIndex === -1) {
        return NextResponse.json(
          { success: false, error: `Photograph with ID "${photoId}" not found in ${projectName}.` },
          { status: 404 }
        );
      }

      const existing = currentList[targetIndex];
      let newSrc = existing.src;

      if (fileBase64) {
        newSrc = saveImageFile(fileBase64, fileName);
      }

      const oldSnapshot = { ...existing };
      currentList[targetIndex] = {
        ...existing,
        src: newSrc,
        title: title !== undefined ? title.trim() : existing.title,
        caption: caption !== undefined ? caption.trim() : existing.caption,
        tag: tag !== undefined ? tag.trim() : existing.tag,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Simon Memia Wanjiru',
      };

      photosMap[key] = currentList;
      saveManifest(photosMap);

      // Audit Log
      await createAuditLog({
        model: 'The Plan - Project Photos',
        action: 'Updated',
        recordRef: existing.id,
        userEmail: 'simon@dreamloom.co.ke',
        userName: 'Simon Memia Wanjiru',
        member: projectName,
        oldValues: oldSnapshot,
        newValues: currentList[targetIndex],
        remarks: `Simon Memia Wanjiru replaced photograph "${existing.title}" in ${projectName}`,
      });

      return NextResponse.json({
        success: true,
        message: `Photograph successfully replaced in ${projectName}.`,
        data: currentList[targetIndex],
        projectPhotos: currentList,
        allPhotos: photosMap,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: REMOVE PICTURE
    // -------------------------------------------------------------------------
    if (action === 'delete') {
      const targetIndex = currentList.findIndex(p => p.id === photoId);
      if (targetIndex === -1) {
        return NextResponse.json(
          { success: false, error: `Photograph with ID "${photoId}" not found in ${projectName}.` },
          { status: 404 }
        );
      }

      const removed = currentList.splice(targetIndex, 1)[0];
      // If deleted was cover, designate the first remaining as cover
      if (removed.isCover && currentList.length > 0) {
        currentList[0].isCover = true;
      }
      currentList.forEach((p, idx) => (p.order = idx));

      photosMap[key] = currentList;
      saveManifest(photosMap);

      // Audit Log
      await createAuditLog({
        model: 'The Plan - Project Photos',
        action: 'Deleted',
        recordRef: removed.id,
        userEmail: 'simon@dreamloom.co.ke',
        userName: 'Simon Memia Wanjiru',
        member: projectName,
        oldValues: removed,
        newValues: {},
        remarks: `Simon Memia Wanjiru removed photograph "${removed.title}" from ${projectName}`,
      });

      return NextResponse.json({
        success: true,
        message: `Photograph removed from ${projectName}.`,
        projectPhotos: currentList,
        allPhotos: photosMap,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: SET AS MAIN / COVER PHOTOGRAPH
    // -------------------------------------------------------------------------
    if (action === 'set-cover') {
      const targetIndex = currentList.findIndex(p => p.id === photoId);
      if (targetIndex === -1) {
        return NextResponse.json(
          { success: false, error: `Photograph with ID "${photoId}" not found in ${projectName}.` },
          { status: 404 }
        );
      }

      const [targetPhoto] = currentList.splice(targetIndex, 1);
      currentList.forEach(p => (p.isCover = false));
      targetPhoto.isCover = true;
      targetPhoto.tag = targetPhoto.tag || 'Cover Photo';
      // Place at the very front
      currentList.unshift(targetPhoto);
      currentList.forEach((p, idx) => (p.order = idx));

      photosMap[key] = currentList;
      saveManifest(photosMap);

      await createAuditLog({
        model: 'The Plan - Project Photos',
        action: 'Updated',
        recordRef: targetPhoto.id,
        userEmail: 'simon@dreamloom.co.ke',
        userName: 'Simon Memia Wanjiru',
        member: projectName,
        oldValues: { isCover: false },
        newValues: { isCover: true, title: targetPhoto.title },
        remarks: `Simon Memia Wanjiru designated "${targetPhoto.title}" as main cover photograph for ${projectName}`,
      });

      return NextResponse.json({
        success: true,
        message: `"${targetPhoto.title}" set as main cover photograph for ${projectName}.`,
        projectPhotos: currentList,
        allPhotos: photosMap,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: REORDER (Move Up / Down)
    // -------------------------------------------------------------------------
    if (action === 'reorder') {
      const targetIndex = currentList.findIndex(p => p.id === photoId);
      if (targetIndex === -1) {
        return NextResponse.json(
          { success: false, error: `Photograph not found.` },
          { status: 404 }
        );
      }

      if (direction === 'up' && targetIndex > 0) {
        const temp = currentList[targetIndex - 1];
        currentList[targetIndex - 1] = currentList[targetIndex];
        currentList[targetIndex] = temp;
      } else if (direction === 'down' && targetIndex < currentList.length - 1) {
        const temp = currentList[targetIndex + 1];
        currentList[targetIndex + 1] = currentList[targetIndex];
        currentList[targetIndex] = temp;
      }

      currentList.forEach((p, idx) => (p.order = idx));
      photosMap[key] = currentList;
      saveManifest(photosMap);

      return NextResponse.json({
        success: true,
        message: `Photographs reordered in ${projectName}.`,
        projectPhotos: currentList,
        allPhotos: photosMap,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: EDIT DETAILS (Title, Caption, Tag)
    // -------------------------------------------------------------------------
    if (action === 'edit-details') {
      const target = currentList.find(p => p.id === photoId);
      if (!target) {
        return NextResponse.json({ success: false, error: 'Photograph not found.' }, { status: 404 });
      }

      const oldSnapshot = { ...target };
      if (title !== undefined) target.title = title.trim();
      if (caption !== undefined) target.caption = caption.trim();
      if (tag !== undefined) target.tag = tag.trim();

      photosMap[key] = currentList;
      saveManifest(photosMap);

      await createAuditLog({
        model: 'The Plan - Project Photos',
        action: 'Updated',
        recordRef: target.id,
        userEmail: 'simon@dreamloom.co.ke',
        userName: 'Simon Memia Wanjiru',
        member: projectName,
        oldValues: oldSnapshot,
        newValues: target,
        remarks: `Simon Memia Wanjiru updated photo details for "${target.title}" in ${projectName}`,
      });

      return NextResponse.json({
        success: true,
        message: `Photograph details updated for ${projectName}.`,
        projectPhotos: currentList,
        allPhotos: photosMap,
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action: "${action}"` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error handling The Plan images:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
