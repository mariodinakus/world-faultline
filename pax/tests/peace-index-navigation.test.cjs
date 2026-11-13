"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(base,p),"utf8");
const html=read("index.html"),views=read("views.js"),source=read("peace-path.js"),css=read("war-economy.css");
assert.match(html,/id="paxPeaceIndexHome"/);
assert.match(html,/id="paxPeacePath"/);
assert.ok(html.indexOf('id="paxPeaceIndexHome"')<html.indexOf('class="stats-band"'));
assert.match(views,/peace:\["paxConflictBar","\.pax-path-section"\]/);
assert.match(views,/peace:\["Δείκτης Ειρήνης","Peace Index"\]/);
assert.match(views,/today:\["overview","paxPeaceIndexHome"/);
assert.match(views,/view==="peace"/);
assert.match(css,/\.pax-index-ring/);
new vm.Script(views);new vm.Script(source);
const roots={paxPeaceIndexHome:{innerHTML:""},paxPeacePath:{innerHTML:""}};
const doc={readyState:"loading",addEventListener(){},getElementById(id){return roots[id]||null}};
const regions=["ukraine","gaza","iranisrael","usiran","sudan","drc","myanmar","yemen","syria"].map(id=>({id,short:id.toUpperCase()}));
const milestones=[
 {date:"2022-01-01",type:"talks",title:"Talks"},
 {date:"2022-02-01",type:"proposal",title:"Proposal"},
 {date:"2022-03-01",type:"agreement",title:"Signed grain shipping accord"},
 {date:"2022-04-01",type:"implemented",title:"Shipment implemented"},
 {date:"2023-06-01",type:"setback",title:"Accord terminated"}
];
const sandbox={document:doc,state:{selected:"ukraine"},paxLang:()=>"el",paxProcessRecords:()=>milestones,
 esc:x=>String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;"),REGIONS:regions,
 paxRegionEn:id=>id,Date,console};
vm.runInNewContext(source+";this.testApi={paxPathHomeRender,paxPathRender,paxPathSummary};",sandbox);
sandbox.testApi.paxPathHomeRender();
sandbox.testApi.paxPathRender();
const home=roots.paxPeaceIndexHome.innerHTML,detail=roots.paxPeacePath.innerHTML;
assert.match(home,/ΔΕΙΚΤΗΣ ΕΙΡΗΝΗΣ/);
assert.match(home,/4<small>\/5<\/small>/);
assert.match(home,/Μη επαρκώς πρόσφατα δεδομένα/);
assert.match(home,/δεν είναι πιθανότητα/i);
assert.match(home,/#\/peace\/ukraine/);
assert.match(detail,/Τεκμηρίωση ειρηνευτικής διαδικασίας/);
assert.match(detail,/Διατηρήσιμη μείωση βίας/);
assert.match(detail,/μεταγενέστερη ανατροπή/);
assert.equal((home.match(/class="pax-index-conflict(?: active)?"/g)||[]).length,9);
const empty=sandbox.testApi.paxPathSummary("ukraine");
assert.equal(empty.confirmed,4);
assert.equal(empty.stale,true);
assert.equal(empty.setback,true);
console.log("PAX Peace Index: visible home, navigation, historical counts, stale warnings and conflict detail OK");
