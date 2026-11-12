/* PAX War Economy — monthly World Bank Pink Sheet / annual WDI. Descriptive, not causal. */
"use strict";
const PAX_ECON_CFG={
 ukraine:{c:["brent","gas_eu","wheat","urea"],iso:["UKR","RUS"],el:"Ενέργεια, σιτηρά, λιπάσματα",en:"Energy, grain, fertilizer"},
 gaza:{c:["wheat","brent","urea","gold"],iso:["PSE","ISR"],el:"Επισιτισμός, εισαγωγές, ενέργεια",en:"Food security, imports, energy"},
 iranisrael:{c:["brent","gas_eu","gold","copper"],iso:["IRN","ISR"],el:"Πετρέλαιο, ενέργεια, αγορές",en:"Oil, energy, markets"},
 usiran:{c:["brent","gas_eu","gold","wheat"],iso:["IRN","USA"],el:"Πετρέλαιο και μεταφορές",en:"Oil and shipping"},
 sudan:{c:["gold","wheat","urea","brent"],iso:["SDN"],el:"Χρυσός, τρόφιμα, λίπασμα",en:"Gold, food, fertilizers"},
 drc:{c:["copper","gold","brent","urea"],iso:["COD"],el:"Χαλκός, ορυκτός πλούτος, καύσιμα",en:"Copper, minerals, fuel"},
 myanmar:{c:["rice","gas_eu","brent","copper"],iso:["MMR"],el:"Ρύζι, φυσικό αέριο και εμπόριο",en:"Rice, gas and trade"},
 yemen:{c:["brent","wheat","urea","gas_eu"],iso:["YEM"],el:"Πετρέλαιο, ναυτιλία, επισιτισμός",en:"Oil, shipping, food"},
 syria:{c:["wheat","brent","urea","gold"],iso:["SYR"],el:"Σιτάρι, καύσιμα, εισαγωγές",en:"Wheat, fuel, imports"}
};
const PAX_ECON_LABELS={
 brent:["Πετρέλαιο Brent","Brent oil"],gas_eu:["Φυσικό αέριο Ευρώπης","Europe gas"],
 wheat:["Σιτάρι","Wheat"],urea:["Λίπασμα ουρία","Urea fertilizer"],gold:["Χρυσός","Gold"],
 copper:["Χαλκός","Copper"],rice:["Ρύζι","Rice"]
};
const PAX_ECON_WDI={
 "NY.GDP.MKTP.KD.ZG":["Μεταβολή πραγματικού ΑΕΠ","Real GDP growth","%"],
 "FP.CPI.TOTL.ZG":["Πληθωρισμός CPI","CPI inflation","%"],
 "NY.GDP.PCAP.CD":["ΑΕΠ ανά κάτοικο","GDP per capita","US$"]
};
const PAX_ECON={price:null,error:null,loading:false,metric:"NY.GDP.MKTP.KD.ZG",commodity:"",range:"all",wdi:{},busy:{}};
const pET=(el,en)=>paxLang()==="en"?en:el;
const pEL=x=>esc(String(x??""));
const pEN=(pair)=>pair?.[paxLang()==="en"?1:0]||"—";
const pEF=(n,dec=1)=>Number.isFinite(n)?n.toLocaleString(paxLang()==="en"?"en-GB":"el-GR",{maximumFractionDigits:dec,minimumFractionDigits:dec}):"—";
const pEU=(url,label)=>/^https:\/\//.test(url||"")?'<a target="_blank" rel="noopener noreferrer" href="'+pEL(url)+'">'+pEL(label)+'</a>':"";
function pECheck(data){
 if(data?.provider!=="World Bank Pink Sheet"||data.schemaVersion!==1||!data.series||!data.lastPeriod)throw Error("Dataset schema mismatch");
 for(const s of Object.values(data.series))if(!s.unit||!Array.isArray(s.points)||s.points.some(p=>!Array.isArray(p)||!Number.isFinite(p[1])||!/^20\d\d-\d\d$/.test(p[0])))throw Error("Series failed validation");
 return data;
}
async function pELoad(){
 if(PAX_ECON.price||PAX_ECON.loading)return;
 PAX_ECON.loading=true;PAX_ECON.error=null;pERender();
 try{const r=await fetch("data/economy-prices.json",{cache:"no-cache"});
  if(!r.ok)throw Error("HTTP "+r.status);
  PAX_ECON.price=pECheck(await r.json());
 }catch(e){PAX_ECON.error=String(e?.message||e)}
 finally{PAX_ECON.loading=false;pERender()}
}
async function pEWdi(iso,indicator){
 const key=iso+"/"+indicator;if(PAX_ECON.wdi[key]||PAX_ECON.busy[key])return;
 PAX_ECON.busy[key]=true;
 try{
  const r=await fetch("https://api.worldbank.org/v2/country/"+iso+"/indicator/"+indicator+"?format=json&per_page=120&date=2000:2026");
  if(!r.ok)throw Error("HTTP "+r.status);
  const j=await r.json();if(!Array.isArray(j)||!Array.isArray(j[1]))throw Error("No observations");
  const points=j[1].filter(x=>/^\d{4}$/.test(x.date)&&Number.isFinite(x.value))
   .map(x=>[x.date,x.value]).sort((a,b)=>a[0].localeCompare(b[0]));
  PAX_ECON.wdi[key]={points,country:j[1][0]?.country?.value||iso};
 }catch(e){PAX_ECON.wdi[key]={points:[],country:iso,error:String(e?.message||e)}}
 finally{delete PAX_ECON.busy[key];pERender()}
}
function pEChart(all,anchor,unit,isAnnual){
 const cutoff=PAX_ECON.range==="5y"?new Date().getUTCFullYear()-5:PAX_ECON.range==="15y"?new Date().getUTCFullYear()-15:0;
 const points=all.filter(p=>Number(p[0].slice(0,4))>=cutoff&&Number.isFinite(p[1]));
 if(points.length<2)return '<div class="pax-econ-empty">'+pET("Δεν υπάρχουν αρκετά σημεία.","Insufficient data points.")+'</div>';
 const w=740,h=246,pl=61,pr=19,pt=19,pb=35,innerW=w-pl-pr,innerH=h-pt-pb;
 const values=points.map(p=>p[1]),min=Math.min(...values),max=Math.max(...values),spread=Math.max(0.001,max-min);
 const lo=min-spread*.18,hi=max+spread*.16;
 const x=i=>pl+innerW*i/(points.length-1),y=v=>pt+innerH*(hi-v)/(hi-lo);
 const path=points.map((p,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(p[1]).toFixed(1)).join(" ");
 const guide=[0,.25,.5,.75,1].map(fr=>'<line x1="'+pl+'" y1="'+(pt+fr*innerH)+'" x2="'+(w-pr)+'" y2="'+(pt+fr*innerH)+'" stroke="currentColor" opacity=".13"/><text x="'+(pl-8)+'" y="'+(pt+fr*innerH+4)+'" text-anchor="end" font-size="11" fill="currentColor" opacity=".65">'+pEL(pEF(hi-(hi-lo)*fr))+'</text>').join("");
 const iMark=points.findIndex(p=>p[0]>=anchor.slice(0,isAnnual?4:7));
 const marker=iMark>=0?'<line x1="'+x(iMark)+'" x2="'+x(iMark)+'" y1="'+pt+'" y2="'+(h-pb)+'" stroke="#ae8b55" stroke-dasharray="4 5" stroke-width="1.6"/>':"";
 const tickIndices=[0,Math.floor((points.length-1)/2),points.length-1];
 const ticks=tickIndices.map(i=>'<text x="'+x(i)+'" y="'+(h-8)+'" text-anchor="middle" font-size="11" fill="currentColor" opacity=".7">'+pEL(points[i][0])+'</text>').join("");
 return '<svg role="img" class="pax-econ-svg" aria-label="'+pEL(pET("Ιστορικό διάγραμμα","Historical trend"))+'" viewBox="0 0 '+w+' '+h+'">'+guide+marker+'<path fill="none" stroke="#2d6650" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="'+path+'"/>'+ticks+'</svg><div class="pax-econ-chart-meta"><span>'+pEL(points[0][0])+' – '+pEL(points.at(-1)[0])+'</span><span>'+pEL(unit)+'</span></div>';
}
function pERenderPrice(region){
 const data=PAX_ECON.price,conf=PAX_ECON_CFG[region];
 if(!data)return '<div class="pax-econ-empty">'+pEL(PAX_ECON.loading?pET("Φόρτωση ιστορικών τιμών…","Loading historical prices…"):pET("Το τεκμηριωμένο αρχείο μηνιαίων τιμών δεν είναι ακόμη διαθέσιμο.","Verified monthly prices have not been published yet."))+
  (PAX_ECON.error?" ("+pEL(PAX_ECON.error)+")":"")+' <button type="button" data-econ-retry>'+pET("Επανάληψη","Retry")+'</button> '+pEU("https://www.worldbank.org/en/research/commodity-markets","World Bank")+'</div>';
 const available=conf.c.filter(key=>data.series[key]?.points?.length);
 if(!available.length)return '<p class="pax-econ-empty">'+pET("Δεν υπάρχουν στοιχεία για το πεδίο.","No data available.")+'</p>';
 if(!available.includes(PAX_ECON.commodity))PAX_ECON.commodity=available[0];
 const s=data.series[PAX_ECON.commodity],full=s.points,first=full[0],last=full.at(-1),
  pre=full.filter(p=>p[0]<paxConflictStart(region).slice(0,7)).at(-1),
  post=full.find(p=>p[0]>=paxConflictStart(region).slice(0,7));
 return '<div class="pax-econ-menu"><div class="pax-econ-chips">'+available.map(id=>'<button type="button" data-econ-id="'+id+'" class="'+(PAX_ECON.commodity===id?"active":"")+'">'+pEL(pEN(PAX_ECON_LABELS[id]))+'</button>').join("")+'</div><div class="pax-econ-chips">'+[["5y","5Y"],["15y","15Y"],["all",pET("ΟΛΑ","ALL")]].map(([k,label])=>'<button type="button" data-econ-range="'+k+'" class="'+(PAX_ECON.range===k?"active":"")+'">'+label+'</button>').join("")+'</div></div>'+
 '<div class="pax-econ-stats"><div><small>'+pET("Τελευταία διαθέσιμη τιμή","Latest reported price")+'</small><strong>'+pEL(pEF(last?.[1],2))+'</strong><span>'+pEL(s.unit)+' · '+pEL(last?.[0])+'</span></div><div><small>'+pET("Πρώτη διαθέσιμη τιμή","First reported price")+'</small><strong>'+pEL(pEF(first?.[1],2))+'</strong><span>'+pEL(first?.[0])+'</span></div><div><small>'+pET("Πριν / μετά την αρχή φάσης","Before / after phase start")+'</small><strong>'+pEL(pEF(pre?.[1],2))+' / '+pEL(pEF(post?.[1],2))+'</strong><span>'+pEL(pre?.[0]||"—")+' / '+pEL(post?.[0]||"—")+'</span></div></div>'+
 pEChart(full,paxConflictStart(region),s.unit,false)+
 '<div class="pax-econ-recent"><b>'+pET("12 πρόσφατες μηνιαίες παρατηρήσεις","12 recent monthly observations")+'</b><div>'+full.slice(-12).map(p=>'<span><small>'+pEL(p[0])+'</small><strong>'+pEL(pEF(p[1],2))+'</strong></span>').join("")+'</div></div>'+
 '<p class="pax-econ-note">'+pET("Ονομαστικές διεθνείς τιμές αναφοράς σε USD — όχι εθνικές τιμές καταναλωτή. Το πριν/μετά δεν μετρά αιτιακή επίδραση του πολέμου.","Nominal world benchmark prices in USD — not domestic consumer prices. Before/after is not a causal estimate of war effects.")+' '+pEU(data.sourceUrl||"https://www.worldbank.org/en/research/commodity-markets","World Bank Pink Sheet")+' · '+pEL(data.lastPeriod)+'</p>';
}
function pERenderMacro(region){
 const metric=PAX_ECON.metric,conf=PAX_ECON_CFG[region];
 return '<div class="pax-econ-macro"><div class="pax-econ-macro-head"><h4>'+pET("Ετήσιοι οικονομικοί δείκτες χώρας","Annual country indicators")+'</h4><select id="paxEconMetric">'+Object.entries(PAX_ECON_WDI).map(([key,item])=>'<option value="'+key+'" '+(metric===key?"selected":"")+'>'+pEL(pEN(item))+'</option>').join("")+'</select></div>'+
 '<div class="pax-econ-macro-grid">'+conf.iso.map(iso=>{const item=PAX_ECON.wdi[iso+"/"+metric],last=item?.points?.at(-1);
  return '<article><span>'+pEL(item?.country||iso)+'</span><strong>'+pEL(pEF(last?.[1],2))+' <small>'+pEL(PAX_ECON_WDI[metric][2])+'</small></strong><small>'+pEL(last?.[0]||pET("Αναμονή / έλλειψη στοιχείων","Loading / unavailable"))+'</small>'+
  (item?.points?.length?pEChart(item.points,paxConflictStart(region),PAX_ECON_WDI[metric][2],true):'<p>'+pEL(item?.error||pET("Τα στοιχεία δεν φορτώθηκαν ακόμη.","Observations not loaded."))+'</p>')+'</article>';
 }).join("")+'</div><p class="pax-econ-note">'+pET("Πηγή: World Bank WDI · Ετήσιες τιμές, συχνά με κενά ή εκτιμήσεις. Καμία μεταβολή δεν αποδίδεται αποκλειστικά στον πόλεμο.","Source: World Bank WDI · Annual figures, sometimes missing or estimated. Changes cannot be attributed exclusively to war.")+' '+pEU("https://data.worldbank.org/","WDI")+'</p></div>';
}
function pERender(){
 const root=document.getElementById("paxWarEconomy");if(!root)return;
 const region=state.selected,conf=PAX_ECON_CFG[region];if(!conf)return;
 root.innerHTML='<div class="pax-econ-head"><div><span class="pax-study-kicker">PAX / WAR ECONOMY · HISTORICAL DATA</span><h3>WAR <span>ECONOMY.</span></h3><p>'+pEL(pEN([conf.el,conf.en]))+'</p></div><span>'+pEL(region.toUpperCase())+'</span></div>'+pERenderPrice(region)+pERenderMacro(region);
 root.querySelectorAll("[data-econ-id]").forEach(b=>b.addEventListener("click",()=>{PAX_ECON.commodity=b.dataset.econId;pERender()}));
 root.querySelectorAll("[data-econ-range]").forEach(b=>b.addEventListener("click",()=>{PAX_ECON.range=b.dataset.econRange;pERender()}));
 root.querySelector("[data-econ-retry]")?.addEventListener("click",()=>{PAX_ECON.error=null;pELoad()});
 root.querySelector("#paxEconMetric")?.addEventListener("change",e=>{PAX_ECON.metric=e.target.value;pERender();pERefreshMacro(region)});
}
function pERefreshMacro(region){
 const conf=PAX_ECON_CFG[region];if(conf)conf.iso.forEach(iso=>pEWdi(iso,PAX_ECON.metric));
}
function pEOnView(){
 if(typeof PAX_VIEW==="undefined"||PAX_VIEW.view!=="conflict"||PAX_VIEW.sub!=="economy")return;
 pERender();pELoad();pERefreshMacro(state.selected);
}
function pEInit(){
 ["pax:view","pax:selection","pax:language"].forEach(e=>document.addEventListener(e,pEOnView));
 pEOnView();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",pEInit);else pEInit();