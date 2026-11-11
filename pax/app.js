/* PAX | Transparent headline-signal monitor. No unsupported peace predictions. */
const REGIONS=[
 {id:'ukraine',name:'Ρωσία — Ουκρανία',short:'ΟΥΚΡΑΝΙΑ',subtitle:'Ευρωπαϊκή ασφάλεια · Διαπραγματεύσεις',lat:49,lon:31,map:'ΟΥΚΡΑΝΙΑ'},
 {id:'gaza',name:'Ισραήλ — Παλαιστίνη / Γάζα',short:'ΓΑΖΑ',subtitle:'Κατάπαυση πυρός · Ανθρωπιστική κατάσταση',lat:31.5,lon:34.5,map:'ΓΑΖΑ'},
 {id:'iranisrael',name:'Ιράν — Ισραήλ',short:'ΙΡΑΝ / ΙΣΡΑΗΛ',subtitle:'Περιφερειακή ένταση · Διπλωματία',lat:33,lon:53,map:'ΙΡΑΝ'},
 {id:'usiran',name:'ΗΠΑ — Ιράν',short:'ΗΠΑ / ΙΡΑΝ',subtitle:'Πυρηνικές διαπραγματεύσεις · Κυρώσεις',lat:37.5,lon:-98,map:'ΗΠΑ / ΙΡΑΝ'},
 {id:'sudan',name:'Σουδάν',short:'ΣΟΥΔΑΝ',subtitle:'Εσωτερική σύγκρουση · Μεσολάβηση',lat:15,lon:30,map:'ΣΟΥΔΑΝ'},
 {id:'drc',name:'Λ.Δ. Κονγκό / M23',short:'ΚΟΝΓΚΟ',subtitle:'Ανατολικό Κονγκό · Διαβουλεύσεις',lat:-3,lon:24,map:'ΚΟΝΓΚΟ'},
 {id:'myanmar',name:'Μιανμάρ',short:'ΜΙΑΝΜΑΡ',subtitle:'Εσωτερική σύγκρουση · Εκεχειρίες',lat:21,lon:96,map:'ΜΙΑΝΜΑΡ'},
 {id:'yemen',name:'Υεμένη',short:'ΥΕΜΕΝΗ',subtitle:'Περιφερειακές επιχειρήσεις · Διαμεσολάβηση',lat:15,lon:48,map:'ΥΕΜΕΝΗ'},
 {id:'syria',name:'Συρία',short:'ΣΥΡΙΑ',subtitle:'Περιφερειακή σταθεροποίηση',lat:35,lon:39,map:'ΣΥΡΙΑ'}
];
const state={selected:'ukraine',filter:'all',search:'',rows:{},loading:true,lastUpdated:null,prior:null,mapReady:false};
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validLink=url=>{try{const u=new URL(url);return u.protocol==='https:'?u.href:'#'}catch{return '#'}};
const dateLong=iso=>{const d=new Date(iso);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('el-GR',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Athens'}).format(d):'—'};
const timeLocal=iso=>{const d=new Date(iso);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('el-GR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Athens'}).format(d):'—'};
const TYPES={
 talks:{label:'ΔΙΑΠΡΑΓΜΑΤΕΥΣΕΙΣ',weight:1},
 proposal:{label:'ΕΙΡΗΝΕΥΤΙΚΗ ΠΡΟΤΑΣΗ',weight:2},
 ceasefire:{label:'ΕΚΕΧΕΙΡΙΑ / ΣΥΜΦΩΝΙΑ',weight:3},
 implemented:{label:'ΕΦΑΡΜΟΓΗ ΜΕΤΡΩΝ',weight:4},
 setback:{label:'ΚΛΙΜΑΚΩΣΗ / ΕΜΠΟΔΙΟ',weight:-2.2},
 other:{label:'ΓΕΩΠΟΛΙΤΙΚΗ ΕΙΔΗΣΗ',weight:0}
};
function classify(title){
 const t=String(title).toLowerCase();
 // Priority order matters: a violated ceasefire must not become a positive "ceasefire" signal.
 if(/(?:cease.?fire|truce|peace deal|agreement).{0,55}(?:violat|collaps|breakdown|broken|rejected|rejects|fails|failed|unravels|ends|shattered)|(?:violat|collaps|broken|rejects|rejected|failed).{0,55}(?:cease.?fire|truce|peace deal|agreement)/i.test(t))return 'setback';
 if(/(?:airstrik|missile|bombard|shelling|attacks?|attacked|killed|killings|deaths|shells|retaliat|fighting|clashes|offensive|deadlock|rejects|rejected|escalat|drone strike|raid on)/i.test(t))return 'setback';
 if(/(?:hostages?|prisoners?).{0,36}(?:released|freed|exchanged)|(?:withdrawal|monitoring mission|peacekeepers).{0,34}(?:begins|starts|deployed|launched)|(?:humanitarian corridor|aid deliveries).{0,30}(?:opens|resumes|operational)/i.test(t))return 'implemented';
 if(/(?:cease.?fire|truce|peace agreement|peace deal).{0,50}(?:signed|in effect|takes effect|begins|holds|reached|agreed|implemented|secured)|(?:sign|agreed|reached|seal).{0,45}(?:cease.?fire|truce|peace deal|peace agreement)/i.test(t))return 'ceasefire';
 if(/(?:peace plan|peace proposal|cease.?fire proposal|draft agreement|framework deal|negotiating framework|proposed deal|proposes truce|proposes cease.?fire)/i.test(t))return 'proposal';
 if(/(?:talks|negotiations?|diploma(?:t|cy)|mediator|mediation|envoy|summit|dialogue|peace meeting|peace mission|peace process)/i.test(t))return 'talks';
 return 'other';
}
function analyse(row){
 const items=row?.articles||[];
 const sources=new Set(items.map(x=>x.source?.toLowerCase()).filter(Boolean));
 const counts={talks:0,proposal:0,ceasefire:0,implemented:0,setback:0,other:0};
 items.forEach(x=>counts[x.type]++);
 const positives=counts.talks+counts.proposal+counts.ceasefire+counts.implemented;
 const negative=counts.setback;
 const positiveWeight=counts.talks+counts.proposal*2+counts.ceasefire*3+counts.implemented*4;
 const negativeWeight=negative*2.2;
 const enough=items.length>=5&&sources.size>=3;
 const score=enough?Math.max(0,Math.min(100,Math.round((100*positiveWeight/(positiveWeight+negativeWeight+1))/5)*5)):null;
 return {counts,positives,negative,score,enough,sources:sources.size,articles:items.length};
}
function regionRow(id){return state.rows[id]||{articles:[],provider:null,error:null}}
function regionAnalysis(id){return analyse(regionRow(id))}
function setSelected(id,scroll=false){
 if(!REGIONS.some(r=>r.id===id))return;
 state.selected=id;render();
 if(scroll)$('detail').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderPicker(){
 $('regionPicker').innerHTML=REGIONS.map(r=>'<button type="button" data-id="'+esc(r.id)+'" class="'+(r.id===state.selected?'active':'')+'">'+esc(r.short)+'</button>').join('');
 $('regionPicker').querySelectorAll('button').forEach(el=>el.addEventListener('click',()=>setSelected(el.dataset.id)));
}
function renderRadar(){
 $('radarList').innerHTML=REGIONS.map(r=>{
  const row=regionRow(r.id),an=analyse(row),available=an.score!==null;
  return '<button type="button" class="radar-item '+(r.id===state.selected?'active':'')+'" data-id="'+esc(r.id)+'">'+
   '<span class="radar-item-head"><span class="radar-name">'+esc(r.name)+'</span><span class="radar-number">'+(available?an.score:'—')+'</span></span>'+
   '<span class="radar-metadata"><span>'+(row.error?'Αδυναμία ανάκτησης':state.loading&&!an.articles?'Ανάκτηση…':available?'Σήματα δημοσιευμάτων':'Μη επαρκής κάλυψη')+'</span><span>'+an.articles+' άρθρα</span></span>'+
   '<div class="mini-track"><span style="width:'+(available?an.score:0)+'%"></span></div></button>';
 }).join('');
 $('radarList').querySelectorAll('button').forEach(el=>el.addEventListener('click',()=>setSelected(el.dataset.id,true)));
}
function renderStats(){
 const rows=Object.values(state.rows),items=rows.flatMap(x=>x.articles||[]);
 const sources=new Set(items.map(x=>x.source?.toLowerCase()).filter(Boolean));
 $('statRegions').textContent=String(REGIONS.length).padStart(2,'0');
 $('statStories').textContent=state.loading?'…':String(items.length);
 $('statSources').textContent=state.loading?'…':String(sources.size);
 $('statUpdated').textContent=state.lastUpdated?timeLocal(state.lastUpdated):'—';
}
function headlineCard(a,type){return '<div class="insight-card"><span>'+esc(TYPES[type].label)+' · '+esc(a.source||'—')+'</span><a href="'+esc(validLink(a.url))+'" target="_blank" rel="noopener noreferrer">'+esc(a.title)+'</a><small>'+dateLong(a.publishedAt)+'</small></div>'}
function renderDetail(){
 const region=REGIONS.find(r=>r.id===state.selected),row=regionRow(region.id),an=analyse(row);
 $('selectedTitle').textContent=region.name;$('selectedSubtitle').textContent=region.subtitle;
 $('coverageBadge').textContent=row.error?'ΣΦΑΛΜΑ ΠΗΓΗΣ':state.loading&&!an.articles?'ΑΝΑΚΤΗΣΗ':an.enough?'ΕΠΑΡΚΕΣ ΔΕΙΓΜΑ*':'ΠΕΡΙΟΡΙΣΜΕΝΟ ΔΕΙΓΜΑ';
 $('peaceScore').textContent=an.score===null?'—':an.score;
 const prior=state.prior?.values?.[region.id],hasPrior=Number.isFinite(prior)&&an.score!==null;
 const delta=hasPrior?an.score-prior:null;
 $('peaceDirection').textContent=row.error?'Δεν ανακτήθηκαν δεδομένα. Δεν παράγεται βαθμολογία.':an.score===null?
  'Χρειάζονται τουλάχιστον 5 τίτλοι από 3 εκδότες. Δεν προκύπτει βαθμολογία.':
  (delta===null?'Πρώτη παρατήρηση στο πρόγραμμα περιήγησης':delta===0?'Σταθερό σε σχέση με την προηγούμενη επίσκεψη':
   (delta>0?'+':'')+delta+' μονάδες σε σχέση με προηγούμενη επίσκεψη');
 $('gaugeArc').setAttribute('stroke-dasharray',(an.score===null?0:(an.score/100)*230)+' 230');
 $('talksCount').textContent=an.positives.toString();$('setbacksCount').textContent=an.negative.toString();
 $('talksTrack').style.width=an.articles?Math.min(100,100*an.positives/an.articles)+'%':'0%';
 $('setbacksTrack').style.width=an.articles?Math.min(100,100*an.negative/an.articles)+'%':'0%';
 const annotated=row.articles.filter(x=>x.type!=='other'),strong=annotated.filter(x=>x.type!=='setback');
 const negative=annotated.filter(x=>x.type==='setback');
 const intro=row.error?'LIVE DATA UNAVAILABLE':!an.articles?'NOT ENOUGH EVIDENCE':an.positives&&an.negative?'DIPLOMACY ≠ DE-ESCALATION':an.positives?'DIPLOMATIC SIGNALS IN THE FEED':an.negative?'MILITARY SIGNALS DOMINATE':'NO CLASSIFIED SIGNALS';
 const text=row.error?'Ο πάροχος δημοσιευμάτων δεν απάντησε. Τα στοιχεία διατηρούνται κενά.':
  'Στους '+an.articles+' ανακτημένους τίτλους βρέθηκαν '+an.positives+' διπλωματικά σήματα και '+an.negative+' σήματα κλιμάκωσης. Αυτή είναι ταξινόμηση τίτλων, όχι διασταύρωση πραγματικών γεγονότων.';
 const evidence=[...strong.slice(0,2),...negative.slice(0,2)].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,3);
 $('insightContent').innerHTML='<span class="mini-label">WHAT WE CAN ACTUALLY OBSERVE</span>'+
  '<div class="insight-callout">'+esc(intro)+'</div><p class="insight-text">'+esc(text)+'</p>'+
  (evidence.length?evidence.map(a=>headlineCard(a,a.type)).join(''):'<div class="insight-empty">Δεν υπάρχουν διαθέσιμοι τίτλοι με αναγνωρίσιμα διπλωματικά ή στρατιωτικά σήματα. Αυτό δεν σημαίνει ότι δεν εξελίσσεται η σύγκρουση.</div>')+
  '<p class="insight-text" style="margin-top:22px;font-size:10px">Πάροχος: '+esc(row.provider||'—')+'. Το *επαρκές δείγμα αφορά μόνο το ελάχιστο πλήθος/διασπορά εκδοτών, όχι την ποιότητα ή την ακρίβεια των πληροφοριών.</p>';
}
function renderStories(){
 const list=REGIONS.flatMap(r=>(regionRow(r.id).articles||[]).map(a=>({...a,regionName:r.short,regionId:r.id})))
  .sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
 const filtered=list.filter(a=>(state.filter==='all'||(state.filter==='talks'?['talks','proposal'].includes(a.type):
  state.filter==='ceasefire'?['ceasefire','implemented'].includes(a.type):a.type==='setback'))&&
  (!state.search||[a.title,a.source,a.regionName].join(' ').toLocaleLowerCase('el').includes(state.search.toLocaleLowerCase('el'))));
 $('storyList').innerHTML=filtered.slice(0,36).map(a=>{
   const d=new Date(a.publishedAt),valid=Number.isFinite(d.getTime()),day=valid?d.toLocaleDateString('en-GB',{day:'2-digit',timeZone:'Europe/Athens'}):'—',
   month=valid?d.toLocaleDateString('en-GB',{month:'short',timeZone:'Europe/Athens'}).toUpperCase():'—';
   return '<article class="story"><div class="story-date"><strong>'+day+'</strong><span>'+month+'</span></div><div><div class="story-meta"><span class="story-category">'+esc(TYPES[a.type].label)+'</span><span>'+esc(a.source||'—')+'</span><span>·</span><span>'+esc(a.regionName)+'</span></div><h3><a href="'+esc(validLink(a.url))+'" target="_blank" rel="noopener noreferrer">'+esc(a.title)+'</a></h3><div class="story-region">'+dateLong(a.publishedAt)+' · Αρχική δημοσίευση ↗</div></div><a class="story-open" href="'+esc(validLink(a.url))+'" target="_blank" rel="noopener noreferrer" aria-label="Άνοιγμα άρθρου">↗</a></article>';
 }).join('')||'<div class="empty-feed">'+(state.loading?'Ανακτώνται δημοσιεύματα…':'Δεν υπάρχουν δημοσιεύματα που να ταιριάζουν σε αυτό το φίλτρο. Έλεγξε τις πηγές ή δοκίμασε άλλο φίλτρο.')+'</div>';
 $('feedFilters').querySelectorAll('button').forEach(el=>el.classList.toggle('active',el.dataset.filter===state.filter));
}
function renderVolume(){
 const items=REGIONS.flatMap(r=>regionRow(r.id).articles||[]);
 const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setUTCDate(d.getUTCDate()-6+i);return d.toISOString().slice(0,10)});
 const counts=days.map(d=>items.filter(a=>a.publishedAt?.slice(0,10)===d).length);
 const max=Math.max(1,...counts);
 $('volumeChart').innerHTML=days.map((d,i)=>'<div class="volume-item" title="'+counts[i]+' δημοσιεύματα"><div class="volume-bar" style="height:'+Math.max(2,counts[i]/max*98)+'px"></div><span>'+d.slice(8)+'</span></div>').join('');
}
function renderDelta(){
 const id=state.selected,old=state.prior?.values?.[id],now=regionAnalysis(id).score;
 let message='Δεν υπάρχει προηγούμενη παρατήρηση σε αυτόν τον browser. Οι μελλοντικές επισκέψεις θα συγκρίνονται με το τωρινό διαθέσιμο δείγμα.';
 if(state.prior&&Number.isFinite(old)&&Number.isFinite(now)){
  const diff=now-old,change=diff===0?'αμετάβλητος':diff>0?'αυξήθηκε':'μειώθηκε';
  message='Ο δείκτης '+change+(diff===0?'':' κατά '+Math.abs(diff)+' μονάδες')+' από τις '+timeLocal(state.prior.at)+'. Αιτία δεν τεκμαίρεται αυτόματα: η μεταβολή μπορεί να οφείλεται σε νέα δημοσιεύματα, αλλαγή κάλυψης ή ταξινομητικά σφάλματα.';
 }
 $('deltaContent').textContent=message;
}
function render(){
 renderStats();renderPicker();renderRadar();renderDetail();renderStories();renderVolume();renderDelta();
 document.querySelectorAll('.hotspot').forEach(el=>el.classList.toggle('selected',el.dataset.id===state.selected));
}
function setupUI(){
 document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{
   document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x===btn));
   $(btn.dataset.target)?.scrollIntoView({behavior:'smooth',block:'start'});
 }));
 $('feedFilters').addEventListener('click',event=>{
   const button=event.target.closest('button[data-filter]');if(!button)return;
   state.filter=button.dataset.filter;renderStories();
 });
 $('feedSearch').addEventListener('input',e=>{state.search=e.target.value;renderStories()});
 $('refreshBtn').addEventListener('click',()=>load(true));
 const clock=()=>{$('clock').textContent=new Intl.DateTimeFormat('el-GR',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Athens'}).format(new Date()).toUpperCase()+' / ATHENS';};
 clock();setInterval(clock,60000);
 try{const saved=JSON.parse(localStorage.getItem('pax-observation-v1')||'null');if(saved&&saved.at&&saved.values)state.prior=saved;}catch{}
}
async function load(manual=false){
 state.loading=true;$('refreshBtn').disabled=true;$('refreshBtn').textContent='↻ ΑΝΑΚΤΗΣΗ';
 if(manual)state.prior=readSaved();
 render();
 const results=await Promise.allSettled(REGIONS.map(async region=>{
  const response=await fetch('/api/news?region='+encodeURIComponent(region.id),{headers:{'Accept':'application/json'}});
  const payload=await response.json().catch(()=>({error:'Invalid response',articles:[]}));
  if(!response.ok)throw Error(payload.error||'Server error '+response.status);
  return {id:region.id,data:payload};
 }));
 for(let i=0;i<results.length;i++){
   const {id}=REGIONS[i],result=results[i];
   if(result.status==='fulfilled'){
     const data=result.value.data;
     state.rows[id]={articles:(Array.isArray(data.articles)?data.articles:[]).map(a=>({...a,type:classify(a.title)})),provider:data.provider||'—',error:null};
   }else state.rows[id]={articles:[],provider:null,error:'Δεν είναι διαθέσιμη η ροή ειδήσεων'};
 }
 state.loading=false;state.lastUpdated=new Date().toISOString();$('refreshBtn').disabled=false;$('refreshBtn').innerHTML='<span class="refresh-icon">↻</span> ΑΝΑΝΕΩΣΗ';
 const snap={at:state.lastUpdated,values:Object.fromEntries(REGIONS.map(r=>[r.id,regionAnalysis(r.id).score]))};
 try{localStorage.setItem('pax-observation-v1',JSON.stringify(snap))}catch{}
 render();
}
function readSaved(){try{return JSON.parse(localStorage.getItem('pax-observation-v1')||'null')}catch{return null}}
async function drawWorldMap(){
 const svg=document.getElementById('worldMap');if(!window.d3||!window.topojson){svg.innerHTML='<text x="480" y="235" text-anchor="middle">Δεν φορτώθηκαν οι βιβλιοθήκες του χάρτη.</text>';return}
 try{
  const response=await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',{cache:'force-cache'});
  if(!response.ok)throw Error('map source unavailable');
  const world=await response.json(),countries=topojson.feature(world,world.objects.countries);
  const projection=d3.geoNaturalEarth1().fitExtent([[23,14],[935,452]],countries);
  const path=d3.geoPath(projection);
  const root=d3.select(svg);root.selectAll('*').remove();
  root.append('path').attr('class','graticule').attr('d',path(d3.geoGraticule().step([30,30])()));
  root.append('g').selectAll('path').data(countries.features).enter().append('path').attr('class','country-shape').attr('d',path);
  const markers=root.append('g');
  REGIONS.forEach(r=>{
   const pt=projection([r.lon,r.lat]);if(!pt)return;
   const g=markers.append('g').attr('class','hotspot'+(r.id===state.selected?' selected':'')).attr('data-id',r.id)
    .attr('transform','translate('+pt[0]+','+pt[1]+')').attr('role','button').attr('tabindex','0')
    .attr('aria-label','Προβολή '+r.name);
   g.append('circle').attr('class','hit-ring').attr('r',13);
   g.append('circle').attr('class','hit-core').attr('r',5.5);
   g.append('title').text(r.name+' — γεωγραφική αναφορά, όχι πεδίο μάχης');
   // Labels only for selected region; adjacent countries can otherwise visually overlap.
   g.append('text').attr('x',12).attr('y',-12).text(r.map).style('display',r.id===state.selected?'block':'none');
   g.on('click',()=>{setSelected(r.id,true);updateLabels()});
   g.on('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelected(r.id,true);updateLabels()}});
  });
  function updateLabels(){d3.selectAll('.hotspot').each(function(){d3.select(this).select('text').style('display',this.dataset.id===state.selected?'block':'none')})}
  // Keep selected label synced with picker and radar.
  new MutationObserver(updateLabels).observe($('regionPicker'),{childList:true});
  state.mapReady=true;
 }catch(e){svg.innerHTML='<text x="480" y="235" text-anchor="middle" fill="#666">Ο γεωγραφικός χάρτης δεν είναι προσωρινά διαθέσιμος.</text>';}
}
setupUI();render();drawWorldMap();load();
