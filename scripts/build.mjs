import { spawn } from "node:child_process";
import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const targets = ["web", "android", "mac", "windows", "linux", "ios"];
const desktopHosts = { darwin: "mac", win32: "windows", linux: "linux" };

export function buildPlan(args, host = process.platform) {
  const desktop = desktopHosts[host];
  if (!desktop) throw new Error(`Unsupported build host: ${host}`);
  if (args.length > 1 || (args.length && !args[0].startsWith("--targets="))) {
    throw new Error(
      "Usage: npm run build -- [--targets=web,android,desktop,mac,windows,linux,ios]",
    );
  }
  const supported = ["web", "android", desktop, ...(host === "darwin" ? ["ios"] : [])];
  const selected = args.length ? args[0].slice("--targets=".length).split(",") : supported;
  const requested = [
    ...new Set(selected.map((target) => (target === "desktop" ? desktop : target))),
  ];
  for (const target of requested) {
    if (!targets.includes(target)) throw new Error(`Unknown build target: ${target || "(empty)"}`);
    if (!supported.includes(target)) {
      throw new Error(`${target} cannot be built on ${host}; use its native build host.`);
    }
  }
  // Native projects consume the web build; build it once before packaging any target.
  return {
    build: ["web", ...requested.filter((target) => target !== "web")],
    skipped: targets.filter((target) => !supported.includes(target)),
  };
}

async function run(command, args, options = {}) {
  await new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit", ...options });
    child.on("error", (error) => reject(new Error(`Cannot run ${command}: ${error.message}`)));
    child.on("exit", (code, signal) => {
      if (code === 0) resolveRun();
      else reject(new Error(`${command} failed (${signal ?? `exit ${code}`}).`));
    });
  });
}

function cli(path, args, options) {
  return run(process.execPath, [join(root, "node_modules", path), ...args], options);
}

async function cleanDirectory(path) {
  await rm(path, { recursive: true, force: true });
  await mkdir(path, { recursive: true });
}

/** Copy only final packages, never Gradle intermediates or Cargo build caches. */
export async function collectArtifacts(source, destination, extensions) {
  let count = 0;
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const path = join(source, entry.name);
    if (entry.isDirectory()) {
      count += await collectArtifacts(path, destination, extensions);
    } else if (entry.isFile() && extensions.some((extension) => entry.name.endsWith(extension))) {
      const output = join(destination, entry.name);
      if (existsSync(output)) throw new Error(`Duplicate artifact name: ${entry.name}`);
      await cp(path, output);
      count += 1;
    }
  }
  return count;
}

async function buildDesktop(target, output) {
  // An explicit Cargo output path makes artifact collection independent of user Cargo config.
  const cargoOutput = join(root, "src-tauri", "target");
  const bundleDir = join(cargoOutput, "release", "bundle");
  await rm(bundleDir, { recursive: true, force: true });
  await cli(
    "@tauri-apps/cli/tauri.js",
    ["build", "--ci", "--config", JSON.stringify({ build: { beforeBuildCommand: "" } })],
    { env: { ...process.env, CARGO_TARGET_DIR: cargoOutput } },
  );
  const count = await collectArtifacts(bundleDir, output, [
    ".deb",
    ".rpm",
    ".AppImage",
    ".dmg",
    ".msi",
    ".exe",
  ]);
  if (!count) throw new Error(`Tauri produced no ${target} installers in ${bundleDir}.`);
}

async function buildAndroid(output) {
  await run("java", ["-version"]);
  await cli("@capacitor/cli/bin/capacitor", ["sync", "android"]);
  const project = join(root, "android");
  // The wrapper owns the Gradle version. Release packages are unsigned until a signing config is supplied.
  if (process.platform === "win32") {
    await run(
      "cmd.exe",
      ["/d", "/s", "/c", "gradlew.bat :app:assembleRelease :app:bundleRelease --no-daemon"],
      { cwd: project },
    );
  } else {
    await run("sh", ["./gradlew", ":app:assembleRelease", ":app:bundleRelease", "--no-daemon"], {
      cwd: project,
    });
  }
  let count = 0;
  for (const directory of ["apk/release", "bundle/release"]) {
    count += await collectArtifacts(join(project, "app/build/outputs", directory), output, [
      ".apk",
      ".aab",
    ]);
  }
  if (count < 2) throw new Error("Android build did not produce both APK and AAB packages.");
}

async function buildIos(output) {
  await run("xcodebuild", ["-version"]);
  await cli("@capacitor/cli/bin/capacitor", ["sync", "ios"]);
  const derivedData = join(root, ".cache", "ios-build");
  await run("xcodebuild", [
    "-project",
    "ios/App/App.xcodeproj",
    "-scheme",
    "App",
    "-configuration",
    "Release",
    "-sdk",
    "iphonesimulator",
    "-destination",
    "generic/platform=iOS Simulator",
    "-derivedDataPath",
    derivedData,
    "CODE_SIGNING_ALLOWED=NO",
    "build",
  ]);
  const products = join(derivedData, "Build", "Products", "Release-iphonesimulator");
  const app = join(products, "App.app");
  if (!(await stat(app)).isDirectory()) throw new Error("Xcode did not produce App.app.");
  // Preserve executable permissions and the app bundle when sharing the build.
  await run("tar", [
    "-czf",
    join(output, "endless-codex-ios-simulator.tar.gz"),
    "-C",
    products,
    "App.app",
  ]);
}

export async function build(args = process.argv.slice(2)) {
  const plan = buildPlan(args);
  console.log(`Building: ${plan.build.join(", ")}`);
  if (plan.skipped.length)
    console.log(`Unavailable on ${process.platform}: ${plan.skipped.join(", ")}`);
  console.log("Native prerequisites and artifact details: docs/building.md");
  await cli("vite/bin/vite.js", ["build"]);
  await cli("typescript/bin/tsc", ["--noEmit"]);
  const failed = [];
  for (const target of plan.build.filter((target) => target !== "web")) {
    const output = join(root, "dist", target);
    try {
      await cleanDirectory(output);
      if (target === "android") await buildAndroid(output);
      else if (target === "ios") await buildIos(output);
      else await buildDesktop(target, output);
      console.log(`Built ${target}: dist/${target}`);
    } catch (error) {
      // Do not leave a partial package set looking like a successful target build.
      await rm(output, { recursive: true, force: true });
      failed.push(target);
      console.error(`Build failed for ${target}: ${error.message}`);
    }
  }
  if (failed.length)
    throw new Error(
      `Failed targets: ${failed.join(", ")}. Other completed outputs remain in dist/.`,
    );
  console.log(`Build complete: ${plan.build.map((target) => `dist/${target}`).join(", ")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  build().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
