/* PAX GAME THEORY / transparent 2x2 illustrative payoff matrix.
   There are no estimated state preferences, prediction or probabilities here. */
const PAX_GAME={peace:6,leverage:8,warCost:2,exposure:4};
function paxGameCopy(gr,en){return paxLang()==="en"?en:gr}
function paxGamePayoffs(){
 const {peace,leverage,warCost,exposure}=PAX_GAME;
 return [
  [[peace,peace],[-exposure,leverage]],
  [[leverage,-exposure],[-warCost,-warCost]]
 ];
}
function paxGameNash(matrix,i,j){
 const a=matrix[i][j][0],b=matrix[i][j][1];
 return a>=matrix[1-i][j][0]&&b>=matrix[i][1-j][1];
}
function paxGameRender(){
 const el=$("strategy");if(!el)return;
 const open=$("paxGameDetails")?.open;
 if(!open)return;
 const en=paxLang()==="en",p=paxGamePayoffs(),names=en?["TALKS","HARDLINE"]:["ΣΥΝΟΜΙΛΙΕΣ","ΣΚΛΗΡΗ ΣΤΑΣΗ"];
 const rows=[];
 for(let i=0;i<2;i++)for(let j=0;j<2;j++)rows.push({i,j,nash:paxGameNash(p,i,j),u:p[i][j]});
 const roots=rows.filter(x=>x.nash);
 $("paxGameMatrix").innerHTML='<div class="pax-game-table"><div class="pax-game-blank">'+(en?"Actor B →":"Παίκτης Β →")+'</div>'+
  '<div class="pax-game-col">'+names[0]+'</div><div class="pax-game-col">'+names[1]+'</div>'+
  [0,1].map(i=>'<div class="pax-game-rowlabel">'+(en?"Actor A":"Παίκτης Α")+' · '+names[i]+'</div>'+
   [0,1].map(j=>{
    const item=rows.find(x=>x.i===i&&x.j===j);
    const payoff=item.u.map(v=>(v>0?"+":"")+v).join(" / ");
    return '<div class="pax-game-cell'+(item.nash?" nash":"")+'"><div class="pax-game-cell-top">'+
    (en?"A / B payoffs":"Αμοιβές Α / Β")+'</div><strong>'+payoff+'</strong>'+
    (item.nash?'<span class="pax-game-nash">'+(en?"NASH EQUILIBRIUM":"ΙΣΟΡΡΟΠΙΑ NASH")+'</span>':"")+'</div>';
   }).join("")).join("")+'</div>';
 let summary="";
 if(roots.length===1){
  const r=roots[0],result=(en?"A: ":"Α: ")+names[r.i]+", "+(en?"B: ":"Β: ")+names[r.j];
  summary=paxGameCopy("Με αυτές τις υποθετικές απολαβές, μία καθαρή ισορροπία Nash: "+result+".",
   "With these hypothetical payoffs, one pure-strategy Nash equilibrium: "+result+".");
 }else if(roots.length>1){
  summary=paxGameCopy("Με αυτές τις παραδοχές υπάρχουν "+roots.length+" καθαρές ισορροπίες Nash. Το μοντέλο δεν επιλέγει ποια θα πραγματοποιηθεί.",
   "These assumptions yield "+roots.length+" pure-strategy Nash equilibria. This model cannot predict which one occurs.");
 }else summary=paxGameCopy("Δεν εντοπίζεται καθαρή ισορροπία Nash σε αυτόν τον πίνακα. Μπορεί να υπάρχουν μικτές στρατηγικές.",
  "No pure-strategy Nash equilibrium is found. Mixed-strategy equilibria may exist.");
 $("paxGameResult").textContent=summary;
 $("paxGameScenario").textContent=paxGameCopy(
  "Το παράδειγμα αφορά δύο αφηρημένους παίκτες, όχι εκτιμημένες προτιμήσεις των εμπόλεμων στη σύγκρουση "+(REGIONS.find(x=>x.id===state.selected)?.name||"")+".",
  "This is a two-player hypothetical exercise, not estimated preferences of participants in "+(REGIONS.find(x=>x.id===state.selected)?.name||"the selected conflict")+".");
 for(const [k,value] of Object.entries(PAX_GAME)){
  const o=$("paxGame"+k[0].toUpperCase()+k.slice(1)+"Value");if(o)o.textContent=value;
 }
}
function paxGameInit(){
 const details=$("paxGameDetails");if(!details)return;
 details.addEventListener("toggle",()=>{if(details.open)paxGameRender()});
 for(const k of Object.keys(PAX_GAME)){
  const id="paxGame"+k[0].toUpperCase()+k.slice(1),input=$(id);
  input?.addEventListener("input",()=>{PAX_GAME[k]=Number(input.value);paxGameRender()});
 }
 document.addEventListener("pax:language",paxGameRender);
 document.addEventListener("pax:selection",paxGameRender);
}
paxGameInit();
