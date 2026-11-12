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
function paxPathRender(){
 const root=document.getElementById("paxPeacePath");if(!root)return;
 const records=typeof paxProcessRecords==="function"?paxProcessRecords(state.selected):[];
 const today=new Date().toISOString().slice(0,10);
 const valid=records.filter(x=>x.date<=today).sort((a,b)=>b.date.localeCompare(a.date));
 const latest=valid[0],agreement=valid.find(x=>x.type==="agreement"),
  setback=valid.find(x=>x.type==="setback");
 const overturned=agreement&&setback&&setback.date>agreement.date;
 const aged=latest&&Math.floor((Date.now()-Date.parse(latest.date+"T12:00:00Z"))/86400000)>90;
 root.innerHTML='<div class="pax-path-heading"><div><span class="pax-study-kicker">PEACE PATH / EVIDENCE GATES</span><h3>'+esc(paxPathT("Πόσο κοντά στην ειρήνη;","How close to peace?"))+'</h3><p>'+esc(paxPathT("Τι έχει καταγραφεί από τη διαπραγμάτευση ως την πράξη — όχι αυθαίρετο 78% ειρήνης.","Which necessary stages have documentary evidence — not an invented 78% chance of peace."))+'</p></div><span class="pax-path-asof">'+esc(paxPathT("Επιλεκτικό ιστορικό αρχείο","Selective historical record"))+'</span></div>'+
 '<div class="pax-path-steps">'+PAX_PATH_STEPS.map(([kind,el,en,del,den],i)=>{
  const e=kind?valid.find(x=>x.type===kind):null;
  return '<article class="pax-path-step '+(e?"has-evidence":"no-evidence")+'"><span class="pax-path-index">0'+(i+1)+'</span><b>'+esc(paxPathT(el,en))+'</b><span class="pax-path-status">'+esc(e?paxPathT("Ιστορικό τεκμήριο","Historical evidence"):paxPathT("Δεν τεκμηριώθηκε","Not verified"))+'</span><p>'+esc(paxPathT(del,den))+'</p>'+(e?'<small>'+esc(e.date)+' · '+esc(e.title)+'</small>':'')+'</article>';
 }).join("")+'</div><div class="pax-path-context"><div><b>'+esc(latest?paxPathT("Τελευταίο καταχωρισμένο ορόσημο","Most recent recorded milestone")+": "+latest.date:paxPathT("Χωρίς καταχωρισμένο ορόσημο","No recorded milestone"))+'</b><p>'+esc(latest?.title||paxPathT("Δεν υπάρχουν επαρκή δεδομένα.","Insufficient data."))+'</p><p>'+esc(overturned?paxPathT("Καταγράφηκε μεταγενέστερη ανατροπή της συμφωνίας.","A subsequent setback was recorded after the agreement."):aged?paxPathT("Το τελευταίο τεκμήριο είναι παλαιότερο των 90 ημερών.","The newest source record is over 90 days old."):paxPathT("Προηγούμενα στάδια δεν αποδεικνύουν τη σημερινή κατάστασή τους.","Past milestones do not establish current validity."))+'</p></div><a href="#/conflict/'+esc(state.selected)+'/process">'+esc(paxPathT("Αρχείο τεκμηρίων","Source ledger"))+'</a></div><p class="pax-path-caveat">'+esc(paxPathT("Δεν υπολογίζεται συνολική βαθμολογία ή πιθανότητα ειρήνης. Οι ενδείξεις είναι επιλεκτικά χρονολογημένα γεγονότα, όχι πλήρες αρχείο και όχι αξιολόγηση της τρέχουσας εκεχειρίας. Το στάδιο «διατηρήσιμη μείωση βίας» δεν επιβεβαιώνεται από τίτλους ειδήσεων.","No composite score or peace probability is calculated. These are selected dated records, not an exhaustive archive or a current ceasefire assessment. Sustained violence reduction cannot be verified from headlines."))+'</p>';
}
function paxPathInit(){
 if(!document.getElementById("paxPeacePath"))return;
 ["pax:view","pax:selection","pax:language","pax:data"].forEach(e=>document.addEventListener(e,paxPathRender));
 paxPathRender();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",paxPathInit);else paxPathInit();