// Serveur statique de test : sert le dépôt sous /Agora/ (comme GitHub Pages)
const http=require('http'),fs=require('fs'),path=require('path');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
module.exports=function start(port){
  const root=path.join(__dirname,'..');const hits=[];const ctl={swExtra:'',acces:null};
  const srv=http.createServer((q,r)=>{
    let u=decodeURIComponent(q.url.split('?')[0]);hits.push(u);
    if(!u.startsWith('/Agora/')){r.writeHead(404);return r.end('nf');}
    u=u.slice(6);if(u.endsWith('/'))u+='index.html';
    const f=path.join(root,u);if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end('nf');}
    if(u==='/sw.js'&&ctl.swExtra){r.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-cache'});return r.end(fs.readFileSync(f,'utf8')+ctl.swExtra);}
    if(u==='/acces.json'&&ctl.acces){r.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-cache'});return r.end(ctl.acces);}
    r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(r);
  });
  return new Promise(res=>srv.listen(port,()=>res({srv,hits,ctl,url:'http://localhost:'+port+'/Agora/'})));
};
