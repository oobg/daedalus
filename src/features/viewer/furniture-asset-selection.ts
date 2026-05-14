import type {
  FurnitureAssetMetadata,
  FurnitureAssetMetadataValidationResult,
} from "./furniture-asset-metadata.ts";

export interface FurnitureAssetLookupRequest {
  assetId: string;
}

export interface FurnitureAssetCatalogEntry {
  assetId: string;
  modelPath: string;
  metadata: FurnitureAssetMetadata;
  validation: FurnitureAssetMetadataValidationResult;
}

export interface ApprovedFurnitureAssetSelection {
  assetId: string;
  modelPath: string;
  metadata: Readonly<FurnitureAssetMetadata>;
  validation: Extract<FurnitureAssetMetadataValidationResult, { ok: true }>;
}

export type FurnitureAssetSelectionResult =
  | {
      ok: true;
      asset: Readonly<ApprovedFurnitureAssetSelection>;
    }
  | {
      ok: false;
      code: "asset_not_found" | "asset_not_approved";
      assetId: string;
      message: string;
      validation: FurnitureAssetMetadataValidationResult | null;
    };

export function resolveApprovedFurnitureAsset(
  request: FurnitureAssetLookupRequest,
  catalog: readonly FurnitureAssetCatalogEntry[],
): FurnitureAssetSelectionResult {
  const entry = catalog.find((candidate) => candidate.assetId === request.assetId);

  if (entry == null) {
    return {
      ok: false,
      code: "asset_not_found",
      assetId: request.assetId,
      message: `Furniture asset "${request.assetId}" is not registered in the approved model catalog.`,
      validation: null,
    };
  }

  if (!entry.validation.ok) {
    return {
      ok: false,
      code: "asset_not_approved",
      assetId: request.assetId,
      message: `Furniture asset "${request.assetId}" is not approved for the miniature viewer.`,
      validation: entry.validation,
    };
  }

  return {
    ok: true,
    asset: Object.freeze({
      assetId: entry.assetId,
      modelPath: entry.modelPath,
      metadata: entry.validation.metadata,
      validation: entry.validation,
    }),
  };
}
