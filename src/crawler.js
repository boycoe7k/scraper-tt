const cheerio = require("cheerio");
const { URL } = require("url");
const config = require("./config");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// The current ZIMSEC site renders its catalog from js/default_papers.js rather
// than putting PDF links in the HTML. Extract the JSON object assigned to dt.
function extractObject(source, marker) {
  const start = source.indexOf(marker);
  if (start < 0) return null;
  const open = source.indexOf("{", start);
  if (open < 0) return null;

  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let i = open; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) return source.slice(open, i + 1);
  }
  return null;
}

async function discoverScriptPdfs($, pageUrl, pdfs) {
  const scripts = [];
  $("script[src]").each((_, el) => scripts.push($(el).attr("src")));

  for (const src of scripts) {
    try {
      const scriptUrl = new URL(src, pageUrl).toString();
      const response = await fetch(scriptUrl, { redirect: "follow" });
      if (!response.ok) continue;
      const source = await response.text();
      if (!source.includes("downloadURL")) continue;

      const object = extractObject(source, "let dt=");
      if (!object) continue;
      const records = JSON.parse(object);
      for (const record of Object.values(records)) {
        const url = record.downloadURL || record.downloadURL2 || record.s3Url;
        if (!url || !/^https?:\/\//i.test(url)) continue;
        pdfs.push({
          url,
          title: record.page_title || record.fileName || record.s3FileName || url
        });
      }
    } catch {}
  }
}

async function crawl() {
  const origin = new URL(config.sourceUrl).origin;
  const seeds = [config.sourceUrl, ...(config.sourceUrls || [])];
  const queue = [...new Set(seeds)].map(url => ({ url, depth: 0 }));
  const visited = new Set();
  const pdfs = [];

  while (queue.length && visited.size < config.maxPages) {
    const current = queue.shift();
    if (visited.has(current.url) || current.depth > config.maxDepth) continue;
    visited.add(current.url);

    try {
      const res = await fetch(current.url, { redirect: "follow" });
      if (!res.ok) continue;

      const type = res.headers.get("content-type") || "";
      if (type.includes("application/pdf") || current.url.toLowerCase().endsWith(".pdf")) {
        pdfs.push({ url: current.url, title: current.url.split("/").pop() });
        continue;
      }
      if (!type.includes("text/html")) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      await discoverScriptPdfs($, current.url, pdfs);

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        try {
          const next = new URL(href, current.url);
          if (next.origin !== origin) return;
          next.hash = "";
          const url = next.toString();
          const label = $(el).text().trim() || next.pathname.split("/").pop();

          if (/\.pdf(?:$|\?)/i.test(next.pathname + next.search)) {
            pdfs.push({ url, title: label });
          } else if (current.depth < config.maxDepth && !visited.has(url)) {
            queue.push({ url, depth: current.depth + 1 });
          }
        } catch {}
      });

      await sleep(config.requestDelay);
    } catch {}
  }

  const unique = new Map();
  for (const pdf of pdfs) unique.set(pdf.url, pdf);
  return { pagesVisited: visited.size, pdfs: [...unique.values()] };
}

module.exports = { crawl };
