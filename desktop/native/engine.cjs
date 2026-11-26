const finite=v=>typeof v==='number'&&Number.isFinite(v);
function extract(geo,radar){const m={};const add=(id,label,v,threshold,source,date)=>{if(finite(v)||typeof v==='string'&&v!=='n/a'&&v!=='')m[id]={label,v,threshold,source,date:date||null}};
if(geo?.escalation?.coverage>=.75)add('escalation','Escalation index (not probability)',geo.escalation.value,3,'geo',geo.generatedAt);
add('brent','Brent USD',geo?.brent?.last?.value,2,'geo',geo?.brent?.last?.date);
add('clock','Doomsday Clock seconds',geo?.doomsday?.seconds,1,'geo',null);
for(const n of geo?.news||[])add('attention:'+n.id,'Public attention: '+n.id,n.ratio,.5,'geo',geo.generatedAt);
for(const [k,label,t] of [['p','US recession model %',3],['stress','Systemic stress',3],['g20','G20 CLI',.2],['diff','Downturn diffusion',3]])add('macro:'+k,label,radar?.current?.[k],t,'radar',radar?.generatedAt);
for(const c of radar?.countries||[])add('country:'+c.iso3,'Country risk: '+c.iso3,c.level,0,'radar',radar.generatedAt);
return m}
function compare(old,next){const baseline={...old},alerts=[];for(const [id,n] of Object.entries(next)){const o=old[id];if(!o){baseline[id]=n;continue}if(o.date&&n.date&&n.date<o.date)continue;const delta=finite(o.v)&&finite(n.v)?n.v-o.v:null;const changed=delta===null?o.v!==n.v:Math.abs(delta)+1e-9>=n.threshold;if(changed){alerts.push({id,label:n.label,old:o.v,new:n.v,delta,source:n.source,date:n.date,at:new Date().toISOString(),severity:delta!==null&&Math.abs(delta)>=3*n.threshold?'high':'normal'});baseline[id]=n}}return {baseline,alerts}}
module.exports={extract,compare};