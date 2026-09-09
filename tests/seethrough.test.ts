import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  Image2Live2DProcessExecutor,
  SeeThroughClient,
  buildFlatImageCharacter,
} from "../src";

test("SeeThroughClient follows submit -> poll -> result protocol", async () => {
  const calls: string[] = [];
  let statusCount = 0;

  const client = new SeeThroughClient({
    baseUrl: "https://gpu.example.test/",
    token: "secret",
    pollIntervalMs: 1,
    timeoutMs: 10,
    sleep: async () => {},
    fetchImpl: async (input, init) => {
      const url = String(input);
      calls.push(url);

      if (url.endsWith("/decompose")) {
        assert.equal(init?.method, "POST");
        assert.equal(
          new Headers(init?.headers).get("X-Auth-Token"),
          "secret",
        );

        return new Response(
          JSON.stringify({ job_id: "job-1" }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }

      if (url.endsWith("/jobs/job-1")) {
        statusCount += 1;
        return new Response(
          JSON.stringify({
            status:
              statusCount < 2 ? "running" : "done",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }

      if (url.endsWith("/jobs/job-1/result")) {
        return new Response(
          new Uint8Array([9, 8, 7]),
          { status: 200 },
        );
      }

      return new Response("not found", {
        status: 404,
      });
    },
  });

  const result = await client.decompose(
    new Uint8Array([1, 2, 3]),
  );

  assert.deepEqual([...result], [9, 8, 7]);
  assert.deepEqual(calls, [
    "https://gpu.example.test/decompose",
    "https://gpu.example.test/jobs/job-1",
    "https://gpu.example.test/jobs/job-1",
    "https://gpu.example.test/jobs/job-1/result",
  ]);
});

test("flat-image builder feeds decomposed PSD into image2live2d", async () => {
  const workspace = fs.mkdtempSync(
    path.join(os.tmpdir(), "character-engine-flat-"),
  );

  const input = path.join(workspace, "hero.png");
  fs.writeFileSync(input, new Uint8Array([1, 2, 3]));

  const seeThrough = new SeeThroughClient({
    baseUrl: "https://gpu.example.test",
    pollIntervalMs: 1,
    sleep: async () => {},
    fetchImpl: async (input) => {
      const url = String(input);

      if (url.endsWith("/decompose")) {
        return new Response(
          JSON.stringify({ job_id: "j" }),
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }

      if (url.endsWith("/jobs/j")) {
        return new Response(
          JSON.stringify({ status: "done" }),
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }

      return new Response(
        new Uint8Array([4, 5, 6]),
      );
    },
  });

  const executor: Image2Live2DProcessExecutor = {
    async execute(options) {
      assert.equal(options.kind, "psd");
      assert.ok(
        options.inputPath.endsWith(
          path.join(
            "decomposition",
            "hero.psd",
          ),
        ),
      );

      fs.mkdirSync(options.workspace, {
        recursive: true,
      });

      const irrPath = path.join(
        options.workspace,
        "rig.irr.json",
      );

      fs.writeFileSync(
        irrPath,
        JSON.stringify({
          meta: {
            name: "hero",
            irr_version: "0.1.0",
          },
          parts: [],
          parameters: [],
        }),
      );

      return {
        irrPath,
        passed: true,
      };
    },
  };

  const result = await buildFlatImageCharacter({
    inputImagePath: input,
    workspace,
    context: {
      characterId: "hero",
      name: "Hero",
      version: "1.0.0",
    },
    seeThrough,
    image2live2dExecutor: executor,
  });

  assert.ok(
    result.files[
      "source/seethrough/decomposition.psd"
    ],
  );
  assert.equal(
    result.sourceMetadata?.decomposition,
    "see-through",
  );
});
