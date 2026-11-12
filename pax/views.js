/* PAX 3 — four views instead of one long scroll, one shared conflict selector,
   plus the real-data panels: observed game (GDELT), costs (UCDP), humanitarian (ReliefWeb), Greek press. */
'use strict';
const PAX_DATA_BASE="https://raw.githubusercontent.com/mariodinakus/world-faultline/pax-data/data/";
const PAX_VIEW={view:"today",sub:"signal",data:{gdelt:null,headlines:null,ucdp:null},loaded:false,relief:{},greek:{}};
const PAX_VIEW_SECTIONS={
 today:["overview",".stats-band","briefing",".section-main"],
 conflict:["paxConflictBar","detail","peaceSignals","timeline","process",".pax-study-implementation-section","negotiationRoom","timeMachine","gameReal","strategy","relief"],
 feed:["paxConflictBar","greekPress","narrative","dispatch","intelligence"],
 tools:["dataStatus",".pax-study-comparison-section","methodology"]
};
const PAX_SUBS=[
 ["signal",["detail","peaceSignals"],"Σήμα","Signal"],
 ["timeline",["timeline"],"Χρονολόγιο","Timeline"],
 ["process",["process",".pax-study-implementation-section"],"Διαδικασία","Process"],
 ["room",["negotiationRoom"],"Διαπραγμάτευση","Bargaining"],
 ["machine",["timeMachine"],"Χρονομηχανή","Time machine"],
 ["game",["gameReal","strategy"],"Παίγνιο","Game"],
 ["relief",["relief"],"Ανθρωπιστικά","Humanitarian"]
];
const PAX_VIEW_LABELS={today:["Σήμερα","Today"],conflict:["Συγκρούσεις","Conflicts"],feed:["Ροή & Πηγές","Feed & sources"],tools:["Μέθοδος & δεδομένα","Method & data"]};
const vEn=()=>paxLang()==="en";
const vT=(el,en)=>vEn()?en:el;
function vNode(sel){return sel[0]==="."?document.querySelector(sel):document.getElementById(sel)}
function vFmt(n,d=0){return Number.isFinite(n)?n.toLocaleString(vEn()?"en-GB":"el-GR",{maximumFractionDigits:d,minimumFractionDigits:d}):"—"}

