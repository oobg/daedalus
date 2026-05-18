import type {
  ReadonlyRendererSnapshotProject,
  RenderSceneData,
} from "./renderer-contract.ts";

export interface RendererExtensionContext {
  project: ReadonlyRendererSnapshotProject;
  scene: Readonly<RenderSceneData>;
}

export interface RendererRegisteredExtension<
  Kind extends string,
  Result,
> {
  extensionId: string;
  kind: Kind;
  [identifier: string]: unknown;
  execute(context: RendererExtensionContext): Result;
}

export interface RendererFeatureHandler<Result = unknown>
  extends RendererRegisteredExtension<
    "feature-handler",
    Result
  > {
  featureKey: string;
}

export interface RendererOutputHandler<Result = unknown>
  extends RendererRegisteredExtension<"output-type", Result> {
  outputType: string;
}

export interface RendererExtensionRegistrySnapshot {
  featureHandlers: readonly RendererFeatureHandler[];
  outputHandlers: readonly RendererOutputHandler[];
}

export interface RendererExtensionRegistry {
  registerFeatureHandler<Result>(
    handler: RendererFeatureHandler<Result>,
  ): RendererFeatureHandler<Result>;
  registerOutputHandler<Result>(
    handler: RendererOutputHandler<Result>,
  ): RendererOutputHandler<Result>;
  getFeatureHandler(featureKey: string): RendererFeatureHandler | null;
  getOutputHandler(outputType: string): RendererOutputHandler | null;
  listFeatureHandlers(): readonly RendererFeatureHandler[];
  listOutputHandlers(): readonly RendererOutputHandler[];
  snapshot(): RendererExtensionRegistrySnapshot;
}

export function createRendererExtensionRegistry(
  extensions: Partial<RendererExtensionRegistrySnapshot> = {},
): RendererExtensionRegistry {
  const featureHandlers = new Map<string, RendererFeatureHandler>();
  const outputHandlers = new Map<string, RendererOutputHandler>();
  const extensionIds = new Set<string>();

  for (const handler of extensions.featureHandlers ?? []) {
    registerExtension(featureHandlers, extensionIds, "featureKey", handler);
  }

  for (const handler of extensions.outputHandlers ?? []) {
    registerExtension(outputHandlers, extensionIds, "outputType", handler);
  }

  return {
    registerFeatureHandler(handler) {
      registerExtension(featureHandlers, extensionIds, "featureKey", handler);
      return handler;
    },
    registerOutputHandler(handler) {
      registerExtension(outputHandlers, extensionIds, "outputType", handler);
      return handler;
    },
    getFeatureHandler(featureKey) {
      return featureHandlers.get(featureKey) ?? null;
    },
    getOutputHandler(outputType) {
      return outputHandlers.get(outputType) ?? null;
    },
    listFeatureHandlers() {
      return Object.freeze([...featureHandlers.values()]);
    },
    listOutputHandlers() {
      return Object.freeze([...outputHandlers.values()]);
    },
    snapshot() {
      return Object.freeze({
        featureHandlers: Object.freeze([...featureHandlers.values()]),
        outputHandlers: Object.freeze([...outputHandlers.values()]),
      });
    },
  };
}

function registerExtension<
  TIdentifierKey extends "featureKey" | "outputType",
  TExtension extends RendererFeatureHandler | RendererOutputHandler,
>(
  registry: Map<string, TExtension>,
  extensionIds: Set<string>,
  identifierKey: TIdentifierKey,
  extension: TExtension,
): TExtension {
  const registrationKey = extension[identifierKey];

  if (typeof registrationKey !== "string" || registrationKey.length === 0) {
    throw new Error(
      `Renderer extension registration requires a non-empty ${identifierKey}.`,
    );
  }

  if (extension.extensionId.length === 0) {
    throw new Error(
      "Renderer extension registration requires a non-empty extensionId.",
    );
  }

  if (registry.has(registrationKey)) {
    throw new Error(
      `Renderer extension "${registrationKey}" is already registered.`,
    );
  }

  if (extensionIds.has(extension.extensionId)) {
    throw new Error(
      `Renderer extension ID "${extension.extensionId}" is already registered.`,
    );
  }

  registry.set(registrationKey, extension);
  extensionIds.add(extension.extensionId);
  return extension;
}
