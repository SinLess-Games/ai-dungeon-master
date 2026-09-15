import { spawnSync } from "node:child_process";

const probe = /(?:src\/(?:app\/bootstrap\/providers|components\/layout\/site-header|infrastructure\/database\/schema\/(?:index|offlineSyncMutation|worldMap)|server\/app)\.tsx?|tests\/unit\/offline-sync-client\.test\.ts)/;
const result = spawnSync("npm", ["run", "typecheck"], {
  encoding: "utf8",
  shell: false,
});
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
process.stdout.write(output);
process.exit(probe.test(output) ? 0 : 1);
