const fs = require("fs");
const path = require("path");
const config = require("./config");

const papersFile = path.join(config.dataDir, "papers.json");
const stateFile = path.join(config.dataDir, "state.json");

function ensure() {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.mkdirSync(config.downloadDir, { recursive: true });
  if (!fs.existsSync(papersFile)) fs.writeFileSync(papersFile, "[]");
  if (!fs.existsSync(stateFile)) fs.writeFileSync(stateFile, JSON.stringify({
    lastScan: null,
    pagesVisited: 0,
    newPapers: 0,
    downloaded: 0
  }, null, 2));
}

function readJson(file, fallback) {
  ensure();
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}

function writeJson(file, value) {
  ensure();
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function getPapers() {
  return readJson(papersFile, []);
}

function savePapers(papers) {
  writeJson(papersFile, papers);
}

function getState() {
  return readJson(stateFile, {});
}

function saveState(state) {
  writeJson(stateFile, state);
}

function upsertPaper(paper) {
  const papers = getPapers();
  const index = papers.findIndex(p => p.url === paper.url);
  if (index >= 0) {
    papers[index] = { ...papers[index], ...paper };
    savePapers(papers);
    return { added: false, paper: papers[index] };
  }
  const item = {
    ...paper,
    id: paper.id || require("crypto").createHash("sha1").update(paper.url).digest("hex"),
    discoveredAt: paper.discoveredAt || new Date().toISOString()
  };
  papers.unshift(item);
  savePapers(papers);
  return { added: true, paper: item };
}

ensure();

module.exports = { getPapers, savePapers, getState, saveState, upsertPaper };
