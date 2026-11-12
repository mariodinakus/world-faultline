// PAX daily data collector — run by .github/workflows/pax-data.yml, writes JSON to the `pax-data` branch.
// 1) GDELT 2.0 event exports: actor-to-actor cooperation/conflict per conflict dyad per day (Goldstein scale).
// 2) Daily snapshot of PAX headline classification (from the live /api/news endpoint).
// 3) UCDP GED candidate fatalities per month (only when the UCDP_TOKEN secret is set).
import fs from "node:fs";import path from "node:path";import zlib from "node:zlib";
const OUT=process.env.PAX_OUT||"data";const KEEP_DAYS=120;
const BACKFILL=Number(process.env.PAX_BACKFILL_DAYS||90);
const SITE=process.env.PAX_SITE||"https://pax-peace-monitor.vercel.app";
fs.mkdirSync(OUT,{recursive:true});
const read=f=>{try{return JSON.parse(fs.readFileSync(path.join(OUT,f),"utf8"))}catch{return null}};
const write=(f,v)=>fs.writeFileSync(path.join(OUT,f),JSON.stringify(v));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const iso=d=>d.toISOString().slice(0,10);
const today=new Date();today.setUTCHours(0,0,0,0);
function dayList(n){const out=[];for(let i=n;i>=1;i--){const d=new Date(today);d.setUTCDate(d.getUTCDate()-i);out.push(iso(d))}return out}

