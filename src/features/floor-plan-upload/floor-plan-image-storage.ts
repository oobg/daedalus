import { validateFloorPlanImageFile } from "./validate-floor-plan-image-file.ts";

const FLOOR_PLAN_ASSET_STORAGE_KEY_PREFIX = "daedalus.floorPlanAsset";

export interface FloorPlanImageStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface SaveFloorPlanImageInput {
  projectId: string;
  floorId: string;
  file: File;
}

export interface StoredFloorPlanImageAsset {
  assetRef: string;
  storageKey: string;
  projectId: string;
  floorId: string;
  fileName: string;
  mimeType: string;
  size: number;
  contentBase64: string;
}

export async function saveAcceptedFloorPlanImage(
  input: SaveFloorPlanImageInput,
  storage: FloorPlanImageStorage,
): Promise<StoredFloorPlanImageAsset> {
  const validation = validateFloorPlanImageFile(input.file);

  if (!validation.ok) {
    throw new Error(
      `Cannot persist floor plan image: ${validation.code} (${validation.message})`,
    );
  }

  const contentBytes = new Uint8Array(await input.file.arrayBuffer());
  const assetRef = await createFloorPlanAssetRef({
    projectId: input.projectId,
    floorId: input.floorId,
    file: input.file,
    contentBytes,
  });
  const asset: StoredFloorPlanImageAsset = {
    assetRef,
    storageKey: getFloorPlanAssetStorageKey(assetRef),
    projectId: input.projectId,
    floorId: input.floorId,
    fileName: input.file.name,
    mimeType: input.file.type,
    size: input.file.size,
    contentBase64: encodeBase64(contentBytes),
  };

  storage.setItem(asset.storageKey, JSON.stringify(asset));

  return asset;
}

export function loadStoredFloorPlanImage(
  assetRef: string,
  storage: FloorPlanImageStorage,
): StoredFloorPlanImageAsset | null {
  const serialized = storage.getItem(getFloorPlanAssetStorageKey(assetRef));

  if (serialized == null) {
    return null;
  }

  return JSON.parse(serialized) as StoredFloorPlanImageAsset;
}

export function getFloorPlanAssetStorageKey(assetRef: string): string {
  return `${FLOOR_PLAN_ASSET_STORAGE_KEY_PREFIX}:${assetRef}`;
}

async function createFloorPlanAssetRef(input: {
  projectId: string;
  floorId: string;
  file: File;
  contentBytes: Uint8Array;
}): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(input.contentBytes));
  const contentHash = toHex(new Uint8Array(digest)).slice(0, 16);
  const sanitizedProjectId = sanitizeRefSegment(input.projectId);
  const sanitizedFloorId = sanitizeRefSegment(input.floorId);
  const sanitizedName = sanitizeRefSegment(input.file.name);

  return `floor-plan://${sanitizedProjectId}/${sanitizedFloorId}/${contentHash}-${sanitizedName}`;
}

function sanitizeRefSegment(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function encodeBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}
