require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const config = require("./config");
const { getPapers, getState } = require("./database");
const { scrape, isRunning } = require("./scraper");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    running: isRunning(),
    source: config.sourceUrl,
    state: getState()
  });
});

app.get("/api/scan-status", (req, res) => {
  const state = getState();
  res.json({
    running: isRunning(),
    lastScan: state.lastScan || null,
    pagesVisited: state.pagesVisited || 0,
    foundPdfs: state.foundPdfs || 0,
    newPapers: state.newPapers || 0,
    downloaded: state.downloaded || 0
  });
});

app.get("/api/stats", (req, res) => {
  const papers = getPapers();
  const years = papers.map(p => p.year).filter(Boolean);
  res.json({
    total: papers.length,
    oLevel: papers.filter(p => p.level === "O Level").length,
    aLevel: papers.filter(p => p.level === "A Level").length,
    subjects: [...new Set(papers.map(p => p.subject).filter(Boolean))].sort(),
    years: [...new Set(years)].sort((a, b) => b - a),
    lastScan: getState().lastScan || null,
    running: isRunning()
  });
});

app.get("/api/papers", (req, res) => {
  const { q = "", level = "", subject = "", year = "", session = "", type = "", limit = "100" } = req.query;
  const search = String(q).toLowerCase().trim();

  let papers = getPapers().filter(p => {
    const matchesQ = !search || [p.title, p.subject, p.level, p.session, p.type]
      .join(" ").toLowerCase().includes(search);
    return matchesQ &&
      (!level || p.level === level) &&
      (!subject || p.subject === subject) &&
      (!year || String(p.year) === String(year)) &&
      (!session || p.session === session) &&
      (!type || p.type === type);
  });

  papers = papers.slice(0, Math.min(Number(limit) || 100, 500));
  res.json({ total: papers.length, papers });
});

app.get("/api/papers/:id/download", (req, res) => {
  const paper = getPapers().find(p => p.id === req.params.id);
  if (!paper) return res.status(404).json({ error: "Paper not found" });

  if (paper.localFile) {
    const filePath = path.join(config.downloadDir, paper.localFile);
    if (fs.existsSync(filePath)) {
      return res.download(filePath, `${paper.title || "zimsec-paper"}.pdf`);
    }
  }
  return res.redirect(paper.url);
});

app.post("/api/scrape", async (req, res) => {
  if (config.scrapeKey && req.headers["x-scrape-key"] !== config.scrapeKey) {
    return res.status(401).json({ error: "Invalid scrape key" });
  }
  try {
    const result = await scrape();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

cron.schedule(config.cronSchedule, async () => {
  try {
    console.log("[cron] Starting automatic ZIMSEC scan...");
    const result = await scrape();
    console.log("[cron] Scan complete:", result);
  } catch (error) {
    console.error("[cron] Scan failed:", error.message);
  }
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.listen(config.port, () => {
  console.log(`ZIMSEC Scraper running on port ${config.port}`);
});
