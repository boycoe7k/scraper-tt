const path = require("path");

module.exports = {
  port: Number(process.env.PORT || 3000),
  sourceUrl: process.env.SOURCE_URL || "https://www5.zimsec.co.zw/download-category/o-level/",
  sourceUrls: (process.env.SOURCE_URLS || "https://www5.zimsec.co.zw/download-category/a-level/").split(",").map(url => url.trim()).filter(Boolean),
  maxDepth: Number(process.env.MAX_CRAWL_DEPTH || 3),
  maxPages: Number(process.env.MAX_PAGES || 250),
  requestDelay: Number(process.env.REQUEST_DELAY_MS || 1000),
  maxDownloadBytes: Number(process.env.MAX_DOWNLOAD_MB || 30) * 1024 * 1024,
  cronSchedule: process.env.CRON_SCHEDULE || "0 */6 * * *",
  scrapeKey: process.env.SCRAPE_KEY || "",
  dataDir: path.join(process.cwd(), "data"),
  downloadDir: path.join(process.cwd(), "downloads")
};
