/* PAX 3.1 — historical obligation ledger and evidence-linked process comparison.
   Invariant: source metadata is NOT evidence of ongoing compliance.
   Static, versioned research files; no artificial "peace score" or extrapolation. */
"use strict";
const PAX_RESEARCH={
 ledger:null,comparative:null,error:null,loading:false,loaded:false,
 filter:"all",compareA:"gaza-2025",compareB:"colombia",family:"all"
};
const psT=(el,en)=>paxLang()==="en"?en:el;
const psE=s=>esc(String(s??""));
const psLang=o=>o?(paxLang()==="en"?o.en||o.el:o.el||o.en)||"":"";
const psNiceDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s))?s:"—";
const psISODate=s=>new Date(s+"T12:00:00Z").getTime();
const psDayDiff=(from,to)=>Math.round((psISODate(to)-psISODate(from))/86400000);
function psSafeUrl(u){try{const p=new URL(u);return p.protocol==="https:"?p.href:""}catch{return""}}
function psAnchor(url,label){const safe=psSafeUrl(url);return safe?'<a href="'+psE(safe)+'" target="_blank" rel="noopener noreferrer">'+psE(label)+'</a>':""}
function psEvidenceState(events){
 if(!events.length)return "missing";
 const x=events[events.length-1];
 return {observed:"observed",pledged:"pledged",interrupted:"interrupted",limitation:"limitation"}[x.kind]||"missing";
}
function psStatusLabel(s){
 return ({
 observed:[ "Τεκμηριωμένη ιστορική ενέργεια","Historical action documented"],
 pledged:[ "Δέσμευση / υπογραφή μόνο","Pledge / signature only"],
 interrupted:[ "Τεκμηριωμένη μεταγενέστερη διακοπή","Later interruption documented"],
 limitation:[ "Ανοικτή εκκρεμότητα στην πηγή","Unresolved in the cited source"],
 missing:[ "Χωρίς επαλήθευση εφαρμογής","No implementation verification"]
 })[s]?.[paxLang()==="en"?1:0]||s;
}
async function psReadJSON(path){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),10000);
 try{
  const r=await fetch(path,{signal:ctrl.signal,cache:"no-cache"});
  if(!r.ok)throw Error("HTTP "+r.status);
  return await r.json();
 }finally{clearTimeout(timer)}
}
function psCheckData(ledger,comparative){
 if(ledger?.schemaVersion!==1||comparative?.schemaVersion!==1||!Array.isArray(ledger.agreements)||!Array.isArray(comparative.cases))
  throw Error("Unrecognized research data");
 for(const a of ledger.agreements){
  if(!REGIONS.some(r=>r.id===a.region)||!a.id||!psSafeUrl(a.source?.url)||!a.commitments?.length)
   throw Error("Incomplete agreement dossier");
  for(const k of a.commitments){
   if(!k.id||!psSafeUrl(k.promiseSource)||!Array.isArray(k.observations))throw Error("Incomplete commitment");
   for(const ev of k.observations)if(!psSafeUrl(ev.url)||!Number.isFinite(psISODate(ev.date)))
    throw Error("Invalid evidence record");
  }
 }
 for(const c of comparative.cases){
  if(!psSafeUrl(c.reference?.url)||!Number.isFinite(psISODate(c.anchor))||!Array.isArray(c.events)||!c.events.length)
   throw Error("Incomplete comparison case");
 }
}
async function psLoadResearch(){
 if(PAX_RESEARCH.loading||PAX_RESEARCH.loaded)return;
 PAX_RESEARCH.loading=true;PAX_RESEARCH.error=null;psRenderAll();
 try{
  const [ledger,comparative]=await Promise.all([
   psReadJSON("research/implementation-ledger.json"),
   psReadJSON("research/comparative-cases.json")
  ]);
  psCheckData(ledger,comparative);
  PAX_RESEARCH.ledger=ledger;PAX_RESEARCH.comparative=comparative;PAX_RESEARCH.loaded=true;
 }catch(err){PAX_RESEARCH.error=String(err?.message||err)}
 finally{PAX_RESEARCH.loading=false;psRenderAll()}
}
function psLoading(root){
 root.innerHTML='<div class="pax-study-message">'+psE(PAX_RESEARCH.error?
   psT("Το τεκμηριωμένο αρχείο δεν φορτώθηκε: ","Could not load the sourced dataset: ")+PAX_RESEARCH.error:
   psT("Φόρτωση τεκμηριωμένων καταχωρίσεων…","Loading source-linked research records…"))+
   ' <button type="button" data-study-retry>'+psE(psT("Επανάληψη","Retry"))+'</button></div>';
 root.querySelector("[data-study-retry]")?.addEventListener("click",()=>{PAX_RESEARCH.error=null;psLoadResearch()});
}
function psSourceLabel(ev){
 return '<span class="pax-study-date">'+psE(psNiceDate(ev.date))+'</span><span>'+psE(psLang({el:ev.el,en:ev.en}))+'</span>'+
  psAnchor(ev.url,ev.source||psT("Πηγή","Source"));
}
function psComplianceRender(){
 const root=document.getElementById("paxImplementation");if(!root)return;
 if(!PAX_RESEARCH.loaded){psLoading(root);return}
 const data=PAX_RESEARCH.ledger;
 const items=data.agreements.filter(a=>a.region===state.selected),region=REGIONS.find(r=>r.id===state.selected);
 const header='<div class="pax-study-head"><div><span class="pax-study-kicker">PAX / IMPLEMENTATION TRACKER · ARCHIVAL</span>'+
  '<h3>'+psE(psT("Εφαρμογή συμφωνιών","Agreement implementation"))+'</h3><p>'+
  psE(psT("Τι υποσχέθηκαν, τι τεκμηριώθηκε και τι έμεινε ανοιχτό. Το αρχείο δεν βεβαιώνει σημερινή συμμόρφωση.","What was pledged, what was recorded, and what remains unverified. The ledger cannot establish compliance today."))+
  '</p></div><span class="pax-study-asof">'+psE(psT("Επιμέλεια δεδομένων","Curated"))+' '+psE(data.curatedAt)+'</span></div>';
 if(!items.length){
  root.innerHTML=header+'<div class="pax-study-message"><b>'+psE(region?.name||"")+'</b><p>'+
   psE(psT("Δεν υπάρχει ακόμη ελεγμένη κατά δέσμευση καταχώριση για αυτή τη σύγκρουση. Αυτό είναι έλλειμμα κάλυψης, όχι ένδειξη ότι δεν υπήρξαν συμφωνίες ή πράξεις εφαρμογής.","No commitment-level entry has been audited for this conflict. This is a coverage gap, not evidence of absent agreements or implementation."))+
   '</p><a href="#/conflict/'+psE(state.selected)+'/process">'+psE(psT("Προβολή υπάρχοντος αρχείου οροσήμων","View the existing milestone archive"))+'</a></div>';return;
 }
 let obligations=items.flatMap(a=>a.commitments.map(c=>({a,c,status:psEvidenceState(c.observations)})));
 const countBy=s=>obligations.filter(x=>x.status===s).length;
 const filters=[["all",psT("Όλα","All")],["observed",psT("Ιστορικές ενέργειες","Historical actions")],["pledged",psT("Μόνο δεσμεύσεις","Pledges")],["interrupted",psT("Διακοπές","Interruptions")],["missing",psT("Χωρίς έλεγχο","Unverified")]];
 const shown=obligations.filter(x=>PAX_RESEARCH.filter==="all"||x.status===PAX_RESEARCH.filter||
   (PAX_RESEARCH.filter==="missing"&&x.status==="limitation"));
 root.innerHTML=header+
  '<div class="pax-study-rail">'+
  '<div><strong>'+obligations.length+'</strong><span>'+psE(psT("καταγεγραμμένες δεσμεύσεις","listed commitments"))+'</span></div>'+
  '<div><strong>'+countBy("observed")+'</strong><span>'+psE(psT("με πρόσφατο ιστορικό τεκμήριο εφαρμογής","whose latest archival record documents action"))+'</span></div>'+
  '<div><strong>'+countBy("interrupted")+'</strong><span>'+psE(psT("με τεκμηριωμένη μεταγενέστερη διακοπή","with documented later interruption"))+'</span></div>'+
  '</div><div class="pax-study-filters">'+filters.map(([v,t])=>'<button type="button" data-commit-filter="'+v+'" aria-pressed="'+(PAX_RESEARCH.filter===v)+'" class="'+(PAX_RESEARCH.filter===v?"active":"")+'">'+psE(t)+'</button>').join("")+'</div>'+
  (shown.length?shown.map(({a,c,status})=>{
   return '<article class="pax-study-obligation"><div class="pax-study-obligation-head">'+
    '<div><span class="pax-study-kicker">'+psE(psLang(a.title))+' · '+psE(a.signed)+'</span><h4>'+psE(psLang({el:c.el,en:c.en}))+'</h4>'+
    '<span class="pax-study-state s-'+psE(status)+'">'+psE(psStatusLabel(status))+'</span></div>'+
    psAnchor(c.promiseSource,psT("Αρχική δέσμευση","Original commitment"))+'</div>'+
    '<p class="pax-study-scope">'+psE(psLang(a.scope))+'</p>'+
    (c.observations.length?'<ol class="pax-study-evidence">'+c.observations.map(ev=>'<li><span class="pax-study-evidence-kind">'+psE(psStatusLabel(psEvidenceState([ev])))+'</span><div>'+psSourceLabel(ev)+'</div></li>').join("")+'</ol>':
     '<div class="pax-study-unverified">'+psE(psT("Δεν έχει προστεθεί επαληθευμένο αποτέλεσμα στο αρχείο. Δεν επιτρέπεται να συμπεράνουμε ότι εφαρμόστηκε ή παραβιάστηκε.","No verified outcome has been added. Neither implementation nor violation can be inferred."))+'</div>')+
    '</article>';
  }).join(""):'<p class="pax-study-message">'+psE(psT("Δεν υπάρχουν καταχωρίσεις για αυτό το φίλτρο.","No records match this filter."))+'</p>')+
 '<p class="pax-study-caution">'+psE(psT("Οι κατηγορίες περιγράφουν αποκλειστικά το τελευταίο χρονολογημένο τεκμήριο που έχουμε καταχωρίσει για κάθε δέσμευση. «Ιστορικά τεκμηριωμένη» δεν σημαίνει «σε ισχύ τώρα». Μη αναγνωσμένες ή μη καταχωρισμένες πηγές δεν μετρώνται.","Statuses refer only to the last dated evidence we have entered for each obligation. Historically documented does not mean currently in force. Unreviewed or missing sources are not counted."))+'</p>';
 root.querySelectorAll("[data-commit-filter]").forEach(b=>b.addEventListener("click",()=>{PAX_RESEARCH.filter=b.dataset.commitFilter;psComplianceRender()}));
}
function psCaseList(){
 const list=PAX_RESEARCH.comparative.cases;
 const chosen=list.filter(c=>PAX_RESEARCH.family==="all"||c.family===PAX_RESEARCH.family);
 return chosen.length?chosen:list;
}
function psFeatureValue(key){
 const labels={
 documented:[ "Στο κείμενο / τεκμήρια","Documented in sources"],
 not_classified:[ "Δεν κωδικοποιήθηκε","Not coded"],
 planned_not_verified:[ "Σχεδιάστηκε, μη επαληθευμένο","Planned, not verified"],
 outside_scope:[ "Εκτός αντικειμένου","Outside scope"]
 };
 return labels[key]?.[paxLang()==="en"?1:0]||"—";
}
function psCompareCard(c){
 const evs=[...c.events].sort((a,b)=>a.date.localeCompare(b.date)),dur=evs.length>1?psDayDiff(c.anchor,evs[evs.length-1].date):null;
 return '<article class="pax-study-case"><header><span class="pax-study-kicker">'+psE(c.family.toUpperCase())+' · '+psE(c.anchor)+'</span>'+
  '<h4>'+psE(psLang(c.title))+'</h4><p>'+psE(psLang(c.summary))+'</p>'+
  psAnchor(c.reference.url,c.reference.name)+'</header>'+
  '<div class="pax-study-case-events">'+evs.map(ev=>{
    const offset=psDayDiff(c.anchor,ev.date),delta=(offset>0?"+":"")+offset;
    return '<div class="pax-study-event"><span class="pax-study-event-offset">'+psE(delta)+'d</span>'+
      '<div><b>'+psE(ev.date)+'</b><p>'+psE(psLang(ev))+'</p>'+psAnchor(ev.url,ev.source)+'</div></div>';
  }).join("")+'</div>'+
  '<p class="pax-study-case-note">'+psE(psLang(c.caution))+'</p></article>';
}
function psComparisonRender(){
 const root=document.getElementById("paxHistoricalCompare");if(!root)return;
 if(!PAX_RESEARCH.loaded){psLoading(root);return}
 const data=PAX_RESEARCH.comparative,all=data.cases,items=psCaseList();
 let A=all.find(x=>x.id===PAX_RESEARCH.compareA),B=all.find(x=>x.id===PAX_RESEARCH.compareB);
 if(!A||!B){A=all[0];B=all[1];PAX_RESEARCH.compareA=A.id;PAX_RESEARCH.compareB=B.id}
 const families=[["all",psT("Όλα","All")],["comprehensive",psT("Συνολικές","Comprehensive")],["cessation",psT("Εκεχειρίες","Ceasefires")],["humanitarian",psT("Ανθρωπιστικές","Humanitarian")],["limited",psT("Περιορισμένες","Limited")]];
 const option=c=>'<option value="'+psE(c.id)+'">'+psE(psLang(c.title))+'</option>';
 root.innerHTML='<div class="pax-study-head"><div><span class="pax-study-kicker">PAX / HISTORICAL PROCESS LAB</span>'+
  '<h3>'+psE(psT("Ιστορικές διαπραγματεύσεις σε σύγκριση","Compare historical peace processes"))+'</h3><p>'+
  psE(psT("Πραγματικές ημερομηνίες και δημοσιευμένες διατάξεις από πρωτογενείς ή θεσμικές πηγές. Όχι προβλέψεις, ούτε κατάταξη «επιτυχίας».","Observed dates and published provisions from primary or institutional sources. No forecasts or invented success ranking."))+
  '</p></div><span class="pax-study-asof">'+psE(psT("Περιπτώσεις","Cases"))+' '+all.length+' · '+psE(data.curatedAt)+'</span></div>'+
 '<div class="pax-study-filters">'+families.map(([v,t])=>'<button type="button" data-study-family="'+v+'" aria-pressed="'+(PAX_RESEARCH.family===v)+'" class="'+(PAX_RESEARCH.family===v?"active":"")+'">'+psE(t)+'</button>').join("")+'</div>'+
 '<div class="pax-study-gallery">'+items.map(c=>'<button type="button" data-choose-case="'+psE(c.id)+'" class="'+(c.id===A.id||c.id===B.id?"active":"")+'"><span>'+psE(psLang(c.title))+'</span><small>'+psE(c.anchor)+' · '+psE(c.family)+'</small></button>').join("")+'</div>'+
 '<div class="pax-study-pickers"><label>'+psE(psT("Περίπτωση Α","Case A"))+'<select id="paxCaseA">'+all.map(option).join("")+'</select></label>'+
 '<button type="button" id="paxSwapCases" title="'+psE(psT("Αντιστροφή","Swap cases"))+'">⇄</button>'+
 '<label>'+psE(psT("Περίπτωση Β","Case B"))+'<select id="paxCaseB">'+all.map(option).join("")+'</select></label></div>'+
 '<div class="pax-study-two">'+psCompareCard(A)+psCompareCard(B)+'</div>'+
 '<div class="pax-study-matrix"><h4>'+psE(psT("Μήτρα διατάξεων και μηχανισμών","Provisions & mechanisms matrix"))+'</h4>'+
 '<p>'+psE(psT("«Δεν κωδικοποιήθηκε» δεν σημαίνει ότι απουσιάζει από τη συμφωνία. Δείχνουμε μόνο ό,τι τεκμηριώνει το επιλεγμένο πρωτογενές υλικό.","Not coded does not mean absent. Only aspects evidenced in the selected source material are classified."))+'</p>'+
 '<div class="pax-study-tablewrap"><table><thead><tr><th>'+psE(psT("Διάσταση","Dimension"))+'</th><th>'+psE(psLang(A.title))+'</th><th>'+psE(psLang(B.title))+'</th></tr></thead><tbody>'+
 Object.entries(data.features).map(([key,label])=>'<tr><th>'+psE(psLang(label))+'</th><td>'+psE(psFeatureValue(A.features[key]))+'</td><td>'+psE(psFeatureValue(B.features[key]))+'</td></tr>').join("")+
 '</tbody></table></div></div>'+
 '<p class="pax-study-caution">'+psE(psT("Οι χρονικές διαφορές (+/− ημέρες) μετρώνται από τη συμβατική ημερομηνία αναφοράς κάθε περίπτωσης. Διαφορετικά γεγονότα δεν είναι συγκρίσιμα ως «ρυθμός επίτευξης ειρήνης». Καμία πρόβλεψη για τρέχουσες συγκρούσεις.","Day offsets are measured from each case's chosen anchor date. Different milestone types are not comparable as a peace-speed metric. No prediction for current conflicts."))+'</p>';
 root.querySelector("#paxCaseA").value=A.id;root.querySelector("#paxCaseB").value=B.id;
 root.querySelector("#paxCaseA").addEventListener("change",e=>{PAX_RESEARCH.compareA=e.target.value;psComparisonRender()});
 root.querySelector("#paxCaseB").addEventListener("change",e=>{PAX_RESEARCH.compareB=e.target.value;psComparisonRender()});
 root.querySelector("#paxSwapCases").addEventListener("click",()=>{const x=PAX_RESEARCH.compareA;PAX_RESEARCH.compareA=PAX_RESEARCH.compareB;PAX_RESEARCH.compareB=x;psComparisonRender()});
 root.querySelectorAll("[data-study-family]").forEach(b=>b.addEventListener("click",()=>{PAX_RESEARCH.family=b.dataset.studyFamily;psComparisonRender()}));
 root.querySelectorAll("[data-choose-case]").forEach(b=>b.addEventListener("click",()=>{PAX_RESEARCH.compareB=b.dataset.chooseCase;psComparisonRender()}));
}
function psRenderAll(){psComplianceRender();psComparisonRender()}
function psMaybeLoad(){
 if(typeof PAX_VIEW==="undefined")return;
 if((PAX_VIEW.view==="conflict"&&PAX_VIEW.sub==="process")||PAX_VIEW.view==="tools")psLoadResearch();
}
function paxStudyInit(){
 document.addEventListener("pax:view",()=>{psMaybeLoad();if(PAX_RESEARCH.loaded)psRenderAll()});
 document.addEventListener("pax:selection",()=>{if(PAX_RESEARCH.loaded)psComplianceRender()});
 document.addEventListener("pax:language",()=>{if(PAX_RESEARCH.loaded)psRenderAll()});
 psMaybeLoad();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",paxStudyInit);else paxStudyInit();
