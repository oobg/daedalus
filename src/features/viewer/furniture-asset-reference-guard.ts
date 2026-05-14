export interface FurnitureAssetReferenceValidationIssue {
  path: string;
  message: string;
}

export type FurnitureAssetReferenceValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      issues: readonly FurnitureAssetReferenceValidationIssue[];
    };

const DISALLOWED_FURNITURE_ASSET_REFERENCE_PATTERNS = Object.freeze([
  /\bgame[-_\s]?prop\b/,
  /\bhero[-_\s]?prop\b/,
  /\bphotoreal(?:istic)?\b/,
  /\brealistic\b/,
  /\bpbr\b/,
  /\bscan(?:ned)?\b/,
  /\bmegascans?\b/,
  /\bkitbash(?:ed)?\b/,
] as const);

export function validateFurnitureAssetReference(
  assetReference: unknown,
  path = "modelAssetId",
): FurnitureAssetReferenceValidationResult {
  if (typeof assetReference !== "string" || assetReference.trim().length === 0) {
    return {
      ok: false,
      issues: [
        {
          path,
          message:
            "Normalized handcrafted furniture descriptors require a non-empty model asset reference.",
        },
      ],
    };
  }

  const normalizedReference = normalizeFurnitureAssetReference(assetReference);

  for (const pattern of DISALLOWED_FURNITURE_ASSET_REFERENCE_PATTERNS) {
    if (!pattern.test(normalizedReference)) {
      continue;
    }

    return {
      ok: false,
      issues: [
        {
          path,
          message:
            `Normalized furniture descriptor rejected disallowed asset reference "${assetReference}". ` +
            "Realistic scans and game-prop assets are not approved for the miniature viewer.",
        },
      ],
    };
  }

  return { ok: true };
}

export function assertFurnitureAssetReference(
  assetReference: string,
  path?: string,
): string {
  const result = validateFurnitureAssetReference(assetReference, path);

  if (result.ok) {
    return assetReference;
  }

  throw new TypeError(result.issues.map((issue) => issue.message).join(" "));
}

function normalizeFurnitureAssetReference(assetReference: string): string {
  return assetReference
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}
