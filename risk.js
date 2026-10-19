(function(root){
"use strict";
/* WORLD FAULTLINE — Experimental Systemic Vulnerability Index (SVI).
   A transparent descriptive model, NOT a fitted crisis probability.
   Published source data only; no observation is imputed.
*/
const clip=x=>Math.max(0,Math.min(100,x));
const ramp=(a,b,x)=>clip(100*(x-a)/(b-a));
const ECON=[
{code:"NY.GDP.MKTP.KD.ZG",label:"Real GDP growth",weight:.18,unit:"%",score:v=>ramp(3,-6,v)},
{code:"FP.CPI.TOTL.ZG",label:"Inflation",weight:.18,unit:"%",score:v=>v<0?ramp(0,-8,v):ramp(3,30,v)},
{code:"SL.UEM.TOTL.ZS",label:"Unemployment",weight:.12,unit:"%",score:v=>ramp(3,22,v)},
{code:"BN.CAB.XOKA.GD.ZS",label:"Current account / GDP",weight:.12,unit:"%",score:v=>ramp(-2,-15,v)},
{code:"GC.DOD.TOTL.GD.ZS",label:"Central-government debt / GDP",weight:.14,unit:"%",score:v=>ramp(30,150,v)},
{code:"FB.AST.NPER.ZS",label:"Nonperforming loans",weight:.12,unit:"%",score:v=>ramp(2,20,v)},
{code:"FI.RES.TOTL.MO",label:"Reserves / months of imports",weight:.08,unit:"months",score:v=>ramp(6,1,v)},
{code:"DT.TDS.DECT.EX.ZS",label:"External debt service / exports",weight:.06,unit:"%",score:v=>ramp(5,40,v)}
];
const SOCIAL=[
{code:"SL.UEM.1524.ZS",label:"Youth unemployment (15–24)",weight:.25,unit:"%",score:v=>ramp(5,40,v)},
{code:"SI.POV.GINI",label:"Income inequality (Gini)",weight:.20,unit:"0–100",score:v=>ramp(25,65,v)},
{code:"SI.POV.DDAY",label:"Poverty below $3/day (2021 PPP)",weight:.20,unit:"%",score:v=>ramp(0,40,v)},
{code:"SL.EMP.VULN.ZS",label:"Vulnerable employment",weight:.20,unit:"%",score:v=>ramp(10,80,v)},
{code:"SH.DYN.MORT",label:"Under-five mortality",weight:.15,unit:"per 1,000",score:v=>ramp(5,100,v)}
];
const GOV=[
{code:"GOV_WGI_RL_SC",label:"Rule of law",weight:.20,unit:"WGI 0–100",source:"WGI",score:v=>100-clip(v)},
{code:"GOV_WGI_CC_SC",label:"Control of corruption",weight:.18,unit:"WGI 0–100",source:"WGI",score:v=>100-clip(v)},
{code:"GOV_WGI_GE_SC",label:"Government effectiveness",weight:.17,unit:"WGI 0–100",source:"WGI",score:v=>100-clip(v)},
{code:"GOV_WGI_PV_SC",label:"Political stability / nonviolence",weight:.17,unit:"WGI 0–100",source:"WGI",score:v=>100-clip(v)},
{code:"GOV_WGI_RQ_SC",label:"Regulatory quality",weight:.14,unit:"WGI 0–100",source:"WGI",score:v=>100-clip(v)},
{code:"GOV_WGI_VA_SC",label:"Voice and accountability",weight:.14,unit:"WGI 0–100",source:"WGI",score:v=>100-clip(v)}
];
const DOMAINS=[
{key:"economic",name:"Economic pressure",weight:.50,items:ECON,maxAge:4,minCoverage:.55,minCount:4},
{key:"social",name:"Social vulnerability",weight:.25,items:SOCIAL,maxAge:7,minCoverage:.50,minCount:2},
{key:"institutional",name:"Institutional vulnerability (WGI)",weight:.25,items:GOV,maxAge:3,minCoverage:.50,minCount:3}
];
const COMPONENTS=DOMAINS.flatMap(d=>d.items.map(c=>Object.assign({domain:d.key},c)));
function subscore(domain,observations,asOfYear){
const parts=domain.items.map(c=>{
const raw=observations?.[c.code];
const value=raw?.value!==null&&Number.isFinite(Number(raw?.value))?Number(raw.value):null;
const year=raw?.year!=null&&Number.isInteger(Number(raw.year))?Number(raw.year):null;
const age=year==null?null:asOfYear-year;
const valid=value!==null&&year!==null&&age>=0&&age<=domain.maxAge;
return {code:c.code,label:c.label,weight:c.weight,value,year,unit:c.unit,
 stress:valid?Math.round(clip(c.score(value))*10)/10:null,reason:value===null?"missing":valid?"observed":"stale"};
});
const valid=parts.filter(x=>x.stress!==null);
const denominator=valid.reduce((a,p)=>a+p.weight,0);
const enough=valid.length>=domain.minCount&&denominator+1e-8>=domain.minCoverage;
const value=enough?Math.round(valid.reduce((a,p)=>a+p.weight*p.stress,0)/denominator*10)/10:null;
return {key:domain.key,name:domain.name,weight:domain.weight,value,
coverage:Math.round(denominator*100),count:valid.length,total:parts.length,parts,
minCoverage:domain.minCoverage,minCount:domain.minCount};
}
function scoreCountry(observations,asOfYear){
const subs=DOMAINS.map(d=>subscore(d,observations,asOfYear));
const domains=Object.fromEntries(subs.map(s=>[s.key,s]));
const complete=subs.every(s=>s.value!==null);
const value=complete?Math.round(subs.reduce((sum,d)=>sum+d.weight*d.value,0)*10)/10:null;
const coverage=Math.round(subs.reduce((sum,d)=>sum+d.weight*d.coverage,0));
const present=subs.flatMap(s=>s.parts).filter(p=>p.stress!==null);
return {value,economic:domains.economic.value,domains,coverage,count:present.length,total:COMPONENTS.length,
yearMin:present.length?Math.min(...present.map(p=>p.year)):null,
yearMax:present.length?Math.max(...present.map(p=>p.year)):null,
quality:!complete?"insufficient":coverage>=85?"broader coverage":"partial coverage",
parts:domains.economic.parts};
}
async function loadGlobal(api,countries,asOfYear){
const wdi=COMPONENTS.filter(c=>c.source!=="WGI");
const queries=[];
for(let i=0;i<wdi.length;i+=4){
queries.push("/country/all/indicator/"+wdi.slice(i,i+4).map(c=>c.code).join(";")+"?source=2&format=json&mrnev=1&per_page=20000");
}
GOV.forEach(c=>queries.push("/country/all/indicator/"+c.code+"?format=json&mrnev=1&per_page=20000"));
const results=await Promise.allSettled(queries.map(x=>api(x)));
const allowed=new Set(countries.map(c=>c.id)),accepted=new Set(COMPONENTS.map(c=>c.code));
const data=Object.create(null),failures=[];let observations=0;
results.forEach((r,i)=>{
if(r.status!=="fulfilled"){failures.push(queries[i]);return;}
r.value.forEach(p=>{
const iso=p.countryiso3code,code=p.indicator?.id,year=Number(p.date),value=Number(p.value);
if(!allowed.has(iso)||!accepted.has(code)||p.value==null||!Number.isInteger(year)||!Number.isFinite(value))return;
const record=data[iso]||(data[iso]=Object.create(null));
if(!record[code]||year>Number(record[code].year)){record[code]={value,year:String(year)};observations++;}
});
});
if(!observations)throw Error("World Bank returned no valid global observations");
const scores=Object.fromEntries(countries.map(c=>[c.id,scoreCountry(data[c.id],asOfYear)]));
return {scores,observations,failures,loadedAt:new Date().toISOString()};
}
root.FaultlineStress=Object.freeze({DOMAINS,COMPONENTS,ECON,SOCIAL,GOV,scoreCountry,loadGlobal});
})(window);
