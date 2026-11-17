import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import {
  DEFAULT_PLAN_PHOTOS,
  PROJECT_NAMES,
  ThePlanProjectKey,
  PlanPhotoItem
} from '@/lib/thePlanData';

// In-memory runtime fallback cache (used if database connection is temporarily unavailable or during offline tests)
let runtimeFallbackCache: Record<ThePlanProjectKey, PlanPhotoItem[]> | null = null;

function getFallbackStore(): Record<ThePlanProjectKey, PlanPhotoItem[]> {
  if (!runtimeFallbackCache) {
    runtimeFallbackCache = JSON.parse(JSON.stringify(DEFAULT_PLAN_PHOTOS));
  }
  return runtimeFallbackCache!;
}

/**
 * Ensures the PostgreSQL table "ThePlanImage" exists and is seeded with
 * default legacy project photographs if empty.
 */
export async function ensureThePlanDatabaseReady(): Promise<boolean> {
  try {
    await ensureDatabaseSchema();

    // Idempotent table check
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ThePlanImage" (
        "id" TEXT NOT NULL,
        "projectId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "caption" TEXT NOT NULL DEFAULT '',
        "tag" TEXT DEFAULT '',
        "src" TEXT NOT NULL,
        "isCover" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ThePlanImage_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ThePlanImage_projectId_idx" ON "ThePlanImage"("projectId");
    `);

    // Check count and seed legacy photos if empty
    const count = await prisma.thePlanImage.count();
    if (count === 0) {
      const recordsToSeed: any[] = [];
      for (const [pKey, photos] of Object.entries(DEFAULT_PLAN_PHOTOS)) {
        for (const p of photos) {
          recordsToSeed.push({
            id: p.id,
            projectId: pKey,
            title: p.title,
            caption: p.caption || '',
            tag: p.tag || '',
            src: p.src,
            isCover: Boolean(p.isCover),
            sortOrder: p.order ?? 0,
          });
        }
      }

      await prisma.thePlanImage.createMany({
        data: recordsToSeed,
        skipDuplicates: true,
      });
    }

    return true;
  } catch (error) {
    console.warn('ThePlan DB initialization notice (using memory fallback):', (error as Error).message);
    return false;
  }
}

/**
 * Retrieves all project photos grouped by project section from PostgreSQL.
 * Falls back safely to in-memory state or default legacy configuration.
 */
export async function getAllProjectPhotos(): Promise<Record<ThePlanProjectKey, PlanPhotoItem[]>> {
  const result: Record<ThePlanProjectKey, PlanPhotoItem[]> = {
    'land-investment': [],
    'apartments': [],
    'poultry-broilers': [],
    'poultry-layers': [],
    'dairy-farm': [],
    'goat-farm': [],
    'napier-grass': [],
    'avocado-farm': [],
  };

  try {
    await ensureThePlanDatabaseReady();
    const rows = await prisma.thePlanImage.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    if (rows && rows.length > 0) {
      for (const row of rows) {
        const pKey = row.projectId as ThePlanProjectKey;
        if (result[pKey]) {
          result[pKey].push({
            id: row.id,
            src: row.src,
            title: row.title,
            caption: row.caption || '',
            tag: row.tag || '',
            isCover: row.isCover,
            order: row.sortOrder,
            uploadedAt: row.createdAt.toISOString(),
            uploadedBy: 'Simon Memia Wanjiru',
          });
        }
      }

      // Fill in default photos for any project that has no rows in DB
      for (const pKey of Object.keys(DEFAULT_PLAN_PHOTOS) as ThePlanProjectKey[]) {
        if (!result[pKey] || result[pKey].length === 0) {
          result[pKey] = [...DEFAULT_PLAN_PHOTOS[pKey]];
        }
      }

      return result;
    }
  } catch (error) {
    console.warn('Could not read from ThePlanImage table:', (error as Error).message);
  }

  // Fallback to in-memory store
  return getFallbackStore();
}

/**
 * Adds or updates a project photograph in the database.
 */
export async function upsertProjectPhoto(
  projectId: ThePlanProjectKey,
  photo: PlanPhotoItem
): Promise<PlanPhotoItem> {
  try {
    await ensureThePlanDatabaseReady();

    // If marked as cover, unset existing covers for this project
    if (photo.isCover) {
      await prisma.thePlanImage.updateMany({
        where: { projectId },
        data: { isCover: false }
      });
    }

    const saved = await prisma.thePlanImage.upsert({
      where: { id: photo.id },
      create: {
        id: photo.id,
        projectId,
        title: photo.title,
        caption: photo.caption || '',
        tag: photo.tag || '',
        src: photo.src,
        isCover: Boolean(photo.isCover),
        sortOrder: photo.order ?? 0,
      },
      update: {
        title: photo.title,
        caption: photo.caption || '',
        tag: photo.tag || '',
        src: photo.src,
        isCover: Boolean(photo.isCover),
        sortOrder: photo.order ?? 0,
      }
    });

    const item: PlanPhotoItem = {
      id: saved.id,
      src: saved.src,
      title: saved.title,
      caption: saved.caption,
      tag: saved.tag || '',
      isCover: saved.isCover,
      order: saved.sortOrder,
      uploadedAt: saved.createdAt.toISOString(),
      uploadedBy: 'Simon Memia Wanjiru'
    };

    // Update in-memory fallback
    const store = getFallbackStore();
    const list = store[projectId] || [];
    const idx = list.findIndex(p => p.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    store[projectId] = list;

    return item;
  } catch (error) {
    console.warn('Database upsert failed, saving to memory fallback:', (error as Error).message);
    const store = getFallbackStore();
    const list = store[projectId] || [];
    if (photo.isCover) {
      list.forEach(p => (p.isCover = false));
    }
    const idx = list.findIndex(p => p.id === photo.id);
    if (idx >= 0) {
      list[idx] = photo;
    } else {
      if (photo.isCover) {
        list.unshift(photo);
      } else {
        list.push(photo);
      }
    }
    store[projectId] = list;
    return photo;
  }
}

/**
 * Removes a photograph from the database.
 */
export async function deleteProjectPhoto(
  projectId: ThePlanProjectKey,
  photoId: string
): Promise<boolean> {
  try {
    await ensureThePlanDatabaseReady();
    await prisma.thePlanImage.deleteMany({
      where: { id: photoId, projectId }
    });
  } catch (error) {
    console.warn('Database delete failed, removing from memory store:', (error as Error).message);
  }

  const store = getFallbackStore();
  if (store[projectId]) {
    store[projectId] = store[projectId].filter(p => p.id !== photoId);
  }
  return true;
}

/**
 * Reorders photographs for a project.
 */
export async function reorderProjectPhotos(
  projectId: ThePlanProjectKey,
  orderedIds: string[]
): Promise<void> {
  try {
    await ensureThePlanDatabaseReady();
    for (let i = 0; i < orderedIds.length; i++) {
      await prisma.thePlanImage.updateMany({
        where: { id: orderedIds[i], projectId },
        data: { sortOrder: i }
      });
    }
  } catch (error) {
    console.warn('Database reorder failed:', (error as Error).message);
  }

  const store = getFallbackStore();
  if (store[projectId]) {
    const list = store[projectId];
    list.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
    list.forEach((p, idx) => (p.order = idx));
  }
}
