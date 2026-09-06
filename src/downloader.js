const fs = require("fs");
const path = require("path");
const config = require("./config");

async function downloadPdf(url, id) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);

  const length = Number(response.headers.get("content-length") || 0);
  if (length && length > config.maxDownloadBytes) {
    throw new Error("PDF exceeds configured size limit");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > config.maxDownloadBytes) {
    throw new Error("PDF exceeds configured size limit");
  }

  const filename = `${id}.pdf`;
  const filePath = path.join(config.downloadDir, filename);
  fs.writeFileSync(filePath, buffer);
  return { filename, filePath, size: buffer.length };
}

module.exports = { downloadPdf };