/* ---------- GDELT dyads ---------- */
// Sides are matched on CAMEO actor country codes. Internal wars (Sudan, Myanmar) are omitted: GDELT usually
// codes rebel/paramilitary actors without a country, so the two sides cannot be separated reliably.
const DYADS={
 ukraine:{a:{el:"Ρωσία",en:"Russia",c:["RUS"]},b:{el:"Ουκρανία",en:"Ukraine",c:["UKR"]}},
 gaza:{a:{el:"Ισραήλ",en:"Israel",c:["ISR"]},b:{el:"Παλαιστίνιοι",en:"Palestinians",c:["PSE"]}},
 iranisrael:{a:{el:"Ιράν",en:"Iran",c:["IRN"]},b:{el:"Ισραήλ",en:"Israel",c:["ISR"]}},
 usiran:{a:{el:"ΗΠΑ",en:"United States",c:["USA"]},b:{el:"Ιράν",en:"Iran",c:["IRN"]}},
 drc:{a:{el:"Λ.Δ. Κονγκό",en:"DR Congo",c:["COD"]},b:{el:"Ρουάντα",en:"Rwanda",c:["RWA"]}},
 yemen:{a:{el:"Υεμένη (Χούθι κ.ά.)",en:"Yemen (Houthis et al.)",c:["YEM"]},b:{el:"ΗΠΑ / Ισραήλ",en:"US / Israel",c:["USA","ISR"]}},
 syria:{a:{el:"Συρία",en:"Syria",c:["SYR"]},b:{el:"Ισραήλ",en:"Israel",c:["ISR"]}}
};
const match=(side,country,type)=>side.c.includes(country)&&(!side.t||side.t.includes(type));
function unzipFirst(buf){
 let e=buf.length-22;while(e>=0&&buf.readUInt32LE(e)!==0x06054b50)e--;if(e<0)throw Error("no EOCD");
 const cd=buf.readUInt32LE(e+16);if(buf.readUInt32LE(cd)!==0x02014b50)throw Error("bad CD");
 const method=buf.readUInt16LE(cd+10),size=buf.readUInt32LE(cd+20),local=buf.readUInt32LE(cd+42);
 const start=local+30+buf.readUInt16LE(local+26)+buf.readUInt16LE(local+28),data=buf.subarray(start,start+size);
 return method===0?data:zlib.inflateRawSync(data);
}
async function fetchBuf(url,tries=3){
 for(let i=0;i<tries;i++){
  try{const r=await fetch(url,{headers:{"User-Agent":"PAX collector (github.com/mariodinakus/world-faultline)"}});
   if(r.status===404)return null;if(!r.ok)throw Error("HTTP "+r.status);return Buffer.from(await r.arrayBuffer())}
  catch(e){if(i===tries-1)throw e;await sleep(1500*(i+1))}
 }
}
// per day & dyad: [nAB, gAB(weighted sum), wAB, coopAB, confAB, matConfAB, nBA, gBA, wBA, coopBA, confBA, matConfBA]
function emptyRow(){return [0,0,0,0,0,0,0,0,0,0,0,0]}
function addEvent(row,off,gold,quad,mentions){
 const w=Math.max(1,Math.min(mentions,50));
 row[off]++;row[off+1]+=gold*w;row[off+2]+=w;
 if(quad===1||quad===2)row[off+3]++;else{row[off+4]++;if(quad===4)row[off+5]++}
}
async function gdeltDay(day){
 const stamps=[];const base=day.replace(/-/g,"");
 for(let h=0;h<24;h++)for(const m of ["00","15","30","45"])stamps.push(base+String(h).padStart(2,"0")+m+"00");
 const rows={};for(const id in DYADS)rows[id]=emptyRow();
 let files=0;const queue=[...stamps];
 async function worker(){
  while(queue.length){
   const s=queue.shift();let buf;
   try{buf=await fetchBuf("https://data.gdeltproject.org/gdeltv2/"+s+".export.CSV.zip")}catch{continue}
   if(!buf)continue;files++;
   let text;try{text=unzipFirst(buf).toString("utf8")}catch{continue}
   for(const line of text.split("\n")){
    if(!line)continue;const f=line.split("\t");if(f.length<58)continue;
    const c1=f[7],c2=f[17];if(!c1||!c2)continue;
    const t1=f[12],t2=f[22],quad=+f[29],gold=+f[30],mentions=+f[31]||1;if(!Number.isFinite(gold))continue;
    for(const id in DYADS){const d=DYADS[id];
     if(match(d.a,c1,t1)&&match(d.b,c2,t2))addEvent(rows[id],0,gold,quad,mentions);
     else if(match(d.b,c1,t1)&&match(d.a,c2,t2))addEvent(rows[id],6,gold,quad,mentions);
    }
   }
  }
 }
 await Promise.all(Array.from({length:12},worker));
 for(const id in rows)rows[id]=rows[id].map(v=>Math.round(v*10)/10);
 return {files,rows};
}
async function runGdelt(){
 const prev=read("gdelt.json")||{days:{},files:{}};
 const want=dayList(BACKFILL).filter(d=>!prev.days[d]||(prev.files[d]||0)<80);
 console.log("GDELT days to collect:",want.length);
 for(const day of want){
  const t=Date.now(),{files,rows}=await gdeltDay(day);
  if(files>0){prev.days[day]=rows;prev.files[day]=files}
  console.log(day,"files",files,"ukraine",rows.ukraine.slice(0,2),Math.round((Date.now()-t)/1000)+"s");
 }
 const keep=new Set(dayList(KEEP_DAYS));
 for(const d of Object.keys(prev.days))if(!keep.has(d)){delete prev.days[d];delete prev.files[d]}
 const dyads=Object.fromEntries(Object.entries(DYADS).map(([k,v])=>[k,{a:{el:v.a.el,en:v.a.en},b:{el:v.b.el,en:v.b.en}}]));
 write("gdelt.json",{updatedAt:new Date().toISOString(),source:"GDELT 2.0 Event Database (data.gdeltproject.org)",
  columns:["nAB","goldAB","wAB","coopAB","confAB","matAB","nBA","goldBA","wBA","coopBA","confBA","matBA"],dyads,days:prev.days,files:prev.files});
}

