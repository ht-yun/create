import { mkdir, readdir, stat } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";
import sharp from "sharp";

const sourceRoot = resolve(process.argv[2] ?? "public/story-assets/evening-breeze");
const outputRoot = resolve(process.argv[3] ?? join("public/story-assets/optimized", basename(sourceRoot)));
const supported = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".tif", ".tiff"]);

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesBelow(path));
    else if (supported.has(extname(entry.name).toLowerCase())) files.push(path);
  }
  return files;
}

const files = await filesBelow(sourceRoot);
let originalBytes = 0;
let playbackBytes = 0;
for (const source of files) {
  const path = relative(sourceRoot, source).replace(/\.[^.]+$/, ".webp");
  const target = join(outputRoot, path);
  await mkdir(resolve(target, ".."), { recursive: true });
  const result = await sharp(source, { failOn: "error" })
    .rotate()
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(target);
  originalBytes += (await stat(source)).size;
  playbackBytes += result.size;
}

const savedPercent = originalBytes ? Math.round((1 - playbackBytes / originalBytes) * 100) : 0;
console.log(`Generated ${files.length} playback images in ${outputRoot}`);
console.log(`Size: ${(originalBytes / 1024 / 1024).toFixed(1)}MB -> ${(playbackBytes / 1024 / 1024).toFixed(1)}MB (${savedPercent}% smaller)`);
