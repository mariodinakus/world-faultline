/* PAX: humanitarian and official reports from ReliefWeb (UN OCHA). Requires an approved ReliefWeb appname,
   set as the RELIEFWEB_APPNAME environment variable in Vercel (request one at https://apidoc.reliefweb.int). */
const ISO={ukraine:"UKR",gaza:"PSE",iranisrael:"IRN",usiran:"IRN",sudan:"SDN",drc:"COD",myanmar:"MMR",yemen:"YEM",syria:"SYR"};
const cache=new Map();
module.exports=async function handler(req,res){
 const region=String(req.query?.region||"ukraine");
 if(!ISO[region])return res.status(400).json({error:"Unknown region"});
 const appname=process.env.RELIEFWEB_APPNAME;
 if(!appname)return res.status(200).json({region,status:"needs-appname",reports:[]});
 res.setHeader("Cache-Control","s-maxage=1800, stale-while-revalidate=3600");
 const hit=cache.get(region);if(hit&&hit.until>Date.now())return res.status(200).json(hit.value);
 try{
  const body={limit:10,sort:["date.created:desc"],
   filter:{operator:"AND",conditions:[{field:"primary_country.iso3",value:ISO[region]},{field:"language.code",value:"en"}]},
   fields:{include:["title","date.created","source.shortname","source.name","url_alias","format.name","primary_country.name"]}};
  const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),7000);
  const r=await fetch("https://api.reliefweb.int/v2/reports?appname="+encodeURIComponent(appname),
   {method:"POST",signal:ctl.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});clearTimeout(t);
  if(!r.ok)throw Error("HTTP "+r.status);
  const j=await r.json();
  const reports=(j.data||[]).map(x=>{const f=x.fields||{};return {title:f.title,date:f.date?.created||null,
   source:(f.source||[]).map(s=>s.shortname||s.name).filter(Boolean).slice(0,2).join(", "),
   format:(f.format||[]).map(s=>s.name).join(", "),url:f.url_alias||("https://reliefweb.int/node/"+x.id)}}).filter(x=>x.title);
  const value={region,status:"ok",updatedAt:new Date().toISOString(),provider:"ReliefWeb (UN OCHA)",country:ISO[region],reports};
  cache.set(region,{until:Date.now()+20*60e3,value});
  return res.status(200).json(value);
 }catch(e){return res.status(200).json({region,status:"unavailable",reports:[]})}
};
