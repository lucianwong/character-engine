import {
  RigImporter,
  RigImporterRegistry,
  RigImportContext,
  RigImportResult,
} from "./RigImporter";

export type BuilderJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed";

export interface BuilderJobSnapshot {
  id: string;
  status: BuilderJobStatus;
  importerId?: string;
  error?: string;
  result?: RigImportResult;
}

export class CharacterBuilderJobRunner {
  private sequence = 0;
  private readonly jobs = new Map<string, BuilderJobSnapshot>();

  constructor(
    private readonly registry: RigImporterRegistry,
  ) {}

  submit<TSource>(
    source: TSource,
    context: RigImportContext,
    importerId?: string,
  ): string {
    const id = "builder-job-" + this.sequence++;
    this.jobs.set(id, {
      id,
      status: "queued",
      importerId,
    });

    void this.run(id, source, context, importerId);
    return id;
  }

  get(id: string): BuilderJobSnapshot | undefined {
    const value = this.jobs.get(id);
    return value
      ? {
          ...value,
          result: value.result,
        }
      : undefined;
  }

  async runNow<TSource>(
    source: TSource,
    context: RigImportContext,
    importerId?: string,
  ): Promise<RigImportResult> {
    const importer = this.resolveImporter(source, importerId);
    return await importer.import(source, context);
  }

  private async run<TSource>(
    id: string,
    source: TSource,
    context: RigImportContext,
    importerId?: string,
  ): Promise<void> {
    try {
      const importer = this.resolveImporter(source, importerId);

      this.jobs.set(id, {
        id,
        status: "running",
        importerId: importer.id,
      });

      const result = await importer.import(source, context);

      this.jobs.set(id, {
        id,
        status: "completed",
        importerId: importer.id,
        result,
      });
    } catch (error) {
      this.jobs.set(id, {
        id,
        status: "failed",
        importerId,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }

  private resolveImporter<TSource>(
    source: TSource,
    importerId?: string,
  ): RigImporter<any> {
    if (importerId) {
      const importer = this.registry.get(importerId);
      if (!importer) {
        throw new Error(
          "Unknown RigImporter: " + importerId,
        );
      }
      if (!importer.canImport(source)) {
        throw new Error(
          "RigImporter " +
            importerId +
            " does not accept this source",
        );
      }
      return importer;
    }

    const detected = this.registry.detect(source);
    if (!detected) {
      throw new Error(
        "No registered RigImporter accepts this source",
      );
    }

    return detected;
  }
}
