/* PAX bilingual presentation: Greek default, English toggle.
   Original content and sources remain intact; titles of external news are never machine-translated. */
const PAX_LANG_KEY="pax-language-v1";
let PAX_LANGUAGE="el";
try{PAX_LANGUAGE=localStorage.getItem(PAX_LANG_KEY)==="en"?"en":"el"}catch{}
function paxLang(){return PAX_LANGUAGE}
const PAX_EN_TEXT=new Map([
 ["Επισκόπηση","Overview"],["Δελτίο","Daily brief"],["Τεκμήρια","Evidence"],["Διαδικασία","Peace process"],["Διαπραγμάτευση","Dealbreakers"],["Χρονομηχανή","Time machine"],["Παίγνια","Game theory"],["Ροή","Live wire"],["Πηγές","Sources"],["Μεθοδολογία","Methodology"],["ΑΝΑΝΕΩΣΗ","REFRESH"],["↻ ΑΝΑΝΕΩΣΗ","↻ REFRESH"],
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
/* Additional dynamic component and methodology translations. */
for(const [gr,en] of [
 ["Η ανάκτηση απέτυχε","Fetch failed"],["Ανάκτηση…","Loading…"],["Δεν ανακτήθηκαν δημοσιεύματα — καμία ερμηνεία δεν είναι διαθέσιμη.","No reports retrieved — no assessment possible."],
 ["Περιγραφή τάσεων σε τίτλους της εβδομάδας· όχι βαθμολογία ειρήνης ή πρόβλεψη.","This week's reported signals, not a peace score or forecast."],
 ["Λίγες διακριτές ειδήσεις ή εκδότες — δεν εξάγεται αξιόπιστη ένδειξη.","Too few distinct reports or publishers for a reliable signal."],
 ["Δεν ανακτήθηκαν δεδομένα και δεν υπολογίζεται δείκτης.","No data retrieved; no descriptive assessment is available."],
 ["Δεν βρέθηκαν σαφείς τίτλοι που να υποστηρίζουν συμπέρασμα.","No clear headlines support a conclusion."],
 ["Δεν υπάρχουν δημοσιεύματα που να ταιριάζουν σε αυτό το φίλτρο. Έλεγξε τις πηγές ή δοκίμασε άλλο φίλτρο.","No articles match this filter. Check the sources or try another filter."],
 ["Η τωρινή εικόνα βασίζεται σε πρόσφατους τίτλους. Το PAX δεν μετατρέπει περισσότερη ειδησεογραφία σε μεγαλύτερη «πιθανότητα ειρήνης».","The current view is based on recent reporting. PAX does not turn additional headlines into a higher chance of peace."],
 ["Δεν φορτώθηκαν οι βιβλιοθήκες του χάρτη.","The map libraries could not be loaded."],["Ο γεωγραφικός χάρτης δεν είναι προσωρινά διαθέσιμος.","The geographic map is temporarily unavailable."],
 ["Αυτόματη ταξινόμηση ειδησεογραφικού τίτλου. Δεν έχει επικυρωθεί η πραγματοποίηση του γεγονότος. Η ίδια εξέλιξη ενδέχεται να καλύπτεται από περισσότερους εκδότες.","Automatically classified news headline. The underlying event has not been verified. Multiple outlets may cover the same development."],
 ["Δεν υπάρχουν καταγεγραμμένα γεγονότα σε αυτό το χρονικό διάστημα. Δοκίμασε μεγαλύτερη περίοδο ή άλλη σύγκρουση.","No recorded events for this period. Try a longer window or another conflict."],
 ["Δημοσίευμα","News report"],["ΑΝΑΦΟΡΑ","REPORT"],
 ["ΕΝΕΡΓΗ ΡΟΗ","ACTIVE FEED"],["ΜΕΜΟΝΩΜΕΝΗ ΠΗΓΗ","SINGLE SOURCE"],
 ["Έλεγχος παρόχων σε εξέλιξη…","Checking providers…"],["Δεν υπάρχουν διαθέσιμα διαγνωστικά πηγών.","Source diagnostics unavailable."],["Δεν υπάρχουν διαθέσιμα στοιχεία για συγκριτική ανάλυση πηγών.","No data are available for source comparison."],
 ["Ομαδοποίηση ομοιότητας τίτλων, όχι διασταύρωση","Grouped by headline similarity, not verified"],
 ["Δεν ανακτήθηκαν σχετικά δημοσιεύματα.","No relevant reports retrieved."],["Ανακτώνται οι δημόσιες οικονομικές χρονοσειρές…","Loading public economic time series…"],
 ["Ιστορική μεταβολή της χρονοσειράς","Historical series movement"],["Μη διαθέσιμο","Unavailable"],["μη real-time","not real-time"],
 ["ΕΝΕΡΓΕΙΑ","ENERGY"],["ΣΥΝΑΛΛΑΓΜΑ","FX"],["ΤΡΟΦΙΜΑ","FOOD"],
 ["Άγνωστη πηγή","Unknown publisher"],["Νέα αναφορά χτυπήματος","New strike report"],["Νέα διπλωματική εξέλιξη","New diplomatic report"],
 ["Η πρώτη επίσκεψη διαμορφώνει σημείο αναφοράς. Νέοι τίτλοι εμφανίζονται με μη αναγνωσμένο σήμα σε επόμενες ανακτήσεις.","Your first visit creates the initial baseline. New headlines appear as unread on subsequent updates."],
 ["Δεν υπάρχουν πρόσφατοι τίτλοι ειδοποιήσεων στα επιλεγμένα φίλτρα. Δεν αποτελεί ένδειξη ότι δεν υπήρξαν γεγονότα.","No recent alerts match the selected filters. This does not mean that no events occurred."],
 ["BROWSER ALERTS ΕΝΕΡΓΑ","BROWSER ALERTS ACTIVE"],["BROWSER ALERTS ΑΠΟΚΛΕΙΣΜΕΝΑ","BROWSER ALERTS BLOCKED"],["BROWSER ALERTS ΜΗ ΔΙΑΘΕΣΙΜΑ","BROWSER ALERTS UNAVAILABLE"],
 ["Ενεργοποιήθηκαν ειδοποιήσεις browser για νέους τίτλους μόνο όσο το PAX είναι ανοιχτό. Δεν έχουμε push όταν κλείνει η σελίδα.","Browser alerts are enabled for new headlines while PAX is open. No notifications are sent when this page is closed."],
 ["Ο browser έχει αποκλείσει τις ειδοποιήσεις. Μπορείς να αλλάξεις την άδεια από τις ρυθμίσεις ιστοτόπου. Οι ειδοποιήσεις μέσα στο PAX λειτουργούν κανονικά.","Your browser has blocked notifications. Change its site permissions if desired; in-app alerts still work."],
 ["Το καμπανάκι λειτουργεί μέσα στο PAX. Browser alerts απαιτούν ρητή άδεια και λειτουργούν μόνο όσο η εφαρμογή είναι ανοιχτή.","The in-app bell always works. Browser notifications require permission and only work while the app is open."],
 ["Δημοσίευμα, όχι επιβεβαιωμένο συμβάν","Published report, not a verified event"],
 ["Το παλιό αριθμητικό Peace Proximity Index αποσύρθηκε επειδή μετρούσε λέξεις και τίτλους χωρίς επιστημονική βαθμονόμηση. Το νέο","The numerical Peace Proximity Index was withdrawn because it counted words and headlines without statistical calibration. The new"],
 ["Οι ημερομηνίες ιστορικού αρχείου αντιστοιχούν σε επιλεγμένες, ορισμένες φάσεις των συγκρούσεων. Για την Ουκρανία χρησιμοποιούμε την 24/02/2022 (πλήρης εισβολή), αν και ο ευρύτερος πόλεμος άρχισε το 2014. Η ζωντανή ροή διατηρεί μόνο δημοσιεύσεις των τελευταίων επτά ημερών και ποτέ προγενέστερες της εκκίνησης του επιλεγμένου φακέλου. Το αρχείο είναι επιμελημένο και επιλεκτικό, όχι πλήρης αναζήτηση όλων των ιστορικών ειδήσεων.","Archive dates refer to defined phases of each conflict. Ukraine starts on 24 February 2022 (full-scale invasion), though the wider war began in 2014. The live feed shows only the most recent seven days, never before the defined conflict phase. The curated archive is selective, not a comprehensive historical news search."],
 ["LIVE = ΤΕΛΕΥΤΑΙΕΣ 7 ΗΜΕΡΕΣ.","LIVE = LAST 7 DAYS."],
 ["Το ιστορικό από την αρχή της σύγκρουσης βρίσκεται στο","Historical milestones since the start of the selected phase are in the"],
 ["Δεν παρουσιάζουμε παλιότερες ειδήσεις ως τρέχουσες.","We never present older news as breaking developments."],
 ["Η πρώτη επίσκεψη","First visit"],
 ["ΠΗΓΗ","SOURCE"]
])PAX_EN_TEXT.set(gr,en);
/* PAX 2.2 navigation, briefing, peace process and strategy lab. */
for(const [gr,en] of [
 ["Πρόσφατες ειδήσεις: διπλωματικές εξελίξεις, κλιμάκωση και βασική κάλυψη. Οι τίτλοι δεν αποτελούν ανεξάρτητη επιβεβαίωση γεγονότων.","Recent reporting on diplomacy, escalation and contextual coverage. Headlines are not independent verification of events."],
 ["ΟΜΑΔΕΣ ΔΗΜΟΣΙΕΥΜΑΤΩΝ /","HEADLINE CLUSTERS /"],
 ["Τελευταίες 24 ώρες","Last 24 hours"],["Ανάκτηση δεδομένων…","Retrieving data…"],
 ["ΔΙΠΛΩΜΑΤΙΑ","DIPLOMACY"],["ΚΛΙΜΑΚΩΣΗ","ESCALATION"],["ΛΟΙΠΗ ΚΑΛΥΨΗ","OTHER COVERAGE"],
 ["Περιμένουμε δεδομένα για σύγκριση δημοσιεύσεων.","Waiting for source data to compare reporting volume."],
 ["Ευρετική ομαδοποίηση παρόμοιων τίτλων, όχι επαλήθευση. Αριθμοί = ομάδες δημοσιευμάτων, όχι πραγματικά περιστατικά.","Headline similarity grouping is heuristic, not fact-checking. Counts represent news clusters, not confirmed incidents."],
 ["Από τις διαπραγματεύσεις στις συμφωνίες, την εφαρμογή και τα αδιέξοδα: διαφορετικά, τεκμηριωμένα ορόσημα.","From talks and agreements through implementation and setbacks: distinct, source-linked milestones."],
 ["Αναζήτηση σε συμφωνίες, πηγές…","Search agreements and sources…"],
 ["Αναζήτηση ιστορικών διαπραγματεύσεων","Search negotiation history"],
 ["ΟΛΑ ΤΑ ΟΡΟΣΗΜΑ","ALL MILESTONES"],
 ["Επιλεκτικό αρχείο με συνδέσμους πηγών. Η ανακοίνωση μιας συμφωνίας δεν αποδεικνύει ότι εφαρμόζεται σήμερα.","A selective archive with source links. The announcement of an agreement does not prove present-day implementation."],
 ["Δοκίμασε πώς μεταβάλλεται μια υποθετική ισορροπία Nash. Δεν είναι πρόβλεψη πραγματικού πολέμου.","Explore hypothetical Nash equilibria. This is not a prediction about any real conflict."],
 ["Δύο υποθετικοί παίκτες · Συνομιλίες ή σκληρή στάση · Ισορροπία Nash","Two hypothetical actors · Talks or hardline posture · Nash equilibrium"],
 ["Όφελος κοινών συνομιλιών","Mutual talks benefit"],
 ["Όφελος μονομερούς πίεσης","Unilateral pressure advantage"],
 ["Κόστος ταυτόχρονης κλιμάκωσης","Mutual escalation cost"],
 ["Κόστος έκθεσης συνεργαζόμενου","Cooperating actor's exposure cost"],
 ["Αυθαίρετες μονάδες χρησιμότητας, όχι μετρήσεις πραγματικών κυβερνήσεων. Η ισορροπία Nash δεν είναι πιθανότητα ειρήνης.","Illustrative utility units, not measurements of actual governments. A Nash equilibrium is not a probability of peace."],
 ["Συνομιλίες / προτάσεις","Talks / proposals"],
 ["Συμφωνίες / εφαρμογή","Agreements / implementation"],
 ["Επιλεγμένη περιοχή","Conflict filter"],
 ["Όλες οι συγκρούσεις","All conflicts"],
 ["Φιλτράρισμα ειδοποιήσεων ανά σύγκρουση","Filter alerts by conflict"],
 ["ΣΥΝΟΜΙΛΙΕΣ / ΠΡΟΤΑΣΗ","TALKS / PROPOSAL"],
 ["ΑΝΑΦΟΡΑ ΣΥΜΦΩΝΙΑΣ","REPORTED AGREEMENT"],
 ["ΑΝΑΦΟΡΑ ΑΔΙΕΞΟΔΟΥ","REPORTED BREAKDOWN"],
 ["Η εφαρμογή φορτώθηκε. Ο δωρεάν server ειδήσεων ενεργοποιείται· οι ειδήσεις θα εμφανιστούν σταδιακά.","The interface has loaded. The free news server is waking up and articles will appear progressively."]
])PAX_EN_TEXT.set(gr,en);
/* PAX 2.3 additions: user-facing static labels (dynamic sections translate themselves). */
for(const [el,en] of [
 ["Δες πώς αυξάνονται τα καταχωρισμένα ορόσημα ανά ημερομηνία και τι ακολούθησε. Ιστορική αναπαραγωγή, όχι πραγματική ειδησεογραφική κάλυψη της εποχής.","Browse dated historical milestones and what was recorded next. Event-date replay, not a comprehensive contemporaneous news archive."],
 ["ΕΠΙΛΟΓΗ ΗΜΕΡΟΜΗΝΙΑΣ","SELECT DATE"],
 ["ΕΝΑΡΞΗ ΦΑΣΗΣ","PHASE START"],["ΠΡΙΝ 12 ΜΗΝΕΣ","12 MONTHS AGO"],["ΣΗΜΕΡΑ","TODAY"],
 ["Μετακίνηση στον ιστορικό χρόνο","Move through historical dates"],
 ["Επιλογή σύγκρουσης για ιστορική αναπαραγωγή","Select conflict for historical replay"],
 ["ΚΑΤΑΧΩΡΙΣΕΙΣ ΕΩΣ ΤΗΝ ΗΜΕΡΟΜΗΝΙΑ","ENTRIES BY SELECTED DATE"],
 ["ΚΑΤΑΧΩΡΙΣΕΙΣ ΜΕΤΑ ΤΗΝ ΗΜΕΡΟΜΗΝΙΑ","ENTRIES AFTER SELECTED DATE"],
 ["Η ταξινόμηση γίνεται με ημερομηνία γεγονότος, όχι υποχρεωτικά με ημερομηνία πρώτης δημοσίευσης. Πηγές μπορεί να γράφτηκαν αργότερα: δεν πρόκειται για πραγματική ανασύσταση του τι γνώριζαν τότε οι άνθρωποι. Το αρχείο είναι επιλεκτικό.","Items are ordered by event date, not necessarily original publication date. Some sources were published later: this is NOT a reconstruction of what was known at that time. The archive is selective."],
 ["Τι χρειάζεται να εξεταστεί για μια βιώσιμη συμφωνία; Τεκμηριωμένα ιστορικά ορόσημα, έλεγχος θέσεων και υποθετικά βήματα — όχι αυθαίρετες εκτιμήσεις.","What questions matter for a durable agreement? Dated sources, actor-position audits and hypothetical steps — without invented probabilities."],
 ["Διαπραγματευτικό ζήτημα ≠ διαπιστωμένο αδιέξοδο.","A negotiating question is not proof of an impasse."],
 ["Επιλογή σύγκρουσης στο Negotiation Room","Select conflict for the Negotiation Room"],
 ["Δεν αποδίδουμε «επίσημες θέσεις» χωρίς πρωτογενή, χρονολογημένη πηγή. Όπου δεν υπάρχει τεκμηρίωση εμφανίζεται έλλειμμα δεδομένων. Οι συμβιβασμοί και οι επιλογές είναι υποθετικοί, όχι προτάσεις των μερών.","We do not attribute official positions without dated primary-source evidence. Missing evidence is explicitly shown. Compromises and decisions are hypothetical, not proposals from the actual actors."],
 ["Συγκριτική ανάγνωση τίτλων διαφορετικών εκδοτών, με ετικέτες λέξεων και πηγές. Δεν βαφτίζουμε την ποικιλία περιγραφών «παραπληροφόρηση».","Compare headlines from different publishers using source links and keyword tags. Differences in wording are not automatically misinformation."],
 ["Επιλογή σύγκρουσης για σύγκριση ειδήσεων","Select conflict for news comparison"],
 ["ΟΜΑΔΕΣ ΠΑΡΟΜΟΙΩΝ ΤΙΤΛΩΝ ΣΕ ΠΟΛΛΟΥΣ ΕΚΔΟΤΕΣ","SIMILAR-HEADLINE CLUSTERS ACROSS PUBLISHERS"],
 ["Η ομοιότητα τίτλων δεν αποδεικνύει ότι δύο εκδότες επιβεβαίωσαν το ίδιο γεγονός.","Similar headlines do not mean two outlets independently confirmed an event."],
 ["Ανάκτηση πρόσφατων δημοσιευμάτων…","Retrieving recent reports…"],
 ["Συγκρίνουμε τίτλους, όχι ολόκληρα άρθρα ή αξιοπιστία εκδοτών. Οι ετικέτες προκύπτουν από λέξεις και δεν αποδεικνύουν προπαγάνδα, μεροληψία ή αντίφαση. Οι σύνδεσμοι ανοίγουν τους εκδότες.","We compare titles, not full article text or publisher reliability. Keyword tags do not establish propaganda, bias or contradictions. Links open the original publishers."],
 ["Το Negotiation Room διακρίνει ερωτήματα, τεκμηριωμένες ιστορικές αναφορές και υποθετικά σενάρια. Το Time Machine είναι αναπαραγωγή ανά ημερομηνία ιστορικού γεγονότος, όχι πλήρης ανακατασκευή της πληροφόρησης της εποχής. Το Narrative Divergence συγκρίνει διατύπωση τίτλων, όχι το περιεχόμενο άρθρων ή την αλήθεια των ισχυρισμών.","The Negotiation Room distinguishes research questions, dated records and hypothetical scenarios. Time Machine is an event-date replay, not a reconstruction of all information available at that time. Narrative Divergence compares headline wording, not article content or the truth of their claims."]
])PAX_EN_TEXT.set(el,en);
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
 const dynamic=[
  [/^Ανακτήθηκαν (\d+) δημοσιεύματα από (\d+) εκδότες, οργανωμένα σε περίπου (\d+) ομάδες παρόμοιων τίτλων\. Από αυτές, (\d+) αφορούν διπλωματία και (\d+) κλιμάκωση\. Η ομαδοποίηση είναι ενδεικτική· δεν αποδεικνύει ανεξάρτητη επιβεβαίωση γεγονότων\.$/,(m,a,b,c,d,e)=>a+" articles from "+b+" publishers were grouped into approximately "+c+" similar-headline clusters; "+d+" concern diplomacy and "+e+" escalation. Grouping does not independently verify events."],
  [/^(\d+) ομάδες παρόμοιων τίτλων από (\d+) εκδότες\. (\d+) ομάδες εμφανίζονται σε τουλάχιστον δύο εκδότες\. Αυτό δείχνει διασπορά δημοσίευσης, όχι ανεξάρτητη επιβεβαίωση\.$/,(m,a,b,c)=>a+" headline clusters from "+b+" publishers. "+c+" clusters appear at more than one publisher. This is coverage diversity, not independent confirmation."],
  [/^Τροφοδοσία: (.+)\. Το ιστορικό διπλωματικών οροσήμων φαίνεται στο Timeline και δεν συγχέεται με την τρέχουσα ειδησεογραφία\.$/,(m,provider)=>"Source: "+provider+". Diplomatic milestones are recorded in the Timeline, separately from breaking news."],
  [/^Κατά την προηγούμενη επίσκεψη: «(.+)»\. Σήμερα: «(.+)»\. Η αλλαγή περιγράφει τον τύπο των δημοσιευμάτων, όχι τεκμηριωμένη πρόοδο ή αναστροφή της σύγκρουσης\.$/,(m,a,b)=>"Previous visit: "+(PAX_EN_TEXT.get(a)||a)+". Now: "+(PAX_EN_TEXT.get(b)||b)+". The change reflects coverage, not a confirmed shift in the conflict."],
  [/^Το περιγραφικό σήμα παραμένει «(.+)» από την προηγούμενη επίσκεψη\. Αυτό δεν αποδεικνύει σταθερή κατάσταση επί του πεδίου\.$/,(m,a)=>"The headline status remains "+(PAX_EN_TEXT.get(a)||a)+" since the previous visit. This does not prove unchanged conditions on the ground."],
  [/^(\d+) ομάδες παρόμοιων τίτλων από (\d+) εκδότες/,(m,a,b)=>a+" similar-title clusters from "+b+" publishers"],
  [/^(\d+) \/ (\d+) χρονοσειρές διαθέσιμες/,(m,a,b)=>a+" / "+b+" available time series"],
  [/^(\d+) δημοσιεύματα · Αρχική δημοσίευση ↗$/,(m,a)=>a+" articles · Original publisher ↗"]
 ];
 for(const [rx,fn] of dynamic){const match=trim.match(rx);if(match)return raw.replace(trim,fn(...match))}
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
 if(button){const label=PAX_LANGUAGE==="el"?"EN":"ΕΛ";if(button.textContent!==label)button.textContent=label; /* unconditional writes re-trigger the observer and freeze English mode */button.setAttribute("aria-label",PAX_LANGUAGE==="el"?"Switch to English":"Αλλαγή στα ελληνικά");button.setAttribute("title",PAX_LANGUAGE==="el"?"English version":"Ελληνική έκδοση")}
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
