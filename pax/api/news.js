/* PAX 2.0 multi-source feed: metadata only. */
const QUERIES={
 ukraine:'"Russia" "Ukraine" (talks OR peace OR ceasefire OR missiles OR diplomacy)',
 gaza:'("Gaza" OR "Palestine") (Israel OR Hamas) (ceasefire OR talks OR attacks OR aid)',
 iranisrael:'"Israel" "Iran" (strikes OR diplomacy OR ceasefire OR nuclear)',
 usiran:'"United States" "Iran" (talks OR nuclear OR sanctions OR attack)',
 sudan:'Sudan (RSF OR SAF OR army) (peace OR ceasefire OR violence)',
 drc:'(Congo OR DRC) (M23 OR Rwanda) (ceasefire OR negotiations OR fighting)',
 myanmar:'Myanmar (junta OR resistance) (ceasefire OR strikes OR talks)',
 yemen:'Yemen (Houthis OR Houthi) (ceasefire OR strikes OR diplomacy)',
 syria:'Syria (SDF OR Damascus OR ceasefire OR clashes OR negotiations)'
};
const CONFLICT_START={ukraine:"2022-02-24",gaza:"2023-10-07",iranisrael:"2024-04-13",usiran:"2025-06-22",sudan:"2023-04-15",drc:"2022-03-28",myanmar:"2021-02-01",yemen:"2015-03-26",syria:"2011-03-15"};
const RELEVANCE={
 ukraine:/\b(ukrain\w*|russi\w*|kyiv|kiev|zelensk\w*|putin|donbas|crimea)\b/i,
 gaza:/\b(gaza|palestini\w*|hamas|israel\w*|west bank|rafah|netanyahu)\b/i,
 iranisrael:/\b(iran\w*|israel\w*|tehran|tel aviv)\b/i,
 usiran:/\b(iran\w*|tehran|nuclear talks|washington)\b/i,
 sudan:/\b(sudan\w*|khartoum|darfur|rsf\b)\b/i,
 drc:/\b(congo|congol\w*|kinshasa|goma|m23\b|kivu|drc\b)\b/i,
 myanmar:/\b(myanmar|burma|yangon|naypyidaw|junta)\b/i,
 yemen:/\b(yemen\w*|houthi\w*|sanaa|red sea)\b/i,
 syria:/\b(syria\w*|damascus|aleppo|sdf\b|kurdis\w*)\b/i
};
const RSS=[
 {id:"bbc",name:"BBC World",url:"https://feeds.bbci.co.uk/news/world/rss.xml",publisher:"BBC News"},
 {id:"guardian",name:"The Guardian World",url:"https://www.theguardian.com/world/rss",publisher:"The Guardian"},
 {id:"aljazeera",name:"Al Jazeera",url:"https://www.aljazeera.com/xml/rss/all.xml",publisher:"Al Jazeera"},
 {id:"dw",name:"DW",url:"https://rss.dw.com/xml/rss-en-all",publisher:"DW"}
];
function decode(s=""){return String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp|ndash|mdash|rsquo|lsquo);/gi,(_,x)=>{
 if(x[0]==="#"){const n=x[1]?.toLowerCase()==="x"?parseInt(x.slice(2),16):parseInt(x.slice(1),10);return Number.isFinite(n)&&n>0&&n<1114112?String.fromCodePoint(n):""}
 return {amp:"&",quot:'"',apos:"'",lt:"<",gt:">",nbsp:" ",ndash:"–",mdash:"—",rsquo:"'",lsquo:"'"}[x.toLowerCase()]||"";
}).replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim()}
function tag(item,name){const safe=name.replace(/[^a-z]/gi,"");const m=item.match(new RegExp("<(?:\\w+:)?"+safe+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:\\w+:)?"+safe+">","i"));return m?decode(m[1]):""}
function entries(xml){return xml.match(/<(?:item|entry)(?:\s[^>]*)?>[\s\S]*?<\/(?:item|entry)>/gi)||[]}
function safeUrl(s){try{const u=new URL(s);return u.protocol==="https:"?u.href:null}catch{return null}}
function date(s){const t=Date.parse(s);return Number.isFinite(t)?new Date(t).toISOString():null}
function publisher(source){
 const s=String(source||"Unknown").trim(),t=s.toLowerCase();
 if(/reuters/.test(t))return "Reuters";if(/associated press|ap news/.test(t))return "AP News";
 if(/bbc/.test(t))return "BBC News";if(/guardian/.test(t))return "The Guardian";
 if(/al jazeera/.test(t))return "Al Jazeera";if(/deutsche welle|^dw\b|dw.com/.test(t))return "DW";
 if(/france.?24/.test(t))return "France 24";if(/euronews/.test(t))return "Euronews";
 if(/politico/.test(t))return "POLITICO";
 return s.slice(0,60)
}
function parseRSS(xml,feed,via){
 return entries(xml).map(item=>{
 const title=tag(item,"title"),source=publisher(feed?.publisher||tag(item,"source"));
 const link=item.match(/<link\b[^>]*href=["']([^"']+)["']/i);
 const url=safeUrl(tag(item,"link")||link?.[1]);
 const publishedAt=date(tag(item,"pubDate")||tag(item,"published")||tag(item,"updated")||tag(item,"date"));
 return {title:title.endsWith(" - "+source)?title.slice(0,-source.length-3):title,url,source,publishedAt,via};
 }).filter(a=>a.title&&a.url&&a.publishedAt)
}
function parseGDELT(data){return (data.articles||[]).map(a=>{
 const d=String(a.seendate||"");
 const parsed=/^\d{8}T\d{6}Z$/.test(d)?d.slice(0,4)+"-"+d.slice(4,6)+"-"+d.slice(6,8)+"T"+d.slice(9,11)+":"+d.slice(11,13)+":"+d.slice(13,15)+"Z":d;
 return {title:decode(a.title),url:safeUrl(a.url),source:publisher(a.domain||a.sourcecountry),publishedAt:date(parsed),via:"GDELT"}
}).filter(a=>a.title&&a.url&&a.publishedAt)}
// Shared in-process cache prevents 9 concurrent region requests from refetching the same publisher feeds.
// Free Render instances may sleep and reset this cache; it is an optimization, not permanent storage.
const UPSTREAM_CACHE=new Map(),REGION_CACHE=new Map();
const FEED_TTL=4*60*1000,REGION_TTL=3*60*1000,STALE_TTL=12*60*1000;
let activeRequests=0;const requestQueue=[];
async function waitSlot(){
 if(activeRequests<7){activeRequests++;return}
 await new Promise(resolve=>requestQueue.push(resolve));
 activeRequests++;
}
function releaseSlot(){activeRequests--;const resume=requestQueue.shift();if(resume)resume()}
function cached(upstreamKey,loader){
 const existing=UPSTREAM_CACHE.get(upstreamKey),now=Date.now();
 if(existing&&existing.until>now)return existing.value;
 const value=loader().catch(error=>{UPSTREAM_CACHE.delete(upstreamKey);throw error});
 UPSTREAM_CACHE.set(upstreamKey,{until:now+FEED_TTL,value});
 if(UPSTREAM_CACHE.size>80)for(const [k,v] of UPSTREAM_CACHE)if(v.until<now)UPSTREAM_CACHE.delete(k);
 return value;
}
async function get(url){
 return cached(url,async()=>{
  await waitSlot();
  const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),4800);
  try{
   const response=await fetch(url,{signal:ctl.signal,headers:{"User-Agent":"PAX Global Conflict Intelligence 2.1","Accept":"application/rss+xml,application/xml,text/xml,application/json,*/*"}});
   if(!response.ok)throw Error("HTTP "+response.status);
   const body=await response.text();if(body.length>1400000)throw Error("oversize");return body;
  }finally{clearTimeout(timeout);releaseSlot()}
 });
}
function google(query){return "https://news.google.com/rss/search?q="+encodeURIComponent(query+" when:7d")+"&hl=en-US&gl=US&ceid=US:en"}
function unique(all,region){
 const now=Date.now(),phase=Date.parse(CONFLICT_START[region]+"T00:00:00Z"),cutoff=Math.max(now-7*86400000,phase),seen=new Set();
 return all.filter(a=>{
 const t=Date.parse(a.publishedAt);if(!a.title||!a.url||!Number.isFinite(t)||t<cutoff||t>now+3600000)return false;
 const canonical=a.title.toLocaleLowerCase().replace(/[\p{P}\p{S}]/gu," ").replace(/\s+/g," ").trim();
 if(!RELEVANCE[region].test(canonical))return false;
 const key=canonical.slice(0,180)+"|"+a.source.toLowerCase();
 if(seen.has(key))return false;seen.add(key);return true
 }).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,55)
}
async function collect(region){
 const q=QUERIES[region];
 // The four publisher RSS feeds are shared across all nine conflict dossiers.
 const jobs=[
  {name:"Google News · broad",run:()=>parseRSS(awaitableGoogle(q),null,"Google News")},
  {name:"Google News · wire",run:()=>parseRSS(awaitableGoogle(q+" (site:reuters.com OR site:apnews.com OR site:france24.com OR site:politico.eu OR site:euronews.com)"),null,"Google News")},
  ...RSS.map(f=>({name:f.name,run:()=>get(f.url).then(xml=>parseRSS(xml,f,"Publisher RSS"))}))
 ];
 function awaitableGoogle(query){return get(google(query))}
 // Explicitly settle all six feeds and do not make GDELT calls unless coverage is scant.
 const results=await Promise.allSettled(jobs.map(x=>Promise.resolve().then(x.run).then(async x=>typeof x?.then==="function"?parseRSS(await x,null,"Google News"):x)));
 const sources=results.map((v,i)=>({feed:jobs[i].name,status:v.status==="fulfilled"?"ok":"unavailable",count:v.status==="fulfilled"?v.value.length:0}));
 let all=results.flatMap(r=>r.status==="fulfilled"?r.value:[]);
 const initial=unique(all,region);
 if(initial.length<10){
  const base=({ukraine:"Ukraine Russia",gaza:"Gaza Israel",iranisrael:"Iran Israel",usiran:"Iran United States",sudan:"Sudan RSF",drc:"Congo M23",myanmar:"Myanmar junta",yemen:"Yemen Houthi",syria:"Syria Damascus"})[region];
  try{
   const p=new URLSearchParams({query:base,mode:"ArtList",maxrecords:"40",timespan:"7d",format:"json",sort:"DateDesc"});
   const added=parseGDELT(JSON.parse(await get("https://api.gdeltproject.org/api/v2/doc/doc?"+p)));
   all=all.concat(added);
   sources.push({feed:"GDELT (low-coverage fallback)",status:"ok",count:added.length});
  }catch{sources.push({feed:"GDELT (low-coverage fallback)",status:"unavailable",count:0})}
 }
 const articles=unique(all,region),publishers=[...new Set(articles.map(x=>x.source))].sort();
 const ok=sources.filter(x=>x.status==="ok").length;
 return {region,updatedAt:new Date().toISOString(),windowDays:7,
  conflictStart:CONFLICT_START[region],archiveMode:"curated-timeline",articles,provider:"Multi-source",
  publishers,sourceFeeds:sources,stats:{articles:articles.length,publishers:publishers.length,feedsOk:ok,feedsTotal:sources.length},
  caution:"Publisher-count measures coverage diversity, not independent verification.",
  ...(ok?{}:{error:"All news providers unavailable"})};
}
module.exports=async(req,res)=>{
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"Method not allowed"})}
 const region=String(req.query.region||"").toLowerCase();
 if(!Object.prototype.hasOwnProperty.call(QUERIES,region))return res.status(400).json({error:"Unknown region"});
 const now=Date.now(),cached=REGION_CACHE.get(region);
 if(cached&&cached.until>now){
  res.setHeader("X-PAX-Cache","HIT");res.setHeader("Cache-Control","public, max-age=60, s-maxage=180, stale-while-revalidate=600");
  return res.status(200).json(await cached.promise);
 }
 if(cached?.promise&&cached.pending){res.setHeader("X-PAX-Cache","COALESCED");return res.status(200).json(await cached.promise)}
 const promise=collect(region);
 REGION_CACHE.set(region,{promise,pending:true,until:now+REGION_TTL});
 try{
  const result=await promise;
  REGION_CACHE.set(region,{promise:Promise.resolve(result),pending:false,until:Date.now()+REGION_TTL,staleUntil:Date.now()+STALE_TTL});
  res.setHeader("X-PAX-Cache","MISS");res.setHeader("Cache-Control","public, max-age=60, s-maxage=180, stale-while-revalidate=600");
  return res.status(200).json(result);
 }catch(error){
  if(cached?.staleUntil>Date.now()){
   REGION_CACHE.set(region,cached);res.setHeader("X-PAX-Cache","STALE");
   return res.status(200).json({...await cached.promise,stale:true});
  }
  REGION_CACHE.delete(region);
  res.setHeader("Cache-Control","no-store");
  return res.status(503).json({region,articles:[],updatedAt:new Date().toISOString(),error:"News sources temporarily unavailable"});
 }
};
