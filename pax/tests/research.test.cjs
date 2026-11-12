"use strict";
// Run with: node pax/tests/research.test.cjs. No npm dependencies.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const ledger=JSON.parse(read("research/implementation-ledger.json"));
const compare=JSON.parse(read("research/comparative-cases.json"));
const ids=["ukraine","gaza","iranisrael","usiran","sudan","drc","myanmar","yemen","syria"];
const iso=d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+"T12:00:00Z"));
const https=u=>typeof u==="string"&&u.startsWith("https://");
assert.equal(ledger.schemaVersion,1);
assert.equal(compare.schemaVersion,1);
assert.equal(ledger.curatedAt,compare.curatedAt);
assert.ok(ledger.agreements.length>=4&&compare.cases.length>=8);
const obligations=new Set();
for(const a of ledger.agreements){
 assert.ok(ids.includes(a.region),a.id);
 assert.ok(iso(a.signed)&&https(a.source?.url),a.id);
 assert.ok(Array.isArray(a.commitments)&&a.commitments.length);
 for(const c of a.commitments){
  assert.ok(!obligations.has(a.id+"/"+c.id),"duplicate obligation");
  obligations.add(a.id+"/"+c.id);
  assert.ok(c.el&&c.en&&https(c.promiseSource),c.id);
  assert.ok(Array.isArray(c.observations),c.id);
  let prev="0000-00-00";
  for(const ev of c.observations){
   assert.ok(iso(ev.date)&&ev.date>=prev&&ev.date<=ledger.curatedAt,c.id+" event date");
   assert.ok(["pledged","observed","interrupted","limitation"].includes(ev.kind),c.id+" status");
   assert.ok(ev.el&&ev.en&&ev.source&&https(ev.url),c.id+" provenance");
   prev=ev.date;
  }
 }
}
const featureKeys=Object.keys(compare.features),caseIds=new Set();
for(const c of compare.cases){
 assert.ok(!caseIds.has(c.id),"duplicate case");
 caseIds.add(c.id);
 assert.ok(iso(c.anchor)&&c.anchor<=compare.curatedAt&&https(c.reference.url),c.id);
 assert.ok(c.title.el&&c.title.en&&c.summary.el&&c.summary.en,c.id);
 assert.ok(c.events.length);
 for(const k of featureKeys)assert.ok(["documented","not_classified","planned_not_verified","outside_scope"].includes(c.features[k]),c.id+" "+k);
 for(const ev of c.events)assert.ok(iso(ev.date)&&ev.date<=compare.curatedAt&&https(ev.url)&&ev.source,c.id+" event");
}
const html=read("index.html"),views=read("views.js"),study=read("research.js");
for(const token of ['id="paxImplementation"','id="paxHistoricalCompare"','src="research.js"','href="research.css"'])
 assert.ok(html.includes(token),"HTML wiring: "+token);
for(const token of ['".pax-study-implementation-section"','".pax-study-comparison-section"'])
 assert.ok(views.includes(token),"view routing: "+token);
for(const file of ["views.js","research.js","peace-signals.js","alerts.js","api/news.js"])
 new vm.Script(read(file),{filename:file});
const fake=()=>({innerHTML:"",querySelector:()=>({value:"",addEventListener(){}}),querySelectorAll:()=>[]});
const impl=fake(),hist=fake(),document={
 readyState:"loading",addEventListener(){},
 getElementById(id){return id==="paxImplementation"?impl:id==="paxHistoricalCompare"?hist:null}
};
const sandbox={
 document,URL,Date,setTimeout,clearTimeout,fetch:()=>Promise.reject(Error("no network required")),
 paxLang:()=>"en",esc:s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"),
 state:{selected:"ukraine"},REGIONS:ids.map(id=>({id,name:id})),PAX_VIEW:{view:"conflict",sub:"process"}
};
vm.runInNewContext(study+"\nthis.__research={PAX_RESEARCH,psRenderAll,psDayDiff};",sandbox);
Object.assign(sandbox.__research.PAX_RESEARCH,{ledger,comparative:compare,loaded:true});
sandbox.__research.psRenderAll();
assert.match(impl.innerHTML,/Black Sea Grain Initiative/);
assert.match(impl.innerHTML,/2023-07-17/);
assert.match(hist.innerHTML,/Northern Ireland/);
assert.match(hist.innerHTML,/Colombia/);
assert.equal(sandbox.__research.psDayDiff("2022-07-22","2022-08-03"),12);
sandbox.state.selected="myanmar";
sandbox.__research.psRenderAll();
assert.match(impl.innerHTML,/No commitment-level entry has been audited/);
console.log("PAX research OK — "+ledger.agreements.length+" dossiers, "+obligations.size+" obligations, "+compare.cases.length+" comparison cases.");