/* ---------- routing ---------- */
function paxParseHash(){
 const parts=location.hash.replace(/^#\/?/,"").split("/").filter(Boolean);
 const view=PAX_VIEW_SECTIONS[parts[0]]?parts[0]:"today";
 let region=null,sub=null;
 if(view==="conflict"||view==="feed"){region=REGIONS.some(r=>r.id===parts[1])?parts[1]:null;sub=PAX_SUBS.some(s=>s[0]===parts[2])?parts[2]:null}
 return {view,region,sub};
}
function paxGo(view,region,sub,push=true){
 PAX_VIEW.view=view;if(sub)PAX_VIEW.sub=sub;
 if(region&&region!==state.selected)paxSetSelectedQuiet(region);
 const hash="#/"+view+(view==="conflict"||view==="feed"?"/"+state.selected+(view==="conflict"?"/"+PAX_VIEW.sub:""):"");
 if(push&&location.hash!==hash)history.pushState(null,"",hash);
 paxApplyView();
 window.scrollTo(0,0);
}
let paxOrigSetSelected=null;
function paxSetSelectedQuiet(id){paxOrigSetSelected(id,false)}
function paxApplyView(){
 const visible=new Set(PAX_VIEW_SECTIONS[PAX_VIEW.view]);
 if(PAX_VIEW.view==="conflict"){
  const subIds=new Set(PAX_SUBS.find(s=>s[0]===PAX_VIEW.sub)[1]);
  for(const s of PAX_SUBS)for(const id of s[1])if(!subIds.has(id))visible.delete(id);
 }
 const all=new Set(Object.values(PAX_VIEW_SECTIONS).flat());
 for(const sel of all){const el=vNode(sel);if(el)el.style.display=visible.has(sel)?"":"none"}
 document.body.dataset.view=PAX_VIEW.view;
 document.querySelectorAll(".view-btn").forEach(b=>{const on=b.dataset.view===PAX_VIEW.view;b.classList.toggle("active",on);b.setAttribute("aria-current",on?"page":"false")});
 paxRenderBar();
 if(PAX_VIEW.view==="conflict"&&PAX_VIEW.sub==="game")paxRenderGame();
 if(PAX_VIEW.view==="conflict"&&PAX_VIEW.sub==="relief")paxRenderRelief();
 if(PAX_VIEW.view==="feed")paxRenderGreek();
 if(PAX_VIEW.view==="tools")paxRenderStatus();
 if(PAX_VIEW.view==="conflict"&&PAX_VIEW.sub==="game"){const d=$("paxGameDetails");if(d&&!d.open){d.open=true;d.dispatchEvent(new Event("toggle"))}}
 window.dispatchEvent(new Event("resize"));
 document.dispatchEvent(new CustomEvent("pax:view",{detail:{view:PAX_VIEW.view,sub:PAX_VIEW.sub}}));
}

/* ---------- header nav + conflict bar ---------- */
function paxBuildNav(){
 const nav=document.querySelector(".top-nav");if(!nav)return;
 nav.innerHTML=Object.entries(PAX_VIEW_LABELS).map(([k,v])=>'<button type="button" class="view-btn" data-view="'+k+'">'+esc(vEn()?v[1]:v[0])+'</button>').join("");
 nav.querySelectorAll(".view-btn").forEach(b=>b.addEventListener("click",()=>paxGo(b.dataset.view)));
}
function paxRenderBar(){
 const bar=$("paxConflictBar");if(!bar)return;
 const showSubs=PAX_VIEW.view==="conflict";
 bar.innerHTML='<div class="pax-cbar-regions" role="tablist" aria-label="'+vT("Επιλογή σύγκρουσης","Choose conflict")+'">'+
  REGIONS.map(r=>{const an=regionAnalysis(r.id);return '<button type="button" role="tab" data-region="'+r.id+'" class="pax-chip'+(r.id===state.selected?" active":"")+'" aria-selected="'+(r.id===state.selected)+'"><span class="pax-chip-dot s-'+esc(an.status)+'"></span>'+esc(vEn()?paxRegionEn(r.id):r.short)+'</button>'}).join("")+'</div>'+
  (showSubs?'<div class="pax-cbar-subs">'+PAX_SUBS.map(s=>'<button type="button" data-sub="'+s[0]+'" class="pax-sub'+(s[0]===PAX_VIEW.sub?" active":"")+'">'+esc(vEn()?s[3]:s[2])+'</button>').join("")+
  '<a class="pax-sub-info" href="#/tools" title="'+vT("Μεθοδολογία και όρια των δεδομένων","Methodology and data limits")+'">ⓘ</a></div>':"");
 bar.querySelectorAll("[data-region]").forEach(b=>b.addEventListener("click",()=>paxGo(PAX_VIEW.view,b.dataset.region)));
 bar.querySelectorAll("[data-sub]").forEach(b=>b.addEventListener("click",()=>paxGo("conflict",null,b.dataset.sub)));
 bar.querySelector(".pax-sub-info")?.addEventListener("click",e=>{e.preventDefault();paxGo("tools")});
}
function paxRegionEn(id){return {ukraine:"UKRAINE",gaza:"GAZA",iranisrael:"IRAN / ISRAEL",usiran:"US / IRAN",sudan:"SUDAN",drc:"CONGO",myanmar:"MYANMAR",yemen:"YEMEN",syria:"SYRIA"}[id]||id}

/* ---------- data from the daily collector ---------- */
async function paxLoadData(){
 const bust="?h="+Math.floor(Date.now()/3600e3);
 const get=f=>fetch(PAX_DATA_BASE+f+bust,{cache:"no-cache"}).then(r=>r.ok?r.json():null).catch(()=>null);
 const [gdelt,headlines,ucdp]=await Promise.all([get("gdelt.json"),get("headlines.json"),get("ucdp.json")]);
 Object.assign(PAX_VIEW.data,{gdelt,headlines,ucdp});PAX_VIEW.loaded=true;
 paxDecorateRadar();paxApplyView();
}
function paxSeries(id){
 const g=PAX_VIEW.data.gdelt;if(!g||!g.dyads?.[id])return null;
 const days=Object.keys(g.days).sort();
 return days.map(d=>{const r=g.days[d][id];if(!r)return {d,ab:null,ba:null};
  const side=o=>({n:r[o],gold:r[o+2]?r[o+1]/r[o+2]:null,coop:r[o+3],conf:r[o+4],mat:r[o+5],share:r[o]>=5?r[o+4]/r[o]:null});
  return {d,ab:side(0),ba:side(6)}});
}
function paxSpark(values,w=88,h=22){
 const v=values.filter(x=>x!=null);if(v.length<5)return "";
 const min=Math.min(...v),max=Math.max(...v),span=max-min||1;
 let path="",started=false;
 values.forEach((x,i)=>{if(x==null){started=false;return}const px=(i/(values.length-1))*w,py=h-2-((x-min)/span)*(h-4);path+=(started?"L":"M")+px.toFixed(1)+" "+py.toFixed(1);started=true});
 return '<svg class="pax-spark" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'" aria-hidden="true"><path d="'+path+'"/></svg>';
}
function paxRolling(arr,k=7){return arr.map((_,i)=>{const s=arr.slice(Math.max(0,i-k+1),i+1).filter(x=>x!=null);return s.length>=3?s.reduce((a,b)=>a+b,0)/s.length:null})}
function paxDecorateRadar(){
 const list=$("radarList");if(!list)return;
 list.querySelectorAll(".radar-item").forEach(btn=>{
  if(btn.querySelector(".pax-spark-wrap"))return;
  const s=paxSeries(btn.dataset.id);if(!s)return;
  const both=s.map(x=>{const a=x.ab?.share,b=x.ba?.share;return a==null&&b==null?null:((a??b)+(b??a))/2});
  const roll=paxRolling(both).slice(-60),spark=paxSpark(roll);if(!spark)return;
  const wrap=document.createElement("span");wrap.className="pax-spark-wrap";
  wrap.innerHTML=spark+'<small>'+vT("Συγκρουσιακά γεγονότα GDELT · 60 ημ.","GDELT conflict events · 60d")+'</small>';
  btn.appendChild(wrap);
 });
}

/* ---------- observed game (GDELT) ---------- */
function paxOLS(y,x1,x2){
 const n=y.length;if(n<20)return null;
 const X=y.map((_,i)=>[1,x1[i],x2[i]]);
 const XtX=[[0,0,0],[0,0,0],[0,0,0]],Xty=[0,0,0];
 for(let i=0;i<n;i++)for(let a=0;a<3;a++){Xty[a]+=X[i][a]*y[i];for(let b=0;b<3;b++)XtX[a][b]+=X[i][a]*X[i][b]}
 const inv=paxInv3(XtX);if(!inv)return null;
 const beta=inv.map(r=>r[0]*Xty[0]+r[1]*Xty[1]+r[2]*Xty[2]);
 let rss=0;for(let i=0;i<n;i++){const e=y[i]-(beta[0]+beta[1]*x1[i]+beta[2]*x2[i]);rss+=e*e}
 const s2=rss/(n-3),se=[0,1,2].map(k=>Math.sqrt(Math.max(0,s2*inv[k][k])));
 return {n,beta,se,t:beta.map((b,k)=>se[k]?b/se[k]:0)};
}
function paxInv3(m){
 const [a,b,c]=m[0],[d,e,f]=m[1],[g,h,i]=m[2];
 const A=e*i-f*h,B=-(d*i-f*g),C=d*h-e*g,det=a*A+b*B+c*C;if(Math.abs(det)<1e-12)return null;
 return [[A,-(b*i-c*h),b*f-c*e],[B,a*i-c*g,-(a*f-c*d)],[C,-(a*h-b*g),a*e-b*d]].map(r=>r.map(v=>v/det));
}
function paxMedian(a){const s=a.filter(x=>x!=null).sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:null}
function paxLineChart(series,labels,colors){
 const W=760,H=220,P={l:38,r:10,t:12,b:24};
 const all=series.flat().filter(v=>v!=null);if(!all.length)return "";
 const max=Math.max(.05,...all)*1.1,n=series[0].length;
 const X=i=>P.l+(i/(n-1))*(W-P.l-P.r),Y=v=>P.t+(1-v/max)*(H-P.t-P.b);
 let grid="";for(let k=0;k<=4;k++){const v=max*k/4;grid+='<line x1="'+P.l+'" x2="'+(W-P.r)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" class="g"/><text x="'+(P.l-6)+'" y="'+(Y(v)+4)+'" text-anchor="end">'+Math.round(v*100)+'%</text>'}
 const ticks=[0,Math.floor(n/2),n-1].map(i=>'<text x="'+X(i)+'" y="'+(H-6)+'" text-anchor="'+(i===0?"start":i===n-1?"end":"middle")+'">'+esc(labels[i]?.slice(5)||"")+'</text>').join("");
 const lines=series.map((s,k)=>{let d="",on=false;s.forEach((v,i)=>{if(v==null){on=false;return}d+=(on?"L":"M")+X(i).toFixed(1)+" "+Y(v).toFixed(1);on=true});return '<path d="'+d+'" stroke="'+colors[k]+'" class="ln"/>'}).join("");
 return '<svg class="pax-chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+vT("Ποσοστό συγκρουσιακών γεγονότων ανά μέρα","Daily share of conflictual events")+'">'+grid+ticks+lines+'</svg>';
}
function paxRenderGame(){
 const root=$("paxGameReal");if(!root)return;
 const id=state.selected,region=REGIONS.find(r=>r.id===id),g=PAX_VIEW.data.gdelt;
 $("paxGameRegion").textContent=vEn()?paxRegionEn(id):region.name;
 if(!PAX_VIEW.loaded){root.innerHTML='<p class="pax-muted">'+vT("Φόρτωση δεδομένων GDELT…","Loading GDELT data…")+'</p>';return}
 if(!g){root.innerHTML=paxEmpty(vT("Τα ημερήσια δεδομένα δεν είναι ακόμη διαθέσιμα. Ο συλλέκτης τρέχει μία φορά τη μέρα (GitHub Actions).","Daily data is not available yet. The collector runs once a day (GitHub Actions)."));return}
 if(!g.dyads[id]){root.innerHTML=paxEmpty(vT("Σε εσωτερικούς πολέμους (Σουδάν, Μιανμάρ) το GDELT συνήθως κωδικοποιεί τις ένοπλες ομάδες χωρίς χώρα, άρα οι δύο πλευρές δεν διαχωρίζονται αξιόπιστα. Δεν δείχνουμε πλασματικό παίγνιο.","In internal wars (Sudan, Myanmar) GDELT usually codes armed groups without a country, so the two sides cannot be separated reliably. We do not show a made-up game."))+paxUcdpBlock(id);return}
 const dy=g.dyads[id],A=vEn()?dy.a.en:dy.a.el,B=vEn()?dy.b.en:dy.b.el,s=paxSeries(id).slice(-90);
 const labels=s.map(x=>x.d),ab=s.map(x=>x.ab?.share??null),ba=s.map(x=>x.ba?.share??null);
 const valid=s.filter(x=>x.ab?.share!=null&&x.ba?.share!=null);
 const totalAB=s.reduce((t,x)=>t+(x.ab?.n||0),0),totalBA=s.reduce((t,x)=>t+(x.ba?.n||0),0);
 if(valid.length<20){root.innerHTML=paxEmpty(vT("Λίγα κωδικοποιημένα γεγονότα μεταξύ των δύο πλευρών ("+valid.length+" ημέρες με αρκετά δεδομένα). Χρειάζονται τουλάχιστον 20 για αξιόπιστη σύγκριση.","Too few coded events between the two sides ("+valid.length+" days with enough data). At least 20 are needed."))+paxUcdpBlock(id);return}
 const mA=paxMedian(valid.map(x=>x.ab.share)),mB=paxMedian(valid.map(x=>x.ba.share));
 const cell={CC:0,CD:0,DC:0,DD:0};
 valid.forEach(x=>{const a=x.ab.share>mA?"D":"C",b=x.ba.share>mB?"D":"C";cell[a+b]++});
 const N=valid.length,pct=k=>Math.round(100*cell[k]/N);
 const top=Object.entries(cell).sort((x,y)=>y[1]-x[1])[0][0];
 // reciprocity: A_t = a + b1*B_{t-1} + b2*A_{t-1}
 const y1=[],x1=[],x2=[],y2=[],z1=[],z2=[];
 for(let i=1;i<s.length;i++){const p=s[i-1],c=s[i];
  if(c.ab?.share!=null&&p.ba?.share!=null&&p.ab?.share!=null){y1.push(c.ab.share);x1.push(p.ba.share);x2.push(p.ab.share)}
  if(c.ba?.share!=null&&p.ab?.share!=null&&p.ba?.share!=null){y2.push(c.ba.share);z1.push(p.ab.share);z2.push(p.ba.share)}}
 const rA=paxOLS(y1,x1,x2),rB=paxOLS(y2,z1,z2);
 const recText=(r,who,other)=>{if(!r)return vT("Ανεπαρκή δεδομένα.","Insufficient data.");
  const b=r.beta[1],t=r.t[1];
  if(Math.abs(t)<2)return vT("Δεν φαίνεται στατιστικά σημαντική αντίδραση της πλευράς «"+who+"» στη χθεσινή στάση της πλευράς «"+other+"».","No statistically significant response of "+who+" to "+other+"'s previous-day behaviour.");
  return b>0?vT("Μοτίβο αμοιβαιότητας: όταν η πλευρά «"+other+"» κλιμακώνει, η πλευρά «"+who+"» τείνει να κλιμακώνει την επόμενη μέρα (σαν tit‑for‑tat).","Reciprocity pattern: when "+other+" escalates, "+who+" tends to escalate the next day (tit-for-tat-like)."):
   vT("Αντίθετη κίνηση: μετά από κλιμάκωση της πλευράς «"+other+"», η πλευρά «"+who+"» τείνει να χαμηλώνει τόνους.","Counter-movement: after "+other+" escalates, "+who+" tends to de-escalate.");
 };
 const coef=r=>r?'β = '+vFmt(r.beta[1],2)+' · t = '+vFmt(r.t[1],1)+' · n = '+r.n:'—';
 const cellName={CC:vT("Και οι δύο κάτω από τον μέσο όρο τους","Both below their norm"),CD:vT(A+" ήπια · "+B+" κλιμακώνει",A+" calm · "+B+" escalates"),DC:vT(A+" κλιμακώνει · "+B+" ήπια",A+" escalates · "+B+" calm"),DD:vT("Και οι δύο κλιμακώνουν","Both escalate")};
 const cellBox=k=>'<div class="pax-g-cell'+(k===top?" top":"")+'"><strong>'+pct(k)+'%</strong><span>'+cell[k]+' '+vT("ημέρες","days")+'</span><small>'+esc(cellName[k])+'</small></div>';
 const roundShare=v=>Math.round(v*100)+"%";
 root.innerHTML=
 '<div class="pax-g-head"><div><span class="pax-desk-overline">'+vT("ΠΑΡΑΤΗΡΟΥΜΕΝΕΣ ΚΙΝΗΣΕΙΣ · GDELT 2.0","OBSERVED MOVES · GDELT 2.0")+'</span><h3><i class="ka"></i>'+esc(A)+' <span>↔</span> <i class="kb"></i>'+esc(B)+'</h3></div>'+
 '<div class="pax-g-meta"><b>'+vFmt(totalAB+totalBA)+'</b> '+vT("κωδικοποιημένα γεγονότα","coded events")+'<br>'+esc(labels[0])+' → '+esc(labels[labels.length-1])+'</div></div>'+
 '<div class="pax-g-grid"><div class="pax-g-chart"><div class="pax-g-label">'+vT("Ποσοστό συγκρουσιακών γεγονότων ανά μέρα (κινητός μέσος 7 ημ.)","Share of conflictual events per day (7-day rolling)")+'</div>'+
 paxLineChart([paxRolling(ab),paxRolling(ba)],labels,["#171d1f","#c49a12"])+
 '<div class="pax-g-legend"><span><i class="ka"></i>'+esc(A)+' → '+esc(B)+'</span><span><i class="kb"></i>'+esc(B)+' → '+esc(A)+'</span></div></div>'+
 '<div class="pax-g-matrix"><div class="pax-g-label">'+vT("Εμπειρικός πίνακας 2×2 · "+N+" ημέρες","Empirical 2×2 · "+N+" days")+'</div>'+
 '<div class="pax-g-table"><span></span><span class="h">'+esc(B)+' '+vT("ήπια","calm")+'</span><span class="h">'+esc(B)+' '+vT("κλιμακώνει","escalates")+'</span>'+
 '<span class="h r">'+esc(A)+' '+vT("ήπια","calm")+'</span>'+cellBox("CC")+cellBox("CD")+
 '<span class="h r">'+esc(A)+' '+vT("κλιμακώνει","escalates")+'</span>'+cellBox("DC")+cellBox("DD")+'</div>'+
 '<div class="pax-g-sync"><strong>'+(pct("CC")+pct("DD"))+'%</strong><span>'+vT("των ημερών οι δύο πλευρές κινούνται προς την ίδια κατεύθυνση (αν ήταν ανεξάρτητες: ~50%). Επειδή κάθε πλευρά χωρίζεται στη δική της διάμεσο, οι δύο μεικτές γωνίες βγαίνουν εξ ορισμού περίπου ίσες — το νούμερο που λέει κάτι είναι η διαγώνιος. Το ποιος αντιδρά σε ποιον φαίνεται παρακάτω.","of days the two sides move in the same direction (if independent: ~50%). Because each side is split at its own median, the two mixed cells are roughly equal by construction — the diagonal is the informative number. Who reacts to whom is shown below.")+'</span></div>'+'<p class="pax-g-note">'+vT("«Κλιμάκωση» = μέρα με ποσοστό συγκρουσιακών γεγονότων πάνω από τη διάμεσο της ίδιας πλευράς ("+esc(A)+": "+roundShare(mA)+", "+esc(B)+": "+roundShare(mB)+"). Μετράμε σχετική στάση, όχι απόλυτη.","“Escalates” = a day whose share of conflictual events is above that side's own median ("+esc(A)+": "+roundShare(mA)+", "+esc(B)+": "+roundShare(mB)+"). Relative stance, not absolute.")+'</p></div></div>'+
 '<div class="pax-g-recip"><div><span class="pax-g-label">'+vT("ΑΜΟΙΒΑΙΟΤΗΤΑ · ","RECIPROCITY · ")+esc(A)+'</span><p>'+recText(rA,A,B)+'</p><code>'+coef(rA)+'</code></div>'+
 '<div><span class="pax-g-label">'+vT("ΑΜΟΙΒΑΙΟΤΗΤΑ · ","RECIPROCITY · ")+esc(B)+'</span><p>'+recText(rB,B,A)+'</p><code>'+coef(rB)+'</code></div></div>'+
 paxUcdpBlock(id)+
 '<p class="pax-desk-disclaimer">'+vT("Το GDELT κωδικοποιεί αυτόματα γεγονότα από ειδήσεις: μετράει ό,τι αναφέρεται στον Τύπο, με λάθη κωδικοποίησης και μεροληψία κάλυψης. Η παλινδρόμηση (y = α + β·Άλλος_{t−1} + γ·Ίδιος_{t−1}) δείχνει συσχέτιση στον χρόνο, όχι αιτιότητα. Το 2×2 εδώ είναι μετρημένο· οι αμοιβές του υποθετικού μοντέλου από κάτω δεν είναι.","GDELT machine-codes events from news: it measures what the press reports, with coding errors and coverage bias. The regression (y = α + β·Other_{t−1} + γ·Self_{t−1}) shows temporal association, not causation. This 2×2 is measured; the payoffs of the hypothetical model below are not.")+
 ' <a href="'+PAX_DATA_BASE+'gdelt.json" target="_blank" rel="noopener">'+vT("Ακατέργαστα δεδομένα ↗","Raw data ↗")+'</a></p>';
}
function paxEmpty(msg){return '<div class="pax-g-empty">'+esc(msg)+'</div>'}
function paxUcdpBlock(id){
 const u=PAX_VIEW.data.ucdp;
 if(!u||u.status!=="ok"){
  return '<div class="pax-g-cost"><span class="pax-g-label">'+vT("ΚΟΣΤΟΣ ΠΟΛΕΜΟΥ · UCDP","COST OF WAR · UCDP")+'</span><p class="pax-muted">'+
   vT("Οι μηνιαίοι νεκροί από το UCDP χρειάζονται δωρεάν κλειδί πρόσβασης (UCDP_TOKEN) στις ρυθμίσεις του GitHub repo. Μόλις προστεθεί, εμφανίζονται εδώ αυτόματα.","UCDP monthly fatalities need a free access token (UCDP_TOKEN) in the GitHub repo secrets. Once added, they appear here automatically.")+'</p></div>';
 }
 const m=u.months?.[id]||{},keys=Object.keys(m).sort().slice(-12);if(!keys.length)return "";
 const max=Math.max(1,...keys.map(k=>m[k]));
 return '<div class="pax-g-cost"><span class="pax-g-label">'+vT("ΚΟΣΤΟΣ ΠΟΛΕΜΟΥ · ΝΕΚΡΟΙ ΑΝΑ ΜΗΝΑ (UCDP, ΚΑΛΥΤΕΡΗ ΕΚΤΙΜΗΣΗ)","COST OF WAR · FATALITIES PER MONTH (UCDP BEST ESTIMATE)")+'</span><div class="pax-bars">'+
  keys.map(k=>'<div title="'+k+': '+m[k]+'"><i style="height:'+Math.max(2,Math.round(100*m[k]/max))+'%"></i><b>'+vFmt(m[k])+'</b><small>'+k.slice(2)+'</small></div>').join("")+
  '</div><p class="pax-muted">'+vT("Υποψήφια (candidate) δεδομένα UCDP "+esc(u.version)+" — αναθεωρούνται μηνιαία.","UCDP candidate data "+esc(u.version)+" — revised monthly.")+'</p></div>';
}

/* ---------- humanitarian (ReliefWeb) ---------- */
async function paxRenderRelief(){
 const root=$("paxReliefList");if(!root)return;const id=state.selected;
 $("paxReliefRegion").textContent=vEn()?paxRegionEn(id):REGIONS.find(r=>r.id===id).name;
 let data=PAX_VIEW.relief[id];
 if(!data){root.innerHTML='<p class="pax-muted">'+vT("Φόρτωση…","Loading…")+'</p>';
  try{data=await fetch(PAX_API_ORIGIN+"/api/relief?region="+id).then(r=>r.json())}catch{data={status:"unavailable",reports:[]}}
  PAX_VIEW.relief[id]=data;if(state.selected!==id)return}
 if(data.status==="needs-appname"){root.innerHTML=paxEmpty(vT("Το ReliefWeb (ΟΗΕ/OCHA) απαιτεί εγκεκριμένο όνομα εφαρμογής. Ζήτησέ το δωρεάν στο apidoc.reliefweb.int και πρόσθεσέ το στο Vercel ως RELIEFWEB_APPNAME — μετά οι αναφορές εμφανίζονται εδώ.","ReliefWeb (UN OCHA) requires an approved appname. Request one free at apidoc.reliefweb.int and add it in Vercel as RELIEFWEB_APPNAME — reports then appear here."));return}
 if(!data.reports?.length){root.innerHTML=paxEmpty(vT("Δεν ήταν δυνατή η ανάκτηση αναφορών αυτή τη στιγμή.","Reports could not be retrieved right now."));return}
 root.innerHTML=data.reports.map(r=>'<article class="pax-relief-item"><div><span class="pax-tag">'+esc(r.format||"Report")+'</span><time>'+esc(r.date?r.date.slice(0,10):"")+'</time></div><a href="'+esc(validLink(r.url))+'" target="_blank" rel="noopener noreferrer">'+esc(r.title)+'</a><small>'+esc(r.source||"")+'</small></article>').join("");
}

/* ---------- Greek press vs international ---------- */
async function paxRenderGreek(){
 const root=$("paxGreekGrid");if(!root)return;const id=state.selected;
 $("paxGreekRegion").textContent=vEn()?paxRegionEn(id):REGIONS.find(r=>r.id===id).name;
 let gr=PAX_VIEW.greek[id];
 if(!gr){root.innerHTML='<p class="pax-muted">'+vT("Φόρτωση…","Loading…")+'</p>';
  try{gr=await fetch(PAX_API_ORIGIN+"/api/greek?region="+id).then(r=>r.json())}catch{gr={articles:[]}}
  PAX_VIEW.greek[id]=gr;if(state.selected!==id)return}
 const intl=(regionRow(id).articles||[]).slice(0,12),greek=(gr.articles||[]).slice(0,12);
 const typeOf=t=>classify(t);
 const plain=t=>String(t).normalize("NFD").replace(/\p{M}/gu,"").toLowerCase();
 const grDip=greek.filter(a=>/συνομιλ|διαπραγμ|ειρην|εκεχειρ|συμφων|διπλωμ|απεσταλμ|συνοδ|συναντησ/.test(plain(a.title))).length;
 const grEsc=greek.filter(a=>/επιθεσ|πληγμ|βομβ|νεκρ|σκοτω|κλιμακ|drone|πυραυλ|μαχ|συγκρουσ|καταρρι|επιδρομ/.test(plain(a.title))).length;
 const inDip=intl.filter(a=>["talks","proposal","ceasefire","implemented"].includes(typeOf(a.title))).length,inEsc=intl.filter(a=>typeOf(a.title)==="setback").length;
 const col=(title,list,dip,escn,note)=>'<div class="pax-greek-col"><div class="pax-greek-head"><h4>'+title+'</h4><span>'+list.length+' '+vT("τίτλοι","headlines")+' · '+vT("διπλωματία","diplomacy")+' '+dip+' · '+vT("ένταση","escalation")+' '+escn+'</span></div>'+
  (list.length?list.map(a=>'<a class="pax-greek-item" href="'+esc(validLink(a.url))+'" target="_blank" rel="noopener noreferrer"><b>'+esc(a.title)+'</b><small>'+esc(a.source||"")+' · '+esc(timeLocal(a.publishedAt))+'</small></a>').join(""):'<p class="pax-muted">'+note+'</p>')+'</div>';
 root.innerHTML=col(vT("Ελληνικός Τύπος","Greek press"),greek,grDip,grEsc,vT("Δεν βρέθηκαν ελληνικοί τίτλοι.","No Greek headlines found."))+
  col(vT("Διεθνής Τύπος","International press"),intl,inDip,inEsc,vT("Αναμονή διεθνών τίτλων…","Waiting for international headlines…"));
}

/* ---------- data status ---------- */
function paxRenderStatus(){
 const root=$("paxDataStatus");if(!root)return;const d=PAX_VIEW.data;
 const row=(name,ok,detail,link)=>'<div class="pax-status-row"><span class="pax-status-dot '+(ok===true?"ok":ok===false?"bad":"wait")+'"></span><div><b>'+name+'</b><small>'+detail+'</small></div>'+(link?'<a href="'+link+'" target="_blank" rel="noopener">↗</a>':"")+'</div>';
 const days=d.gdelt?Object.keys(d.gdelt.days).length:0,hdays=d.headlines?Object.keys(d.headlines.days).length:0;
 root.innerHTML=
  row(vT("Ειδήσεις (RSS / Google News / GDELT DOC)","News (RSS / Google News / GDELT DOC)"),state.lastUpdated?true:null,vT("Ζωντανά, κάθε φόρτωση σελίδας","Live, on every page load")+(state.lastUpdated?" · "+timeLocal(state.lastUpdated):""))+
  row("GDELT 2.0 Events",d.gdelt?true:false,d.gdelt?vT(days+" ημέρες · ενημέρωση ","Days: "+days+" · updated ")+timeLocal(d.gdelt.updatedAt):vT("Δεν έχει τρέξει ακόμη ο ημερήσιος συλλέκτης","Daily collector has not run yet"),PAX_DATA_BASE+"gdelt.json")+
  row(vT("Ιστορικό σήματος τίτλων","Headline signal history"),d.headlines?true:false,d.headlines?vT(hdays+" ημερήσια στιγμιότυπα",hdays+" daily snapshots"):"—",PAX_DATA_BASE+"headlines.json")+
  row("UCDP GED",d.ucdp?.status==="ok"?true:d.ucdp?.status==="no-token"?null:false,d.ucdp?.status==="ok"?vT("Έκδοση ","Version ")+esc(d.ucdp.version):vT("Χρειάζεται UCDP_TOKEN (GitHub secret)","Needs UCDP_TOKEN (GitHub secret)"))+
  row("ReliefWeb",null,vT("Χρειάζεται RELIEFWEB_APPNAME (Vercel env)","Needs RELIEFWEB_APPNAME (Vercel env)"))+
  row(vT("Ελληνικός Τύπος (Google News Ελλάδα)","Greek press (Google News Greece)"),true,vT("Ζωντανά, ανά σύγκρουση","Live, per conflict"))+
  row("FRED / ECB",null,vT("Τιμές ενέργειας, σιταριού, EUR/USD","Energy, wheat, EUR/USD prices"));
}

/* ---------- legacy in-page anchors (#timeline, #methodology …) → the view that holds them ---------- */
function paxRouteToElement(id){
 const el=document.getElementById(id);if(!el)return false;
 const sec=el.closest("main>section")||el;
 for(const [view,list] of Object.entries(PAX_VIEW_SECTIONS)){
  if(!list.some(sel=>vNode(sel)===sec))continue;
  if(view==="conflict"){const sub=PAX_SUBS.find(s=>s[1].includes(sec.id));paxGo("conflict",null,sub?sub[0]:"signal")}else paxGo(view);
  if(el!==sec)setTimeout(()=>el.scrollIntoView({behavior:"smooth",block:"start"}),60);
  return true;
 }
 return false;
}
function paxReorderFeed(){
 const anchor=$("dataStatus");if(!anchor)return;
 for(const id of ["dispatch","greekPress","narrative","intelligence"]){const n=$(id);if(n)anchor.parentNode.insertBefore(n,anchor)}
}
/* ---------- init ---------- */
function paxViewsInit(){
 document.body.classList.add("pax-views");
 paxOrigSetSelected=window.setSelected;
 window.setSelected=function(id,scroll){paxOrigSetSelected(id,false);if(scroll)paxGo("conflict",id,"signal");else if(PAX_VIEW.view!=="today")paxGo(PAX_VIEW.view,null,null,true)};
 paxBuildNav();paxReorderFeed();
 const headH=()=>{const h=document.querySelector(".site-header");if(h)document.documentElement.style.setProperty("--pax-head",h.offsetHeight+"px")};
 headH();window.addEventListener("resize",headH);window.addEventListener("load",headH);if("ResizeObserver" in window)new ResizeObserver(headH).observe(document.querySelector(".site-header"));
 document.addEventListener("click",e=>{
  const a=e.target.closest?.('a[href^="#"]');if(!a)return;const h=a.getAttribute("href");
  if(h.startsWith("#/")){e.preventDefault();location.hash=h;return}
  if(h.length>1&&paxRouteToElement(h.slice(1)))e.preventDefault();
 });
 const p=paxParseHash();if(p.region)paxSetSelectedQuiet(p.region);if(p.sub)PAX_VIEW.sub=p.sub;PAX_VIEW.view=p.view;
 paxApplyView();
 if(location.hash.length>1&&!location.hash.startsWith("#/"))paxRouteToElement(decodeURIComponent(location.hash.slice(1)));
 window.addEventListener("hashchange",()=>{if(location.hash.length>1&&!location.hash.startsWith("#/")){paxRouteToElement(location.hash.slice(1));return}const q=paxParseHash();if(q.region&&q.region!==state.selected)paxSetSelectedQuiet(q.region);if(q.sub)PAX_VIEW.sub=q.sub;PAX_VIEW.view=q.view;paxApplyView();window.scrollTo(0,0)});
 window.addEventListener("popstate",()=>{const q=paxParseHash();if(q.region&&q.region!==state.selected)paxSetSelectedQuiet(q.region);if(q.sub)PAX_VIEW.sub=q.sub;PAX_VIEW.view=q.view;paxApplyView()});
 document.addEventListener("pax:selection",()=>{if(PAX_VIEW.view==="conflict"||PAX_VIEW.view==="feed"){paxRenderBar();if(PAX_VIEW.sub==="game")paxRenderGame();if(PAX_VIEW.sub==="relief")paxRenderRelief();if(PAX_VIEW.view==="feed")paxRenderGreek()}});
 document.addEventListener("pax:data",()=>{paxRenderBar();if(PAX_VIEW.view==="feed")paxRenderGreek();if(PAX_VIEW.view==="tools")paxRenderStatus()});
 document.addEventListener("pax:language",()=>{paxBuildNav();paxApplyView();document.querySelectorAll(".pax-spark-wrap").forEach(n=>n.remove());paxDecorateRadar()});
 new MutationObserver(()=>paxDecorateRadar()).observe($("radarList"),{childList:true});
 paxLoadData();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",paxViewsInit);else paxViewsInit();
