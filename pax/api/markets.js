/* PAX Markets: actual FRED observations, not causality estimates or trading signals. */
const INDICATORS=[
 {id:"DCOILBRENTEU",name:"Brent crude",unit:"USD/barrel",category:"ΕΝΕΡΓΕΙΑ"},
 {id:"DCOILWTICO",name:"WTI crude",unit:"USD/barrel",category:"ΕΝΕΡΓΕΙΑ"},
 {id:"DHHNGSP",name:"Henry Hub gas",unit:"USD/MMBtu",category:"ΕΝΕΡΓΕΙΑ"},
 {id:"DEXUSEU",name:"EUR / USD",unit:"USD per EUR",category:"ΣΥΝΑΛΛΑΓΜΑ"},
 {id:"PWHEAMTUSDM",name:"Global wheat price",unit:"USD/metric ton",category:"ΤΡΟΦΙΜΑ"}
];
async function fetchSeries(item){
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
  return {...item,url:"https://fred.stlouisfed.org/series/"+item.id,updatedAt:latest.date,
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
 return res.status(200).json({source:"Federal Reserve Bank of St. Louis / FRED",fetchedAt:new Date().toISOString(),
  indicators,available:success,seriesTotal:INDICATORS.length,
  disclaimer:"Historical FRED observations with source dates; not live exchange quotes. Changes do not imply the conflict caused a price movement. Not financial advice."});
};