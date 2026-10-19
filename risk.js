(function (root) {
"use strict";
/*
 * WORLD FAULTLINE — Macroeconomic Stress Index, provisional v0.2.
 * A transparent descriptive sensitivity index. Not a fitted probability of crisis.
 * Country values are drawn directly from the World Bank API; none are imputed.
 * Weights and breakpoints are design assumptions, not calibrated on crisis labels.
 */
const COMPONENTS = [
 {code:"NY.GDP.MKTP.KD.ZG",label:"Real GDP growth",weight:.18,unit:"%",stress:v=>ramp(3,-6,v)},
 {code:"FP.CPI.TOTL.ZG",label:"Consumer-price inflation",weight:.18,unit:"%",stress:v=>v<0?ramp(0,-8,v):ramp(3,30,v)},
 {code:"SL.UEM.TOTL.ZS",label:"Unemployment",weight:.12,unit:"%",stress:v=>ramp(3,22,v)},
 {code:"BN.CAB.XOKA.GD.ZS",label:"Current account / GDP",weight:.12,unit:"%",stress:v=>ramp(-2,-15,v)},
 {code:"GC.DOD.TOTL.GD.ZS",label:"Central-government debt / GDP",weight:.14,unit:"%",stress:v=>ramp(30,150,v)},
 {code:"FB.AST.NPER.ZS",label:"Nonperforming loans",weight:.12,unit:"%",stress:v=>ramp(2,20,v)},
 {code:"FI.RES.TOTL.MO",label:"Total reserves / months of imports",weight:.08,unit:"months",stress:v=>ramp(6,1,v)},
 {code:"DT.TDS.DECT.EX.ZS",label:"External debt service / exports",weight:.06,unit:"%",stress:v=>ramp(5,40,v)}
];
function clamp(x){return Math.max(0,Math.min(100,x));}
function ramp(low,high,value){return clamp((value-low)/(high-low)*100);}
function scoreCountry(data,asOfYear){
 const parts=COMPONENTS.map(c=>{
  const raw=data&&data[c.code]; const observation=raw&&Number.isFinite(Number(raw.value))?raw:null;
  const year=observation?Number(observation.year):null;
  const age=year==null?null:asOfYear-year;
  const usable=!!observation&&Number.isInteger(year)&&age>=0&&age<=4;
  return {code:c.code,label:c.label,weight:c.weight,value:observation?Number(observation.value):null,year,
   age,stress:usable?Math.round(c.stress(Number(observation.value))*10)/10:null,
   reason:!observation?"missing":usable?"observed":"stale"};
 });
 const available=parts.filter(p=>p.stress!==null);
 const weight=available.reduce((sum,p)=>sum+p.weight,0);
 const coverage=Math.round(weight*100);
 const sufficient=available.length>=4&&weight>=.55;
 const value=sufficient?Math.round(available.reduce((sum,p)=>sum+p.stress*p.weight,0)/weight*10)/10:null;
 return {value,coverage,count:available.length,total:parts.length,
  quality:value===null?"insufficient":coverage>=80&&available.length>=6?"broader coverage":"limited coverage",
  parts,yearMin:available.length?Math.min(...available.map(p=>p.year)):null,yearMax:available.length?Math.max(...available.map(p=>p.year)):null};
}
async function loadGlobal(api,countries,asOfYear){
 const chunks=[COMPONENTS.slice(0,4),COMPONENTS.slice(4)];
 const queries=chunks.map(group=>"/country/all/indicator/"+group.map(c=>c.code).join(";")+"?source=2&format=json&mrnev=1&per_page=20000");
 const results=await Promise.allSettled(queries.map(api));
 const available=new Set(countries.map(c=>c.id));
 const data=Object.create(null);
 let failed=0;let observations=0;
 results.forEach(result=>{
  if(result.status!=="fulfilled"){failed++;return;}
  result.value.forEach(r=>{
   const id=r.countryiso3code, code=r.indicator&&r.indicator.id;
   if(!available.has(id)||!COMPONENTS.some(c=>c.code===code)||r.value==null)return;
   const year=Number(r.date),val=Number(r.value);
   if(!Number.isFinite(year)||!Number.isFinite(val))return;
   const record=data[id]||(data[id]=Object.create(null));
   if(!record[code]||year>Number(record[code].year)){record[code]={value:val,year:String(year)};observations++;}
  });
 });
 if(!observations)throw Error("The World Bank did not provide any global indicator observations.");
 const scores=Object.fromEntries(countries.map(c=>[c.id,scoreCountry(data[c.id],asOfYear)]));
 return {scores,failed,observations,requestedChunks:queries.length,loadedAt:new Date().toISOString()};
}
root.FaultlineStress=Object.freeze({COMPONENTS,scoreCountry,loadGlobal});
})(window);
