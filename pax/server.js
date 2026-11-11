/* PAX: small dependency-free Node server for Render fallback.
   Vercel continues to use /api/*.js natively. */
'use strict';
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {URL}=require('node:url');
const ROOT=__dirname;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8',
 '.txt':'text/plain; charset=utf-8','.ico':'image/x-icon'};
function wrapResponse(raw){
 let status=200;
 const obj={
  setHeader:(key,value)=>raw.setHeader(key,value),
  status:(code)=>{status=code;return obj},
  json:(data)=>{if(raw.writableEnded)return obj;raw.statusCode=status;raw.setHeader('Content-Type','application/json; charset=utf-8');raw.end(JSON.stringify(data));return obj}
 };
 return obj;
}
const handlers={'/api/news':require('./api/news.js'),'/api/markets':require('./api/markets.js')};
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 try{
  const parsed=new URL(req.url,'http://localhost');
  const pathname=decodeURIComponent(parsed.pathname);
  if(pathname.startsWith('/api/')){
   const endpoint=handlers[pathname];if(!endpoint){res.writeHead(404,{'Content-Type':'application/json'});res.end('{"error":"Unknown endpoint"}');return}
   const request={method:req.method,query:Object.fromEntries(parsed.searchParams)};
   await endpoint(request,wrapResponse(res));return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return}
  const relative=pathname==='/'?'index.html':pathname.replace(/^\/+/,'');
  const target=path.resolve(ROOT,relative);
  if(!target.startsWith(ROOT+path.sep)||target.includes(path.sep+'api'+path.sep)||
   relative.startsWith('.')||relative.split('/').some(x=>x.startsWith('.'))){
   res.writeHead(403);res.end('Forbidden');return;
  }
  let data;try{data=await fs.readFile(target)}catch{res.writeHead(404);res.end('Not found');return}
  res.statusCode=200;res.setHeader('Content-Type',MIME[path.extname(target)]||'application/octet-stream');
  res.setHeader('Cache-Control',relative==='index.html'?'public, max-age=120':'public, max-age=600');
  res.end(req.method==='HEAD'?undefined:data);
 }catch(error){
  if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json; charset=utf-8'});
  res.end('{"error":"Internal server error"}');
 }
});
const PORT=Number(process.env.PORT)||10000;
server.listen(PORT,'0.0.0.0',()=>{console.log('PAX listening on '+PORT)});
