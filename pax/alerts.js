/* PAX WATCH / in-app alert bell + consent-based page-open browser notifications.
   No service-worker push, no live military tracking, no verification of individual incident claims. */
const PAX_ALERT_KEY="pax-alert-center-v2";
const PAX_ALERT_OPTIONS_KEY="pax-alert-preferences-v1";
const PAX_ALERT_MAX_AGE=72*3600000;
const PAX_WATCH={known:[],items:[],initialized:false,open:false,permission:"default",timer:null,settings:{strikes:true,diplomacy:true,milestones:true,region:"all"},previousFocus:null};
try{const saved=JSON.parse(localStorage.getItem(PAX_ALERT_KEY)||"null");if(saved&&Array.isArray(saved.known)&&Array.isArray(saved.items)){PAX_WATCH.known=saved.known.slice(-550);PAX_WATCH.items=saved.items.slice(0,75);PAX_WATCH.initialized=saved.initialized===true}}catch{}
try{const saved=JSON.parse(localStorage.getItem(PAX_ALERT_OPTIONS_KEY)||"null");if(saved&&typeof saved==="object"){PAX_WATCH.settings.strikes=saved.strikes!==false;PAX_WATCH.settings.diplomacy=saved.diplomacy!==false;PAX_WATCH.settings.milestones=saved.milestones!==false;PAX_WATCH.settings.region=REGIONS.some(r=>r.id===saved.region)?saved.region:"all"}}catch{}
function paxAlertsSave(){try{localStorage.setItem(PAX_ALERT_KEY,JSON.stringify({known:PAX_WATCH.known.slice(-550),items:PAX_WATCH.items.slice(0,75),initialized:PAX_WATCH.initialized}))}catch{}}
function paxPrefsSave(){try{localStorage.setItem(PAX_ALERT_OPTIONS_KEY,JSON.stringify(PAX_WATCH.settings))}catch{}}
function paxSimpleKey(a,r){return r+"|"+String(a.title||"").toLocaleLowerCase().replace(/\s+/g," ").replace(/[^\p{L}\p{N} ]/gu,"").trim()+"|"+String(a.publishedAt||"").slice(0,10)}
// Keep old browser alert histories accurate when a broad publisher RSS item
// was filed under two different conflicts. This is a headline rule, not verification.
function paxAlertRegion(a){
 const t=String(a.title||"").toLowerCase();
 if(a.region==="iranisrael"&&/\b(gaza|palestin\w*|hamas|rafah|west bank|nasser hospital)\b/.test(t)
    &&!/\b(iran|iranian|tehran)\b/.test(t))return "gaza";
 return a.region;
}
function paxAlertIdentity(a){
 const title=String(a.title||"").toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu," ").trim();
 const source=String(a.source||"").toLowerCase().trim();
 const day=String(a.publishedAt||"").slice(0,10);
 return source+"|"+title+"|"+day;
}
PAX_WATCH.items=PAX_WATCH.items.map(a=>({...a,region:paxAlertRegion(a)}))
 .filter((a,i,list)=>list.findIndex(b=>paxAlertIdentity(b)===paxAlertIdentity(a))===i);
