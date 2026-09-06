const { crawl } = require("./crawler");
const { parsePaper } = require("./parser");
const { downloadPdf } = require("./downloader");
const { getPapers, saveState, getState, upsertPaper } = require("./database");

let running = false;

async function scrape() {
  if (running) return { ok: false, message: "A scan is already running" };
  running = true;

  const started = new Date().toISOString();
  let added = 0;
  let downloaded = 0;
  let failedDownloads = 0;

  try {
    const result = await crawl();

    for (const item of result.pdfs) {
      const paper = parsePaper(item.title, item.url);
      const existing = getPapers().find(p => p.url === paper.url);

      if (!existing) {
        const saved = upsertPaper(paper);
        if (saved.added) added++;
      }

      const current = getPapers().find(p => p.url === paper.url);
      if (current && !current.localFile) {
        try {
          const file = await downloadPdf(paper.url, current.id);
          upsertPaper({ ...current, localFile: file.filename, size: file.size, downloadedAt: new Date().toISOString() });
          downloaded++;
        } catch {
          failedDownloads++;
        }
      }
    }

    const state = {
      ...getState(),
      lastScan: new Date().toISOString(),
      startedAt: started,
      pagesVisited: result.pagesVisited,
      foundPdfs: result.pdfs.length,
      newPapers: added,
      downloaded,
      failedDownloads
    };
    saveState(state);

    return { ok: true, ...state };
  } finally {
    running = false;
  }
}

module.exports = { scrape, isRunning: () => running };
