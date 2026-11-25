// HEGEMONY tension thermometer: live news tone per rivalry pair (last 3 days), Google News RSS.
const PAIRS=[
 ['USA','CHN','("United States" OR Washington OR Trump) (China OR Beijing)'],
 ['RUS','NATO','(Russia OR Kremlin OR Putin) (NATO OR Europe)'],
 ['ISR','IRN','(Israel OR Netanyahu) (Iran OR Tehran)'],
 ['IND','PAK','(India OR Modi) (Pakistan OR Islamabad)'],
 ['CHN','TWN','(China OR Beijing) (Taiwan OR Taipei)'],
 ['CHN','JPN','(China OR Beijing) (Japan OR Tokyo)'],
 ['KOR','PRK','("South Korea" OR Seoul) ("North Korea" OR Pyongyang)'],
 ['USA','VEN','("United States" OR Trump) (Venezuela OR Maduro)'],
 ['GRC','TUR','(Greece OR Athens) (Turkey OR Türkiye OR Ankara)'],
 ['RUS','UKR','(Russia OR Kremlin) (Ukraine OR Kyiv)'],
 ['USA','IRN','("United States" OR Trump OR Washington) (Iran OR Tehran)'],
 ['CHN','PHL','(China OR Beijing) (Philippines OR Manila)']];
const CONF=/\b(sanction\w*|tariff\w*|threat\w*|strike\w*|attack\w*|warn\w*|condemn\w*|clash\w*|tension\w*|expel\w*|ban|accus\w*|retaliat\w*|blockade|seiz\w*|war|missile\w*|drone\w*|invad\w*|incursion|provocat\w*|escalat\w*|killed|shell\w*|hostil\w*|dispute)\b/i;
const COOP=/\b(deal|agreement|talks|truce|ceasefire|cooperat\w*|partnership|summit|meet\w*|visit\w*|ties|thaw|easing|de-?escalat\w*|dialogue|peace|signs?|signed|pact|trade)\b/i;
function xt(x,t){const m=x.match(new RegExp('<'+t+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+t+'>','i'));return (m?.[1]||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").trim()}
async function pair([a,b,q]){const u='https://news.google.com/rss/search?'+new URLSearchParams({q:q+' when:3d',hl:'en-US',gl:'US',ceid:'US:en'});const r=await fetch(u,{signal:AbortSignal.timeout(9000),headers:{'User-Agent':'Mozilla/5.0 HEGEMONY'}});if(!r.ok)throw Error('RSS '+r.status);const x=await r.text();
 const items=[...x.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(m=>{let t=xt(m[1],'title'),s=xt(m[1],'source');if(s&&t.endsWith(' - '+s))t=t.slice(0,-(s.length+3));return {title:t,url:xt(m[1],'link'),source:s,date:xt(m[1],'pubDate')}});
 let conf=0,coop=0;items.forEach(i=>{const c=CONF.test(i.title),o=COOP.test(i.title);if(c)conf++;if(o)coop++;i.tone=c&&!o?'conf':o&&!c?'coop':'mixed'});
 const score=Math.round(100*(conf+1)/(conf+coop+2));return {a,b,count:items.length,conf,coop,score,top:items.filter(i=>i.tone==='conf').slice(0,3).concat(items.filter(i=>i.tone!=='conf').slice(0,1))}}
module.exports=async(req,res)=>{const out=await Promise.allSettled(PAIRS.map(pair));const pairs=out.map((r,i)=>r.status==='fulfilled'?r.value:{a:PAIRS[i][0],b:PAIRS[i][1],error:true,count:0,score:null,top:[]});
 res.setHeader('Cache-Control','public, s-maxage=900, stale-while-revalidate=1800');res.status(200).json({pairs,retrievedAt:new Date().toISOString()})};
