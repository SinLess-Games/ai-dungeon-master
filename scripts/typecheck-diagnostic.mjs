import { spawnSync } from "node:child_process";

const probe = /TS2322|TS2345|TS2769/;
const result = spawnSync("npm", ["run", "typecheck"], {
  encoding: "utf8",
  shell: false,
});
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
process.stdout.write(output);
process.exit(probe.test(output) ? 0 : 1);
