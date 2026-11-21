/* Agora Test — moteur d'analyse gestuelle v2 (by Stephen). JS pur, testable sous Node.
   Entrée : points du corps (33), des mains (21) et paroles horodatées. Sortie : moments précis à revoir, avec contexte. */
(function(root){
'use strict';
const E={};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const median=a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
const pct=(a,b)=>b>0?Math.round(1000*a/b)/10:0;
const r1=x=>Math.round(x*10)/10;
const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z']/g,'');
const fmt=t=>{t=Math.max(0,t);return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0')};
E.fmt=fmt;

/* ---------- lexiques (mots entiers ou débuts de mots ; « = » : mot exact, pluriel accepté) ---------- */
const LEX={
 cheveux:['cheveu','coiffu','coiffeu','coupe=','couleur','teintur','blond','brun','roux','rouss','noir=','chatain','textur','boucl','fris','crepu','lisse=','tress','perruqu','mech','chignon','permanent','volume=','decolor','balayage','racine','tete=','crane=','migraine'],
 visage:['visage','cach','honte','masque','yeux','oeil','nez=','bouche','levre','lunette','joue=','front=','menton','sourir','larme','pleur','rougi','maquill','peau=','bouton','ride=','barbe','moustach','sourcil','dent=','oreille','grimac'],
 cou:['cou=','nuque','gorge','cravate','col=','collier','foulard','echarpe']
};
const hit=(ws,list)=>{for(const w of ws)for(const p of list){if(p.endsWith('=')){const b=p.slice(0,-1);if(w===b||w===b+'s')return w;}else if(w.startsWith(p))return w;}return null;};
const MIME=['comme ca','ainsi','regardez','imaginez','je faisais','je me'];
const POS=new Set(['bien','super','excellent','parfait','genial','bravo','oui','formidable','magnifique','top','content','heureux','adore','aime','reussi']);
const NEGS=new Set(['mauvais','nul','horrible','terrible','catastrophe','probleme','echec','difficile']);
const NO=new Set(['non','jamais','aucun','impossible','faux']);
const INCL=new Set(['tous','toutes','ensemble','nous','venez','bienvenue','accueillir','public','vous']);
const NUM={un:1,une:1,deux:2,trois:3,quatre:4,cinq:5};
E.lex={LEX,POS,NEGS,NO,INCL,NUM,norm};

/* ---------- forme de la main (pouce, doigts) ---------- */
E.handShape=function(lm){
  if(!lm||lm.length<21)return null;
  const w=lm[0],palm=d2(lm[5],lm[17])||1e-6,tips=[8,12,16,20],pips=[6,10,14,18];
  let curled=0,ext=0;
  tips.forEach((t,i)=>{const dt=d2(lm[t],w),dp=d2(lm[pips[i]],w);if(dt<dp*1.05)curled++;else if(dt>dp*1.2)ext++;});
  const thumbExt=d2(lm[4],lm[2])>0.7*palm&&d2(lm[4],lm[5])>0.55*palm;
  const dy=(lm[4].y-lm[2].y)/(d2(lm[4],lm[2])||1e-6);
  let thumb=null;if(curled>=3&&thumbExt){if(dy<-0.6)thumb='up';else if(dy>0.6)thumb='down';}
  return {thumb,fingers:ext+(thumbExt&&curled<3?1:0),curled};
};

/* ---------- balancement : segments d'oscillation du bassin ---------- */
E.computeSway=function(series){
  const out={cycles:0,perMin:0,pctTime:0,segments:[]};
  if(series.length<20)return out;
  const T=series[series.length-1].t-series[0].t;if(T<5)return out;
  const hp=[];let j=0,sum=0,cnt=0;
  for(let i=0;i<series.length;i++){sum+=series[i].x;cnt++;while(series[i].t-series[j].t>2.5){sum-=series[j].x;cnt--;j++;}hp.push({t:series[i].t,x:series[i].x-sum/cnt});}
  const ext=[];let dir=0,last=hp[0];
  for(let i=1;i<hp.length;i++){const v=hp[i].x-last.x;if(Math.abs(v)<1e-4)continue;const nd=v>0?1:-1;if(dir!==0&&nd!==dir)ext.push(last);dir=nd;last=hp[i];}
  const peaks=[];for(let i=1;i<ext.length;i++){const a=Math.abs(ext[i].x-ext[i-1].x);if(a>0.08)peaks.push({t0:ext[i-1].t,t:ext[i].t,dt:ext[i].t-ext[i-1].t});}
  let run=[],cycles=0;const segs=[];
  const flush=()=>{if(run.length>=3){cycles+=run.length/2;segs.push({t0:run[0].t0,t1:run[run.length-1].t,n:run.length/2});}run=[];};
  for(const p of peaks){if(p.dt>=0.3&&p.dt<=2.0)run.push(p);else flush();}
  flush();
  const merged=[];segs.forEach(s=>{const l=merged[merged.length-1];if(l&&s.t0-l.t1<2.5){l.t1=s.t1;l.n+=s.n;}else merged.push(Object.assign({},s));});
  out.segments=merged.filter(s=>s.t1-s.t0>=4);
  const inTime=out.segments.reduce((a,s)=>a+(s.t1-s.t0),0);
  out.cycles=Math.round(cycles);out.perMin=r1(cycles/(T/60));out.pctTime=clamp(r1(100*inTime/T),0,100);
  return out;
};

/* ---------- maillage du visage (478 points) ---------- */
const OVAL=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
E.OVAL=OVAL;
E.syntheticFace=function(cx,cy,fw,aspect,roll){ // visage de test : ellipse + repères principaux (cx,cy = milieu des yeux, en coordonnées image)
  const F=Array.from({length:478},()=>({x:cx,y:cy,z:0}));roll=roll||0;const c=Math.cos(roll),s=Math.sin(roll);
  const put=(i,lx,ly)=>{const dx=lx*fw,dy=ly*fw;F[i]={x:cx+(dx*c-dy*s)/aspect,y:cy+(dx*s+dy*c),z:0};};
  put(33,-0.3,0);put(263,0.3,0);put(234,-0.5,0.05);put(454,0.5,0.05);put(10,0,-0.5);put(152,0,0.95);put(1,0,0.2);put(13,0,0.48);put(14,0,0.52);
  OVAL.forEach((i,k)=>{if([10,152,234,454].includes(i))return;const a=2*Math.PI*k/OVAL.length;put(i,0.5*Math.sin(a),0.2-0.72*Math.cos(a)+ (Math.cos(a)>0?0:0));});
  return F;};
function headFromFace(face,A){
  const g=i=>({x:face[i].x*A,y:face[i].y});
  const eL=g(33),eR=g(263),cL=g(234),cR=g(454),nose=g(1),lu=g(13),ll=g(14),chin=g(152);
  const fw=d2(cL,cR);if(!(fw>1e-4))return null;
  const cx=(eL.x+eR.x)/2,cy=(eL.y+eR.y)/2,roll=Math.atan2(eR.y-eL.y,eR.x-eL.x);
  const loc=p=>{const dx=p.x-cx,dy=p.y-cy,c=Math.cos(-roll),s=Math.sin(-roll);return {x:(dx*c-dy*s)/fw,y:(dx*s+dy*c)/fw};};
  const mouth={x:(lu.x+ll.x)/2,y:(lu.y+ll.y)/2};
  return {cx,cy,ed:fw,mouthDy:loc(mouth).y,chinDy:loc(chin).y,roll,poly:OVAL.map(g),yaw:(nose.x-(cL.x+cR.x)/2)/fw,pitch:(nose.y-cy)/fw,face:true};
}
function inPoly(p,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)c=!c;}return c;}

/* ---------- épisodes ---------- */
function Ep(gap){let cur=null;const list=[];return{
  on(t,active,d){if(active){if(!cur)cur={t0:t,t1:t,d:d||{}};else{cur.t1=t;}}else if(cur&&t-cur.t1>gap){list.push(cur);cur=null;}},
  len(t){return cur?t-cur.t0:0;},
  end(){if(cur){list.push(cur);cur=null;}return list;}};}

/* ---------- analyseur ---------- */
E.createAnalyzer=function(opts){
  opts=Object.assign({aspect:9/16,mode:'full',teleprompter:false,hiddenAlert:8},opts||{});
  const A={};let prev=null,t0=null;
  const dur={total:0,body:0,anyForce:0,speakF:0,speakT:0,feetN:0,headN:0};
  const hs={force:0,basse:0,haute:0,cachee:0,hors:0};
  const speech=[],words=[],series=[],buckets=new Map(),feet=[],depth=[];
  const epHidden=Ep(0.8),epLow=Ep(1),epCross=Ep(0.8),epDown=Ep(1),epSide=Ep(1),epForce=Ep(1.2);
  const events=[];let touches=[],tc=null,hiddenAlerted=false;
  let wPrev=[null,null],speedEMA=[0,0],gs={on:false,t:0,amp:0,quiet:0},gestures=[];
  let thumbRun={up:0,down:0},lastThumb=-9,fingerRun={n:0,c:0},lastFinger=-9,headBuf=[],lastNod=-9,lastShake=-9,baseHead=[],headBase=null;
  let anchor=null,mv=null,moves=[];
  const P=(l,i)=>({x:l[i].x*opts.aspect,y:l[i].y,v:l[i].visibility==null?1:l[i].visibility,rx:l[i].x,ry:l[i].y});

  A.markSpeech=t=>{speech.push(t);};
  A.addWord=(text,t)=>{words.push({w:norm(text),raw:String(text),t});};
  A.speechActive=t=>{if(!speech.length)return null;for(let i=speech.length-1;i>=0&&speech[i]>t-1.2;i--){if(speech[i]<=t)return true;}return false;};
  A.setOpts=o=>Object.assign(opts,o);
  A.hiddenLive=()=>0;

  /* zones de la tête, en unités « écart des oreilles » */
  function headGeom(L,SW){
    const ear=[P(L,7),P(L,8)],eye=[P(L,2),P(L,5)],mo=[P(L,9),P(L,10)],nose=P(L,0);
    const eyes=eye.filter(e=>e.v>0.35);if(!eyes.length&&nose.v<0.4)return null;
    const cx=eyes.length?eyes.reduce((a,e)=>a+e.x,0)/eyes.length:nose.x;
    let ed=SW/3.1;if(ear[0].v>0.35&&ear[1].v>0.35)ed=Math.max(d2(ear[0],ear[1]),SW/3.6);
    const cy=eyes.length?eyes.reduce((a,e)=>a+e.y,0)/eyes.length:nose.y-0.3*ed;
    const mv_=mo.filter(m=>m.v>0.35);const mouthDy=mv_.length?(mv_.reduce((a,m)=>a+m.y,0)/mv_.length-cy)/ed:0.85;
    return {cx,cy,ed,mouthDy};
  }
  function zoneOf(p,H,shDy){
    let ddx=p.x-H.cx,ddy=p.y-H.cy;
    if(H.roll){const c=Math.cos(-H.roll),sn=Math.sin(-H.roll);const x=ddx*c-ddy*sn,y=ddx*sn+ddy*c;ddx=x;ddy=y;}
    const dx=ddx/H.ed,dy=ddy/H.ed,ax=Math.abs(dx),m=H.mouthDy,chin=H.chinDy!=null?H.chinDy+0.05:m+0.6;
    if(dy<-0.55&&dy>-2.1&&ax<1.0)return 'cheveux';
    if(ax>=0.62&&ax<1.35&&dy>-1.2&&dy<0.45)return 'cheveux';
    if(ax<0.62){
      if(dy>=-0.55&&dy<-0.12)return 'front';
      if(dy>=-0.12&&dy<m-0.15)return 'visage';
      if(dy>=m-0.15&&dy<chin)return 'bouche';
      if(dy>=chin&&dy<shDy)return 'cou';
    }
    if(ax<1.0&&dy>=chin&&dy<shDy)return 'cou';
    if(H.poly&&inPoly(p,H.poly))return 'visage';
    return null;
  }

  A.push=function(f){
    const t=f.t;if(t0==null)t0=t;
    const dt=prev==null?0:clamp(t-prev,0,0.5);prev=t;dur.total+=dt;
    const out={state:null,alerts:[]};
    const L=f.pose;if(!L||L.length<33)return out;
    const Ls=P(L,11),Rs=P(L,12);if(Ls.v<0.4||Rs.v<0.4)return out;
    dur.body+=dt;const tt=t-t0;
    const SW=Math.hypot(Ls.x-Rs.x,Ls.y-Rs.y)||1e-6,Sm={x:(Ls.x+Rs.x)/2,y:(Ls.y+Rs.y)/2};
    const Lh=P(L,23),Rh=P(L,24),hipsOk=Lh.v>0.4&&Rh.v>0.4&&Lh.ry<1&&Rh.ry<1;
    const Hm=hipsOk?{x:(Lh.x+Rh.x)/2,y:(Lh.y+Rh.y)/2}:{x:Sm.x,y:Sm.y+1.5*SW};
    const T=Math.max(0.1,hipsOk?Math.hypot(Hm.x-Sm.x,Hm.y-Sm.y):1.5*SW);
    const sec=Math.floor(tt),speaking=A.speechActive(t);

    /* mains : zones du corps */
    const st=[];
    [15,16].forEach((wi,k)=>{
      const w=P(L,wi);let s;
      if(w.rx<0||w.rx>1||w.ry<0||w.ry>1)s='hors';
      else if(w.v<0.45)s='cachee';
      else{const r=(w.y-Sm.y)/T;if(r>1.05)s='basse';else if(r<-0.2)s='haute';else s=Math.abs(w.x-Sm.x)<=2.2*SW?'force':'haute';}
      st.push(s);hs[s]+=dt/2;
      if(wPrev[k]&&dt>0&&s!=='hors'&&s!=='cachee'){const sp=Math.hypot(w.x-wPrev[k].x,w.y-wPrev[k].y)/dt/T;speedEMA[k]=0.6*speedEMA[k]+0.4*sp;}else speedEMA[k]=0.6*speedEMA[k];
      wPrev[k]=(s==='hors'||s==='cachee')?null:w;
    });
    const anyF=st.includes('force');if(anyF){dur.anyForce+=dt;}
    if(speaking){dur.speakT+=dt;if(anyF)dur.speakF+=dt;}
    const dom=anyF?'force':(st.includes('cachee')&&!st.includes('basse')&&!st.includes('haute')?'cachee':(st.includes('basse')?'basse':(st.includes('haute')?'haute':'hors')));
    out.state=dom;
    const b=buckets.get(sec)||{force:0,basse:0,haute:0,cachee:0,hors:0};b[dom]+=dt||0.001;buckets.set(sec,b);

    epHidden.on(tt,st[0]==='cachee'&&st[1]==='cachee');
    epLow.on(tt,st[0]==='basse'&&st[1]==='basse');
    epForce.on(tt,anyF&&st[0]!=='cachee'&&st[1]!=='cachee'&&speaking===true);
    const hl=epHidden.len(tt);
    if(hl>=opts.hiddenAlert&&!hiddenAlerted){hiddenAlerted=true;out.alerts.push('Mains cachées depuis '+Math.round(hl)+' s');}
    if(hl<1)hiddenAlerted=false;

    /* gestes (segments de mouvement des mains) */
    const sp=Math.max(speedEMA[0],speedEMA[1]);
    if(sp>0.35){if(!gs.on){gs.on=true;gs.t=tt;gs.amp=0;gs.quiet=0;}gs.amp=Math.max(gs.amp,sp);}
    else if(gs.on){gs.quiet+=dt;if(gs.quiet>0.3){if(tt-gs.t>0.25)gestures.push({t0:gs.t,t1:tt,amp:gs.amp});gs.on=false;}}

    /* contacts main ↔ tête : doigts réellement dans la zone, et main à la même profondeur que le visage */
    const H=(f.face&&f.face.length>=468&&headFromFace(f.face,opts.aspect))||headGeom(L,SW);
    if(H){
      const shDy=Math.max(H.mouthDy+1.0,(Sm.y-H.cy)/H.ed-0.15);
      const sources=[];
      if(f.hands&&f.hands.length){
        f.hands.forEach(lm=>{const pts=[4,8,12,16,20,9].map(i=>({x:lm[i].x*opts.aspect,y:lm[i].y}));
          const palmW=Math.hypot((lm[5].x-lm[17].x)*opts.aspect,lm[5].y-lm[17].y);sources.push({pts,ratio:palmW/H.ed,known:true});});
      }else{
        [[15,17,19,21],[16,18,20,22]].forEach(ids=>{const pts=ids.map(i=>P(L,i)).filter(p=>p.v>0.45&&p.rx>=0&&p.rx<=1&&p.ry>=0&&p.ry<=1);if(pts.length>=2)sources.push({pts,ratio:null,known:false});});
      }
      let best=null;
      sources.forEach(s=>{
        const cnt={};s.pts.forEach(p=>{const z=zoneOf(p,H,shDy);if(z)cnt[z]=(cnt[z]||0)+1;});
        let z=null,n=0;for(const k in cnt)if(cnt[k]>n){n=cnt[k];z=k;}
        if(!z||n<2)return;
        const inFront=s.known&&s.ratio>1.05,tooSmall=s.known&&s.ratio<0.22;
        if(inFront||tooSmall)return;
        const cx=s.pts.reduce((a,p)=>a+p.x,0)/s.pts.length,cy=s.pts.reduce((a,p)=>a+p.y,0)/s.pts.length;
        const cand={z,n,known:s.known,cx,cy};if(!best||cand.n>best.n)best=cand;
      });
      if(best){
        if(tc&&tc.zone===best.z){tc.t1=tt;tc.frames++;tc.known=tc.known&&best.known;tc.path+=Math.hypot(best.cx-tc.lx,best.cy-tc.ly)/H.ed;tc.lx=best.cx;tc.ly=best.cy;tc.gap=0;tc.speakN+=speaking?1:0;}
        else{if(tc)closeTouch();tc={zone:best.z,t0:tt,t1:tt,frames:1,known:best.known,path:0,lx:best.cx,ly:best.cy,speakN:speaking?1:0,gap:0};}
      }else if(tc&&tt-tc.t1>0.35)closeTouch();
    }
    function closeTouch(){if(tc&&tc.frames>=3&&tc.t1-tc.t0>=0.3){tc.static=(tc.path/Math.max(0.3,tc.t1-tc.t0))<0.5;touches.push(tc);}tc=null;}
    A._closeTouch=closeTouch;

    /* bras croisés */
    {const wl=P(L,15),wr=P(L,16),cross=(w,s)=>(w.x-Sm.x)*(s.x-Sm.x)<0&&Math.abs(w.x-Sm.x)>0.1*SW,rl=(wl.y-Sm.y)/T,rr=(wr.y-Sm.y)/T;
     epCross.on(tt,wl.v>0.4&&wr.v>0.4&&cross(wl,Ls)&&cross(wr,Rs)&&rl>0.1&&rl<0.95&&rr>0.1&&rr<0.95&&Math.hypot(wl.x-wr.x,wl.y-wr.y)<1.3*SW);}

    /* tête : orientation, hochements */
    if(H){const el=P(L,7),er=P(L,8),nose=P(L,0);
      if(H.face||(el.v>0.4&&er.v>0.4)){let yaw,pit;if(H.face){yaw=H.yaw;pit=H.pitch;}else{const ed=Math.hypot(el.x-er.x,el.y-er.y)||1e-6,em={x:(el.x+er.x)/2,y:(el.y+er.y)/2};yaw=(nose.x-em.x)/ed;pit=(nose.y-em.y)/ed;}
        const yTh=H.face?0.3:0.45,pTh=H.face?0.15:0.45;
        if(!headBase){baseHead.push([yaw,pit]);if(baseHead.length>25)headBase=[median(baseHead.map(a=>a[0])),median(baseHead.map(a=>a[1]))];}
        else{dur.headN+=dt;const dy=yaw-headBase[0],dp=pit-headBase[1];
          epSide.on(tt,!opts.teleprompter&&Math.abs(dy)>yTh);epDown.on(tt,!opts.teleprompter&&dp>pTh);
          headBuf.push({t,x:nose.x/SW,y:nose.y/SW});while(headBuf.length&&t-headBuf[0].t>1.5)headBuf.shift();
          const rev=k=>{let r=0,d=0,l=headBuf[0][k];for(const h of headBuf){const v=h[k]-l;if(Math.abs(v)>0.03){const n=v>0?1:-1;if(d&&n!==d)r++;d=n;l=h[k];}}return r;};
          if(headBuf.length>8){if(rev('x')>=3&&t-lastShake>1.8){lastShake=t;events.push({t:tt,type:'non-tete'});}else if(rev('y')>=3&&t-lastNod>1.8){lastNod=t;events.push({t:tt,type:'oui-tete'});}}}}}

    /* pouce / doigts */
    if(f.hands&&f.hands.length)f.hands.forEach(lm=>{const s=E.handShape(lm);if(!s)return;
      ['up','down'].forEach(k=>{thumbRun[k]=s.thumb===k?thumbRun[k]+1:0;if(thumbRun[k]>=4&&tt-lastThumb>1.5){lastThumb=tt;events.push({t:tt,type:k==='up'?'pouce-haut':'pouce-bas'});}});
      if(s.curled<4){fingerRun.n===s.fingers?fingerRun.c++:(fingerRun={n:s.fingers,c:1});if(fingerRun.c>=8&&fingerRun.n>=1&&fingerRun.n<=5&&tt-lastFinger>1.2){lastFinger=tt;events.push({t:tt,type:'doigts',data:fingerRun.n});}}});

    /* ancrage, balancement, déplacements */
    if(opts.mode==='full'&&hipsOk){
      const La=P(L,27),Ra=P(L,28);if(La.v>0.4&&Ra.v>0.4&&La.ry<1&&Ra.ry<1){feet.push(Math.abs(La.x-Ra.x)/SW);dur.feetN+=dt;}
      series.push({t:tt,x:Hm.x/SW});depth.push(SW);
      const hx=Hm.x/SW;if(!anchor)anchor={x:hx};
      if(!mv){if(Math.abs(hx-anchor.x)>0.5)mv={t0:tt,x0:anchor.x,x:hx,last:tt,sp:speaking};else anchor.x=0.9*anchor.x+0.1*hx;}
      else{if(Math.abs(hx-mv.x)>0.05)mv.last=tt;mv.x=hx;if(tt-mv.last>0.6){moves.push({t0:mv.t0,t1:mv.last,dx:mv.x-mv.x0,sp:mv.sp});anchor={x:mv.x};mv=null;}}
    }
    return out;
  };

  /* ---------- contexte : ce qui était dit autour d'un moment ---------- */
  function context(a,b){
    const w=words.filter(x=>x.t-t0>=a-3.5&&x.t-t0<=b+2.0);
    return {ws:w.map(x=>x.w),text:w.map(x=>x.raw).join(' ').split(' ').slice(0,16).join(' '),n:w.length};
  }
  function classifyTouch(tc,idx){
    const g=tc.zone,c=context(tc.t0,tc.t1);let lists=[];
    if(g==='cheveux')lists=[LEX.cheveux];else if(g==='front')lists=[LEX.visage,LEX.cheveux];else if(g==='visage'||g==='bouche')lists=[LEX.visage];else if(g==='cou')lists=[LEX.cou];
    let w=null;for(const l of lists){w=hit(c.ws,l);if(w)break;}
    if(w)return {verdict:'illustratif',mot:w,c};
    const joined=c.ws.join(' ');if(MIME.some(m=>joined.includes(m)))return {verdict:'incertain',c};
    if(!words.length)return {verdict:'sans-transcription',c};
    return {verdict:'libre',c};
  }
  const ZN={cheveux:'tes cheveux',front:'ton front',visage:'ton visage',bouche:'ta bouche ou ton menton',cou:'ton cou ou ta nuque'};

  A.finish=function(){
    A._closeTouch&&A._closeTouch();
    const total=Math.max(dur.total,0.001),body=Math.max(dur.body,0.001),end=total;
    const sumH=Object.values(hs).reduce((a,b)=>a+b,0)||1;
    const hands={force:pct(hs.force,sumH),basse:pct(hs.basse,sumH),haute:pct(hs.haute,sumH),cachee:pct(hs.cachee,sumH),hors:pct(hs.hors,sumH),
      auMoinsUneEnForce:pct(dur.anyForce,body),enForcePendantParole:dur.speakT>3?pct(dur.speakF,dur.speakT):null};
    const sway=E.computeSway(series),fr=median(feet);
    const stance=fr==null?null:{ratio:Math.round(fr*100)/100,label:fr<0.5?'pieds trop serrés':(fr>2?'pieds très écartés':'bien posé')};
    const issues=[],good=[],neutral=[];let id=0;
    const add=(arr,o)=>{o.id=++id;arr.push(o);return o;};

    /* mains cachées */
    epHidden.end().filter(e=>e.t1-e.t0>=opts.hiddenAlert*0.6).forEach(e=>{const d=e.t1-e.t0;
      add(issues,{kind:'cachees',sev:d>=20?3:d>=opts.hiddenAlert?2:1,t0:e.t0,t1:e.t1,title:'Mains cachées',
      what:'Pendant '+Math.round(d)+' s, tes deux mains ne sont pas visibles (dans le dos, dans les poches ou sous le cadre).',
      why:'Le public ne voit plus tes mains : on ne peut plus lire ton énergie et cela donne une impression de retenue.',
      fix:'Ramène-les devant toi, entre la ceinture et les épaules. Pose-les là entre deux gestes.'});});
    /* mains basses */
    epLow.end().filter(e=>e.t1-e.t0>=10).forEach(e=>add(issues,{kind:'basses',sev:1,t0:e.t0,t1:e.t1,title:'Bras ballants',
      what:'Pendant '+Math.round(e.t1-e.t0)+' s, tes deux mains restent le long du corps.',why:'Sans gestes, la voix porte seule : le message paraît plus plat.',
      fix:'Lève les mains à hauteur de ceinture au moins au moment des idées importantes.'}));
    /* bras croisés */
    epCross.end().filter(e=>e.t1-e.t0>=3).forEach(e=>add(issues,{kind:'croises',sev:e.t1-e.t0>=8?2:1,t0:e.t0,t1:e.t1,title:'Bras croisés',
      what:'Bras croisés pendant '+Math.round(e.t1-e.t0)+' s.',why:'Une posture fermée : elle peut être prise pour de la distance ou de la défense, même si tu es simplement à l’aise.',
      fix:'Décroise-les dès que tu commences une nouvelle idée.'}));
    /* regard / tête */
    if(!opts.teleprompter){
      epDown.end().filter(e=>e.t1-e.t0>=3).forEach(e=>add(issues,{kind:'regard-bas',sev:2,t0:e.t0,t1:e.t1,title:'Tête baissée',what:'Tête vers le bas pendant '+Math.round(e.t1-e.t0)+' s.',why:'Tu perds le contact avec la salle et la voix part vers le sol.',fix:'Remonte le menton, garde un repère de notes à hauteur des yeux.'}));
      epSide.end().filter(e=>e.t1-e.t0>=3).forEach(e=>add(issues,{kind:'regard-cote',sev:1,t0:e.t0,t1:e.t1,title:'Tête tournée de côté',what:'Tête détournée du public pendant '+Math.round(e.t1-e.t0)+' s.',why:'Le public n’est plus face à toi.',fix:'Reviens face à la salle avant de continuer ta phrase.'}));
    }
    /* balancement */
    sway.segments.forEach(s=>add(issues,{kind:'balancement',sev:s.t1-s.t0>=10?2:1,t0:s.t0,t1:s.t1,title:'Balancement',
      what:'Tu te balances d’un pied sur l’autre ('+Math.round(s.n)+' allers-retours en '+Math.round(s.t1-s.t0)+' s).',
      why:'Un mouvement répété sans lien avec le propos devient un tic visible et fatigue le regard.',fix:'Répartis le poids sur les deux pieds. Bouge seulement pour changer d’idée, en marchant franchement.'}));
    /* déplacements */
    let useful=0,parasite=0,back=0;
    moves.forEach((m,i)=>{const n=moves[i+1];const bk=n&&n.t0-m.t1<6&&Math.sign(n.dx)!==Math.sign(m.dx);
      if(bk){back++;parasite++;add(issues,{kind:'deplacement',sev:1,t0:m.t0,t1:n.t1,title:'Aller-retour',what:'Tu avances puis reviens en quelques secondes.',why:'Un aller-retour sans pause ressemble à de la nervosité, pas à un choix.',fix:'Déplace-toi une fois, pose-toi, puis parle.'});}
      else if(m.sp===true){parasite++;add(issues,{kind:'deplacement',sev:1,t0:m.t0,t1:m.t1,title:'Déplacement en pleine phrase',what:'Tu changes de place pendant que tu parles.',why:'Le déplacement est plus fort quand il marque une pause ou un changement d’idée.',fix:'Marche pendant le silence, puis reprends la parole une fois arrivé.'});}
      else if(m.sp===false){useful++;add(good,{kind:'deplacement-utile',t0:m.t0,t1:m.t1,title:'Déplacement bien placé',what:'Tu te déplaces pendant un silence, ce qui marque le changement d’idée.'});}});
    /* contacts avec la tête : on juge avec le contexte */
    const ctxTouch=touches.map(tc=>Object.assign({tc},classifyTouch(tc)));
    const counts={};ctxTouch.filter(x=>x.verdict==='libre'||x.verdict==='sans-transcription').filter(x=>x.tc.t1-x.tc.t0>=0.5).forEach(x=>{counts[x.tc.zone]=(counts[x.tc.zone]||0)+1;});
    let tics=0;
    ctxTouch.forEach(x=>{const tc=x.tc,d=tc.t1-tc.t0,zn=ZN[tc.zone],sure=tc.known?'sûr':'probable';
      const base={t0:tc.t0,t1:tc.t1,zone:tc.zone,conf:sure};
      if(x.verdict==='illustratif'){add(neutral,Object.assign(base,{kind:'contact-compris',title:'Main sur '+zn+' : compris par le contexte',
        what:'Tu parlais de « '+x.mot+' » juste à ce moment-là ('+(x.c.text?'« '+x.c.text+' »':'')+'). Ce geste illustre ton propos, il n’est pas compté comme un tic.'}));return;}
      if(x.verdict==='incertain'){add(neutral,Object.assign(base,{kind:'contact-incertain',title:'Main sur '+zn+' : à vérifier',
        what:'Tu semblais faire une démonstration (« '+x.c.text+' »). Regarde la vidéo : si tu mimes quelque chose, c’est bon.'}));return;}
      const repeat=(counts[tc.zone]||0)>=3,long=d>=1.5;
      if(!(long||repeat)){add(neutral,Object.assign(base,{kind:'contact-bref',title:'Contact bref avec '+zn,what:'Contact de '+r1(d)+' s : normal (gratter, replacer une mèche). Non compté.'}));return;}
      if(x.verdict==='sans-transcription'){add(issues,Object.assign(base,{kind:'contact',sev:1,title:'Main sur '+zn+' (contexte inconnu)',
        what:'Contact de '+r1(d)+' s ('+sure+'). Sans transcription, je ne peux pas savoir si tu parlais de ce que tu touchais.',why:'À toi de juger en revoyant la vidéo : illustration du propos ou habitude ?',fix:'Active la transcription pour que je tienne compte de ce que tu dis.'}));return;}
      tics++;
      add(issues,Object.assign(base,{kind:'contact',sev:(d>=4||counts[tc.zone]>=5)?3:2,title:'Main sur '+zn,
        what:'De '+fmt(tc.t0)+' à '+fmt(tc.t1)+' ('+r1(d)+' s), tes doigts touchent '+zn+'. Détection '+sure+(repeat?', et c’est la '+counts[tc.zone]+'e fois dans cette zone':'')+'.',
        ctx:x.c.text?'Tu disais : « '+x.c.text+' ». Rien dans la phrase ne parle de ce que tu touches : ce n’est donc pas un geste pour illustrer.':'',
        why:'Un auto-contact sans lien avec le propos accompagne souvent la tension, la réflexion ou l’habitude. Il ne dit rien de ta sincérité ; il détourne simplement l’attention de ce que tu dis.',
        fix:'Remplace-le par un appui : mains jointes à la ceinture, ou un geste ouvert sur un mot-clé.'}));
    });
    /* contradictions entre mots et gestes */
    const ev=events;
    const near=(type,t,a,b)=>ev.some(e=>e.type===type&&e.t>=t-a&&e.t<=t+b);
    const crossedAt=(t,a,b)=>epCross.end().some(e=>e.t0<=t+b&&e.t1>=t-a);
    const contradictions=[];
    words.forEach(wd=>{const t=wd.t-t0,w=wd.w;
      if(POS.has(w)){if(near('pouce-bas',t,0.6,2.5))contradictions.push({t,mot:w,geste:'un pouce baissé',niveau:'contradiction'});else if(near('non-tete',t,0.6,2.5))contradictions.push({t,mot:w,geste:'la tête qui dit non',niveau:'contradiction'});}
      if(NEGS.has(w)&&near('pouce-haut',t,0.6,2.5))contradictions.push({t,mot:w,geste:'un pouce levé',niveau:'contradiction'});
      if(NO.has(w)&&near('oui-tete',t,0.6,2.5))contradictions.push({t,mot:w,geste:'la tête qui dit oui',niveau:'à vérifier'});
      if(INCL.has(w)&&crossedAt(t,0.3,2.5))contradictions.push({t,mot:w,geste:'des bras croisés',niveau:'à vérifier'});
      if(NUM[w]){const f=ev.filter(e=>e.type==='doigts'&&e.t>=t-0.6&&e.t<=t+2.5);if(f.length&&!f.some(e=>e.data===NUM[w]))contradictions.push({t,mot:w,geste:f[0].data+' doigt(s) levé(s)',niveau:'à vérifier'});}});
    contradictions.forEach(c=>add(issues,{kind:'contradiction',sev:c.niveau==='contradiction'?3:1,t0:Math.max(0,c.t-1),t1:c.t+2.5,title:c.niveau==='contradiction'?'Mots et geste qui se contredisent':'Mots et geste à vérifier',
      what:'Tu dis « '+c.mot+' » avec '+c.geste+'.',why:'Quand le corps dit autre chose que la voix, le public croit le corps.',fix:'Aligne le geste sur le mot, ou change le geste.'}));
    /* bons moments */
    epForce.end().filter(e=>e.t1-e.t0>=6).sort((a,b)=>(b.t1-b.t0)-(a.t1-a.t0)).slice(0,2).forEach(e=>add(good,{kind:'mains-forces',t0:e.t0,t1:e.t1,title:'Mains bien placées en parlant',what:'Pendant '+Math.round(e.t1-e.t0)+' s, tes mains sont dans la zone de force et visibles pendant que tu parles.'}));
    /* constats généraux */
    const notes=[];
    if(stance&&stance.label!=='bien posé')notes.push('Ancrage : '+stance.label+'. Vise un écart des pieds proche de la largeur des épaules.');
    if(hands.auMoinsUneEnForce<40)notes.push('Au moins une main en zone de force seulement '+hands.auMoinsUneEnForce+' % du temps.');
    /* note */
    const hid=issues.filter(i=>i.kind==='cachees').reduce((a,i)=>a+(i.t1-i.t0),0),crs=issues.filter(i=>i.kind==='croises').reduce((a,i)=>a+(i.t1-i.t0),0);
    const sc={mains:Math.round(25*clamp(hands.auMoinsUneEnForce/55,0,1)),
      cachees:Math.round(20-Math.min(20,hid*0.8)),ancrage:Math.round(20-Math.min(15,sway.pctTime*0.4)-(stance&&stance.label!=='bien posé'?5:0)),
      deplacements:Math.round(15-Math.min(15,parasite*4)),posture:Math.round(10-Math.min(10,crs)),
      contact:Math.round(10-Math.min(10,tics*3+contradictions.filter(c=>c.niveau==='contradiction').length*3))};
    const score=Object.values(sc).reduce((a,b)=>a+b,0);
    issues.sort((a,b)=>a.t0-b.t0);good.sort((a,b)=>a.t0-b.t0);neutral.sort((a,b)=>a.t0-b.t0);
    const priorites=[...issues].sort((a,b)=>(b.sev*3+Math.min(10,b.t1-b.t0))-(a.sev*3+Math.min(10,a.t1-a.t0))).slice(0,3).map(i=>i.id);
    const timeline=[];for(let s=0;s<Math.ceil(total);s++){const bb=buckets.get(s);if(!bb){timeline.push('absent');continue;}let k='force',m=-1;for(const key in bb){if(bb[key]>m){m=bb[key];k=key;}}timeline.push(k);}
    return {duree:Math.round(total),corpsVisiblePct:pct(dur.body,total),hands,gestes:{total:gestures.length,parMin:r1(gestures.length/(body/60))},
      ancrage:stance,balancement:sway,deplacements:{total:moves.length,utiles:useful,parasites:parasite,allersRetours:back},
      contacts:{total:touches.length,tics},tete:{hochements:ev.filter(e=>e.type==='oui-tete').length,secouements:ev.filter(e=>e.type==='non-tete').length},
      issues,good,neutral,priorites,notes,contradictions,timeline,score:{total:Math.max(0,score),detail:sc}};
  };
  return A;
};
if(typeof module!=='undefined'&&module.exports)module.exports=E;else root.AgoraEngine=E;
})(typeof self!=='undefined'?self:this);
