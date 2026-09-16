import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["run", "typecheck"], {
  encoding: "utf8",
  env: process.env,
});
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
const lines = output.split(/\r?\n/).filter((line) => line.includes("worldBuilderRoutes.ts"));
const match = lines.some((line) => {
  const found = line.match(/worldBuilderRoutes\.ts\((\d+),/);
  return found ? Number(found[1]) <= 50 : false;
});
process.exit(match ? 1 : 0);
