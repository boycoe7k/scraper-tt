function clean(text) {
  return text.replace(/\s+/g, " ").trim();
}

function parsePaper(title, url) {
  const t = clean(title);
  const lower = t.toLowerCase();

  let level = "";
  if (/\bo\s*level\b|\bol\b/.test(lower)) level = "O Level";
  if (/\ba\s*level\b|\bal\b/.test(lower)) level = "A Level";

  let session = "";
  if (/\bjune\b/i.test(t)) session = "June";
  else if (/\bnovember\b/i.test(t)) session = "November";
  else if (/\bmay\b/i.test(t)) session = "May";

  const yearMatch = t.match(/\b(20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : null;

  let type = "Paper";
  if (/marking scheme|mark scheme|ms\b/i.test(t)) type = "Marking Scheme";
  else if (/green book/i.test(t)) type = "Green Book";
  else if (/blue book/i.test(t)) type = "Blue Book";
  else if (/notes?/i.test(t)) type = "Notes";

  let paper = "";
  const paperMatch = t.match(/\bpaper\s*([0-9]+)\b/i);
  if (paperMatch) paper = `Paper ${paperMatch[1]}`;

  const subjects = [
    "Mathematics", "English Language", "Physics", "Chemistry", "Biology",
    "Geography", "History", "Accounting", "Business Studies", "Economics",
    "Computer Science", "Information Communication Technology", "ICT",
    "Shona", "Ndebele", "Divinity", "Literature", "French",
    "Family and Religious Studies", "Heritage Studies"
  ];
  let subject = "";
  for (const s of subjects) {
    if (lower.includes(s.toLowerCase())) {
      subject = s === "ICT" ? "Information Communication Technology" : s;
      break;
    }
  }

  return { title: t, url, level, subject, year, session, paper, type };
}

module.exports = { parsePaper };
