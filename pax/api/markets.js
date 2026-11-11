/* PAX Markets: actual FRED observations, not causality estimates or trading signals. */
const INDICATORS=[
 {id:"DCOILBRENTEU",name:"Brent crude",unit:"USD/barrel",category:"ΕΝΕΡΓΕΙΑ"},
 {id:"DCOILWTICO",name:"WTI crude",unit:"USD/barrel",category:"ΕΝΕΡΓΕΙΑ"},
 {id:"DHHNGSP",name:"Henry Hub gas",unit:"USD/MMBtu",category:"ΕΝΕΡΓΕΙΑ"},
 {id:"DEXUSEU",name:"EUR / USD",unit:"USD per EUR",category:"ΣΥΝΑΛΛΑΓΜΑ"},
 {id:"PWHEAMTUSDM",name:"Global wheat price",unit:"USD/metric ton",category:"ΤΡΟΦΙΜΑ"}
];
async function fetchECB(){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),7000);
 try {
  const res=await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml",{signal:ctrl.signal,headers:{"Accept":"application/xml,text/xml","User-Agent":"PAX-Conflict-Economics/2.0"}});
  if(!res.ok)throw Error("ECB HTTP "+res.status);
  const xml=await res.text(),points=[];
  const exp=/<Cube\b[^>]*time=["'](\d{4}-\d\d-\d\d)["'][^>]*>([\s\S]*?)<\/Cube>/gi;
  for(const match of xml.matchAll(exp)){
   const dollar=match[2].match(/<Cube\b[^>]*currency=["']USD["'][^>]*rate=["']([\d.]+)["']/i);
   const value=dollar?Number(dollar[1]):NaN;if(Number.isFinite(value))points.push({date:match[1],value});
  }
  points.sort((a,b)=>a.date.localeCompare(b.date));
  if(!points.length)throw Error("No ECB observations");
  const last=points.at(-1),prior=points.at(Math.max(0,points.length-8));
  return {id:"DEXUSEU",name:"EUR / USD",unit:"USD per EUR",category:"ΣΥΝΑΛΛΑΓΜΑ",source:"European Central Bank",
   url:"https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html",
   updatedAt:last.date,value:last.value,comparisonDate:prior.date,comparisonValue:prior.value,
   changePct:prior.value?Number(((last.value/prior.value-1)*100).toFixed(2)):null,points:points.slice(-45)};
 }finally{clearTimeout(timer)}
}
async function fetchSeries(item){
 if(item.id==="DEXUSEU"){try{return await fetchECB()}catch{}}
 if(process.env.FRED_API_KEY){
  try{
   const params=new URLSearchParams({series_id:item.id,api_key:process.env.FRED_API_KEY,file_type:"json",observation_start:"2025-01-01",sort_order:"desc",limit:"45"});
   const c=new AbortController(),timer=setTimeout(()=>c.abort(),7000);
   let response;try{response=await fetch("https://api.stlouisfed.org/fred/series/observations?"+params,{signal:c.signal,headers:{"Accept":"application/json"}})}finally{clearTimeout(timer)}
   if(response.ok){
    const json=await response.json();
    const rows=(json.observations||[]).filter(x=>Number.isFinite(Number(x.value))&&x.value!==".").map(x=>({date:x.date,value:Number(x.value)})).sort((a,b)=>a.date.localeCompare(b.date));
    if(rows.length){
     const last=rows.at(-1),prev=rows.at(Math.max(0,rows.length-(item.id==="PWHEAMTUSDM"?2:8)));
     return {...item,source:"FRED",url:"https://fred.stlouisfed.org/series/"+item.id,value:last.value,updatedAt:last.date,comparisonDate:prev.date,comparisonValue:prev.value,changePct:prev.value?Number(((last.value/prev.value-1)*100).toFixed(2)):null,points:rows};
    }
   }
  }catch{}
 }
 const params=new URLSearchParams({id:item.id,cosd:"2025-01-01"});
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),7400);
 try{
  const res=await fetch("https://fred.stlouisfed.org/graph/fredgraph.csv?"+params,{
    signal:ctrl.signal,headers:{"Accept":"text/csv","User-Agent":"PAX Conflict Economics Monitor"}
  });
  if(!res.ok)throw Error("FRED HTTP "+res.status);
  const data=await res.text();if(data.length>250000)throw Error("Data too large");
  const lines=data.trim().replace(/\r/g,"").split("\n").slice(1),rows=[];
  for(const line of lines){
   const [date,raw]=line.split(",");
   if(!/^\d{4}-\d\d-\d\d$/.test(date))continue;
   const value=Number(raw);
   if(!raw?.trim()||!Number.isFinite(value))continue;
   rows.push({date,value})
  }
  const points=rows.slice(-45);
  if(!points.length)throw Error("No observations");
  const latest=points.at(-1),comparison=points.at(Math.max(0,points.length-(item.id==="PWHEAMTUSDM"?2:8)));
  const changePct=comparison&&comparison.value!==0?Number(((latest.value/comparison.value-1)*100).toFixed(2)):null;
  return {...item,source:"FRED",url:"https://fred.stlouisfed.org/series/"+item.id,updatedAt:latest.date,
   value:latest.value,comparisonDate:comparison?.date||null,comparisonValue:comparison?.value||null,changePct,points};
 }finally{clearTimeout(timer)}
}
module.exports=async function handler(req,res){
 if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
 const results=await Promise.allSettled(INDICATORS.map(fetchSeries));
 const indicators=results.map((x,i)=>x.status==="fulfilled"?x.value:{
  ...INDICATORS[i],value:null,changePct:null,updatedAt:null,points:[],
  url:"https://fred.stlouisfed.org/series/"+INDICATORS[i].id,
  error:"Η δημόσια χρονοσειρά δεν είναι διαθέσιμη"
 });
 const success=indicators.filter(x=>Number.isFinite(x.value)).length;
 res.setHeader("Cache-Control",success?"s-maxage=7200, stale-while-revalidate=14400":"no-store");
 return res.status(200).json({source:"Federal Reserve Bank of St. Louis / FRED + European Central Bank",fetchedAt:new Date().toISOString(),
  indicators,available:success,seriesTotal:INDICATORS.length,
  disclaimer:"Historical FRED or ECB observations with source dates, not live quotes. FRED API access can require FRED_API_KEY in Vercel project environment. Changes do not imply conflict causality. Not financial advice."});
};