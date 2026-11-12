/* PAX / Peace Signals. Distinguishes reports from verified actions.
   These are source-linked title groups, not incident counts or a probability of peace. */
"use strict";
const PAX_SIGNAL_DAYS=7;
const paxSigT=(gr,en)=>paxLang()==="en"?en:gr;
function paxSignalGroups(){
 const row=state.rows[state.selected],now=Date.now(),cutoff=now-PAX_SIGNAL_DAYS*86400000;
 const articles=(row?.articles||[]).filter(a=>{
  const t=Date.parse(a.publishedAt);
  return Number.isFinite(t)&&t>=cutoff&&t<=now+3600000;
 });
 if(typeof PAX_INTEL!=="undefined"&&typeof PAX_INTEL.cluster==="function")
  return PAX_INTEL.cluster(articles);
 return articles.map(a=>({lead:a,articles:[a],publishers:[a.source]}));
}
function paxSignalLink(article){
 if(!article?.url||!/^https:\/\//i.test(article.url))return "";
 return '<a href="'+esc(validLink(article.url))+'" target="_blank" rel="noopener noreferrer">'+esc(article.title||"—")+
  '</a><small>'+esc(article.source||"—")+' · '+esc(timeLocal(article.publishedAt))+'</small>';
}
function paxSignalBox(name,count,items,note){
 const links=items.slice(0,2).map(g=>paxSignalLink(g.lead)).filter(Boolean);
 return '<article class="pax-signal-card"><div class="pax-signal-label">'+esc(name)+'</div>'+
  '<strong class="pax-signal-number">'+(count===null?"—":count)+'</strong>'+
  '<p>'+esc(note)+'</p><div class="pax-signal-links">'+
  (links.length?links.join(""):'<span class="pax-signal-empty">'+esc(paxSigT("Δεν υπάρχουν διαθέσιμοι σχετικοί τίτλοι.","No matching headlines available."))+'</span>')+
  '</div></article>';
}
function paxSignalsRender(){
 const root=document.getElementById("peaceSignals");if(!root)return;
 const region=REGIONS.find(r=>r.id===state.selected);
 if(!region)return;
 const row=state.rows[region.id],loaded=!!row&&!row.error,groups=paxSignalGroups();
 const diplomacy=groups.filter(g=>["talks","proposal"].includes(g.lead.type));
 const implementation=groups.filter(g=>["ceasefire","implemented"].includes(g.lead.type));
 const intensity=groups.filter(g=>g.lead.type==="setback");
 const number=arr=>loaded?arr.length:null;
 const start=typeof paxConflictStart==="function"?paxConflictStart(region.id):"";
 const today=new Date().toISOString().slice(0,10);
 const records=(typeof paxProcessRecords==="function"?paxProcessRecords(region.id):[])
  .filter(x=>x.date<=today&&(!start||x.date>=start));
 const latest=records[0];
 const archive=latest?'<div class="pax-signal-archive"><span>'+esc(paxSigT("ΤΕΛΕΥΤΑΙΟ ΕΠΙΛΕΓΜΕΝΟ ΙΣΤΟΡΙΚΟ ΟΡΟΣΗΜΟ","LATEST CURATED HISTORICAL MILESTONE"))+
  '</span><strong>'+esc(latest.date)+' · '+esc(latest.title)+'</strong><p>'+esc(latest.detail||"")+
  '</p><a href="'+esc(validLink(latest.url))+'" target="_blank" rel="noopener noreferrer">'+esc(latest.source||paxSigT("Πηγή","Source"))+'</a></div>':
  '<p class="pax-signal-empty">'+esc(paxSigT("Δεν υπάρχει καταχωρισμένο ιστορικό ορόσημο για αυτή τη φάση.","No historical milestone recorded for this monitored phase."))+'</p>';
 root.innerHTML='<div class="section-heading"><div><span class="kicker">PAX / PEACE SIGNALS</span><h2>'+
  paxSigT('ΤΙ ΔΕΙΧΝΟΥΝ ΤΑ <span>ΣΤΟΙΧΕΙΑ.</span>','WHAT THE <span>SIGNALS SAY.</span>')+
  '</h2></div><p>'+esc(paxSigT("Τρεις χωριστές διαστάσεις δημοσιευμάτων για τις τελευταίες 7 ημέρες. Καμία δεν ισοδυναμεί με πιθανότητα ειρήνης.","Three separate dimensions of reporting over the past seven days. None measures the probability of peace."))+'</p></div>'+
  '<div class="pax-signals-meta">'+esc(region.name)+' · '+esc(paxSigT("Τελευταίες 7 ημέρες","Last 7 days"))+
  ' · '+esc(loaded?paxSigT(groups.length+" ομάδες τίτλων",""+groups.length+" headline groups"):paxSigT("Προσωρινά μη διαθέσιμα δεδομένα","Data temporarily unavailable"))+'</div>'+
  '<div class="pax-signals-grid">'+
  paxSignalBox(paxSigT("ΔΙΠΛΩΜΑΤΙΑ / ΠΡΟΤΑΣΕΙΣ","DIPLOMACY / PROPOSALS"),number(diplomacy),diplomacy,
   paxSigT("Ομάδες τίτλων που αναφέρονται σε συνομιλίες ή προτάσεις.","Headline groups referring to talks or proposals."))+
  paxSignalBox(paxSigT("ΣΥΜΦΩΝΙΕΣ / ΕΦΑΡΜΟΓΗ","AGREEMENTS / IMPLEMENTATION"),number(implementation),implementation,
   paxSigT("Αναφορές συμφωνίας ή εφαρμογής, χωρίς επαλήθευση συμμόρφωσης.","Reported agreements or steps, not verified compliance."))+
  paxSignalBox(paxSigT("ΚΛΙΜΑΚΩΣΗ / ΕΜΠΟΔΙΑ","ESCALATION / OBSTACLES"),number(intensity),intensity,
   paxSigT("Τίτλοι για επιθέσεις, παραβιάσεις ή αδιέξοδα.","Headlines about attacks, violations or breakdowns."))+
  '</div>'+
  '<div class="pax-signal-bottom"><div><div class="pax-signal-bottom-label">'+esc(paxSigT("ΑΡΧΕΙΟ ΔΙΑΠΡΑΓΜΑΤΕΥΣΕΩΝ","NEGOTIATION ARCHIVE"))+'</div>'+
  archive+'<a class="pax-signal-route" href="#/conflict/'+esc(region.id)+'/process">'+esc(paxSigT("Προβολή τεκμηριωμένης διαδικασίας","See the sourced peace-process timeline"))+'</a></div>'+
  '<div><div class="pax-signal-bottom-label">'+esc(paxSigT("ΤΙ ΠΡΕΠΕΙ ΝΑ ΕΛΕΓΧΘΕΙ","WHAT TO VERIFY NEXT"))+'</div>'+
  '<p>'+esc(paxSigT("Υπάρχει πρωτογενής ανακοίνωση; Η πρόταση έγινε συμφωνία; Υπάρχουν ανεξάρτητα στοιχεία εφαρμογής; Μειώθηκαν οι επιθέσεις στο πεδίο;","Is there a primary statement? Did a proposal become an agreement? Is implementation independently evidenced? Did violence on the ground decrease?"))+'</p>'+
  '<a class="pax-signal-route" href="#/conflict/'+esc(region.id)+'/game">'+esc(paxSigT("Δες το εμπειρικό παίγνιο","Explore the empirical game"))+'</a></div></div>'+
  '<p class="pax-signal-disclaimer">'+esc(paxSigT("Οι αριθμοί μετρούν ομάδες δημοσιευμένων τίτλων, όχι επιβεβαιωμένα περιστατικά. Το ιστορικό ορόσημο είναι αρχειακή καταχώριση και δεν αποδεικνύει σημερινή εφαρμογή. Η απουσία τίτλων δεν σημαίνει απουσία γεγονότων.","Counts refer to grouped published headlines, not confirmed events. The historical entry is archival, not evidence of current implementation. Missing coverage does not mean nothing happened."))+'</p>';
}
function paxSignalsInit(){
 const root=document.getElementById("peaceSignals");if(!root)return;
 document.addEventListener("pax:progress",paxSignalsRender);
 document.addEventListener("pax:selection",paxSignalsRender);
 document.addEventListener("pax:data",paxSignalsRender);
 document.addEventListener("pax:language",paxSignalsRender);
 paxSignalsRender();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",paxSignalsInit);
else paxSignalsInit();
