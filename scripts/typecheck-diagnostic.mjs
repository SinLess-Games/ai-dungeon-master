import { spawnSync } from "node:child_process";

const pattern = /worldBuilderRoutes\.ts\((?:[1-9]|[1-9]\d|[1-3]\d\d),/;
const result = spawnSync("npm", ["run", "typecheck"], {
  encoding: "utf8",
  env: process.env,
});
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
process.exit(pattern.test(output) ? 1 : 0);
