import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

async function convert(inputPath, options) {
  const outputPath = inputPath.replace(/\\.(png|jpe?g)$/i, ".webp");

  await sharp(inputPath, { failOn: "none" })
    .rotate()
    .resize({
      width: options.width,
      height: options.height,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({
      quality: options.quality,
      alphaQuality: 100,
      effort: 6,
      smartSubsample: true
    })
    .toFile(outputPath);

  const [original, optimized] = await Promise.all([
    stat(inputPath),
    stat(outputPath)
  ]);

  const saved = Math.max(0, 100 - (optimized.size / original.size) * 100);
  console.log(
    `${inputPath} -> ${outputPath}: ${(original.size / 1024).toFixed(0)} KB -> ${(optimized.size / 1024).toFixed(0)} KB (${saved.toFixed(1)}% smaller)`
  );
}

const logoFiles = (await readdir("logos", { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\\.png$/i.test(entry.name))
  .map((entry) => path.join("logos", entry.name));

const coverFiles = (await readdir("pic/okay", { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\\.(png|jpe?g)$/i.test(entry.name))
  .map((entry) => path.join("pic/okay", entry.name));

const jobs = [
  ...logoFiles.map((file) =>
    convert(file, { width: 320, height: 320, quality: 90 })
  ),
  ...coverFiles.map((file) =>
    convert(file, { width: 1000, height: 1000, quality: 86 })
  ),
  convert("pic/pic 1.jpg", {
    width: 1100,
    height: 1400,
    quality: 88
  })
];

await Promise.all(jobs);
console.log(`Optimized ${jobs.length} homepage images.`);
