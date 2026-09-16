import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["run", "typecheck"], {
  encoding: "utf8",
  env: process.env,
});
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
const lines = output.split(/\r?\n/).filter((line) => line.includes("worldBuilderRoutes.ts"));
process.exit(lines.some((line) => line.includes("TS2589")) ? 1 : 0);
