/* PAX TIME MACHINE — event-date replay, not a true contemporaneous archive. */
const PAX_MACHINE={date:null};
function paxMachineToday(){return PAX_TODAY()}
function paxMachineRecords(id,date){
 const onset=paxConflictStart(id);
 return PAX_MILESTONES.filter(x=>x.region===id&&x.date>=onset)
  .sort((a,b)=>a.date.localeCompare(b.date));
}
function paxMachineRender(){
 const root=$("timeMachine");if(!root)return;
 const en=paxLang()==="en",id=state.selected,onset=paxConflictStart(id),today=paxMachineToday();
 if(!PAX_MACHINE.date||PAX_MACHINE.date<onset)PAX_MACHINE.date=onset;
 if(PAX_MACHINE.date>today)PAX_MACHINE.date=today;
 const rows=paxMachineRecords(id),past=rows.filter(r=>r.date<=PAX_MACHINE.date),
 after=rows.filter(r=>r.date>PAX_MACHINE.date),
 last=past.at(-1)||null,next=after[0]||null;
 const input=$("paxMachineDate");input.min=onset;input.max=today;input.value=PAX_MACHINE.date;
 const from=Date.parse(onset+"T12:00:00Z"),to=Date.parse(today+"T12:00:00Z"),
 date=Date.parse(PAX_MACHINE.date+"T12:00:00Z"),
 pct=Math.max(0,Math.min(100,Math.round((date-from)/Math.max(1,to-from)*100)));
 $("paxMachineRange").value=pct;
 $("paxMachineRegion").textContent=REGIONS.find(r=>r.id===id)?.name||"—";
 $("paxMachineCount").textContent=String(past.length).padStart(2,"0");
 $("paxMachineAfter").textContent=String(after.length).padStart(2,"0");
 $("paxMachineAsOf").textContent=en?"EVENTS DATED BY "+PAX_DATE(PAX_MACHINE.date):
  "ΓΕΓΟΝΟΤΑ ΕΩΣ "+PAX_DATE(PAX_MACHINE.date);
 $("paxMachineCurrent").textContent=PAX_DATE(PAX_MACHINE.date);
 const localRecord=r=>{
  const pair=PAX_HISTORY_TRANSLATIONS[r.id]||[];
  return {title:en?(r.titleEn||pair[0]||r.title):r.title,
   detail:en?(r.detailEn||pair[1]||r.detail):r.detail};
 };
 const makeCard=(r,caption)=>{
  if(!r)return '<div class="pax-machine-empty">'+(en?"No milestone is indexed in this part of the selected phase.":"Δεν υπάρχει καταχωρισμένο ορόσημο στο επιλεγμένο τμήμα της περιόδου.")+"</div>";
  const copy=localRecord(r);
  return '<div class="pax-machine-story"><span>'+esc(caption)+' · '+esc(PAX_EVENT_DATE(r))+'</span>'+
   '<h4>'+esc(copy.title)+'</h4><p>'+esc(copy.detail)+'</p>'+
   '<a href="'+esc(validLink(r.url))+'" target="_blank" rel="noopener noreferrer">'+esc(r.source||"Source")+' ↗</a></div>';
 };
 $("paxMachineBeforeCard").innerHTML=makeCard(last,en?"LATEST RECORD AT SELECTED DATE":"ΤΕΛΕΥΤΑΙΑ ΚΑΤΑΧΩΡΙΣΗ ΩΣ ΤΟΤΕ");
 $("paxMachineAfterCard").innerHTML=makeCard(next,en?"NEXT DATED MILESTONE":"ΕΠΟΜΕΝΟ ΧΡΟΝΟΛΟΓΗΜΕΝΟ ΟΡΟΣΗΜΟ");
 $("paxMachineList").innerHTML=past.slice(-6).reverse().map(r=>{
  const txt=localRecord(r);
  return '<a href="'+esc(validLink(r.url))+'" target="_blank" rel="noopener noreferrer"><time>'+esc(PAX_EVENT_DATE(r))+'</time>'+
   '<span>'+esc(txt.title)+'</span><b>↗</b></a>';
 }).join("")||'<div class="pax-machine-empty">'+(en?"No earlier event is indexed.":"Δεν έχει καταχωριστεί προγενέστερο γεγονός.")+'</div>';
}
function paxMachineInit(){
 const root=$("timeMachine");if(!root)return;
 $("paxMachineRegionSelect").innerHTML=REGIONS.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.name)+'</option>').join("");
 $("paxMachineRegionSelect").addEventListener("change",e=>setSelected(e.target.value));
 $("paxMachineDate").addEventListener("change",e=>{PAX_MACHINE.date=e.target.value;paxMachineRender()});
 $("paxMachineRange").addEventListener("input",e=>{
  const first=Date.parse(paxConflictStart(state.selected)+"T12:00:00Z"),
   last=Date.parse(paxMachineToday()+"T12:00:00Z");
  const t=first+Math.round((last-first)*Number(e.target.value)/100);
  PAX_MACHINE.date=new Date(t).toISOString().slice(0,10);
  paxMachineRender();
 });
 root.querySelectorAll("[data-machine-period]").forEach(btn=>btn.addEventListener("click",()=>{
  const p=btn.dataset.machinePeriod;
  if(p==="now")PAX_MACHINE.date=paxMachineToday();
  else if(p==="onset")PAX_MACHINE.date=paxConflictStart(state.selected);
  else if(p==="year"){
   const d=new Date(paxMachineToday()+"T12:00:00Z");d.setUTCFullYear(d.getUTCFullYear()-1);
   PAX_MACHINE.date=d.toISOString().slice(0,10);
  }
  paxMachineRender();
 }));
 document.addEventListener("pax:selection",()=>{
  $("paxMachineRegionSelect").value=state.selected;
  if(!PAX_MACHINE.date||PAX_MACHINE.date<paxConflictStart(state.selected))
   PAX_MACHINE.date=paxConflictStart(state.selected);
  paxMachineRender();
 });
 document.addEventListener("pax:language",paxMachineRender);
 PAX_MACHINE.date=paxMachineToday();
 paxMachineRender();
}
paxMachineInit();