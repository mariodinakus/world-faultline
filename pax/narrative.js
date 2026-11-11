/* PAX NARRATIVE DIVERGENCE — compares titles, not article bodies or factual truth. */
const PAX_NARRATIVE={mode:"match",visible:false};
const PAX_NARRATIVE_TOPICS=[
 {id:"diplomacy",re:/talks?|negotiat|diplomac|peace|summit|mediat|agreement|cease.?fire|truce/i,el:"Διπλωματία",en:"Diplomacy"},
 {id:"violence",re:/attack|strike|missile|shell|bomb|drone|offensiv|clash|kill|dead|fight/i,el:"Στρατιωτικές αναφορές",en:"Military reporting"},
 {id:"humanitarian",re:/humanitarian|aid|refugee|displac|civilian|food|hospital|famine|hostage|prisoner/i,el:"Ανθρωπιστικό",en:"Humanitarian"},
 {id:"attribution",re:/claim|alleg|accus|blame|say|report|deny|disput/i,el:"Απόδοση / ισχυρισμός",en:"Attribution / claim"}
];
function paxNarrativeTags(title){
 return PAX_NARRATIVE_TOPICS.filter(t=>t.re.test(title||"")).map(t=>paxLang()==="en"?t.en:t.el);
}
function paxNarrativeEvidence(){
 const items=(state.rows[state.selected]?.articles||[]).filter(x=>x.title&&x.url&&x.publishedAt);
 const groups=typeof PAX_INTEL!=="undefined"?PAX_INTEL.cluster(items):[];
 return groups.filter(g=>g.publishers.length>=2&&g.articles.length>=2);
}
function paxNarrativeSample(){
 const items=(state.rows[state.selected]?.articles||[]).filter(x=>x.title&&x.url&&x.publishedAt);
 const used=new Set(),sample=[];
 for(const a of items.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt))){
  const k=String(a.source).trim().toLowerCase();
  if(!k||used.has(k))continue;
  used.add(k);sample.push(a);
  if(sample.length>=4)break;
 }
 return sample;
}
function paxNarrativeRender(){
 const root=$("narrative");if(!root||!PAX_NARRATIVE.visible)return;
 const en=paxLang()==="en",matched=paxNarrativeEvidence(),sample=paxNarrativeSample(),row=state.rows[state.selected];
 $("paxNarrativeRegion").textContent=REGIONS.find(r=>r.id===state.selected)?.name||"—";
 $("paxNarrativeRegionSelect").value=state.selected;
 $("paxNarrativeCount").textContent=matched.length;
 root.querySelectorAll("[data-narrative-mode]").forEach(b=>{
  const active=b.dataset.narrativeMode===PAX_NARRATIVE.mode;
  b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));
 });
 if(PAX_NARRATIVE.mode==="match"){
  $("paxNarrativeNote").textContent=en?
   "Only headline clusters matched by word overlap and publication time. Similar words do not prove the outlets confirmed the same facts.":
   "Μόνο ομάδες τίτλων που πληρούν όρια ομοιότητας λέξεων και χρόνου. Η ομοιότητα δεν αποδεικνύει ανεξάρτητη επιβεβαίωση.";
  $("paxNarrativeResults").innerHTML=matched.length?matched.slice(0,4).map((group,i)=>{
   const publications=group.articles.filter((a,idx,arr)=>arr.findIndex(x=>x.source===a.source)===idx).slice(0,4);
   return '<article class="pax-narrative-pair"><div class="pax-narrative-pair-head"><strong>'+
    (en?"SIMILAR HEADLINE GROUP ":"ΟΜΑΔΑ ΟΜΟΙΩΝ ΤΙΤΛΩΝ ")+(i+1)+'</strong><span>'+group.publishers.length+
    (en?" publishers":" εκδότες")+'</span></div><div class="pax-narrative-columns">'+
    publications.map(a=>paxNarrativeCard(a)).join("")+'</div></article>';
  }).join(""):'<div class="pax-desk-empty">'+(row?
   (en?"No sufficiently similar titles from different publishers were identified. This is not evidence of reporting agreement or disagreement. Try the coverage sample.":"Δεν εντοπίστηκαν αρκετά όμοιοι τίτλοι από διαφορετικούς εκδότες. Αυτό δεν τεκμηριώνει συμφωνία ή διαφωνία. Δοκίμασε το δείγμα κάλυψης."):
   (en?"Waiting for this conflict’s news feed…":"Αναμονή ειδήσεων για την επιλεγμένη σύγκρουση…"))+'</div>';
 }else{
  $("paxNarrativeNote").textContent=en?
   "Recent headlines from different publishers concerning this conflict. They may refer to entirely different events. Compare coverage emphasis, NOT conflicting accounts of a single event.":
   "Πρόσφατοι τίτλοι από διαφορετικούς εκδότες για την ίδια σύγκρουση. Μπορεί να αφορούν εντελώς διαφορετικά γεγονότα. Σύγκρινε την έμφαση κάλυψης, ΟΧΙ αντιφάσεις για ένα συμβάν.";
  $("paxNarrativeResults").innerHTML=sample.length?
   '<div class="pax-narrative-columns">'+sample.map(a=>paxNarrativeCard(a)).join("")+'</div>':
   '<div class="pax-desk-empty">'+(en?"No retrievable multi-publisher sample at present.":"Δεν υπάρχει διαθέσιμο δείγμα από πολλαπλούς εκδότες.")+'</div>';
 }
}
function paxNarrativeCard(a){
 const en=paxLang()==="en",tags=paxNarrativeTags(a.title);
 return '<div class="pax-narrative-card"><div class="pax-narrative-source">'+esc(a.source||"Unknown")+' <time>'+
  esc(timeLocal(a.publishedAt))+'</time></div><a href="'+esc(validLink(a.url))+'" target="_blank" rel="noopener noreferrer">'+
  esc(a.title)+'</a><div class="pax-narrative-tagset">'+(tags.length?tags.map(t=>'<span>'+esc(t)+'</span>').join(""):
  '<span>'+(en?"No listed keyword cluster":"Χωρίς λέξεις της λίστας")+'</span>')+'</div>'+
  '<small>'+(en?"Keyword tags describe headline wording; no article-body inspection.":"Οι ετικέτες βασίζονται σε λέξεις τίτλων, όχι σε ανάγνωση του άρθρου.")+'</small></div>';
}
function paxNarrativeInit(){
 const root=$("narrative");if(!root)return;
 $("paxNarrativeRegionSelect").innerHTML=REGIONS.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.name)+'</option>').join("");
 $("paxNarrativeRegionSelect").value=state.selected;
 $("paxNarrativeRegionSelect").addEventListener("change",e=>setSelected(e.target.value));
 root.querySelectorAll("[data-narrative-mode]").forEach(btn=>btn.addEventListener("click",()=>{
  PAX_NARRATIVE.mode=btn.dataset.narrativeMode;paxNarrativeRender();
 }));
 const mount=()=>{PAX_NARRATIVE.visible=true;paxNarrativeRender()};
 if("IntersectionObserver" in window){
  const obs=new IntersectionObserver(entries=>{
   if(entries.some(e=>e.isIntersecting)){obs.disconnect();mount()}
  },{rootMargin:"280px"});obs.observe(root);
 }else mount();
 for(const event of ["pax:selection","pax:progress","pax:data","pax:language"])document.addEventListener(event,paxNarrativeRender);
}
paxNarrativeInit();