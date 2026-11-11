/* PAX / Intelligence Lab: event-like title grouping (NOT verification), source diagnostics,
   open diplomatic questions, and sourced economics series. */
const PAX_STOP=new Set(["the","and","for","from","with","after","before","amid","says","say","said","over","into","this","that","will","would","could","may","are","has","have","new","its","about","what","when","where","more","their","than","while","who","how","as","at","on","in","of","to","a","an","by","is","it","us","uk","live","report","reports","latest","update","updates","today","yesterday","week","world","news","russia","russian","ukraine","ukrainian","israel","israeli","gaza","iran","iranian","sudan","sudanese","yemen","yemeni","syria","syrian","congo","myanmar","united","states"]);
function paxTokens(str){return new Set(String(str||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^\p{L}\p{N}]/gu," ").split(/\s+/).filter(w=>w.length>=3&&!PAX_STOP.has(w)))}
function paxJaccard(a,b){
 let overlap=0;for(const token of a)if(b.has(token))overlap++;
 return overlap/(a.size+b.size-overlap||1)
}
function paxCluster(articles){
 const items=[...articles].filter(x=>x.title&&x.publishedAt).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
 const result=[];
 for(const article of items){
  const tokens=paxTokens(article.title),t=Date.parse(article.publishedAt);
  const match=result.find(group=>{
   const delta=Math.abs(t-Date.parse(group.lead.publishedAt));
   if(delta>60*3600000)return false;
   const a=group.tokens,b=tokens;
   if(a.size<4||b.size<4)return false;
   const intersection=[...a].filter(x=>b.has(x)).length;
   return intersection>=4&&paxJaccard(a,b)>=0.58;
  });
  if(match)match.articles.push(article);
  else result.push({lead:article,articles:[article],tokens});
 }
 return result.map(g=>({lead:g.lead,articles:g.articles,publishers:[...new Set(g.articles.map(a=>String(a.source||"").trim()).filter(Boolean))],representative:g.lead.title}))
}
const PAX_QUESTIONS={
 ukraine:["Πώς ορίζεται ένας ελέγξιμος μηχανισμός εκεχειρίας;","Πώς αντιμετωπίζονται ασφάλεια και εδαφικά ζητήματα;","Ποια βήματα εφαρμογής μπορούν να τεκμηριωθούν;"],
 gaza:["Πώς επαληθεύεται η εφαρμογή της εκεχειρίας;","Τι συμβαίνει με ομήρους και κρατουμένους;","Ποια είναι η κατάσταση ανθρωπιστικής πρόσβασης και διακυβέρνησης;"],
 iranisrael:["Ποιες περιφερειακές δεσμεύσεις μπορούν να επαληθευθούν;","Υπάρχουν απευθείας ή διαμεσολαβημένες διπλωματικές επαφές;","Εφαρμόζονται ανακοινωμένες δεσμεύσεις αποκλιμάκωσης;"],
 usiran:["Πώς ορίζονται τα βήματα πυρηνικής επαλήθευσης;","Ποιες κυρώσεις και δεσμεύσεις συζητούνται δημόσια;","Τι διαχωρίζει πολιτικές δηλώσεις από εφαρμοσμένα μέτρα;"],
 sudan:["Πώς μπορεί να τεκμηριωθεί η προστασία αμάχων;","Ποιοι μηχανισμοί παρακολούθησης συμφωνούνται;","Πώς διασφαλίζεται η πρόσβαση ανθρωπιστικής βοήθειας;"],
 drc:["Υπάρχει λειτουργικός μηχανισμός επαλήθευσης εκεχειρίας;","Τι παρατηρείται στη διαδικασία πολιτικών συνομιλιών;","Πώς παρακολουθείται η ανθρωπιστική πρόσβαση;"],
 myanmar:["Πώς ελέγχεται η πρόσβαση ανθρωπιστικής βοήθειας;","Τι είδους εκεχειρίες ανακοινώνονται;","Ποια είναι η έκταση και συμμετοχή της διαμεσολάβησης;"],
 yemen:["Ποιοι όροι προσωρινής εκεχειρίας εφαρμόζονται;","Τι ισχύει για λιμάνια, πτήσεις και εφοδιασμό;","Πώς παρακολουθείται η περιφερειακή διάσταση;"],
 syria:["Τι στάδιο έχουν οι συμφωνίες ενσωμάτωσης και ασφάλειας;","Πώς διασφαλίζονται τα δικαιώματα των κοινοτήτων;","Ποια μέτρα εφαρμογής τεκμηριώνονται ανεξάρτητα;"]
};
const PAX_QUESTIONS_EN={
 ukraine:["What would make a ceasefire independently monitorable?","How are security guarantees and territorial issues addressed?","Which implementation steps can actually be documented?"],
 gaza:["How is compliance with any ceasefire monitored?","What is the status of hostages and prisoners?","What is known about humanitarian access and governance?"],
 iranisrael:["Which regional commitments can be verified?","Are direct or mediated diplomatic contacts taking place?","Are announced de-escalation measures implemented?"],
 usiran:["What would nuclear verification require?","Which sanctions and commitments are publicly under discussion?","Which statements have translated into actual measures?"],
 sudan:["How can civilian protection be documented?","Which monitoring mechanisms are agreed?","How can humanitarian access be protected?"],
 drc:["Is there a working ceasefire verification mechanism?","What progress is observable in political talks?","How is humanitarian access monitored?"],
 myanmar:["How is humanitarian access assessed?","What kinds of ceasefires have been announced?","How inclusive are mediation and talks?"],
 yemen:["Which temporary ceasefire provisions are implemented?","What is the position on ports, flights and supplies?","How is the regional dimension addressed?"],
 syria:["What is the implementation status of security and integration deals?","How are community rights protected?","What implementation measures are independently documented?"]
};
const PAX_INTEL={cluster:paxCluster};
function paxIntelRender(){
 const r=state.rows[state.selected]||{},cl=paxCluster(r.articles||[]);
 const live=cl.filter(x=>x.publishers.length>=2).length;
 const panel=document.getElementById("sourceStatus");
 if(!panel)return;
 document.getElementById("intelConflict").textContent=REGIONS.find(x=>x.id===state.selected)?.name||"—";
 document.getElementById("clusterCount").textContent=String(cl.length);
 const feeds=r.sourceFeeds||[];
 panel.innerHTML=feeds.length?feeds.map(s=>'<div class="feed-health '+(s.status==="ok"?"ok":"down")+'"><span class="health-dot"></span><b>'+esc(s.feed)+'</b><small>'+esc(s.status==="ok"?(paxLang()==="en"?"ACTIVE FEED":"ΕΝΕΡΓΗ ΡΟΗ"):(paxLang()==="en"?"UNAVAILABLE":"ΜΗ ΔΙΑΘΕΣΙΜΗ"))+'</small><strong>'+Number(s.count||0)+'</strong></div>').join("")
  :'<div class="intel-placeholder">'+(state.loading?(paxLang()==="en"?"Checking news feeds…":"Έλεγχος παρόχων σε εξέλιξη…"):(paxLang()==="en"?"Source diagnostics unavailable.":"Δεν υπάρχουν διαθέσιμα διαγνωστικά πηγών."))+'</div>';
 const publisherCount=r.stats?.publishers||new Set((r.articles||[]).map(a=>a.source)).size;
 document.getElementById("credibilityIntro").textContent=cl.length?
  (paxLang()==="en"?cl.length+" similar-headline clusters from "+publisherCount+" publishers. "+live+" clusters appear in at least two outlets. This shows publication diversity, not independent confirmation.":
   cl.length+" ομάδες παρόμοιων τίτλων από "+publisherCount+" εκδότες. "+live+" ομάδες εμφανίζονται σε τουλάχιστον δύο εκδότες. Αυτό δείχνει διασπορά δημοσίευσης, όχι ανεξάρτητη επιβεβαίωση."):
  (paxLang()==="en"?"No reporting available for source comparison.":"Δεν υπάρχουν διαθέσιμα στοιχεία για συγκριτική ανάλυση πηγών.");
 document.getElementById("clusterList").innerHTML=cl.slice(0,11).map(g=>{
  const lead=g.lead,others=g.articles.slice(0,6),type=g.publishers.length>1?(paxLang()==="en"?"MULTIPLE OUTLETS":"ΠΟΛΛΑΠΛΗ ΚΑΛΥΨΗ"):(paxLang()==="en"?"SINGLE PUBLISHER":"ΜΕΜΟΝΩΜΕΝΗ ΠΗΓΗ");
  return '<article class="cluster-card"><div class="cluster-type">'+esc(type)+' · '+g.publishers.length+(paxLang()==="en"?(g.publishers.length===1?" PUBLISHER":" PUBLISHERS"):' ΕΚΔΟΤ'+(g.publishers.length===1?"ΗΣ":"ΕΣ"))+'</div>'+
   '<h4>'+esc(lead.title)+'</h4><div class="cluster-links">'+others.map(a=>'<a href="'+esc(validLink(a.url))+'" target="_blank" rel="noopener noreferrer">'+esc(a.source)+' ↗</a>').join("")+'</div>'+
   '<div class="cluster-foot">'+timeLocal(lead.publishedAt)+' · '+(paxLang()==="en"?"Similar-headline grouping, not fact verification":"Ομαδοποίηση ομοιότητας τίτλων, όχι διασταύρωση")+'</div></article>'
 }).join("")||'<div class="intel-placeholder">Δεν ανακτήθηκαν σχετικά δημοσιεύματα.</div>';
 document.getElementById("negotiationMatrix").innerHTML=((paxLang()==="en"?PAX_QUESTIONS_EN:PAX_QUESTIONS)[state.selected]||[]).map((q,i)=>
  '<div class="question-card"><span>OPEN QUESTION 0'+(i+1)+'</span><p>'+esc(q)+'</p></div>').join("");
}
let paxMarketData=null;
function paxSparkline(points){
 if(!points?.length)return'<span>—</span>';
 const values=points.map(x=>x.value).filter(Number.isFinite),min=Math.min(...values),max=Math.max(...values),denom=max-min||1;
 const path=values.map((v,i)=>(i?"L":"M")+(i/(Math.max(1,values.length-1))*240).toFixed(1)+" "+(68-(v-min)/denom*56).toFixed(1)).join(" ");
 return'<svg viewBox="0 0 240 80" preserveAspectRatio="none" aria-label="Ιστορική μεταβολή της χρονοσειράς" role="img"><path d="'+path+'" stroke="#171d1f" stroke-width="2.5" fill="none" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>'
}
function paxMarketRender(){
 const dest=document.getElementById("marketGrid");if(!dest)return;
 if(!paxMarketData){dest.innerHTML='<div class="intel-placeholder">Ανακτώνται οι δημόσιες οικονομικές χρονοσειρές…</div>';return}
 const items=paxMarketData.indicators||[];
 dest.innerHTML=items.map(item=>{
  const ok=Number.isFinite(item.value),change=Number.isFinite(item.changePct);
  return'<article class="market-card"><div class="market-card-head"><span>'+esc(item.category)+'</span><a href="'+esc(validLink(item.url))+'" target="_blank" rel="noopener noreferrer">'+esc(item.source||"FRED")+' ↗</a></div>'+
   '<h4>'+esc(item.name)+'</h4><div class="market-value">'+(ok?Number(item.value).toLocaleString("el-GR",{maximumFractionDigits:3}):'—')+'</div><div class="market-unit">'+esc(item.unit)+'</div>'+
   '<div class="market-spark">'+paxSparkline(item.points)+'</div>'+
   '<div class="market-bottom"><span>'+(change?(item.changePct>0?"+":"")+item.changePct+"%":"—")+'</span><small>'+esc(item.updatedAt||"Μη διαθέσιμο")+' · '+(paxLang()==="en"?"not live":"μη real-time")+'</small></div></article>';
 }).join("");
 document.getElementById("marketStamp").textContent=paxMarketData.available+" / "+paxMarketData.seriesTotal+(paxLang()==="en"?" series available":" χρονοσειρές διαθέσιμες");
}
async function paxMarketsLoad(){
 try{const result=await fetch("/api/markets",{headers:{Accept:"application/json"}});if(!result.ok)throw Error("Markets unavailable");
 paxMarketData=await result.json()}catch{paxMarketData={available:0,seriesTotal:5,indicators:[]}};
 paxMarketRender();
}
function paxIntelInit(){
 document.addEventListener("pax:selection",paxIntelRender);
 document.addEventListener("pax:data",paxIntelRender);
 document.addEventListener("pax:progress",paxIntelRender);
 document.addEventListener("pax:language",()=>{paxIntelRender();paxMarketRender()});
 paxIntelRender();paxMarketRender();
 const market=document.getElementById("marketGrid");
 if("IntersectionObserver" in window&&market){
  const obs=new IntersectionObserver(entries=>{
   if(entries.some(e=>e.isIntersecting)){obs.disconnect();paxMarketsLoad()}
  },{rootMargin:"400px"});
  obs.observe(market);
 }else setTimeout(paxMarketsLoad,3500);
}
paxIntelInit();