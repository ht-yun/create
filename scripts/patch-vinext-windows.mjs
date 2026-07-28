import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const target = path.resolve(
  "node_modules/vinext/dist/server/static-file-cache.js",
);

const buggyLine = "relativePath: path.relative(base, batch[j]),";
const fixedLine =
  'relativePath: path.relative(base, batch[j]).replaceAll(path.sep, "/"),';

try {
  const source = await readFile(target, "utf8");

  if (source.includes(fixedLine)) {
    console.log("[postinstall] vinext Windows static paths are already patched.");
  } else if (source.includes(buggyLine)) {
    await writeFile(target, source.replace(buggyLine, fixedLine), "utf8");
    console.log("[postinstall] patched vinext Windows static asset paths.");
  } else {
    console.log(
      "[postinstall] vinext static path implementation has changed; no patch needed.",
    );
  }
} catch (error) {
  if (error?.code === "ENOENT") {
    console.log("[postinstall] vinext is not installed; skipped compatibility patch.");
  } else {
    throw error;
  }
}
