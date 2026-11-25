// HEGEMONY odds: live prediction-market probabilities for geopolitics (Polymarket Gamma API, public).
const TAGS=['geopolitics','world','ukraine','middle-east','china','iran','israel','russia','taiwan','nato'];
const KEEP=/war|ceasefire|invade|invasion|strike|nuclear|troops|attack|peace|nato|taiwan|china|russia|ukraine|iran|israel|gaza|putin|xi|zelensky|missile|military|sanction|annex|blockade|regime|clash|deal|truce|greenland|venezuela|korea|india|pakistan|turkey|hezbollah|houthi/i;
async function tag(t){const u='https://gamma-api.polymarket.com/events?'+new URLSearchParams({tag_slug:t,active:'true',closed:'false',limit:'40',order:'volume24hr',ascending:'false'});const r=await fetch(u,{signal:AbortSignal.timeout(9000),headers:{Accept:'application/json','User-Agent':'HEGEMONY'}});if(!r.ok)throw Error('PM '+r.status);return r.json()}
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
module.exports=async(req,res)=>{try{const got=await Promise.allSettled(TAGS.map(tag));const seen=new Set(),out=[];
 got.forEach(g=>{if(g.status!=='fulfilled')return;(g.value||[]).forEach(ev=>{if(seen.has(ev.id))return;seen.add(ev.id);const mk=(ev.markets||[]).filter(m=>m.active&&!m.closed);if(!mk.length)return;
  const ms=mk.map(m=>{let p=[];try{p=JSON.parse(m.outcomePrices||'[]').map(Number)}catch{}let o=[];try{o=JSON.parse(m.outcomes||'[]')}catch{}const yi=o.findIndex(x=>/^yes$/i.test(x));return {q:m.groupItemTitle||m.question,p:p[yi>=0?yi:0],chg:num(m.oneDayPriceChange),vol:num(m.volume)}}).filter(m=>Number.isFinite(m.p));
  if(!ms.length||!KEEP.test(ev.title))return;ms.sort((a,b)=>b.p-a.p);
  out.push({title:ev.title,url:'https://polymarket.com/event/'+ev.slug,end:ev.endDate,vol:num(ev.volume),vol24:num(ev.volume24hr),markets:ms.slice(0,6)})})});
 out.sort((a,b)=>b.vol24-a.vol24||b.vol-a.vol);if(!out.length&&got.every(g=>g.status!=='fulfilled'))throw Error(String(got[0].reason?.message));
 res.setHeader('Cache-Control','public, s-maxage=600, stale-while-revalidate=1200');res.status(200).json({source:'Polymarket',events:out.slice(0,30),retrievedAt:new Date().toISOString()})}catch(e){res.status(502).json({error:'Source unavailable',detail:String(e.message).slice(0,120)})}};