function paxAlertType(a){
 const t=String(a.title||"").toLowerCase();
 // A declared agreement and a reported breakdown are distinct headline types, not verified events.
 if(/(?:cease.?fire|truce|peace deal|peace agreement).{0,55}(?:collaps|breakdown|broken|violat|fails|failed|rejected|unravels)|(?:collaps|breakdown|broken|violat|failed).{0,55}(?:cease.?fire|truce|peace deal|peace agreement)/i.test(t))return "breakdown";
 // Strong headline-level kinetic terms. 'strike a deal' should not trigger an attack alert.
 if(/air[\s-]?strik|bombard|shelling|missile[\s-]?(?:attack|strike|barrage|launch)|missile strikes?|rocket (?:attacks?|fire|strikes?)|drone[\s-]?(?:attacks?|strikes?)|explosion|bomb(?:ing|ardment)|(?:military|aerial|deadly|overnight|fresh|new|large-scale) strikes?|(?:strikes?|attacks?) (?:hit|kill|wound|target|injure)|(?:launch(?:ed|es)?|carry(?:ing)? out|carried out) (?:a |new |fresh )?(?:strikes?|attacks?)|(?:strike|attack) on (?:the |a )?(?:city|capital|port|airbase|town|village|hospital)/i.test(t))return "strike";
 if(a.type==="ceasefire"||a.type==="implemented")return "milestone";
 if(a.type==="proposal"||a.type==="talks")return "diplomacy";
 return null;
}
function paxAlertMatches(a){
 if(PAX_WATCH.settings.region!=="all"&&a.region!==PAX_WATCH.settings.region)return false;
 return a.type==="strike"?PAX_WATCH.settings.strikes:
 a.type==="milestone"||a.type==="breakdown"?PAX_WATCH.settings.milestones:
 PAX_WATCH.settings.diplomacy;
}
function paxAlertLabel(type){
 const en=paxLang()==="en";
 return {strike:en?"REPORTED STRIKE":"ΑΝΑΦΟΡΑ ΧΤΥΠΗΜΑΤΟΣ",
  diplomacy:en?"TALKS / PROPOSAL":"ΣΥΝΟΜΙΛΙΕΣ / ΠΡΟΤΑΣΗ",
  milestone:en?"REPORTED AGREEMENT":"ΑΝΑΦΟΡΑ ΣΥΜΦΩΝΙΑΣ",
  breakdown:en?"REPORTED BREAKDOWN":"ΑΝΑΦΟΡΑ ΑΔΙΕΞΟΔΟΥ"}[type]||(en?"REPORT":"ΑΝΑΦΟΡΑ");
}
function paxAlertsIngest(){
 const now=Date.now(),isFirst=!PAX_WATCH.initialized,seen=new Set(PAX_WATCH.known),identities=new Set(PAX_WATCH.items.map(paxAlertIdentity));
 const fresh=[];
 for(const region of REGIONS){
   for(const article of state.rows[region.id]?.articles||[]){
     if(!article.title||!article.url?.startsWith("https://"))continue;
     const date=Date.parse(article.publishedAt);
     if(!Number.isFinite(date)||date<now-PAX_ALERT_MAX_AGE||date>now+3600000)continue;
     const type=paxAlertType(article);if(!type)continue;
     const key=paxSimpleKey(article,region.id),identity=paxAlertIdentity(article);
     if(seen.has(key)||identities.has(identity))continue;
     seen.add(key);identities.add(identity);
     const item={id:key,region:paxAlertRegion({...article,region:region.id}),type,title:article.title,source:article.source||"Άγνωστη πηγή",url:article.url,publishedAt:article.publishedAt,firstObservedAt:new Date().toISOString(),read:isFirst||!paxAlertMatches({type,region:region.id})};
     fresh.push(item);
   }
 }
 PAX_WATCH.known=Array.from(seen).slice(-550);
 PAX_WATCH.items=fresh.concat(PAX_WATCH.items).filter((x,i,arr)=>arr.findIndex(z=>z.id===x.id)===i)
  .filter((x,i,arr)=>arr.findIndex(y=>paxAlertIdentity(y)===paxAlertIdentity(x))===i)
  .filter(x=>Date.parse(x.publishedAt)>now-PAX_ALERT_MAX_AGE).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,75);
 PAX_WATCH.initialized=true;paxAlertsSave();paxAlertsRender();
 if(!isFirst&&fresh.length&&PAX_WATCH.permission==="granted"&&typeof Notification!=="undefined"){
   const priority={breakdown:0,milestone:1,strike:2,diplomacy:3};
   const visible=fresh.filter(paxAlertMatches).filter(x=>!x.read)
    .sort((a,b)=>(priority[a.type]??4)-(priority[b.type]??4)).slice(0,3);
   for(const a of visible){
     try{
       const n=new Notification("PAX / "+paxAlertLabel(a.type),{
         body:a.title.slice(0,140)+" · "+a.source,tag:"pax-"+a.region+"-"+a.type,icon:"/favicon.svg",silent:true,
       });
       n.onclick=()=>{window.focus();paxOpenAlerts();n.close()};
     }catch{}
   }
 }
}
function paxAlertsRender(){
 const badge=document.getElementById("alertBadge"),unread=PAX_WATCH.items.filter(a=>!a.read&&paxAlertMatches(a)).length;
 badge.textContent=unread>99?"99+":unread.toString();badge.hidden=unread===0;
 const rows=PAX_WATCH.items.filter(paxAlertMatches).slice(0,45);
 document.getElementById("alertItems").innerHTML=rows.length?rows.map(a=>
  '<article class="alert-item'+(a.read?"":" unread")+'"><div class="alert-pip"></div><div><div class="alert-meta"><span class="alert-tag'+(a.type==="strike"?"":" diplomacy")+'">'+esc(paxAlertLabel(a.type))+'</span><span>'+esc(REGIONS.find(r=>r.id===a.region)?.short||a.region)+'</span></div><h4><a href="'+esc(validLink(a.url))+'" target="_blank" rel="noopener noreferrer" data-alert-id="'+esc(a.id)+'">'+esc(a.title)+'</a></h4><div class="alert-meta"><span>'+esc(a.source)+'</span><span>·</span><span>'+timeLocal(a.publishedAt)+'</span><span>· Δημοσίευμα, όχι επιβεβαιωμένο συμβάν</span></div></div></article>').join("")+
  '<div class="alert-empty" style="font-size:10px">Η πρώτη επίσκεψη διαμορφώνει σημείο αναφοράς. Νέοι τίτλοι εμφανίζονται με μη αναγνωσμένο σήμα σε επόμενες ανακτήσεις.</div>':
  '<div class="alert-empty">Δεν υπάρχουν πρόσφατοι τίτλοι ειδοποιήσεων στα επιλεγμένα φίλτρα. Δεν αποτελεί ένδειξη ότι δεν υπήρξαν γεγονότα.</div>';
 document.getElementById("alertStrikeToggle").checked=PAX_WATCH.settings.strikes;
 document.getElementById("alertTalkToggle").checked=PAX_WATCH.settings.diplomacy;
 document.getElementById("alertMilestoneToggle").checked=PAX_WATCH.settings.milestones;
 document.getElementById("alertRegionFilter").value=PAX_WATCH.settings.region;
 const btn=document.getElementById("notifyOptin"),note=document.getElementById("alertPermissionNote");
 const supported="Notification" in window&&window.isSecureContext;
 const permission=supported?Notification.permission:"unsupported";
 PAX_WATCH.permission=permission;
 if(permission==="granted"){btn.textContent="BROWSER ALERTS ΕΝΕΡΓΑ";btn.disabled=true}
 else if(permission==="denied"){btn.textContent="BROWSER ALERTS ΑΠΟΚΛΕΙΣΜΕΝΑ";btn.disabled=true}
 else if(permission==="unsupported"){btn.textContent="BROWSER ALERTS ΜΗ ΔΙΑΘΕΣΙΜΑ";btn.disabled=true}
 else{btn.textContent="ΕΝΕΡΓΟΠΟΙΗΣΗ BROWSER ALERTS";btn.disabled=false}
 note.textContent=permission==="granted"?
   "Ενεργοποιήθηκαν ειδοποιήσεις browser για νέους τίτλους μόνο όσο το PAX είναι ανοιχτό. Δεν έχουμε push όταν κλείνει η σελίδα.":
   permission==="denied"?"Ο browser έχει αποκλείσει τις ειδοποιήσεις. Μπορείς να αλλάξεις την άδεια από τις ρυθμίσεις ιστοτόπου. Οι ειδοποιήσεις μέσα στο PAX λειτουργούν κανονικά.":
   "Το καμπανάκι λειτουργεί μέσα στο PAX. Browser alerts απαιτούν ρητή άδεια και λειτουργούν μόνο όσο η εφαρμογή είναι ανοιχτή.";
}
function paxOpenAlerts(){
 const panel=document.getElementById("alertsPanel"),overlay=document.getElementById("alertsOverlay");
 PAX_WATCH.previousFocus=document.activeElement;
 panel.classList.add("open");panel.setAttribute("aria-hidden","false");overlay.hidden=false;
 document.getElementById("alertBell").setAttribute("aria-expanded","true");
 PAX_WATCH.open=true;paxAlertsRender();panel.focus();
}
function paxCloseAlerts(){
 const panel=document.getElementById("alertsPanel"),overlay=document.getElementById("alertsOverlay");
 panel.classList.remove("open");panel.setAttribute("aria-hidden","true");overlay.hidden=true;PAX_WATCH.open=false;
 document.getElementById("alertBell").setAttribute("aria-expanded","false");
 PAX_WATCH.previousFocus?.focus?.();
}
function paxMarkAllRead(){PAX_WATCH.items.forEach(a=>a.read=true);paxAlertsSave();paxAlertsRender()}
function paxAlertsInit(){
 document.getElementById("alertBell").addEventListener("click",()=>PAX_WATCH.open?paxCloseAlerts():paxOpenAlerts());
 document.getElementById("alertsClose").addEventListener("click",paxCloseAlerts);
 document.getElementById("alertsOverlay").addEventListener("click",paxCloseAlerts);
 document.addEventListener("keydown",e=>{if(!PAX_WATCH.open)return;if(e.key==="Escape")paxCloseAlerts();
   if(e.key==="Tab"){const panel=document.getElementById("alertsPanel");const list=[...panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex="0"]')].filter(x=>x.getClientRects().length);if(!list.length)return;const first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
 });
 document.getElementById("markAllRead").addEventListener("click",paxMarkAllRead);
 document.getElementById("alertStrikeToggle").addEventListener("change",e=>{PAX_WATCH.settings.strikes=e.target.checked;paxPrefsSave();paxAlertsRender()});
 document.getElementById("alertTalkToggle").addEventListener("change",e=>{PAX_WATCH.settings.diplomacy=e.target.checked;paxPrefsSave();paxAlertsRender()});
 document.getElementById("alertMilestoneToggle").addEventListener("change",e=>{PAX_WATCH.settings.milestones=e.target.checked;paxPrefsSave();paxAlertsRender()});
 const regionFilter=document.getElementById("alertRegionFilter");
 regionFilter.innerHTML='<option value="all">'+(paxLang()==="en"?"All conflicts":"Όλες οι συγκρούσεις")+'</option>'+
   REGIONS.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.name)+'</option>').join("");
 regionFilter.value=PAX_WATCH.settings.region;
 regionFilter.addEventListener("change",e=>{PAX_WATCH.settings.region=e.target.value;paxPrefsSave();paxAlertsRender()});
 document.getElementById("alertItems").addEventListener("click",event=>{
  const a=event.target.closest("a[data-alert-id]");if(!a)return;
  const item=PAX_WATCH.items.find(x=>x.id===a.dataset.alertId);if(item){item.read=true;paxAlertsSave();paxAlertsRender()}
 });
 document.getElementById("notifyOptin").addEventListener("click",async()=>{
   if(!("Notification" in window)||!window.isSecureContext)return;
   try{PAX_WATCH.permission=await Notification.requestPermission()}catch{PAX_WATCH.permission=Notification.permission}
   paxAlertsRender();
 });
 document.addEventListener("pax:data",paxAlertsIngest);
 document.addEventListener("pax:language",()=>{
  const select=document.getElementById("alertRegionFilter"),value=select.value;
  select.options[0].textContent=paxLang()==="en"?"All conflicts":"Όλες οι συγκρούσεις";
  select.value=value;
  paxAlertsRender()
 });
 // Refresh only while page is visible; never trigger noisy background polling.
 PAX_WATCH.timer=setInterval(()=>{
  if(document.visibilityState!=="visible"||state.loading||PAX_WATCH.open)return;
  load(false);
 },5*60*1000);
 paxAlertsRender();
 if(!state.loading)paxAlertsIngest();
}
paxAlertsInit();
