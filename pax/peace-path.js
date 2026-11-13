/* PAX Peace Path. Historic source-linked milestones; NOT a forecast or proximity percentage. */
"use strict";
const PAX_PATH_STEPS=[
 ["talks","Διπλωματικές επαφές","Diplomatic talks","Επαληθευμένες επαφές ή διαπραγματεύσεις","Documented meetings or talks"],
 ["proposal","Συγκεκριμένη πρόταση","Published proposal","Δημοσιευμένο σχέδιο ή πλαίσιο","Published plan or framework"],
 ["agreement","Επίσημη συμφωνία","Formal agreement","Υπογραφή, όχι απαραίτητα εφαρμογή","Signing, not necessarily implementation"],
 ["implemented","Τεκμηριωμένη πράξη εφαρμογής","Recorded implementation","Χρονολογημένη αναφορά πράξης","Dated report of actual action"],
 [null,"Διατηρήσιμη μείωση βίας","Sustained decline in violence","Απαιτούνται ανεξάρτητα διαχρονικά δεδομένα","Requires independent longitudinal violence data"]
];
const paxPathT=(el,en)=>paxLang()==="en"?en:el;

/* An auditable archival evidence count, NOT a peace forecast or a live ceasefire score. */
const PAX_PATH_REVIEW_DAYS=90;
function paxPathSummary(region){
 const today=new Date().toISOString().slice(0,10);
 const records=(typeof paxProcessRecords==="function"?paxProcessRecords(region):[])
   .filter(x=>x&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&x.date<=today)
   .sort((a,b)=>b.date.localeCompare(a.date));
 const stages=PAX_PATH_STEPS.map(([kind])=>kind?records.find(x=>x.type===kind):null);
 const confirmed=stages.filter(Boolean).length;
 const latest=records[0]||null;
 const age=latest?Math.max(0,Math.floor((Date.now()-Date.parse(latest.date+"T12:00:00Z"))/86400000)):null;
 const latestSetback=records.find(x=>x.type==="setback");
 const lastAgreement=records.find(x=>x.type==="agreement");
 const setback=!!(latestSetback&&lastAgreement&&latestSetback.date>lastAgreement.date);
 return {region,records,stages,confirmed,latest,age,stale:age===null||age>PAX_PATH_REVIEW_DAYS,setback};
}
function paxPathIndexHero(info,compact=false){
 const label=paxPathT("ΔΕΙΚΤΗΣ ΕΙΡΗΝΗΣ","PEACE INDEX");
 const sub=paxPathT("Τεκμηρίωση ειρηνευτικής διαδικασίας","Documented peace-process stages");
 const archive=paxPathT("Ιστορικά καταγεγραμμένα στάδια","Historically recorded stages");
 const fresh=info.stale
  ?paxPathT("Μη επαρκώς πρόσφατα δεδομένα","No sufficiently recent evidence")
  :paxPathT("Υπάρχει πρόσφατη καταχώριση· όχι επαληθευμένη ειρήνη","Recent entry exists; peace not independently verified");
 const blocked=info.setback
  ?paxPathT("Υπάρχει καταγεγραμμένη μεταγενέστερη ανατροπή συμφωνίας","A later agreement setback is on record")
  :paxPathT("Η εφαρμογή και η μείωση βίας απαιτούν χωριστή επαλήθευση","Implementation and violence reduction need separate verification");
 const ring='<div class="pax-index-ring" style="--pax-index-pct:'+((info.confirmed/5)*100)+'%"><div class="pax-index-ring-inner"><b>'+info.confirmed+'<small>/5</small></b><span>'+paxPathT("στάδια","stages")+'</span></div></div>';
 return '<div class="pax-index-hero'+(compact?" compact":"")+'"><div class="pax-index-copy"><span class="pax-index-eyebrow">'+label+' / '+archive+'</span><h2>'+sub+'</h2><p>'+paxPathT("Δεν είναι πιθανότητα τερματισμού του πολέμου, ούτε βαθμολογία σημερινής ασφάλειας.","This is not the probability of war ending or a live security rating.")+'</p><div class="pax-index-flags"><span class="pax-index-state '+(info.stale?"is-archival":"is-recent")+'">'+fresh+'</span><span class="pax-index-state is-note">'+blocked+'</span></div><small class="pax-index-date">'+(info.latest
 ?paxPathT("Νεότερη καταγραφή","Latest archived event")+": "+info.latest.date
 :paxPathT("Δεν υπάρχουν τεκμηριωμένες εγγραφές","No documented events in this archive"))+'</small></div>'+ring+'</div>';
}
function paxPathHomeRender(){
 const root=document.getElementById("paxPeaceIndexHome");if(!root)return;
 const current=paxPathSummary(state.selected);
 root.innerHTML='<div class="pax-index-home-intro"><div><span class="pax-index-eyebrow">PAX / PEACE INDEX</span><h2>'+paxPathT("ΔΕΙΚΤΗΣ <span>ΕΙΡΗΝΗΣ.</span>","PEACE <span>INDEX.</span>")+'</h2><p>'+paxPathT("Μετράμε τεκμηριωμένα στάδια ειρηνευτικής διαδικασίας, όχι επινοημένη πιθανότητα ειρήνης.","Documented peace-process milestones, not a fabricated chance of peace.")+'</p></div><a href="#/peace/'+state.selected+'" class="pax-index-open">'+paxPathT("ΔΕΣ ΤΗΝ ΑΝΑΛΥΣΗ","OPEN ANALYSIS")+' <span>↗</span></a></div>'+
 paxPathIndexHero(current,true)+
 '<div class="pax-index-conflict-grid" aria-label="'+paxPathT("Τεκμηριωμένα στάδια ανά σύγκρουση","Documented stages by conflict")+'">'+
 REGIONS.map(r=>{const row=paxPathSummary(r.id);
 return '<a class="pax-index-conflict'+(r.id===state.selected?" active":"")+'" href="#/peace/'+esc(r.id)+'"><span class="pax-index-conflict-name">'+esc(paxLang()==="en"&&typeof paxRegionEn==="function"?paxRegionEn(r.id):r.short)+'</span><strong>'+row.confirmed+'<small>/5</small></strong><span class="pax-index-track"><i style="width:'+((row.confirmed/5)*100)+'%"></i></span><small>'+esc(row.stale?paxPathT("ΑΡΧΕΙΑΚΟ","ARCHIVAL"):paxPathT("ΠΡΟΣΦΑΤΗ ΚΑΤΑΧΩΡΙΣΗ","RECENT RECORD"))+'</small></a>';
 }).join("")+'</div>'+
 '<div class="pax-index-home-foot">'+paxPathT("Προσοχή: 4/5 σημαίνει ότι υπάρχουν εγγραφές για 4 κατηγορίες ορόσημων, όχι ότι ένας πόλεμος είναι 80% κοντά στο τέλος. Η διατηρήσιμη μείωση βίας δεν τεκμηριώνεται από τον υπάρχοντα συλλέκτη.","Important: 4/5 means records exist for 4 milestone categories, not an 80% chance of war ending. The current data collector does not independently establish sustained violence reduction.")+'</div>';
}