/* ---------- Headline history ---------- */
const REGIONS=["ukraine","gaza","iranisrael","usiran","sudan","drc","myanmar","yemen","syria"];
function classify(title){
 const t=String(title).toLowerCase();
 if(/(?:cease.?fire|truce|peace deal|agreement).{0,55}(?:violat|collaps|breakdown|broken|rejected|rejects|fails|failed|unravels|ends|shattered)|(?:violat|collaps|broken|rejects|rejected|failed).{0,55}(?:cease.?fire|truce|peace deal|agreement)/i.test(t))return "setback";
 if(/(?:airstrik|missile|bombard|shelling|attacks?|attacked|killed|killings|deaths|shells|retaliat|fighting|clashes|offensive|deadlock|rejects|rejected|escalat|drone strike|raid on)/i.test(t))return "setback";
 if(/(?:hostages?|prisoners?).{0,36}(?:released|freed|exchanged)|(?:withdrawal|monitoring mission|peacekeepers).{0,34}(?:begins|starts|deployed|launched)|(?:humanitarian corridor|aid deliveries).{0,30}(?:opens|resumes|operational)/i.test(t))return "implemented";
 if(/(?:cease.?fire|truce|peace agreement|peace deal).{0,50}(?:signed|in effect|takes effect|begins|holds|reached|agreed|implemented|secured)|(?:sign|agreed|reached|seal).{0,45}(?:cease.?fire|truce|peace deal|peace agreement)/i.test(t))return "ceasefire";
 if(/(?:peace plan|peace proposal|cease.?fire proposal|draft agreement|framework deal|negotiating framework|proposed deal|proposes truce|proposes cease.?fire)/i.test(t))return "proposal";
 if(/(?:talks|negotiations?|diploma(?:t|cy)|mediator|mediation|envoy|summit|dialogue|peace meeting|peace mission|peace process)/i.test(t))return "talks";
 return "other";
}
async function runHeadlines(){
 const prev=read("headlines.json")||{days:{}};const day=iso(new Date());const snap={};
 for(const id of REGIONS){
  try{const r=await fetch(SITE+"/api/news?region="+id);const j=await r.json();
   const c={talks:0,proposal:0,ceasefire:0,implemented:0,setback:0,other:0};
   const recent=(j.articles||[]).filter(a=>Date.now()-Date.parse(a.publishedAt)<36*3600e3);
   for(const a of recent)c[classify(a.title)]++;
   snap[id]=[recent.length,new Set(recent.map(a=>a.source)).size,c.talks,c.proposal,c.ceasefire,c.implemented,c.setback];
  }catch(e){console.log("headlines",id,e.message)}
  await sleep(800);
 }
 if(Object.keys(snap).length)prev.days[day]=snap;
 const keep=new Set([...dayList(KEEP_DAYS),day]);for(const d of Object.keys(prev.days))if(!keep.has(d))delete prev.days[d];
 write("headlines.json",{updatedAt:new Date().toISOString(),window:"articles published in the 36 hours before each daily run",
  columns:["articles","publishers","talks","proposal","ceasefire","implemented","setback"],days:prev.days});
}

/* ---------- UCDP (optional) ---------- */
const UCDP_COUNTRIES={ukraine:[369,365],gaza:[666],iranisrael:[630,666],usiran:[630],sudan:[625],drc:[490],myanmar:[775],yemen:[678],syria:[652]};
async function runUcdp(){
 const token=process.env.UCDP_TOKEN;
 if(!token){write("ucdp.json",{status:"no-token",updatedAt:new Date().toISOString()});console.log("UCDP: no token, skipped");return}
 const now=new Date(),yy=now.getUTCFullYear()%100,versions=[];
 for(let k=0;k<6;k++){const d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-k,1));versions.push((d.getUTCFullYear()%100)+".0."+(d.getUTCMonth()+1))}
 versions.push(yy+".1",(yy-1)+".1");
 const start=iso(new Date(Date.now()-400*86400e3));const out={};let used=null;
 for(const v of versions){
  try{const r=await fetch(`https://ucdpapi.pcr.uu.se/api/gedevents/${v}?pagesize=1&StartDate=${start}`,{headers:{"x-ucdp-access-token":token}});
   if(r.ok){const j=await r.json();if((j.TotalCount||0)>0){used=v;break}}}catch{}
 }
 if(!used){write("ucdp.json",{status:"unavailable",updatedAt:new Date().toISOString()});return}
 for(const [id,cs] of Object.entries(UCDP_COUNTRIES)){
  const months={};
  for(const c of cs){
   let url=`https://ucdpapi.pcr.uu.se/api/gedevents/${used}?pagesize=1000&Country=${c}&StartDate=${start}`;
   for(let page=0;url&&page<40;page++){
    const r=await fetch(url,{headers:{"x-ucdp-access-token":token}});if(!r.ok)break;const j=await r.json();
    for(const e of j.Result||[]){const m=String(e.date_start).slice(0,7);months[m]=(months[m]||0)+(+e.best||0)}
    url=j.NextPageUrl||null;await sleep(300);
   }
  }
  out[id]=months;
 }
 write("ucdp.json",{status:"ok",version:used,updatedAt:new Date().toISOString(),source:"UCDP Georeferenced Event Dataset (candidate)",countries:UCDP_COUNTRIES,months:out});
}

const only=process.argv[2];
if(!only||only==="headlines")await runHeadlines();
if(!only||only==="ucdp")await runUcdp();
if(!only||only==="gdelt")await runGdelt();
console.log("done");
