import { spawnSync } from "node:child_process";

const probe = /TS7030|TS18048|TS2532|TS18047/;
const result = spawnSync("npm", ["run", "typecheck"], {
  encoding: "utf8",
  shell: false,
});
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
process.stdout.write(output);
process.exit(probe.test(output) ? 0 : 1);
