const cheerio = require("cheerio");
const { URL } = require("url");
const config = require("./config");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function crawl() {
  const origin = new URL(config.sourceUrl).origin;
  const queue = [{ url: config.sourceUrl, depth: 0 }];
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
