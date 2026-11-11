/* PAX / Negotiation Timeline — individually sourced historical milestones + explicitly unverified live headline reports. */
const PAX_MILESTONES=[
 {id:"ukr-grain-start",region:"ukraine",date:"2022-07-22",type:"agreement",title:"Συμφωνία για τα σιτηρά της Μαύρης Θάλασσας",detail:"Δημιουργήθηκε μηχανισμός ασφαλών εμπορικών εξαγωγών από ουκρανικά λιμάνια υπό τον συντονισμό ΟΗΕ και Τουρκίας. Δεν ήταν γενική εκεχειρία.",source:"United Nations",url:"https://www.un.org/en/black-sea-grain-initiative/faq"},
 {id:"ukr-grain-end",region:"ukraine",date:"2023-07-17",type:"setback",title:"Δεν ανανεώθηκε η συμφωνία της Μαύρης Θάλασσας",detail:"Η πρωτοβουλία έληξε μετά την τρίτη περίοδο ισχύος της. Το ορόσημο αφορά τις εξαγωγές σιτηρών, όχι το σύνολο της ειρηνευτικής διαδικασίας.",source:"United Nations",url:"https://www.un.org/en/black-sea-grain-initiative/background"},
 {id:"ukr-abu-dhabi",region:"ukraine",date:"2026-11-10",type:"talks",title:"Επαναλήφθηκαν αμερικανικά διαμεσολαβημένες συνομιλίες στο Άμπου Ντάμπι",detail:"Αντιπροσωπείες Ρωσίας και Ουκρανίας συζήτησαν ανθρωπιστικά ζητήματα και εγγυήσεις ασφάλειας. Η συνάντηση δεν παρήγαγε γενική εκεχειρία.",source:"Associated Press",url:"https://apnews.com/article/3d878a3e56d5df5bd198a6d20c824d18"},
 {id:"ukr-prisoner-exchange",region:"ukraine",date:"2026-11-11",type:"proposal",title:"Ανακοίνωση συμφωνίας για προετοιμασία ανταλλαγής αιχμαλώτων",detail:"Σύμφωνα με την AP, οι αντιπροσωπείες συμφώνησαν να οργανώσουν μεγάλη ανταλλαγή αιχμαλώτων. Πρόκειται για συμφωνία οργάνωσης, όχι απόδειξη ότι η ανταλλαγή ολοκληρώθηκε ή ότι επιτεύχθηκε ειρήνη.",source:"Associated Press",url:"https://apnews.com/article/7c8d1024302e0c6ad8be064eec852a64"},
 {id:"gaza-un-res",region:"gaza",date:"2024-06-10",type:"proposal",title:"Ψήφισμα ΣΑ ΟΗΕ 2735 για πρόταση εκεχειρίας σε τρεις φάσεις",detail:"Το Συμβούλιο Ασφαλείας υποστήριξε πρόταση με εκεχειρία, ανταλλαγές και ανθρωπιστική βοήθεια. Το ψήφισμα δεν σημαίνει ότι η πρόταση εφαρμόστηκε αυτόματα.",source:"UN Security Council",url:"https://www.un.org/unispal/document/sres2735-2024-10jun24/"},
 {id:"gaza-2025-deal",region:"gaza",date:"2025-01-15",type:"agreement",title:"Ανακοινώθηκε συμφωνία εκεχειρίας και απελευθέρωσης ομήρων",detail:"Ο Γενικός Γραμματέας του ΟΗΕ χαιρέτισε τη συμφωνία και κάλεσε τα μέρη να την εφαρμόσουν πλήρως.",source:"United Nations",url:"https://www.un.org/unispal/document/secretary-generals-statement-15jan25/"},
 {id:"gaza-2025-start",region:"gaza",date:"2025-01-19",type:"implemented",title:"Έναρξη ισχύος της εκεχειρίας της Γάζας",detail:"Σύμφωνα με την καταγραφή του Διεθνούς Δικαστηρίου που δημοσιεύτηκε από τον ΟΗΕ, η συμφωνία τέθηκε σε ισχύ στις 19 Ιανουαρίου 2025.",source:"United Nations / ICJ",url:"https://www.un.org/unispal/document/summary-advisory-opinion-icj-22oct25/"},
 {id:"gaza-2025-resume",region:"gaza",date:"2025-03-18",type:"setback",title:"Επανέναρξη στρατιωτικών επιχειρήσεων στη Γάζα",detail:"Η καταγραφή του Διεθνούς Δικαστηρίου αναφέρει επανέναρξη των ισραηλινών στρατιωτικών επιχειρήσεων στις 18 Μαρτίου 2025.",source:"United Nations / ICJ",url:"https://www.un.org/unispal/document/summary-advisory-opinion-icj-22oct25/"},
 {id:"iran-2025-un",region:"iranisrael",date:"2025-06-18",type:"setback",title:"Ο ΟΗΕ ζητά άμεση αποκλιμάκωση Ιράν–Ισραήλ",detail:"Ο Γενικός Γραμματέας περιέγραψε εντεινόμενη στρατιωτική σύγκρουση και ζήτησε κατάπαυση του πυρός.",source:"United Nations",url:"https://www.un.org/sg/en/content/sg/statements/2025-06-18/statement-the-secretary-general-the-need-for-ceasefire-between-israel-and-iran"},
 {id:"iran-2025-truce",region:"iranisrael",date:"2025-06-24",type:"agreement",title:"Ανακοίνωση κατάπαυσης πυρός μεταξύ Ιράν και Ισραήλ",detail:"Ο ΟΗΕ χαιρέτισε την ανακοίνωση κατάπαυσης πυρός από τις ΗΠΑ και κάλεσε τα δύο κράτη να την τηρήσουν. Δεν τεκμαίρεται μόνιμη ειρήνη.",source:"United Nations",url:"https://www.un.org/sg/en/content/highlight/2025-06-24.html"},
 {id:"usiran-jcpoa",region:"usiran",date:"2015-07-14",type:"agreement",title:"Συμφωνία JCPOA για το πυρηνικό πρόγραμμα του Ιράν",detail:"Η συμφωνία μεταξύ Ιράν και E3/EU+3 προέβλεπε περιορισμούς, εποπτεία και συνδεδεμένη άρση κυρώσεων. Δεν ήταν συνθήκη τερματισμού πολέμου.",source:"UN Department of Political and Peacebuilding Affairs",url:"https://dppa.un.org/en/node/101504"},
 {id:"usiran-exit",region:"usiran",date:"2018-05-08",type:"setback",title:"ΗΠΑ: αποχώρηση από τη συμφωνία JCPOA",detail:"Ο ΟΗΕ καταγράφει την αμερικανική αποχώρηση το 2018 ως σημαντική πρόκληση για την εφαρμογή της πυρηνικής συμφωνίας.",source:"UN Department of Political and Peacebuilding Affairs",url:"https://dppa.un.org/en/node/101504"},
 {id:"sudan-jeddah",region:"sudan",date:"2023-05-11",type:"agreement",title:"Διακήρυξη της Τζέντα για την προστασία αμάχων",detail:"Σουδανικές Ένοπλες Δυνάμεις και RSF υπέγραψαν δεσμεύσεις για προστασία αμάχων και ανθρωπιστική πρόσβαση. Δεν αποτελεί γενική συμφωνία ειρήνης.",source:"UN Human Rights Council",url:"https://mandates.un.org/mandate/A/HRC/RES/54/2"},
 {id:"drc-doha",region:"drc",date:"2025-07-19",type:"agreement",title:"Διακήρυξη Αρχών στην Ντόχα με AFC/M23",detail:"Η κυβέρνηση της ΛΔ Κονγκό και η AFC/M23 υπέγραψαν πλαίσιο αρχών. Ο ΟΗΕ κάλεσε σε ταχεία εφαρμογή.",source:"United Nations",url:"https://www.un.org/sg/en/content/sg/statement/2025-07-20/statement-attributable-the-spokesperson-for-the-secretary-general-the-declaration-of-principles-between-the-democratic-republic-of-the-congo-and-the-afcm23-scroll-down"},
 {id:"drc-verification",region:"drc",date:"2025-10-14",type:"implemented",title:"Συμφωνία δημιουργίας μηχανισμού επαλήθευσης εκεχειρίας",detail:"Ο ΟΗΕ κατέγραψε την υπογραφή μηχανισμού κοινής επαλήθευσης μεταξύ κυβέρνησης και AFC/M23. Η υπογραφή δεν αποδεικνύει πλήρη τήρηση της εκεχειρίας.",source:"United Nations",url:"https://www.un.org/sg/en/content/highlight/2025-10-14.html"},
 {id:"myanmar-truces",region:"myanmar",date:"2025-04-02",type:"proposal",title:"Ανακοινώσεις προσωρινών εκεχειριών μετά τον σεισμό",detail:"Μετά τον σεισμό, διάφορες πλευρές ανακοίνωσαν προσωρινές παύσεις εχθροπραξιών για ανθρωπιστικούς λόγους. Ο ΟΗΕ κατέγραψε και αναφορές για επιμέρους περιστατικά βίας.",source:"United Nations / UNHCR",url:"https://myanmar.un.org/en/292200-myanmar-earthquake-unhcr-flash-update-1"},
 {id:"yemen-truce",region:"yemen",date:"2022-04-02",type:"agreement",title:"Έναρξη δίμηνης εκεχειρίας υπό την αιγίδα ΟΗΕ",detail:"Η εκεχειρία περιέλαβε παύση επιθετικών επιχειρήσεων, διευκόλυνση εισαγωγής καυσίμων και εμπορικών πτήσεων.",source:"United Nations",url:"https://www.un.org/sg/en/content/sg/notes-correspondents/2022-04-01/note-correspondents-press-statement-the-un-special-envoy-for-yemen-hans-grundberg-two-month-truce"},
 {id:"yemen-renew",region:"yemen",date:"2022-06-02",type:"implemented",title:"Ανανέωση εκεχειρίας Υεμένης για επιπλέον δύο μήνες",detail:"Οι πλευρές συμφώνησαν παράταση των αρχικών όρων. Ο ΟΗΕ κατέγραψε μείωση της βίας και επανέναρξη εμπορικών πτήσεων.",source:"United Nations",url:"https://www.un.org/sg/en/content/sg/statements/2022-06-02/secretary-generals-statement-extension-of-nationwide-truce-yemen"},
 {id:"syria-sdf-march",region:"syria",date:"2025-03-10",type:"agreement",title:"Συμφωνία μεταξύ μεταβατικών αρχών της Συρίας και SDF",detail:"Ο ΟΗΕ χαιρέτισε συμφωνία της 10ης Μαρτίου και ζήτησε να συμβάλει σε μια ευρύτερη, χωρίς αποκλεισμούς πολιτική μετάβαση. Δεν επιβεβαιώνεται ότι εφαρμόστηκαν όλες οι δεσμεύσεις.",source:"United Nations",url:"https://www.un.org/sg/en/content/highlight/2025-03-11.html"},
 {id:"syria-sdf-jan",region:"syria",date:"2026-01-30",type:"agreement",title:"Νέα συμφωνία κυβέρνησης–SDF για τη βορειοανατολική Συρία",detail:"Ο ΟΗΕ χαιρέτισε τη συμφωνία και κάλεσε σε ταχεία, ειρηνική εφαρμογή της ένταξης, προστασία των αμάχων και σεβασμό δικαιωμάτων. Η ανακοίνωση δεν αποδεικνύει πλήρη εφαρμογή.",source:"United Nations",url:"https://www.un.org/sg/en/content/sg/statements/2026-01-30/statement-attributable-the-spokesperson-for-the-secretary-general-syria"},
]; 
PAX_MILESTONES.push(...PAX_HISTORY_EXTRA);
const PAX_LABELS={agreement:"ΣΥΜΦΩΝΙΑ",implemented:"ΕΦΑΡΜΟΓΗ",talks:"ΣΥΝΟΜΙΛΙΕΣ",proposal:"ΠΡΟΤΑΣΗ",setback:"ΑΔΙΕΞΟΔΟ / ΕΝΤΑΣΗ",other:"ΕΙΔΗΣΗ"};
const PAX_GROUP={talks:"talks",proposal:"talks",agreement:"deal",implemented:"deal",ceasefire:"deal",setback:"setback",other:"other"};
const PAX_TODAY=()=>new Date().toLocaleDateString("en-CA",{timeZone:"Europe/Athens"});
const PAX_DATE=s=>{const d=new Date(s+"T12:00:00Z");return new Intl.DateTimeFormat(paxLang()==="en"?"en-GB":"el-GR",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}).format(d)};
const PAX_TIMELINE={from:paxConflictStart("ukraine"),to:PAX_TODAY(),quick:"all",includePress:true,includeContext:false};
function paxTimelineEvents(){
 const id=state.selected;
 const curated=PAX_MILESTONES.filter(x=>x.region===id).map(x=>{
 const pair=PAX_HISTORY_TRANSLATIONS[x.id]||[];
 return {...x,title:paxLang()==="en"?(x.titleEn||pair[0]||x.title):(x.title),detail:paxLang()==="en"?(x.detailEn||pair[1]||x.detail):(x.detail),verified:true,sortDate:x.date};
 });
 const live=(state.rows[id]?.articles||[]).filter(x=>x.type!=="other").slice(0,14).map((a,i)=>({
  id:"press-"+id+"-"+i,region:id,date:a.publishedAt?.slice(0,10)||"",type:a.type==="ceasefire"?"agreement":a.type==="implemented"?"implemented":a.type==="proposal"?"proposal":a.type==="talks"?"talks":"setback",title:a.title,detail:"Αυτόματη ταξινόμηση ειδησεογραφικού τίτλου. Δεν έχει επικυρωθεί η πραγματοποίηση του γεγονότος. Η ίδια εξέλιξη ενδέχεται να καλύπτεται από περισσότερους εκδότες.",source:a.source,url:a.url,verified:false,sortDate:a.publishedAt?.slice(0,10)||""
 }));
 return {curated,live};
}
function paxRenderTimeline(){
 if(!document.getElementById("timelineList"))return;
 const region=REGIONS.find(r=>r.id===state.selected),ev=paxTimelineEvents();
 const onset=paxConflictStart(state.selected),cutoff=s=>s>=PAX_TIMELINE.from&&s<=PAX_TIMELINE.to&&(PAX_TIMELINE.includeContext||s>=onset);
 const curated=ev.curated.filter(x=>cutoff(x.date));
 const press=PAX_TIMELINE.includePress?ev.live.filter(x=>x.date>=onset&&cutoff(x.date)):[];
 const all=curated.concat(press).sort((a,b)=>b.date.localeCompare(a.date)||Number(b.verified)-Number(a.verified));
 const count=type=>curated.filter(x=>PAX_GROUP[x.type]===type).length;
 document.getElementById("timelineRegionName").textContent=region.name;
 document.getElementById("timelineTotal").textContent=ev.curated.filter(x=>PAX_TIMELINE.includeContext||x.date>=onset).length.toString().padStart(2,"0");
 document.getElementById("timelineFrom").min=PAX_TIMELINE.includeContext?"2011-01-01":onset;
 document.getElementById("timelineStartMeta").textContent=(paxLang()==="en"?"CONFLICT PHASE: ":"ΕΝΑΡΞΗ ΦΑΣΗΣ: ")+PAX_DATE(onset);
 document.getElementById("timelineStartDescription").textContent=PAX_CONFLICT_START[state.selected][paxLang()];
 document.getElementById("timelineFrom").value=PAX_TIMELINE.from;
 document.getElementById("timelineTo").value=PAX_TIMELINE.to;
 document.getElementById("timelineTalks").textContent=count("talks");
 document.getElementById("timelineDeals").textContent=count("deal");
 document.getElementById("timelineSetbacks").textContent=count("setback");
 document.getElementById("timelineShown").textContent=curated.length;
 const earliest=curated.length?curated[0]:null,latest=curated.length?curated[curated.length-1]:null;
 const en=paxLang()==="en";
 let summary='<b>'+(en?"COMPARISON ":"ΣΥΓΚΡΙΣΗ ")+esc(PAX_DATE(PAX_TIMELINE.from))+' — '+esc(PAX_DATE(PAX_TIMELINE.to))+'</b> · ';
 if(PAX_TIMELINE.from>PAX_TIMELINE.to)summary+=en?"The start date must be earlier than the end date.":"Η ημερομηνία έναρξης πρέπει να προηγείται της λήξης.";
 else if(!curated.length)summary+=en?"No curated milestones in this period. The archive is selective, not comprehensive.":"Δεν υπάρχουν επιμελημένα ορόσημα μέσα στο επιλεγμένο διάστημα. Το ιστορικό είναι επιλεκτικό, όχι ολοκληρωμένο.";
 else summary+=en?
   curated.length+' documented milestones: '+count("talks")+' talks/proposals, '+count("deal")+' agreements/implementation measures and '+count("setback")+' setbacks. First: “'+esc(earliest.title)+'”. Latest: “'+esc(latest.title)+'”.':
   'Καταγράφονται '+curated.length+' τεκμηριωμένα ορόσημα: '+count("talks")+' συνομιλίες/προτάσεις, '+count("deal")+' συμφωνίες/ενέργειες εφαρμογής και '+count("setback")+' εμπόδια/κλιμακώσεις. Πρώτο: «'+esc(earliest.title)+'». Πιο πρόσφατο: «'+esc(latest.title)+'».';
 if(press.length)summary+=en?' Also '+press.length+' recent unverified headlines are shown; they are not included in milestone counts.':
  ' Επίσης εμφανίζονται '+press.length+' πρόσφατοι ανεπιβεβαίωτοι τίτλοι, οι οποίοι δεν μετρούν στα ιστορικά ορόσημα.';
 if(!PAX_TIMELINE.includeContext)summary+=en?' Events before the defined phase start are excluded.':' Γεγονότα πριν από την έναρξη της επιλεγμένης φάσης εξαιρούνται.';

 document.getElementById("timelineComparison").innerHTML=summary;
 document.getElementById("timelineList").innerHTML=all.length?all.map(x=>
  '<article class="timeline-event"><div class="timeline-event-time">'+esc(PAX_DATE(x.date))+
  '<small>'+(x.datePrecision==="month"?(paxLang()==="en"?"MONTH / APPROX.":"ΜΗΝΑΣ / ΕΝΔΕΙΚΤΙΚΗ ΗΜΕΡΟΜΗΝΙΑ"):(x.verified?"CURATED RECORD":"LIVE NEWS"))+'</small></div>'+
  '<div class="timeline-event-body"><h4>'+esc(x.title)+'</h4><p>'+esc(x.detail)+'</p>'+
  '<a target="_blank" rel="noopener noreferrer" href="'+esc(validLink(x.url))+'">ΠΗΓΗ: '+esc(x.source||"Δημοσίευμα")+' ↗</a></div>'+
  '<div class="timeline-event-status"><span class="marker '+(x.verified?"positive":"press")+'">'+esc(PAX_LABELS[x.type]||"ΑΝΑΦΟΡΑ")+'</span><small>'+(x.verified?"Καταγεγραμμένο με πηγή":"Αυτόματος τίτλος · μη διασταυρωμένος")+'</small></div></article>').join("")
 :'<div class="timeline-noevents">Δεν υπάρχουν καταγεγραμμένα γεγονότα σε αυτό το χρονικό διάστημα. Δοκίμασε μεγαλύτερη περίοδο ή άλλη σύγκρουση.</div>';
 document.querySelectorAll(".timeline-actions button").forEach(button=>button.classList.toggle("active",button.dataset.window===PAX_TIMELINE.quick));
}
function paxTimelineInit(){
 const from=document.getElementById("timelineFrom"),to=document.getElementById("timelineTo"),press=document.getElementById("timelinePress");
 from.max=PAX_TODAY();to.max=PAX_TODAY();to.value=PAX_TODAY();from.min=paxConflictStart(state.selected);
 from.addEventListener("change",()=>{PAX_TIMELINE.from=from.value;PAX_TIMELINE.quick="";paxRenderTimeline()});
 to.addEventListener("change",()=>{PAX_TIMELINE.to=to.value;PAX_TIMELINE.quick="";paxRenderTimeline()});
 press.addEventListener("change",()=>{PAX_TIMELINE.includePress=press.checked;paxRenderTimeline()});
 document.querySelectorAll(".timeline-actions button").forEach(button=>button.addEventListener("click",()=>{
   const n=button.dataset.window;PAX_TIMELINE.quick=n;PAX_TIMELINE.to=PAX_TODAY();
   if(n==="all")PAX_TIMELINE.from=PAX_TIMELINE.includeContext?"2011-01-01":paxConflictStart(state.selected);
   else {const date=new Date(PAX_TIMELINE.to+"T12:00:00Z");date.setUTCDate(date.getUTCDate()-Number(n));PAX_TIMELINE.from=date.toISOString().slice(0,10);}
   paxRenderTimeline();
 }));
 document.getElementById("timelineContext").addEventListener("change",event=>{
 PAX_TIMELINE.includeContext=event.target.checked;
 if(PAX_TIMELINE.quick==="all")PAX_TIMELINE.from=PAX_TIMELINE.includeContext?"2011-01-01":paxConflictStart(state.selected);
 else if(!PAX_TIMELINE.includeContext&&PAX_TIMELINE.from<paxConflictStart(state.selected))PAX_TIMELINE.from=paxConflictStart(state.selected);
 paxRenderTimeline();
 });
 document.addEventListener("pax:selection",()=>{
  if(PAX_TIMELINE.quick==="all")PAX_TIMELINE.from=PAX_TIMELINE.includeContext?"2011-01-01":paxConflictStart(state.selected);
  else if(!PAX_TIMELINE.includeContext&&PAX_TIMELINE.from<paxConflictStart(state.selected))PAX_TIMELINE.from=paxConflictStart(state.selected);
  paxRenderTimeline()
 });
 document.addEventListener("pax:language",paxRenderTimeline);
 document.addEventListener("pax:data",paxRenderTimeline);
 paxRenderTimeline();
}
paxTimelineInit();
