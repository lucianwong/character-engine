import { CharacterPack } from "../types";

export interface RigImportContext {
  characterId: string;
  name: string;
  version: string;
}

export interface RigImportWarning {
  code: string;
  message: string;
  sourcePath?: string;
}

export interface RigImportCapabilities {
  parameters: string[];
  parts: string[];
  animations: string[];
  physics: boolean;
  fullBody: boolean;
  independentHands: boolean;
  independentFeet: boolean;
}

export interface RigImportResult {
  importerId: string;
  pack: CharacterPack;
  files: Record<string, string | Uint8Array>;
  capabilities: RigImportCapabilities;
  warnings: RigImportWarning[];
  sourceMetadata?: Record<string, unknown>;
}

export interface RigImporter<TSource = unknown> {
  readonly id: string;
  canImport(source: unknown): source is TSource;
  import(
    source: TSource,
    context: RigImportContext,
  ): Promise<RigImportResult> | RigImportResult;
}

export class RigImporterRegistry {
  private readonly importers = new Map<string, RigImporter<any>>();

  register(importer: RigImporter<any>): void {
    if (!importer.id.trim()) {
      throw new Error("RigImporter.id is required");
    }
    this.importers.set(importer.id, importer);
  }

  get(id: string): RigImporter<any> | undefined {
    return this.importers.get(id);
  }

  detect(source: unknown): RigImporter<any> | undefined {
    for (const importer of this.importers.values()) {
      if (importer.canImport(source)) return importer;
    }
    return undefined;
  }

  list(): string[] {
    return [...this.importers.keys()].sort();
  }
}
