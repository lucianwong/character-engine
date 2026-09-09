import fs from "node:fs";
import path from "node:path";

export interface SeeThroughJobStatus {
  status: "queued" | "running" | "done" | "error" | string;
  error?: string;
}

export interface SeeThroughClientOptions {
  baseUrl: string;
  token?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeBaseUrl(value: string): string {
  const parsed = new URL(value);

  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error(
      "See-through service URL must use http or https",
    );
  }

  return parsed.toString().replace(/\/$/, "");
}

function arrayBufferFor(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

export class SeeThroughClient {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly timeoutMs: number;
  private readonly pollIntervalMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(options: SeeThroughClientOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.token = options.token;
    this.timeoutMs = options.timeoutMs ?? 30 * 60 * 1000;
    this.pollIntervalMs = options.pollIntervalMs ?? 5000;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep = options.sleep ?? defaultSleep;
  }

  async submit(image: Uint8Array): Promise<string> {
    const response = await this.fetchImpl(
      this.baseUrl + "/decompose",
      {
        method: "POST",
        headers: this.headers({
          "Content-Type": "application/octet-stream",
        }),
        body: arrayBufferFor(image),
      },
    );

    if (!response.ok) {
      throw await this.httpError(
        "decompose submit",
        response,
      );
    }

    const data = (await response.json()) as {
      job_id?: unknown;
    };

    if (
      typeof data.job_id !== "string" ||
      !data.job_id.trim()
    ) {
      throw new Error(
        "See-through service returned no job_id",
      );
    }

    return data.job_id;
  }

  async getStatus(jobId: string): Promise<SeeThroughJobStatus> {
    const response = await this.fetchImpl(
      this.baseUrl +
        "/jobs/" +
        encodeURIComponent(jobId),
      {
        headers: this.headers(),
      },
    );

    if (!response.ok) {
      throw await this.httpError(
        "job status",
        response,
      );
    }

    return (await response.json()) as SeeThroughJobStatus;
  }

  async getResult(jobId: string): Promise<Uint8Array> {
    const response = await this.fetchImpl(
      this.baseUrl +
        "/jobs/" +
        encodeURIComponent(jobId) +
        "/result",
      {
        headers: this.headers(),
      },
    );

    if (!response.ok) {
      throw await this.httpError(
        "job result",
        response,
      );
    }

    return new Uint8Array(
      await response.arrayBuffer(),
    );
  }

  async decompose(image: Uint8Array): Promise<Uint8Array> {
    const jobId = await this.submit(image);
    let waitedMs = 0;

    while (waitedMs <= this.timeoutMs) {
      const status = await this.getStatus(jobId);

      if (status.status === "done") {
        return await this.getResult(jobId);
      }

      if (status.status === "error") {
        throw new Error(
          "See-through decomposition failed: " +
            (status.error ?? "unknown error"),
        );
      }

      if (waitedMs >= this.timeoutMs) break;

      await this.sleep(this.pollIntervalMs);
      waitedMs += this.pollIntervalMs;
    }

    throw new Error(
      "See-through decomposition timed out after " +
        this.timeoutMs +
        "ms (job " +
        jobId +
        ")",
    );
  }

  async decomposeFile(
    inputImagePath: string,
    outputPsdPath: string,
  ): Promise<string> {
    const source = path.resolve(inputImagePath);

    if (!fs.existsSync(source)) {
      throw new Error(
        "Flat image not found: " + source,
      );
    }

    const bytes = new Uint8Array(
      fs.readFileSync(source),
    );
    const psd = await this.decompose(bytes);

    const target = path.resolve(outputPsdPath);
    fs.mkdirSync(path.dirname(target), {
      recursive: true,
    });
    fs.writeFileSync(target, psd);

    return target;
  }

  private headers(
    extra: Record<string, string> = {},
  ): Record<string, string> {
    return {
      ...(this.token
        ? { "X-Auth-Token": this.token }
        : {}),
      ...extra,
    };
  }

  private async httpError(
    stage: string,
    response: Response,
  ): Promise<Error> {
    let body = "";
    try {
      body = (await response.text()).slice(0, 800);
    } catch {
      // ignore body parsing failure
    }

    return new Error(
      "See-through " +
        stage +
        " failed: HTTP " +
        response.status +
        (body ? " " + body : ""),
    );
  }
}
