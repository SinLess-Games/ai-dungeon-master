import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildPlan, collectArtifacts } from "../../scripts/build.mjs";

for (const [host, expected] of [
  ["linux", ["web", "android", "linux"]],
  ["win32", ["web", "android", "windows"]],
  ["darwin", ["web", "android", "mac", "ios"]],
]) {
  test(`default build selects the local targets on ${host}`, () => {
    const plan = buildPlan([], host);
    assert.deepEqual(plan.build, expected);
    assert.ok(plan.skipped.every((target) => !expected.includes(target)));
  });
}

test("explicit targets build web once and resolve the desktop alias", () => {
  assert.deepEqual(buildPlan(["--targets=desktop,web,linux,android"], "linux").build, [
    "web",
    "linux",
    "android",
  ]);
  assert.deepEqual(buildPlan(["--targets=web"], "linux").build, ["web"]);
});

test("invalid and cross-host requests fail before running build tools", () => {
  for (const args of [
    ["--targets=ios"],
    ["--targets=mac"],
    ["--targets=windows"],
    ["--targets="],
    ["--targets=typo"],
    ["--typo"],
    ["--targets=web", "extra"],
  ]) {
    assert.throws(() => buildPlan(args, "linux"));
  }
  assert.throws(() => buildPlan([], "freebsd"));
});

test("artifact collection excludes intermediates and refuses duplicate output names", async () => {
  const directory = await mkdtemp(join(tmpdir(), "codex-build-test-"));
  try {
    const source = join(directory, "source");
    const output = join(directory, "output");
    await mkdir(join(source, "nested"), { recursive: true });
    await mkdir(output);
    await writeFile(join(source, "nested", "app.apk"), "package bytes");
    await writeFile(join(source, "nested", "metadata.json"), "{}");
    assert.equal(await collectArtifacts(source, output, [".apk"]), 1);
    assert.deepEqual(await readdir(output), ["app.apk"]);
    assert.equal(await readFile(join(output, "app.apk"), "utf8"), "package bytes");
    await assert.rejects(collectArtifacts(source, output, [".apk"]), /Duplicate artifact/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
