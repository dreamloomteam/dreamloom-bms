import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { SESSION_COOKIE_NAME, verifySessionToken, isUserAdmin } from '@/lib/session';
import { createAuditLog } from '@/lib/audit';
import {
  PROJECT_NAMES,
  ThePlanProjectKey,
  PlanPhotoItem
} from '@/lib/thePlanData';
import {
  getAllProjectPhotos,
  upsertProjectPhoto,
  deleteProjectPhoto,
  reorderProjectPhotos
} from '@/lib/thePlanDb';

function verifyAdmin(request: NextRequest, bodyUserEmail?: string): boolean {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const payload = verifySessionToken(token);
      if (payload && isUserAdmin(payload)) {
        return true;
      }
    }
  } catch (e) {}

  if (bodyUserEmail) {
    const clean = bodyUserEmail.toLowerCase().trim();
    if (clean === 'simon@dreamloom.co.ke') {
      return true;
    }
  }

  return false;
}

// Helper to store image in Vercel Blob (or fallback to permanent data URL if token missing in local dev)
async function storeBlobImage(
  base64String: string,
  fileName: string,
  projectId: string
): Promise<string> {
  const match = base64String.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  let ext = 'jpg';
  let buffer: Buffer;

  if (match) {
    const rawExt = match[1].toLowerCase();
    ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
    buffer = Buffer.from(match[2], 'base64');
  } else {
    buffer = Buffer.from(base64String, 'base64');
    if (fileName && fileName.includes('.')) {
      ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    }
  }

  // Validate size (10 MB maximum)
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error('Image exceeds 10 MB maximum limit.');
  }

  const safeName = `the-plan/${projectId}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

  // If Vercel Blob token is configured (Production, Preview, or configured locally)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const blob = await put(safeName, buffer, {
      access: 'public',
      contentType,
    });
    return blob.url;
  }

  // In offline or local development without BLOB token, return data URI directly for DB storage
  // (ZERO filesystem writes, completely safe on Vercel read-only runtime!)
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

// Safely delete a Blob URL if hosted on Vercel Blob
async function cleanOldBlob(url?: string | null) {
  if (!url || typeof url !== 'string') return;
  if (!url.includes('blob.vercel-storage.com') && !url.includes('.public.blob.vercel-storage.com')) {
    return; // Don't attempt to delete legacy static paths or data URIs
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;

  try {
    await del(url);
  } catch (error) {
    console.warn('Could not clean old Vercel Blob (non-blocking):', (error as Error).message);
  }
}

// =============================================================================
// GET /api/the-plan/images — Fetch current project photographs from Database
// =============================================================================
export async function GET() {
  try {
    const photosMap = await getAllProjectPhotos();
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
// POST /api/the-plan/images — Manage project photos in PostgreSQL & Vercel Blob
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
      blobUrl,
      direction,
      userEmail,
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
    const photosMap = await getAllProjectPhotos();
    const currentList: PlanPhotoItem[] = [...(photosMap[key] || [])];

    // -------------------------------------------------------------------------
    // ACTION: UPLOAD NEW PICTURE
    // -------------------------------------------------------------------------
    if (action === 'upload') {
      let finalSrc = blobUrl;

      if (!finalSrc && fileBase64) {
        finalSrc = await storeBlobImage(fileBase64, fileName || `${key}.jpg`, key);
      }

      if (!finalSrc) {
        return NextResponse.json(
          { success: false, error: 'No image data or Blob URL provided for upload.' },
          { status: 400 }
        );
      }

      const newPhotoId = `${key}-${Date.now()}`;
      const makeCover = isCover || currentList.length === 0;

      const newPhoto: PlanPhotoItem = {
        id: newPhotoId,
        src: finalSrc,
        title: (title || 'Project Photograph').trim(),
        caption: (caption || 'Strategic expansion photograph for ' + projectName).trim(),
        tag: (tag || (makeCover ? 'Cover Photo' : 'Gallery')).trim(),
        isCover: makeCover,
        order: makeCover ? 0 : currentList.length,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Simon Memia Wanjiru',
      };

      // Save directly to Database
      await upsertProjectPhoto(key, newPhoto);
      const updatedPhotosMap = await getAllProjectPhotos();

      // Log to Audit Log
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
        remarks: `Simon Memia Wanjiru uploaded new photograph "${newPhoto.title}" to ${projectName}`,
      });

      return NextResponse.json({
        success: true,
        message: `Photograph successfully saved to ${projectName}.`,
        data: newPhoto,
        projectPhotos: updatedPhotosMap[key],
        allPhotos: updatedPhotosMap,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: REPLACE PICTURE
    // -------------------------------------------------------------------------
    if (action === 'replace') {
      const existing = currentList.find(p => p.id === photoId);
      if (!existing) {
        return NextResponse.json(
          { success: false, error: `Photograph with ID "${photoId}" not found in ${projectName}.` },
          { status: 404 }
        );
      }

      const oldSrc = existing.src;
      let newSrc = existing.src;

      if (blobUrl) {
        newSrc = blobUrl;
      } else if (fileBase64) {
        newSrc = await storeBlobImage(fileBase64, fileName || `${key}.jpg`, key);
      }

      const updatedPhoto: PlanPhotoItem = {
        ...existing,
        src: newSrc,
        title: title !== undefined ? title.trim() : existing.title,
        caption: caption !== undefined ? caption.trim() : existing.caption,
        tag: tag !== undefined ? tag.trim() : existing.tag,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Simon Memia Wanjiru',
      };

      // REQUIREMENT: Save to database FIRST!
      await upsertProjectPhoto(key, updatedPhoto);
      const updatedPhotosMap = await getAllProjectPhotos();

      // ONLY THEN clean up old Blob if applicable
      if (oldSrc !== newSrc) {
        await cleanOldBlob(oldSrc);
      }

      // Audit Log
      await createAuditLog({
        model: 'The Plan - Project Photos',
        action: 'Updated',
        recordRef: existing.id,
        userEmail: 'simon@dreamloom.co.ke',
        userName: 'Simon Memia Wanjiru',
        member: projectName,
        oldValues: { title: existing.title, src: existing.src },
        newValues: { title: updatedPhoto.title, src: updatedPhoto.src },
        remarks: `Simon Memia Wanjiru replaced photograph "${existing.title}" in ${projectName}`,
      });

      return NextResponse.json({
        success: true,
        message: `Photograph successfully replaced in ${projectName}.`,
        data: updatedPhoto,
        projectPhotos: updatedPhotosMap[key],
        allPhotos: updatedPhotosMap,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: REMOVE PICTURE
    // -------------------------------------------------------------------------
    if (action === 'delete') {
      const existing = currentList.find(p => p.id === photoId);
      if (!existing) {
        return NextResponse.json(
          { success: false, error: `Photograph with ID "${photoId}" not found in ${projectName}.` },
          { status: 404 }
        );
      }

      const oldSrc = existing.src;

      // Delete from Database first
      await deleteProjectPhoto(key, photoId);
      const updatedPhotosMap = await getAllProjectPhotos();

      // Clean up old Blob from Vercel Blob storage
      await cleanOldBlob(oldSrc);

      // Audit Log
      await createAuditLog({
        model: 'The Plan - Project Photos',
        action: 'Deleted',
        recordRef: existing.id,
        userEmail: 'simon@dreamloom.co.ke',
        userName: 'Simon Memia Wanjiru',
        member: projectName,
        oldValues: existing,
        newValues: {},
        remarks: `Simon Memia Wanjiru removed photograph "${existing.title}" from ${projectName}`,
      });

      return NextResponse.json({
        success: true,
        message: `Photograph removed from ${projectName}.`,
        projectPhotos: updatedPhotosMap[key],
        allPhotos: updatedPhotosMap,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: SET AS MAIN / COVER PHOTOGRAPH
    // -------------------------------------------------------------------------
    if (action === 'set-cover') {
      const targetPhoto = currentList.find(p => p.id === photoId);
      if (!targetPhoto) {
        return NextResponse.json(
          { success: false, error: `Photograph with ID "${photoId}" not found in ${projectName}.` },
          { status: 404 }
        );
      }

      const updatedTarget: PlanPhotoItem = {
        ...targetPhoto,
        isCover: true,
        order: 0,
      };

      await upsertProjectPhoto(key, updatedTarget);

      // Reorder other photos
      const otherIds = currentList.filter(p => p.id !== photoId).map(p => p.id);
      await reorderProjectPhotos(key, [photoId, ...otherIds]);

      const updatedPhotosMap = await getAllProjectPhotos();

      await createAuditLog({
        model: 'The Plan - Project Photos',
        action: 'Updated',
        recordRef: targetPhoto.id,
        userEmail: 'simon@dreamloom.co.ke',
        userName: 'Simon Memia Wanjiru',
        member: projectName,
        oldValues: { isCover: false },
        newValues: { isCover: true, title: targetPhoto.title },
        remarks: `Simon Memia Wanjiru set "${targetPhoto.title}" as main cover photograph for ${projectName}`,
      });

      return NextResponse.json({
        success: true,
        message: `"${targetPhoto.title}" set as main cover photograph for ${projectName}.`,
        projectPhotos: updatedPhotosMap[key],
        allPhotos: updatedPhotosMap,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: REORDER (Move Up / Down)
    // -------------------------------------------------------------------------
    if (action === 'reorder') {
      const targetIndex = currentList.findIndex(p => p.id === photoId);
      if (targetIndex === -1) {
        return NextResponse.json({ success: false, error: 'Photograph not found.' }, { status: 404 });
      }

      const reordered = [...currentList];
      if (direction === 'up' && targetIndex > 0) {
        const temp = reordered[targetIndex - 1];
        reordered[targetIndex - 1] = reordered[targetIndex];
        reordered[targetIndex] = temp;
      } else if (direction === 'down' && targetIndex < reordered.length - 1) {
        const temp = reordered[targetIndex + 1];
        reordered[targetIndex + 1] = reordered[targetIndex];
        reordered[targetIndex] = temp;
      }

      await reorderProjectPhotos(key, reordered.map(p => p.id));
      const updatedPhotosMap = await getAllProjectPhotos();

      return NextResponse.json({
        success: true,
        message: `Photographs reordered in ${projectName}.`,
        projectPhotos: updatedPhotosMap[key],
        allPhotos: updatedPhotosMap,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: EDIT DETAILS (Title, Caption, Tag)
    // -------------------------------------------------------------------------
    if (action === 'edit-details') {
      const existing = currentList.find(p => p.id === photoId);
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Photograph not found.' }, { status: 404 });
      }

      const updated: PlanPhotoItem = {
        ...existing,
        title: title !== undefined ? title.trim() : existing.title,
        caption: caption !== undefined ? caption.trim() : existing.caption,
        tag: tag !== undefined ? tag.trim() : existing.tag,
      };

      await upsertProjectPhoto(key, updated);
      const updatedPhotosMap = await getAllProjectPhotos();

      await createAuditLog({
        model: 'The Plan - Project Photos',
        action: 'Updated',
        recordRef: existing.id,
        userEmail: 'simon@dreamloom.co.ke',
        userName: 'Simon Memia Wanjiru',
        member: projectName,
        oldValues: { title: existing.title, caption: existing.caption, tag: existing.tag },
        newValues: { title: updated.title, caption: updated.caption, tag: updated.tag },
        remarks: `Simon Memia Wanjiru updated details for "${updated.title}" in ${projectName}`,
      });

      return NextResponse.json({
        success: true,
        message: `Photograph details updated for ${projectName}.`,
        projectPhotos: updatedPhotosMap[key],
        allPhotos: updatedPhotosMap,
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
