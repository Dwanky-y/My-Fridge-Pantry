import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const [command, ...args] = process.argv.slice(2);
const targets = {
  dev: ["../node_modules/vite/bin/vite.js"],
  preview: ["../node_modules/vite/bin/vite.js", "preview"],
  start: ["../server/index.js"],
};
const target = targets[command];
if (!target) {
  console.error("Usage: node scripts/run.js <dev|preview|start> [arguments]");
  process.exit(1);
}

// Cloud proxy support is optional; older Vite-compatible Node releases lack this flag.
const proxyArgs = process.allowedNodeEnvironmentFlags.has("--use-env-proxy")
  ? ["--use-env-proxy"]
  : [];
const child = spawn(
  process.execPath,
  [
    ...proxyArgs,
    fileURLToPath(new URL(target[0], import.meta.url)),
    ...target.slice(1),
    ...args,
  ],
  { stdio: "inherit" },
);
child.on("error", (error) => {
  console.error(`Could not start ${command}: ${error.message}`);
  process.exit(1);
});
child.on("exit", (code, signal) =>
  process.exit(code ?? (signal === "SIGINT" ? 130 : 1)),
);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