function paxPathRender(){
 const root=document.getElementById("paxPeacePath");if(!root)return;
 const records=typeof paxProcessRecords==="function"?paxProcessRecords(state.selected):[];
 const today=new Date().toISOString().slice(0,10);
 const valid=records.filter(x=>x.date<=today).sort((a,b)=>b.date.localeCompare(a.date));
 const latest=valid[0],agreement=valid.find(x=>x.type==="agreement"),
  setback=valid.find(x=>x.type==="setback");
 const overturned=agreement&&setback&&setback.date>agreement.date;
 const aged=latest&&Math.floor((Date.now()-Date.parse(latest.date+"T12:00:00Z"))/86400000)>90;
 root.innerHTML=paxPathIndexHero(paxPathSummary(state.selected))+'<div class="pax-path-heading"><div><span class="pax-study-kicker">PEACE PATH / EVIDENCE GATES</span><h3>'+esc(paxPathT("Πόσο κοντά στην ειρήνη;","How close to peace?"))+'</h3><p>'+esc(paxPathT("Τι έχει καταγραφεί από τη διαπραγμάτευση ως την πράξη — όχι αυθαίρετο 78% ειρήνης.","Which necessary stages have documentary evidence — not an invented 78% chance of peace."))+'</p></div><span class="pax-path-asof">'+esc(paxPathT("Επιλεκτικό ιστορικό αρχείο","Selective historical record"))+'</span></div>'+
 '<div class="pax-path-steps">'+PAX_PATH_STEPS.map(([kind,el,en,del,den],i)=>{
  const e=kind?valid.find(x=>x.type===kind):null;
  return '<article class="pax-path-step '+(e?"has-evidence":"no-evidence")+'"><span class="pax-path-index">0'+(i+1)+'</span><b>'+esc(paxPathT(el,en))+'</b><span class="pax-path-status">'+esc(e?paxPathT("Ιστορικό τεκμήριο","Historical evidence"):paxPathT("Δεν τεκμηριώθηκε","Not verified"))+'</span><p>'+esc(paxPathT(del,den))+'</p>'+(e?'<small>'+esc(e.date)+' · '+esc(e.title)+'</small>':'')+'</article>';
 }).join("")+'</div><div class="pax-path-context"><div><b>'+esc(latest?paxPathT("Τελευταίο καταχωρισμένο ορόσημο","Most recent recorded milestone")+": "+latest.date:paxPathT("Χωρίς καταχωρισμένο ορόσημο","No recorded milestone"))+'</b><p>'+esc(latest?.title||paxPathT("Δεν υπάρχουν επαρκή δεδομένα.","Insufficient data."))+'</p><p>'+esc(overturned?paxPathT("Καταγράφηκε μεταγενέστερη ανατροπή της συμφωνίας.","A subsequent setback was recorded after the agreement."):aged?paxPathT("Το τελευταίο τεκμήριο είναι παλαιότερο των 90 ημερών.","The newest source record is over 90 days old."):paxPathT("Προηγούμενα στάδια δεν αποδεικνύουν τη σημερινή κατάστασή τους.","Past milestones do not establish current validity."))+'</p></div><a href="#/conflict/'+esc(state.selected)+'/process">'+esc(paxPathT("Αρχείο τεκμηρίων","Source ledger"))+'</a></div><p class="pax-path-caveat">'+esc(paxPathT("Δεν υπολογίζεται συνολική βαθμολογία ή πιθανότητα ειρήνης. Οι ενδείξεις είναι επιλεκτικά χρονολογημένα γεγονότα, όχι πλήρες αρχείο και όχι αξιολόγηση της τρέχουσας εκεχειρίας. Το στάδιο «διατηρήσιμη μείωση βίας» δεν επιβεβαιώνεται από τίτλους ειδήσεων.","No composite score or peace probability is calculated. These are selected dated records, not an exhaustive archive or a current ceasefire assessment. Sustained violence reduction cannot be verified from headlines."))+'</p>';
}
function paxPathInit(){
 if(!document.getElementById("paxPeacePath"))return;
 ["pax:view","pax:selection","pax:language","pax:data"].forEach(e=>document.addEventListener(e,()=>{paxPathRender();paxPathHomeRender()}));
 paxPathRender();paxPathHomeRender();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",paxPathInit);else paxPathInit();