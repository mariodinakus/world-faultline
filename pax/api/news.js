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
async function get(url){
 const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),5600);
 try{const response=await fetch(url,{signal:ctl.signal,headers:{"User-Agent":"PAX Global Conflict Intelligence 2.0","Accept":"application/rss+xml,application/xml,text/xml,application/json,*/*"}});
 if(!response.ok)throw Error("HTTP "+response.status);
 const text=await response.text();if(text.length>1700000)throw Error("oversize");return text
 }finally{clearTimeout(timeout)}
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
 }).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,90)
}
module.exports=async(req,res)=>{
 if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
 const region=String(req.query.region||"").toLowerCase();
 if(!Object.prototype.hasOwnProperty.call(QUERIES,region))return res.status(400).json({error:"Unknown region"});
 const q=QUERIES[region];
 const jobs=[
  {name:"Google News · broad",run:async()=>parseRSS(await get(google(q)),null,"Google News")},
  {name:"Google News · wire",run:async()=>parseRSS(await get(google(q+" (site:reuters.com OR site:apnews.com OR site:france24.com OR site:politico.eu OR site:euronews.com)")),null,"Google News")},
  ...RSS.map(f=>({name:f.name,run:async()=>parseRSS(await get(f.url),f,"Publisher RSS")})),
  {name:"GDELT",run:async()=>{
   const base=({ukraine:"Ukraine Russia",gaza:"Gaza Israel",iranisrael:"Iran Israel",usiran:"Iran United States",sudan:"Sudan RSF",drc:"Congo M23",myanmar:"Myanmar junta",yemen:"Yemen Houthi",syria:"Syria Damascus"})[region];
   const p=new URLSearchParams({query:base,mode:"ArtList",maxrecords:"50",timespan:"7d",format:"json",sort:"DateDesc"});
   return parseGDELT(JSON.parse(await get("https://api.gdeltproject.org/api/v2/doc/doc?"+p)))
  }}
 ];
 const done=await Promise.allSettled(jobs.map(x=>x.run()));
 const sourceFeeds=done.map((v,i)=>({feed:jobs[i].name,status:v.status==="fulfilled"?"ok":"unavailable",count:v.status==="fulfilled"?v.value.length:0}));
 const articles=unique(done.flatMap(x=>x.status==="fulfilled"?x.value:[]),region);
 const publishers=[...new Set(articles.map(a=>a.source))].sort();
 const ok=sourceFeeds.filter(s=>s.status==="ok").length;
 res.setHeader("Cache-Control",ok?"s-maxage=900, stale-while-revalidate=1800":"no-store");
 return res.status(ok?200:503).json({region,updatedAt:new Date().toISOString(),windowDays:7,conflictStart:CONFLICT_START[region],archiveMode:"curated-timeline",articles,provider:"Multi-source",publishers,sourceFeeds,
  stats:{articles:articles.length,publishers:publishers.length,feedsOk:ok,feedsTotal:jobs.length},
  caution:"Publisher-count measures diversity of coverage, not independent confirmation.",
  ...(ok?{}:{error:"All news providers unavailable"})});
};