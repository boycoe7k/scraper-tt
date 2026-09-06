const $=id=>document.getElementById(id);
let searchTimer;
const filters=["level","subject","year","session","type"];

function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function date(v){if(!v)return"Never";const d=new Date(v);return Number.isNaN(d.getTime())?v:d.toLocaleString([],{dateStyle:"medium",timeStyle:"short"})}
function params(){const p=new URLSearchParams();p.set("limit","500");const q=$("search").value.trim();if(q)p.set("q",q);filters.forEach(id=>{if($(id).value)p.set(id,$(id).value)});return p}

function animateNumber(el,to){
  const from=Number(el.dataset.value||0);el.dataset.value=to;const start=performance.now();
  const step=t=>{const x=Math.min(1,(t-start)/550);el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-x,3))).toLocaleString();if(x<1)requestAnimationFrame(step)};requestAnimationFrame(step)
}

async function stats(){
  const r=await fetch("/api/stats");const d=await r.json();
  animateNumber($("total"),d.total);animateNumber($("oLevel"),d.oLevel);animateNumber($("aLevel"),d.aLevel);
  $("lastScan").textContent=d.lastScan?date(d.lastScan):"Never";
  const sub=$("subject"),sv=sub.value;sub.innerHTML='<option value="">All subjects</option>';
  d.subjects.forEach(x=>{const o=document.createElement("option");o.value=x;o.textContent=x;sub.appendChild(o)});sub.value=sv;
  const yr=$("year"),yv=yr.value;yr.innerHTML='<option value="">All years</option>';
  d.years.forEach(x=>{const o=document.createElement("option");o.value=x;o.textContent=x;yr.appendChild(o)});yr.value=yv;
}

function skeletons(){return Array.from({length:6},()=>'<div class="skeleton"></div>').join("")}
async function papers(){
  $("papers").innerHTML=skeletons();$("empty").classList.add("hidden");
  try{
    const r=await fetch("/api/papers?"+params());const d=await r.json();render(d.papers||[]);
  }catch{$("papers").innerHTML="";$("empty").classList.remove("hidden");$("resultCount").textContent="Unable to load archive"}
}
function render(ps){
  $("resultCount").textContent=`${ps.length.toLocaleString()} paper${ps.length===1?"":"s"} found`;
  if(!ps.length){$("papers").innerHTML="";$("empty").classList.remove("hidden");return}
  $("empty").classList.add("hidden");
  $("papers").innerHTML=ps.map((p,i)=>`<article class="paper-card" style="animation-delay:${Math.min(i,12)*.025}s">
    <div class="paper-top"><span class="badge">${esc(p.level||"ZIMSEC")}</span><span class="badge gray">${esc(p.type||"Paper")}</span></div>
    <h3>${esc(p.title||"ZIMSEC Paper")}</h3>
    <div class="meta">${p.subject?`<span>${esc(p.subject)}</span>`:""}${p.year?`<span>• ${esc(p.year)}</span>`:""}${p.session?`<span>• ${esc(p.session)}</span>`:""}${p.paper?`<span>• ${esc(p.paper)}</span>`:""}</div>
    <div class="paper-actions"><a class="download" href="/api/papers/${encodeURIComponent(p.id)}/download">Download</a><a class="source" href="${esc(p.url)}" target="_blank" rel="noopener">Source</a></div>
  </article>`).join("")
}

async function refresh(){
  $("refreshBtn").classList.add("loading");
  await Promise.all([stats(),papers()]);
  $("refreshBtn").classList.remove("loading")
}
async function scanStatus(){
  try{
    const r=await fetch("/api/scan-status");const d=await r.json();
    $("liveText").textContent=d.running?"Crawler scanning":"Crawler online";
    return d;
  }catch{return null}
}
filters.forEach(id=>$(id).addEventListener("change",papers));
$("search").addEventListener("input",()=>{clearTimeout(searchTimer);searchTimer=setTimeout(papers,220)});
$("clearSearch").onclick=()=>{$("search").value="";papers()};
$("resetBtn").onclick=()=>{$("search").value="";filters.forEach(id=>$(id).value="");papers()};
$("refreshBtn").onclick=refresh;
document.addEventListener("keydown",e=>{if(e.key==="/"&&document.activeElement.tagName!=="INPUT"){e.preventDefault();$("search").focus()}if(e.key==="Escape")$("modal").classList.add("hidden")});

$("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.zimsecTheme=document.body.classList.contains("dark")?"dark":"light"};
if(localStorage.zimsecTheme==="dark")document.body.classList.add("dark");

$("adminBtn").onclick=()=>{$("modal").classList.remove("hidden");$("scrapeKey").focus()};
$("closeModal").onclick=()=>{$("modal").classList.add("hidden")};
$("modal").onclick=e=>{if(e.target===$("modal"))$("modal").classList.add("hidden")};

$("scanBtn").onclick=async()=>{
  const btn=$("scanBtn"),status=$("scanStatus");btn.disabled=true;status.textContent="Starting crawler...";
  try{
    const r=await fetch("/api/scrape",{method:"POST",headers:{"x-scrape-key":$("scrapeKey").value}});
    const d=await r.json();if(!r.ok)throw Error(d.error||"Scan failed");
    status.textContent="Scan complete. Refreshing archive...";
    await refresh();
    status.textContent=`Done — ${d.newPapers||0} new papers, ${d.downloaded||0} PDFs downloaded.`;
  }catch(e){status.textContent=e.message}
  finally{btn.disabled=false}
};

$("yearNow").textContent=new Date().getFullYear();
refresh();scanStatus();
setInterval(async()=>{const d=await scanStatus();if(d?.running){await stats()}},5000);
