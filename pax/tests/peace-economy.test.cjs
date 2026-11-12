"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.resolve(__dirname,".."),read=x=>fs.readFileSync(path.join(base,x),"utf8");
const html=read("index.html"),views=read("views.js");
for(const file of ["peace-path.js","war-economy.js","views.js"])
 new vm.Script(read(file),{filename:file});
for(const a of ['id="paxPeacePath"','id="paxWarEconomy"','src="peace-path.js"','src="war-economy.js"','href="war-economy.css"'])
 assert.ok(html.includes(a),"HTML missing "+a);
for(const x of ['["economy",[".pax-economy-section"]','["signal",["detail","peaceSignals",".pax-path-section"]'])
 assert.ok(views.includes(x),"navigation missing "+x);
const el=()=>({innerHTML:"",querySelectorAll(){return[]},querySelector(){return null}});
const roots={paxPeacePath:el(),paxWarEconomy:el()};
const doc={readyState:"loading",addEventListener(){},getElementById(id){return roots[id]}};
const milestones=[
 {date:"2022-04-01",type:"talks",title:"Talks"},
 {date:"2022-07-01",type:"proposal",title:"Proposal"},
 {date:"2022-07-22",type:"agreement",title:"Agreement"},
 {date:"2022-08-03",type:"implemented",title:"Observed"},
 {date:"2023-07-17",type:"setback",title:"Interrupted"}
];
const sandbox={document,Date,Number,Math,URL,console,fetch:()=>Promise.reject(Error("no network in unit test")),
 paxLang:()=>"en",esc:s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"),
 state:{selected:"ukraine"},PAX_VIEW:{view:"conflict",sub:"signal"},
 REGIONS:[{id:"ukraine",short:"Ukraine"},{id:"sudan",short:"Sudan"}],
 paxConflictStart:()=> "2022-02-24",paxProcessRecords:()=>milestones,
 setTimeout,clearTimeout};
vm.runInNewContext(read("peace-path.js")+";this.pathRender=paxPathRender;",sandbox);
sandbox.pathRender();
assert.match(roots.paxPeacePath.innerHTML,/How close to peace/);
assert.match(roots.paxPeacePath.innerHTML,/Sustained decline in violence/);
assert.match(roots.paxPeacePath.innerHTML,/A subsequent setback/);
assert.ok(!roots.paxPeacePath.innerHTML.includes("78% chance of peace")||roots.paxPeacePath.innerHTML.includes("not an invented"));
vm.runInNewContext(read("war-economy.js")+";this.eco={PAX_ECON,pERender,pECheck,pEChart,pET};",sandbox);
sandbox.PAX_VIEW.sub="economy";
sandbox.eco.pERender();
assert.match(roots.paxWarEconomy.innerHTML,/WAR/);
assert.match(roots.paxWarEconomy.innerHTML,/GDP/);
assert.match(roots.paxWarEconomy.innerHTML,/not been published yet/);
const valid=sandbox.eco.pECheck({schemaVersion:1,provider:"World Bank Pink Sheet",lastPeriod:"2026-10",series:{
 brent:{unit:"US$/bbl",points:[["2022-02",90],["2022-03",103],["2026-10",125]]}
}});
sandbox.eco.PAX_ECON.price=valid;
sandbox.eco.pERender();
assert.match(roots.paxWarEconomy.innerHTML,/2026-10/);
assert.match(roots.paxWarEconomy.innerHTML,/2,026|125/);
assert.match(roots.paxWarEconomy.innerHTML,/Before \/ after phase start/);
console.log("PAX Peace Path and War Economy: routing, defensive values, historical graph rendering OK");
