/* PAX bilingual presentation: Greek default, English toggle.
   Original content and sources remain intact; titles of external news are never machine-translated. */
const PAX_LANG_KEY="pax-language-v1";
let PAX_LANGUAGE="el";
try{PAX_LANGUAGE=localStorage.getItem(PAX_LANG_KEY)==="en"?"en":"el"}catch{}
function paxLang(){return PAX_LANGUAGE}
const PAX_EN_TEXT=new Map([
 ["Επισκόπηση","Overview"],["Μεθοδολογία","Methodology"],["ΑΝΑΝΕΩΣΗ","REFRESH"],["↻ ΑΝΑΝΕΩΣΗ","↻ REFRESH"],
 ["Άνοιγμα ειδοποιήσεων","Open alerts"],["Κλείσιμο ειδοποιήσεων","Close alerts"],
 ["Στοιχεία κάλυψης","Coverage statistics"],["Πόλεμος, διπλωματία και διαπραγματεύσεις. Όχι άλλη μία ροή τίτλων — αλλά ένας χάρτης του τι αλλάζει, γιατί αλλάζει και τι πραγματικά τεκμηριώνεται.","War, diplomacy and negotiation. Not just another stream of headlines — a map of what is changing, why it matters and what the evidence actually supports."],
 ["ΔΕΣ ΤΟ PEACE MONITOR","EXPLORE THE EVIDENCE MONITOR"],["ΠΩΣ ΥΠΟΛΟΓΙΖΕΤΑΙ ↗","OUR METHODOLOGY ↗"],
 ["Οι διπλωματικές επαφές δεν είναι το ίδιο με την κατάπαυση του πυρός. Το PAX παρακολουθεί τα δύο ξεχωριστά, με παραπομπές σε δημοσιεύματα.","Diplomatic contacts are not the same as a ceasefire. PAX tracks both separately with links to the reporting."],
 ["ΠΕΡΙΟΧΕΣ ΠΑΡΑΚΟΛΟΥΘΗΣΗΣ","CONFLICTS MONITORED"],["επιλεγμένοι φάκελοι","selected conflict files"],
 ["ΔΗΜΟΣΙΕΥΜΑΤΑ 7 ΗΜΕΡΩΝ","REPORTS IN LAST 7 DAYS"],["μόνο όσα ανακτήθηκαν","retrieved coverage only"],["ΠΗΓΕΣ / ΕΚΔΟΤΕΣ","PUBLISHERS"],["δεν σημαίνει ανεξάρτητη επιβεβαίωση","does not establish independent verification"],["ΤΕΛΕΥΤΑΙΟΣ ΕΛΕΓΧΟΣ","LAST CHECK"],["τοπική ώρα Ελλάδας","Athens local time"],
 ["Επιλεγμένες περιοχές παρακολούθησης. Οι δείκτες είναι γεωγραφικές αναφορές, όχι ζωντανές θέσεις στρατιωτικών επιχειρήσεων.","Selected conflict regions. Map markers are geographic references, not live military positions."],
 ["Ο χάρτης φορτώνει…","Loading map…"],["Επιλεγμένη περιοχή","Selected region"],["ΕΠΙΛΕΞΕ ΣΗΜΕΙΟ ΓΙΑ ΑΝΑΛΥΣΗ ↗","SELECT A REGION TO EXPLORE ↗"],
 ["— Περιγραφικές κατηγορίες από δημοσιεύματα, όχι πρόβλεψη ειρήνης.","— Qualitative news coverage categories, not peace forecasts."],
 ["Τι δημοσιεύεται για τις συνομιλίες και τι για την κλιμάκωση; Χωρίς ατεκμηρίωτα ποσοστά ειρήνης.","What are outlets reporting about diplomacy and escalation? Without unsupported peace percentages."],
 ["Επιλογή γεωπολιτικού φακέλου","Select conflict file"],["Προβολή","Show"],
 ["Διαπραγματεύσεις · Εκεχειρία · Εξέλιξη","Negotiations · Ceasefire · Developments"],["ΑΝΑΚΤΗΣΗ","LOADING"],
 ["ΕΝΔΕΙΞΕΙΣ ΔΗΜΟΣΙΕΥΜΑΤΩΝ / ΟΧΙ ΠΟΣΟΣΤΟ ΕΙΡΗΝΗΣ","HEADLINE SIGNALS / NOT A PEACE PROBABILITY"],
 ["Αναζήτηση επαρκούς κάλυψης…","Evaluating available coverage…"],
 ["ΟΜΑΔΕΣ ΤΙΤΛΩΝ ΔΙΠΛΩΜΑΤΙΑΣ","DIPLOMACY HEADLINE CLUSTERS"],["ΟΜΑΔΕΣ ΤΙΤΛΩΝ ΕΝΤΑΣΗΣ","ESCALATION HEADLINE CLUSTERS"],
 ["Συνομιλίες, προτάσεις, συμφωνίες, εφαρμογή","Talks, proposals, deals and implementation"],["Επιθέσεις, παραβιάσεις, απόρριψη, αδιέξοδο","Attacks, violations, rejection and deadlock"],
 ["Δεν εμφανίζουμε πλέον ψευδή βαθμολογία 0–100.","We no longer publish an unsupported 0–100 score."],
 ["Οι περιγραφές προκύπτουν από ομάδες παρόμοιων τίτλων και μπορούν να κάνουν λάθη. Η πολλαπλή κάλυψη δεν ισοδυναμεί με ανεξάρτητη επιβεβαίωση.","Descriptions are inferred from similar headline clusters and can be wrong. Multiple outlets do not establish independent confirmation."],
 ["Φόρτωση τεκμηρίων…","Loading evidence…"],
 ["Τεκμηριωμένα ιστορικά ορόσημα μαζί με πρόσφατες αναφορές. Επίλεξε περιοχή και σύγκρινε περιόδους χωρίς τεχνητές «πιθανότητες».","Documented historical milestones alongside recent reports. Select a conflict and compare dates without fabricated probabilities."],
 ["Ιστορικά ορόσημα από συγκεκριμένες πηγές. Πρόσφατοι τίτλοι εμφανίζονται ξεχωριστά ως μη επαληθευμένες αναφορές.","Source-linked historical milestones. Recent headlines appear separately as unverified reporting."],
 ["ΑΠΟ","FROM"],["ΕΩΣ","TO"],["ΟΛΟ ΤΟ ΑΡΧΕΙΟ","FULL ARCHIVE"],["12 ΜΗΝΕΣ","12 MONTHS"],["30 ΗΜΕΡΕΣ","30 DAYS"],["7 ΗΜΕΡΕΣ","7 DAYS"],["Πρόσφατοι τίτλοι","Recent headlines"],
 ["ΣΥΝΟΜΙΛΙΕΣ / ΠΡΟΤΑΣΕΙΣ","TALKS / PROPOSALS"],["ΣΥΜΦΩΝΙΕΣ / ΕΦΑΡΜΟΓΗ","AGREEMENTS / IMPLEMENTATION"],["ΑΔΙΕΞΟΔΑ / ΕΧΘΡΟΠΡΑΞΙΕΣ","SETBACKS / HOSTILITIES"],["ΚΑΤΑΓΕΓΡΑΜΜΕΝΑ ΓΕΓΟΝΟΤΑ","DOCUMENTED MILESTONES"],
 ["Επίλεξε ημερομηνίες για να δεις τις καταγεγραμμένες μεταβολές.","Select two dates to review documented developments."],
 ["Τα επιμελημένα ιστορικά γεγονότα έχουν ξεχωριστή πηγή. Οι πρόσφατοι τίτλοι προέρχονται αυτόματα από τις ειδησεογραφικές ροές, χωρίς διασταύρωση. Το αρχείο είναι επιλεκτικό και όχι πλήρης ιστορία της σύγκρουσης.","Curated historical events link to individual sources. Recent headlines are automatically imported and unverified. This is a selective record, not a complete history of the conflict."],
 ["Πηγές, ομοιότητες δημοσιευμάτων και ανοιχτά ερωτήματα διπλωματίας. Η επανάληψη δεν είναι επιβεβαίωση.","Sources, overlapping coverage and unresolved diplomatic questions. Repetition is not verification."],
 ["Ανακτώνται δημοσιεύματα…","Retrieving reporting…"],["ΟΜΑΔΕΣ ΤΙΤΛΩΝ","HEADLINE CLUSTERS"],
 ["Ο αριθμός δίπλα σε κάθε feed είναι το πλήθος τίτλων που ανακτήθηκαν πριν το φιλτράρισμα της συγκεκριμένης σύγκρουσης. Επιτυχής σύνδεση δεν σημαίνει ότι επέστρεψε χρήσιμα άρθρα.","The raw item count for each feed is before conflict-specific filtering. A working feed may still yield no relevant articles."],
 ["Αυτά είναι ερευνητικά ερωτήματα, όχι επιβεβαιωμένες επίσημες θέσεις των μερών.","These are research questions, not verified official negotiating positions."],
 ["Συστάδες παρόμοιων τίτλων με συνδέσμους προς κάθε εκδότη. Η ομαδοποίηση είναι ευρετική.","Clusters of similar headlines with links to each publisher. Grouping is heuristic."],
 ["Δεδομένα FRED","FRED data"],["Πραγματικές ιστορικές τιμές. Μια συσχέτιση χρονικά με τον πόλεμο δεν αποδεικνύει αιτιότητα.","Actual historical observations. Timing alongside a conflict does not establish causality."],
 ["Οι οικονομικές σειρές διαφέρουν σε συχνότητα και ημερομηνία ενημέρωσης. Τα ποσοστά μεταβολής συγκρίνουν διαθέσιμες παρατηρήσεις της ίδιας σειράς, όχι πάντα ίσα ημερολογιακά διαστήματα. Δεν αποτελούν επενδυτικό σήμα.","Economic series have different frequencies and observation dates. Percentage changes compare available observations, not necessarily equal calendar periods. These are not trading signals."],
 ["Τίτλοι και σύνδεσμοι από πρωτότυπους εκδότες μέσω δημόσιων aggregators. Η εμφάνιση δεν συνιστά ανεξάρτητη επαλήθευση του περιεχομένου.","Headlines and original publisher links via public news aggregators. Inclusion does not independently verify the story."],
 ["ΟΛΑ","ALL"],["ΔΙΑΠΡΑΓΜΑΤΕΥΣΕΙΣ","NEGOTIATIONS"],["ΕΚΕΧΕΙΡΙΑ / ΣΥΜΦΩΝΙΕΣ","CEASEFIRES / DEALS"],["ΚΛΙΜΑΚΩΣΗ","ESCALATION"],["Αναζήτηση ειδήσεων","Search news"],["Αναζήτηση τίτλων…","Search headlines…"],
 ["Το PAX συγκρίνει τις ενδείξεις με την προηγούμενη αποθηκευμένη επίσκεψή σου σε αυτόν τον browser.","PAX compares signals against the previous observation saved in this browser."],
 ["Το bell panel εντοπίζει νέους τίτλους και — μόνο μετά από άδεια χρήστη — εμφανίζει ειδοποιήσεις browser όσο η σελίδα είναι ανοιχτή. Δεν υπάρχει background push όταν κλείσει το site, ούτε αυτόματη επιβεβαίωση χτυπήματος.","The alert panel detects new headlines and can show opt-in browser notifications while the page is open. There is no push after the website is closed, nor real-time verification of attacks."],
 ["Το παλιό αριθμητικό Peace Proximity Index αποσύρθηκε επειδή μετρούσε λέξεις και τίτλους χωρίς επιστημονική βαθμονόμηση. Το νέο","The old numerical Peace Proximity Index was removed because it counted headline keywords without scientific calibration. The new"],
 ["παρουσιάζει περιγραφικά σήματα με βάση ομάδες παρόμοιων τίτλων. Δεν υπολογίζει πιθανότητες ούτε βαθμολογεί πολιτικούς δρώντες.","shows descriptive signals based on similar-headline clusters. It does not compute probabilities or score political actors."],
 ["Το","The"],["συγκρίνει δημοσιεύματα από πολλαπλές δημόσιες ροές. Η ομαδοποίηση βασίζεται σε ομοιότητα κειμένου και χρονική εγγύτητα και μπορεί να ομαδοποιήσει διαφορετικά γεγονότα ή να μην ενώσει διπλά άρθρα. Δύο εκδότες μπορούν να αναπαράγουν το ίδιο πρακτορείο· επομένως η πολλαπλή κάλυψη δεν αποδεικνύει ανεξάρτητη διασταύρωση. Τα ερωτήματα διαπραγμάτευσης είναι γενικά σημεία προς διερεύνηση.","compares articles from multiple public feeds. Text similarity and publication timing can merge distinct events or miss duplicates. Outlets may republish the same wire service, so coverage diversity is not independent corroboration. Negotiation questions are for research, not established facts."],
 ["Η ανάκτηση συνδυάζει","Reporting combines"],[", ανάλογα με τη διαθεσιμότητα. Τα feeds μπορεί να είναι ελλιπή ή καθυστερημένα. Δεν υπάρχει συντακτική επιμέλεια ή χειροκίνητη επικύρωση και το σύστημα εμφανίζει ειλικρινώς την έλλειψη δεδομένων.",", subject to availability. Feeds may be incomplete or delayed, and headlines are not manually fact-checked."],
 ["Δεδομένα μόνο από διαθέσιμα δημόσια δημοσιεύματα.","Data from publicly available reporting only."],
 ["ΑΝΑΦΟΡΑ ΧΤΥΠΗΜΑΤΟΣ","REPORTED STRIKE"],["ΔΙΠΛΩΜΑΤΙΑ / ΣΥΜΦΩΝΙΑ","DIPLOMACY / AGREEMENT"],
 ["Νέες δημοσιεύσεις για αναφερόμενα χτυπήματα, κλιμάκωση και διπλωματία. Η ταξινόμηση τίτλων","New headlines reporting strikes, escalation and diplomacy. Headline classification"],
 ["δεν επαληθεύει το γεγονός","does not verify an event"],
 ["Αναφορές χτυπημάτων","Reported strikes"],["Διπλωματία / εκεχειρία","Diplomacy / ceasefires"],
 ["ΕΝΕΡΓΟΠΟΙΗΣΗ BROWSER ALERTS","ENABLE BROWSER ALERTS"],["ΣΗΜΕΙΩΣΗ ΟΛΩΝ ΩΣ ΑΝΑΓΝΩΣΜΕΝΩΝ","MARK ALL AS READ"],
 ["Οι ειδοποιήσεις browser λειτουργούν μόνο όσο η εφαρμογή είναι ανοιχτή.","Browser notifications only work while this page is open."],
 ["WATCH WINDOW: 72 ΩΡΕΣ · NEWS AGGREGATORS · ΧΩΡΙΣ ΖΩΝΤΑΝΗ ΕΠΙΒΕΒΑΙΩΣΗ","WATCH WINDOW: 72 HOURS · NEWS AGGREGATORS · NOT LIVE VERIFIED"],
 ["Ρωσία — Ουκρανία","Russia — Ukraine"],["Ισραήλ — Παλαιστίνη / Γάζα","Israel — Palestine / Gaza"],
 ["Ιράν — Ισραήλ","Iran — Israel"],["ΗΠΑ — Ιράν","United States — Iran"],["Σουδάν","Sudan"],["Λ.Δ. Κονγκό / M23","DR Congo / M23"],
 ["Μιανμάρ","Myanmar"],["Υεμένη","Yemen"],["Συρία","Syria"],
 ["ΟΥΚΡΑΝΙΑ","UKRAINE"],["ΓΑΖΑ","GAZA"],["ΙΡΑΝ / ΙΣΡΑΗΛ","IRAN / ISRAEL"],["ΗΠΑ / ΙΡΑΝ","US / IRAN"],["ΣΟΥΔΑΝ","SUDAN"],["ΚΟΝΓΚΟ","CONGO"],["ΜΙΑΝΜΑΡ","MYANMAR"],["ΥΕΜΕΝΗ","YEMEN"],["ΣΥΡΙΑ","SYRIA"],["ΙΡΑΝ","IRAN"],
 ["Ευρωπαϊκή ασφάλεια · Διαπραγματεύσεις","European security · Negotiations"],["Κατάπαυση πυρός · Ανθρωπιστική κατάσταση","Ceasefire · Humanitarian situation"],["Περιφερειακή ένταση · Διπλωματία","Regional tension · Diplomacy"],["Πυρηνικές διαπραγματεύσεις · Κυρώσεις","Nuclear talks · Sanctions"],["Εσωτερική σύγκρουση · Μεσολάβηση","Internal conflict · Mediation"],["Ανατολικό Κονγκό · Διαβουλεύσεις","Eastern Congo · Peace talks"],["Εσωτερική σύγκρουση · Εκεχειρίες","Internal conflict · Ceasefires"],["Περιφερειακές επιχειρήσεις · Διαμεσολάβηση","Regional military action · Mediation"],["Περιφερειακή σταθεροποίηση","Regional stabilization"],
 ["ΜΗ ΔΙΑΘΕΣΙΜΟ","UNAVAILABLE"],["ΜΕΙΚΤΑ ΣΗΜΑΤΑ","MIXED COVERAGE"],["ΑΝΑΦΟΡΕΣ ΣΥΜΦΩΝΙΑΣ","AGREEMENT REPORTING"],["ΠΑΡΑΛΛΗΛΕΣ ΕΞΕΛΙΞΕΙΣ","PARALLEL DEVELOPMENTS"],["ΔΙΠΛΩΜΑΤΙΚΗ ΚΙΝΗΣΗ","DIPLOMATIC ACTIVITY"],["ΑΝΑΦΟΡΕΣ ΕΝΤΑΣΗΣ","ESCALATION REPORTING"],["ΧΩΡΙΣ ΣΑΦΕΣ ΣΗΜΑ","NO CLEAR SIGNAL"],
 ["ΣΦΑΛΜΑ ΠΗΓΗΣ","SOURCE ERROR"],["ΠΟΛΛΑΠΛΗ ΚΑΛΥΨΗ","MULTIPLE OUTLETS"],["ΠΕΡΙΟΡΙΣΜΕΝΗ ΚΑΛΥΨΗ","LIMITED COVERAGE"],
 ["ΔΙΑΠΡΑΓΜΑΤΕΥΣΕΙΣ","TALKS"],["ΕΙΡΗΝΕΥΤΙΚΗ ΠΡΟΤΑΣΗ","PEACE PROPOSAL"],["ΕΚΕΧΕΙΡΙΑ / ΣΥΜΦΩΝΙΑ","CEASEFIRE / DEAL"],["ΕΦΑΡΜΟΓΗ ΜΕΤΡΩΝ","IMPLEMENTATION"],["ΚΛΙΜΑΚΩΣΗ / ΕΜΠΟΔΙΟ","ESCALATION / SETBACK"],["ΓΕΩΠΟΛΙΤΙΚΗ ΕΙΔΗΣΗ","GEOPOLITICAL NEWS"],
 ["ΣΥΜΦΩΝΙΑ","AGREEMENT"],["ΕΦΑΡΜΟΓΗ","IMPLEMENTATION"],["ΣΥΝΟΜΙΛΙΕΣ","TALKS"],["ΠΡΟΤΑΣΗ","PROPOSAL"],["ΑΔΙΕΞΟΔΟ / ΕΝΤΑΣΗ","DEADLOCK / TENSION"],["ΕΙΔΗΣΗ","NEWS"],
 ["Καταγεγραμμένο με πηγή","Source-linked record"],["Αυτόματος τίτλος · μη διασταυρωμένος","Auto-imported · unverified"],
 ["Έναρξη σύγκρουσης","Conflict phase start"],["ΜΗΝΑΣ / ΕΝΔΕΙΚΤΙΚΗ ΗΜΕΡΟΜΗΝΙΑ","MONTH / APPROXIMATE DATE"],
 ["Προεπιλεγμένη περίοδος: από την έναρξη της τρέχουσας φάσης.","Default period: from the start of the current conflict phase."],
 ["Όλες οι ημερομηνίες είναι ημερομηνίες γεγονότων, όχι κατ' ανάγκη δημοσίευσης των πηγών.","Dates refer to events, not necessarily source publication dates."],
 ["Σχετικά ιστορικά στοιχεία εκτός τρέχουσας φάσης","Earlier background events, outside this conflict phase"],
 ["Εμφάνιση παλαιότερου ιστορικού πλαισίου","Show older contextual history"],
 ["Κρυφό παλαιότερο πλαίσιο","Earlier context hidden"],
 ["Μόνο δημοσιεύματα μετά την έναρξη της τρέχουσας φάσης","Only reports after the current conflict phase began"],
 ["Προβολή ιστορικού αρχείου","Explore historical archive"]
]);
const PAX_ORIGINAL_TEXT=new WeakMap(),PAX_ORIGINAL_ATTR=new WeakMap();
function paxTranslateText(value){
 const raw=String(value),trim=raw.trim();if(!trim)return raw;
 const found=PAX_EN_TEXT.get(trim);if(found)return raw.replace(trim,found);
 const pattern=[
 [/^(\d+) ομάδες τίτλων$/,(m,n)=>n+" headline groups"],
 [/^(\d+) ομάδες παρόμοιων τίτλων$/,(m,n)=>n+" similar-headline clusters"],
 [/^(\d+) εκδότες$/,(m,n)=>n+" publishers"],
 [/^(\d+) άρθρα$/,(m,n)=>n+" articles"],
 [/^(\d+) ΕΚΔΟΤΕΣ$/,(m,n)=>n+" PUBLISHERS"],
 [/^(\d+) ΕΚΔΟΤΗΣ$/,(m,n)=>n+" PUBLISHER"],
 [/^(\d+) δημοσιεύματα$/,(m,n)=>n+" articles"],
 [/^(\d+) \/ (\d+) χρονοσειρές διαθέσιμες$/,(m,a,b)=>a+" / "+b+" series available"],
 [/^Αναφορά: (.*)$/,(m,a)=>"Report: "+a],
 [/^ΠΗΓΗ: (.*) ↗$/,(m,a)=>"SOURCE: "+a+" ↗"]
 ];
 for(const [rx,fn] of pattern){const match=trim.match(rx);if(match)return raw.replace(trim,fn(...match))}
 return raw;
}
function paxTranslateTree(root){
 if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes){
  const parent=node.parentElement;if(!parent||/^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE)$/.test(parent.tagName))continue;
  if(!PAX_ORIGINAL_TEXT.has(node))PAX_ORIGINAL_TEXT.set(node,node.nodeValue);
  const original=PAX_ORIGINAL_TEXT.get(node),target=PAX_LANGUAGE==="en"?paxTranslateText(original):original;
  if(node.nodeValue!==target)node.nodeValue=target;
 }
 const all=root.nodeType===1?[root,...root.querySelectorAll("*")]:[...document.querySelectorAll("*")];
 for(const el of all){
  for(const name of ["placeholder","aria-label","title"]){
   if(!el.hasAttribute?.(name))continue;
   let originals=PAX_ORIGINAL_ATTR.get(el);if(!originals){originals={};PAX_ORIGINAL_ATTR.set(el,originals)}
   if(!(name in originals))originals[name]=el.getAttribute(name);
   const desired=PAX_LANGUAGE==="en"?paxTranslateText(originals[name]):originals[name];
   if(el.getAttribute(name)!==desired)el.setAttribute(name,desired);
  }
 }
 document.documentElement.lang=PAX_LANGUAGE;
 const button=document.getElementById("languageSwitch");
 if(button){button.textContent=PAX_LANGUAGE==="el"?"EN":"ΕΛ";button.setAttribute("aria-label",PAX_LANGUAGE==="el"?"Switch to English":"Αλλαγή στα ελληνικά");button.setAttribute("title",PAX_LANGUAGE==="el"?"English version":"Ελληνική έκδοση")}
}
function paxSetLanguage(next){
 if(next!=="el"&&next!=="en")return;
 PAX_LANGUAGE=next;try{localStorage.setItem(PAX_LANG_KEY,next)}catch{}
 document.dispatchEvent(new CustomEvent("pax:language",{detail:{lang:next}}));
 paxTranslateTree(document.body);
}
function paxI18nInit(){
 document.getElementById("languageSwitch")?.addEventListener("click",()=>paxSetLanguage(PAX_LANGUAGE==="el"?"en":"el"));
 const observer=new MutationObserver(records=>{
  if(PAX_LANGUAGE!=="en")return;
  const roots=new Set();for(const r of records){if(r.type==="childList")for(const n of r.addedNodes)if(n.nodeType===1)roots.add(n);else if(n.nodeType===3)roots.add(n.parentElement)}
  for(const root of roots)if(root)paxTranslateTree(root);
 });
 observer.observe(document.body,{childList:true,subtree:true});
 paxTranslateTree(document.body);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",paxI18nInit);else paxI18nInit();
