/* PAX: Greek-language press coverage per conflict (Google News, Greek edition). Metadata only. */
const QUERIES={
 ukraine:'Ουκρανία (πόλεμος OR ειρήνη OR συνομιλίες OR Πούτιν OR Ζελένσκι)',
 gaza:'Γάζα (Ισραήλ OR Χαμάς OR εκεχειρία)',
 iranisrael:'Ιράν Ισραήλ',
 usiran:'Ιράν (ΗΠΑ OR Ουάσιγκτον OR πυρηνικά)',
 sudan:'Σουδάν (RSF OR πόλεμος OR εκεχειρία OR Νταρφούρ OR Χαρτούμ) -"Νότιο Σουδάν"',
 drc:'Κονγκό (M23 OR Ρουάντα OR Γκόμα OR συγκρούσεις OR αντάρτες)',
 myanmar:'Μιανμάρ (χούντα OR συγκρούσεις OR εκεχειρία OR αντάρτες OR σεισμός)',
 yemen:'Υεμένη (Χούθι OR Ερυθρά)',
 syria:'Συρία (Δαμασκός OR Ισραήλ OR Κούρδοι OR συγκρούσεις OR αλ Σαράα)'
};
const EXCLUDE=/παοκ|αεκ|ολυμπιακ|παναθηναϊκ|ποδοσφ|μπάσκετ|στοίχημα|έμπολα|νότιο σουδάν|kingbet|ρεάλ|μπαρτσελόνα|βινίσιους|γκολ/i;
const RELEVANCE={
 ukraine:/ουκραν|ρωσ|κίεβ|κιέβ|ζελένσκ|πούτιν/i,gaza:/γάζα|γαζα|παλαιστ|χαμάς|ισραήλ|νετανιάχου/i,
 iranisrael:/ιράν|ιραν|ισραήλ|τεχεράν/i,usiran:/ιράν|ιραν|τεχεράν|ηπα|ουάσιγκτον|τραμπ/i,
 sudan:/σουδάν/i,drc:/κονγκό|m23|ρουάντα/i,myanmar:/μιανμάρ|βιρμαν/i,yemen:/υεμέν|χούθι|ερυθρά/i,syria:/συρ[ίι]|δαμασκ/i
};
const cache=new Map();
function decode(s=""){return String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/&(#\d+|#x[0-9a-f]+|amp|quot|apos|lt|gt|nbsp);/gi,(_,x)=>{
 if(x[0]==="#"){const n=x[1].toLowerCase()==="x"?parseInt(x.slice(2),16):parseInt(x.slice(1),10);return Number.isFinite(n)?String.fromCodePoint(n):""}
 return {amp:"&",quot:'"',apos:"'",lt:"<",gt:">",nbsp:" "}[x.toLowerCase()]||"";
}).replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim()}
function tag(item,name){const m=item.match(new RegExp("<"+name+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+name+">","i"));return m?decode(m[1]):""}
function safeUrl(s){try{const u=new URL(s);return u.protocol==="https:"?u.href:null}catch{return null}}
module.exports=async function handler(req,res){
 const region=String(req.query?.region||"ukraine");
 if(!QUERIES[region])return res.status(400).json({error:"Unknown region"});
 res.setHeader("Cache-Control","s-maxage=900, stale-while-revalidate=1800");
 const hit=cache.get(region);if(hit&&hit.until>Date.now())return res.status(200).json(hit.value);
 try{
  const url="https://news.google.com/rss/search?q="+encodeURIComponent(QUERIES[region]+" when:7d")+"&hl=el&gl=GR&ceid=GR:el";
  const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),6000);
  const r=await fetch(url,{signal:ctl.signal,headers:{"User-Agent":"PAX Global Conflict Intelligence","Accept":"application/rss+xml,text/xml"}});clearTimeout(t);
  if(!r.ok)throw Error("HTTP "+r.status);
  const xml=await r.text(),seen=new Set();
  const articles=(xml.match(/<item>[\s\S]*?<\/item>/gi)||[]).map(item=>{
   const source=tag(item,"source")||"—";let title=tag(item,"title");
   if(title.endsWith(" - "+source))title=title.slice(0,-source.length-3).trim();
   const t=Date.parse(tag(item,"pubDate"));
   return {title,url:safeUrl(tag(item,"link")),source,publishedAt:Number.isFinite(t)?new Date(t).toISOString():null};
  }).filter(a=>{
   if(!a.title||!a.url||!a.publishedAt||!RELEVANCE[region].test(a.title)||EXCLUDE.test(a.title+" "+a.source))return false;
   const k=a.title.toLowerCase().slice(0,90);if(seen.has(k))return false;seen.add(k);return true;
  }).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,30);
  const value={region,updatedAt:new Date().toISOString(),provider:"Google News (Ελλάδα)",articles,publishers:[...new Set(articles.map(a=>a.source))]};
  cache.set(region,{until:Date.now()+10*60e3,value});
  return res.status(200).json(value);
 }catch(e){return res.status(200).json({region,articles:[],publishers:[],error:"Greek press feed unavailable"})}
};
