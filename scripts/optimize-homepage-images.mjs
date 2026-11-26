import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

sharp.concurrency(2);

async function convert(inputPath, options) {
  const extension = path.extname(inputPath);
  const outputPath = inputPath.slice(0, -extension.length) + ".webp";

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
    inputPath + " -> " + outputPath + ": " +
    (original.size / 1024).toFixed(0) + " KB -> " +
    (optimized.size / 1024).toFixed(0) + " KB (" +
    saved.toFixed(1) + "% smaller)"
  );
}

const logoFiles = (await readdir("logos", { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\.png$/i.test(entry.name))
  .map((entry) => path.join("logos", entry.name));

const coverFiles = (await readdir("pic/okay", { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\.(png|jpe?g)$/i.test(entry.name))
  .map((entry) => path.join("pic/okay", entry.name));

const jobs = [
  ...logoFiles.map((file) => ({
    file,
    options: { width: 320, height: 320, quality: 90 }
  })),
  ...coverFiles.map((file) => ({
    file,
    options: { width: 1000, height: 1000, quality: 86 }
  })),
  {
    file: "pic/pic 1.jpg",
    options: { width: 1100, height: 1400, quality: 88 }
  }
];

for (const job of jobs) {
  await convert(job.file, job.options);
}

console.log("Optimized " + jobs.length + " homepage images.");
