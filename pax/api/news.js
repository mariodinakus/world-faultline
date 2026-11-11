// PAX data proxy. The upstream news aggregator is not a verification service.
// Vercel Node.js serverless route: /api/news?region=ukraine
const QUERIES = {
  ukraine: '"Ukraine" "Russia" (peace OR ceasefire OR talks OR strikes) when:7d',
  gaza: '"Gaza" (Israel OR Hamas) (ceasefire OR negotiations OR fighting) when:7d',
  iranisrael: '"Iran" "Israel" (diplomacy OR attack OR ceasefire OR tension) when:7d',
  usiran: '"United States" "Iran" (nuclear OR negotiations OR strikes OR sanctions) when:7d',
  sudan: '"Sudan" (RSF OR army) (war OR talks OR ceasefire) when:7d',
  drc: '"Congo" "M23" (peace OR ceasefire OR fighting) when:7d',
  myanmar: '"Myanmar" (junta OR resistance) (fighting OR ceasefire OR talks) when:7d',
  yemen: '"Yemen" (Houthi OR Houthis) (strikes OR negotiations OR ceasefire) when:7d',
  syria: '"Syria" (clashes OR peace OR ceasefire OR negotiations) when:7d'
};
const GDELT_QUERIES = {
  ukraine:'Ukraine Russia',gaza:'Gaza Israel',iranisrael:'Iran Israel',usiran:'United States Iran',
  sudan:'Sudan RSF',drc:'Congo M23',myanmar:'Myanmar junta',yemen:'Yemen Houthi',syria:'Syria ceasefire'
};
function entities(text='') {
  const named={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' ',ndash:'–',mdash:'—',rsquo:"'",lsquo:"'",ldquo:'"',rdquo:'"'};
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,(_,key)=>{
    if(key[0]==='#'){const n=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):parseInt(key.slice(1),10);return Number.isInteger(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}
    return named[key.toLowerCase()]??'&'+key+';';
  }).replace(/<[^>]*>/g,'').trim();
}
function tag(xml,name){const m=xml.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>','i'));return m?entities(m[1]):'';}
function fromGoogle(xml){
  const items=xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi)||[];
  return items.map(item=>{
    const title=tag(item,'title'), url=tag(item,'link'), source=tag(item,'source')||'Αδιευκρίνιστη πηγή';
    const publishedAt=new Date(tag(item,'pubDate')).toISOString();
    return {title:title.replace(new RegExp('\\s[-–]\\s'+source.replace(/[.*+?^\x24{}()|[\]\\]/g,'\\$&')+'\\s*$','i'),''),url,source,publishedAt};
  }).filter(x=>x.title&&x.url.startsWith('https://')&&x.publishedAt).slice(0,35);
}
function fromGdelt(json){return (json.articles||[]).map(a=>({
  title:a.title||'',url:a.url||'',source:a.domain||a.sourcecountry||'Unknown',
  publishedAt:/^\d{8}T\d{6}Z$/.test(a.seendate||'')?a.seendate.slice(0,4)+'-'+a.seendate.slice(4,6)+'-'+a.seendate.slice(6,8)+'T'+a.seendate.slice(9,11)+':'+a.seendate.slice(11,13)+':'+a.seendate.slice(13,15)+'Z':a.seendate||''
}));}
async function get(url){
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),7500);
 try {const r=await fetch(url,{signal:ctrl.signal,headers:{'User-Agent':'PAX-Conflict-Monitor/1.0 (public news metadata aggregator)','Accept':'application/rss+xml,application/xml,application/json,text/xml,*/*'}});if(!r.ok)throw new Error('upstream '+r.status);return r;}finally{clearTimeout(timeout);}
}
async function news(region){
 let lastError='';
 try{
   const u='https://news.google.com/rss/search?q='+encodeURIComponent(QUERIES[region])+'&hl=en-US&gl=US&ceid=US:en';
   const response=await get(u), items=fromGoogle(await response.text());
   if(items.length)return {provider:'Google News RSS',items};
   lastError='Google News feed returned no articles';
 }catch(e){lastError=String(e.message||e);}
 try{
   const p=new URLSearchParams({query:GDELT_QUERIES[region],mode:'ArtList',maxrecords:'35',timespan:'7d',format:'json',sort:'DateDesc'});
   const response=await get('https://api.gdeltproject.org/api/v2/doc/doc?'+p.toString());
   const items=fromGdelt(await response.json());
   if(items.length)return {provider:'GDELT DOC 2.0',items};
 }catch(e){lastError+='; GDELT: '+String(e.message||e);}
 throw new Error(lastError||'No current articles available');
}
module.exports=async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
 const region=String(req.query.region||'').toLowerCase();
 if(!Object.prototype.hasOwnProperty.call(QUERIES,region))return res.status(400).json({error:'Unknown region'});
 try{
   const result=await news(region);
   const seen=new Set(),cutoff=Date.now()-8*86400000;
   const articles=result.items.filter(a=>{
     if(!a.title||!a.url?.startsWith('https://'))return false;
     const time=Date.parse(a.publishedAt);if(!Number.isFinite(time)||time<cutoff||time>Date.now()+3600000)return false;
     const key=a.title.toLowerCase().replace(/[^a-z0-9α-ω]+/g,' ').trim().slice(0,90);
     if(seen.has(key))return false;seen.add(key);return true;
   }).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,30);
   res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=1800');
   return res.status(200).json({region,provider:result.provider,updatedAt:new Date().toISOString(),windowDays:7,articles});
 }catch(err){res.setHeader('Cache-Control','no-store');return res.status(503).json({region,articles:[],updatedAt:new Date().toISOString(),error:'News providers unavailable; no scores can be calculated.',detail:String(err.message||err).slice(0,160)});}
};