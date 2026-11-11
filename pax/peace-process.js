/* PAX PEACE PROCESS: curated milestone ledger. It never infers present ceasefire compliance. */
const PAX_PROCESS={filter:"all",query:"",expanded:false};
const PAX_PROCESS_TYPES=["talks","proposal","agreement","implemented","setback"];
function paxProcessLang(el,en){return paxLang()==="en"?en:el}
function paxProcessRecords(region){
 const start=paxConflictStart(region);
 return PAX_MILESTONES.filter(x=>x.region===region&&x.date>=start)
  .map(x=>{
   const en=PAX_HISTORY_TRANSLATIONS[x.id]||[];
   return {...x,title:paxLang()==="en"?(x.titleEn||en[0]||x.title):x.title,
    detail:paxLang()==="en"?(x.detailEn||en[1]||x.detail):x.detail};
  }).sort((a,b)=>b.date.localeCompare(a.date));
}
function paxProcessGroup(type){
 if(type==="talks"||type==="proposal")return"talks";
 return type;
}
function paxProcessRender(){
 const root=$("process");if(!root)return;
 const en=paxLang()==="en",records=paxProcessRecords(state.selected),recent=records[0]||null;
 const region=REGIONS.find(r=>r.id===state.selected);
 $("processRegion").textContent=region?.name||"—";
 $("processRegionSelect").value=state.selected;
 $("processStart").textContent=(en?"MONITORED PHASE FROM ":"ΕΝΑΡΞΗ ΠΑΡΑΚΟΛΟΥΘΗΣΗΣ ")+
  dateLong(paxConflictStart(state.selected)+"T12:00:00Z");
 $("processCount").textContent=String(records.length).padStart(2,"0");
 const types=[
  ["talks","DIPLOMATIC CONTACT","ΕΠΑΦΕΣ / ΠΡΟΤΑΣΕΙΣ"],
  ["agreement","AGREEMENTS","ΣΥΜΦΩΝΙΕΣ"],
  ["implemented","IMPLEMENTATION REPORTS","ΑΝΑΦΟΡΕΣ ΕΦΑΡΜΟΓΗΣ"],
  ["setback","SETBACK RECORDS","ΕΜΠΟΔΙΑ / ΑΝΑΤΡΟΠΕΣ"]
 ];
 $("processStages").innerHTML=types.map(([type,titleEl,titleGr])=>{
  const count=records.filter(r=>paxProcessGroup(r.type)===type).length;
  return '<button class="pax-stage '+(PAX_PROCESS.filter===type?"active":"")+'" data-process-filter="'+type+'" type="button" aria-pressed="'+(PAX_PROCESS.filter===type)+'">'+
   '<span class="pax-stage-label">'+esc(en?titleEl:titleGr)+'</span><strong>'+count+'</strong><span class="pax-stage-bottom">'+(en?"recorded milestones":"καταγεγραμμένα ορόσημα")+'</span></button>';
 }).join("");
 if(recent){
  const days=Math.floor((Date.now()-Date.parse(recent.date+"T12:00:00Z"))/86400000),old=days>30;
  $("processLatest").innerHTML='<div class="pax-latest-kicker">'+
   (en?"MOST RECENT CATALOGUED ENTRY":"ΠΙΟ ΠΡΟΣΦΑΤΗ ΚΑΤΑΧΩΡΙΣΗ")+
   ' · '+esc(dateLong(recent.date+"T12:00:00Z"))+'</div>'+
   '<h3>'+esc(recent.title)+'</h3><p>'+esc(recent.detail)+'</p>'+
   '<a href="'+esc(validLink(recent.url))+'" target="_blank" rel="noopener noreferrer">'+esc(recent.source)+" ↗</a>"+
   '<small>'+(old?(en?"Historical record; not proof of the current peace process status.":"Ιστορική καταχώριση, όχι απόδειξη της σημερινής κατάστασης."):
    (en?"Source-linked report, not independently verified or evidence of ongoing compliance.":"Καταχώριση με πηγή· δεν αποτελεί ανεξάρτητη επαλήθευση ή απόδειξη συνεχιζόμενης εφαρμογής."))+"</small>";
 }else $("processLatest").innerHTML='<div class="pax-desk-empty">'+
  (en?"No curated record for this conflict phase.":"Δεν υπάρχει επιμελημένη καταχώριση για αυτή τη φάση.")+"</div>";
 const q=PAX_PROCESS.query.trim().toLocaleLowerCase();
 const filtered=records.filter(r=>(PAX_PROCESS.filter==="all"||paxProcessGroup(r.type)===PAX_PROCESS.filter)&&
  (!q||[r.title,r.detail,r.source,r.titleEn,r.detailEn].join(" ").toLocaleLowerCase().includes(q)));
 const displayed=PAX_PROCESS.expanded?filtered:filtered.slice(0,6);
 const labels={talks:en?"TALKS":"ΣΥΝΟΜΙΛΙΕΣ",proposal:en?"PROPOSAL":"ΠΡΟΤΑΣΗ",
  agreement:en?"AGREEMENT":"ΣΥΜΦΩΝΙΑ",implemented:en?"IMPLEMENTATION":"ΕΦΑΡΜΟΓΗ",setback:en?"SETBACK":"ΑΔΙΕΞΟΔΟ"};
 $("processRows").innerHTML=displayed.length?displayed.map(r=>
  '<article class="pax-process-row"><div class="pax-process-date">'+esc(PAX_EVENT_DATE(r))+'</div>'+
  '<div class="pax-process-copy"><div class="pax-process-type">'+esc(labels[r.type]||r.type)+'</div>'+
  '<h4>'+esc(r.title)+'</h4><p>'+esc(r.detail)+'</p>'+
  '<a href="'+esc(validLink(r.url))+'" target="_blank" rel="noopener noreferrer">'+esc(r.source||"Source")+' ↗</a></div></article>'
 ).join(""):'<div class="pax-desk-empty">'+(en?"No entries match this search or filter.":"Δεν υπάρχουν καταχωρίσεις για αυτό το φίλτρο ή την αναζήτηση.")+'</div>';
 $("processShown").textContent=filtered.length+" / "+records.length;
 const toggle=$("processMore");toggle.hidden=filtered.length<=6;
 toggle.textContent=PAX_PROCESS.expanded?(en?"SHOW LESS":"ΛΙΓΟΤΕΡΑ"):(en?"VIEW ALL MILESTONES":"ΟΛΑ ΤΑ ΟΡΟΣΗΜΑ");
 const allBtn=$("processAll");allBtn.classList.toggle("active",PAX_PROCESS.filter==="all");
 allBtn.setAttribute("aria-pressed",String(PAX_PROCESS.filter==="all"));
}
function paxProcessInit(){
 const root=$("process");if(!root)return;
 const picker=$("processRegionSelect");
 picker.innerHTML=REGIONS.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.name)+'</option>').join("");
 picker.value=state.selected;
 picker.addEventListener("change",e=>setSelected(e.target.value,false));
  root.addEventListener("click",e=>{
  const filter=e.target.closest("[data-process-filter]");
  if(filter){PAX_PROCESS.filter=filter.dataset.processFilter;PAX_PROCESS.expanded=false;paxProcessRender()}
 });
 $("processSearch").addEventListener("input",e=>{PAX_PROCESS.query=e.target.value;PAX_PROCESS.expanded=false;paxProcessRender()});
 $("processMore").addEventListener("click",()=>{PAX_PROCESS.expanded=!PAX_PROCESS.expanded;paxProcessRender()});
 document.addEventListener("pax:selection",()=>{PAX_PROCESS.expanded=false;PAX_PROCESS.filter="all";PAX_PROCESS.query="";$("processSearch").value="";paxProcessRender()});
 document.addEventListener("pax:language",paxProcessRender);
 paxProcessRender();
}
paxProcessInit();
