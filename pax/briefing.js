/* PAX DAILY BRIEF: coverage-based changes, never an inferred ground-truth event count. */
const PAX_BRIEF={scope:"all",window:24};
const paxBriefCopy=(el,en)=>paxLang()==="en"?en:el;
function paxBriefGroups(){
 const now=Date.now(),range=PAX_BRIEF.window*3600000;
 const regions=PAX_BRIEF.scope==="all"?REGIONS:REGIONS.filter(r=>r.id===state.selected);
 const groups=[];
 for(const region of regions){
  const articles=(state.rows[region.id]?.articles||[]).filter(a=>{
   const t=Date.parse(a.publishedAt);return Number.isFinite(t)&&t>=now-2*range&&t<=now+3600000;
  });
  const clustered=typeof PAX_INTEL!=="undefined"?PAX_INTEL.cluster(articles):
   articles.map(a=>({lead:a,articles:[a],publishers:[a.source]}));
  for(const group of clustered)groups.push({...group,region});
 }
 groups.sort((a,b)=>Date.parse(b.lead.publishedAt)-Date.parse(a.lead.publishedAt));
 return {current:groups.filter(g=>Date.parse(g.lead.publishedAt)>=now-range),
  previous:groups.filter(g=>Date.parse(g.lead.publishedAt)<now-range),
  loaded:regions.filter(r=>state.rows[r.id]&&!state.rows[r.id].error).length,
  total:regions.length};
}
function paxBriefCategory(type){
 if(type==="setback")return"escalation";
 if(["ceasefire","implemented","talks","proposal"].includes(type))return"diplomacy";
 return"context";
}
function paxBriefRender(){
 const root=$("briefing");if(!root)return;
 const en=paxLang()==="en",data=paxBriefGroups(),groups=data.current;
 const counts={diplomacy:0,escalation:0,context:0};
 groups.forEach(g=>counts[paxBriefCategory(g.lead.type)]++);
 const n=groups.length,old=data.previous.length;
 $("briefCoverage").textContent=paxBriefCopy(
  data.loaded+" / "+data.total+" φάκελοι με διαθέσιμα δεδομένα",
  data.loaded+" / "+data.total+" conflict files with available data");
 $("briefNow").textContent=n;
 $("briefDiplomacy").textContent=counts.diplomacy;
 $("briefEscalation").textContent=counts.escalation;
 $("briefContext").textContent=counts.context;
 $("briefComparison").textContent=old>0?
  paxBriefCopy("Δημοσιεύματα: "+n+" ομάδες τίτλων στο επιλεγμένο παράθυρο, έναντι "+old+" στο προηγούμενο αντίστοιχο διάστημα. Η διαφορά αφορά ειδησεογραφική κάλυψη, όχι αριθμό πραγματικών γεγονότων.",
  "Reporting: "+n+" headline clusters in the chosen window versus "+old+" in the preceding equal-length window. This measures coverage, not actual events."):
  paxBriefCopy("Δεν υπάρχει επαρκές προηγούμενο δείγμα για αξιόπιστη σύγκριση όγκου δημοσιεύσεων.",
  "Insufficient prior-window reporting for a meaningful coverage comparison.");
 const lead=groups.filter(g=>g.lead.type!=="other").slice(0,6);
 if(lead.length<4)lead.push(...groups.filter(g=>g.lead.type==="other").slice(0,6-lead.length));
 $("briefStories").innerHTML=lead.length?lead.slice(0,6).map(g=>{
  const a=g.lead,kind=paxBriefCategory(a.type),label=kind==="diplomacy"?(en?"DIPLOMATIC REPORT":"ΔΙΠΛΩΜΑΤΙΚΗ ΑΝΑΦΟΡΑ"):
   kind==="escalation"?(en?"ESCALATION REPORT":"ΑΝΑΦΟΡΑ ΚΛΙΜΑΚΩΣΗΣ"):(en?"CONTEXT":"ΠΛΑΙΣΙΟ");
  const extra=g.publishers.length>1?(en?" · "+g.publishers.length+" publishers":" · "+g.publishers.length+" εκδότες"):"";
  return '<article class="pax-brief-story"><div class="pax-brief-meta"><span class="pax-brief-tag '+kind+'">'+label+'</span><span>'+esc(g.region.name)+'</span></div>'+
   '<a href="'+esc(validLink(a.url))+'" target="_blank" rel="noopener noreferrer">'+esc(a.title)+'</a>'+
   '<div class="pax-brief-byline">'+esc(a.source||"—")+extra+' · '+esc(timeLocal(a.publishedAt))+'</div></article>';
 }).join(""):'<div class="pax-desk-empty">'+(state.loading?
  paxBriefCopy("Ανακτώνται οι πρώτες ειδήσεις. Η σελίδα λειτουργεί ενώ ενημερώνονται οι πηγές.",
   "Retrieving first headlines. The interface remains available while sources load."):
  paxBriefCopy("Δεν ανακτήθηκαν δημοσιεύματα στο επιλεγμένο διάστημα. Αυτό δεν σημαίνει ότι δεν υπήρξαν εξελίξεις.",
   "No reports retrieved for this period. This does not mean that no events occurred."))+'</div>';
 root.querySelectorAll("[data-brief-hours]").forEach(b=>{
  b.classList.toggle("active",Number(b.dataset.briefHours)===PAX_BRIEF.window);
  b.setAttribute("aria-pressed",String(Number(b.dataset.briefHours)===PAX_BRIEF.window));
 });
 root.querySelectorAll("[data-brief-scope]").forEach(b=>{
  b.classList.toggle("active",b.dataset.briefScope===PAX_BRIEF.scope);
  b.setAttribute("aria-pressed",String(b.dataset.briefScope===PAX_BRIEF.scope));
 });
 const picker=$("briefRegionSelect");if(picker)picker.value=state.selected;
 $("briefRangeText").textContent=paxBriefCopy("Τελευταίες "+PAX_BRIEF.window+" ώρες","Last "+PAX_BRIEF.window+" hours");
}
function paxBriefInit(){
 const root=$("briefing");if(!root)return;
 const picker=$("briefRegionSelect");
 picker.innerHTML=REGIONS.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.name)+'</option>').join("");
 picker.value=state.selected;
 picker.addEventListener("change",e=>{PAX_BRIEF.scope="selected";setSelected(e.target.value,false)});
  root.addEventListener("click",e=>{
  const hours=e.target.closest("[data-brief-hours]"),scope=e.target.closest("[data-brief-scope]");
  if(hours)PAX_BRIEF.window=Number(hours.dataset.briefHours);
  if(scope)PAX_BRIEF.scope=scope.dataset.briefScope;
  if(hours||scope)paxBriefRender();
 });
 for(const type of ["pax:progress","pax:data","pax:selection","pax:language"])
  document.addEventListener(type,paxBriefRender);
 paxBriefRender();
}
paxBriefInit();
