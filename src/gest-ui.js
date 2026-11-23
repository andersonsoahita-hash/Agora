/* Agora — Gestuelle intégrée (généré par tools/make-gest.py : ne pas éditer à la main). Isolée dans un Shadow DOM : ni styles ni identifiants partagés avec l'appli. */
(function(){
var CSS="\n:host{position:fixed;inset:0;z-index:2000;display:block;--wine:#5A1610;--deep:#2E0B09;--ink:#1F1416;--panel:#3A1A18;--red:#B5301F;--hot:#E8553B;--gold:#D9A43A;--lgold:#F3D082;--ok:#6FCF97;--txt:#F7EDE6;--mut:#C9AFA6;color-scheme:dark}\n*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}\n\nh1,h2,h3{font-family:Didot,\"Bodoni 72\",\"Playfair Display\",Georgia,serif;font-weight:600;margin:0}\n.scr{position:fixed;inset:0;display:none;flex-direction:column;overflow:auto;overflow-x:hidden;padding:max(18px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left))}\n.scr.on{display:flex}\n.btn{appearance:none;border:0;border-radius:14px;padding:15px 22px;font:600 16px \"Avenir Next\",system-ui,sans-serif;color:var(--deep);background:linear-gradient(135deg,var(--lgold),var(--gold));cursor:pointer}\n.btn.sec{background:transparent;color:var(--lgold);border:1px solid rgba(217,164,58,.5)}\n.btn.red{background:var(--red);color:#fff}.btn:disabled{opacity:.4}\n.btn:active{transform:scale(.97)}\n.tag{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}\n#s-home{align-items:center;justify-content:center;text-align:center;gap:16px;background:radial-gradient(120% 80% at 50% 0%,var(--wine),var(--deep) 70%)}\n.orb{width:110px;height:110px;border-radius:50%;position:relative}\n.orb i{position:absolute;inset:0;border-radius:50%;border:1.5px solid var(--gold);opacity:0;animation:ring 3.6s infinite}.orb i:nth-child(2){animation-delay:1.2s}.orb i:nth-child(3){animation-delay:2.4s}\n.orb b{position:absolute;inset:36px;border-radius:50%;background:radial-gradient(circle at 35% 30%,var(--lgold),var(--gold) 55%,var(--red));box-shadow:0 0 40px rgba(217,164,58,.5);animation:br 3.6s ease-in-out infinite}\n@keyframes ring{0%{transform:scale(.4);opacity:.9}100%{transform:scale(1.5);opacity:0}}@keyframes br{50%{transform:scale(1.12)}}\n#s-home h1{font-size:42px;line-height:1.05;animation:rise .9s both}#s-home p{margin:0;color:var(--mut);max-width:30ch;animation:rise .9s .25s both}\n#s-home .btns{display:flex;flex-direction:column;gap:10px;width:min(300px,100%);animation:rise .9s .5s both;margin-top:6px}\n@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}\n.by{font-size:13px;color:var(--mut);letter-spacing:.12em}.badge{font-size:12px;color:var(--gold);border:1px solid rgba(217,164,58,.4);padding:3px 10px;border-radius:99px}\n.hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.hd h2{font-size:26px}\n.card{background:var(--panel);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:14px;margin-bottom:12px}\n.card h3{font-size:18px;margin-bottom:8px;color:var(--lgold)}\n.row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-top:1px solid rgba(255,255,255,.06)}.row:first-of-type{border-top:0}\n.row small{display:block;color:var(--mut);font-size:13px}\nselect,textarea{font:16px \"Avenir Next\",system-ui,sans-serif;color:var(--txt);background:var(--ink);border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:9px 10px;max-width:55%}\ntextarea{width:100%;max-width:100%;min-height:110px;resize:vertical}\n.seg{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}\n.seg button{font:600 14px \"Avenir Next\",system-ui,sans-serif;color:var(--mut);background:var(--ink);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:8px 12px}\n.seg button.on{color:var(--deep);background:var(--gold);border-color:var(--gold)}\n.sw{position:relative;width:50px;height:30px;flex:none}.sw input{opacity:0;position:absolute;inset:0;margin:0;width:100%;height:100%;z-index:2}\n.sw span{position:absolute;inset:0;background:var(--ink);border-radius:99px;border:1px solid rgba(255,255,255,.18);transition:.2s}\n.sw span:after{content:\"\";position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:var(--mut);transition:.2s}\n.sw input:checked+span{background:var(--red)}.sw input:checked+span:after{left:23px;background:#fff}\ninput[type=range]{accent-color:var(--gold);width:55%;min-width:0;max-width:55%}.row>*{min-width:0}.card{overflow-x:hidden}\n.sticky{position:sticky;bottom:0;padding-top:10px;background:linear-gradient(transparent,var(--deep) 30%)}.sticky .btn{width:100%}\n.note{font-size:13px;color:var(--mut)}\n/* autorisations */\n.perm{display:flex;gap:12px;align-items:center;padding:12px 0;border-top:1px solid rgba(255,255,255,.07)}.perm:first-of-type{border-top:0}\n.dot{width:26px;height:26px;border-radius:50%;flex:none;display:grid;place-items:center;font-size:14px;background:var(--ink);border:1px solid rgba(255,255,255,.2)}\n.dot.ok{background:var(--ok);color:#06240f;border-color:var(--ok)}.dot.ko{background:var(--hot);color:#fff;border-color:var(--hot)}.dot.wait{border-color:var(--gold);animation:br 1s infinite}\n.perm small{display:block;color:var(--mut);font-size:13px}\n/* session : cadre portrait */\n#s-run{padding:0;background:#000}\n.stage{flex:1;display:flex;flex-direction:column;min-height:0;align-items:center}\n.tp{position:absolute;left:0;right:0;top:0;height:46%;overflow:hidden;display:none;z-index:1;pointer-events:none;background:rgba(0,0,0,var(--tpbg,.3));-webkit-mask-image:linear-gradient(#000 80%,transparent);mask-image:linear-gradient(#000 80%,transparent)}.tp.on{display:block}\n.tp .txt{position:absolute;left:0;right:0;top:0;padding:56px 16px 70%;font:600 var(--tps,30px)/1.4 Didot,Georgia,serif;text-align:center;white-space:pre-wrap;color:rgba(255,255,255,var(--tpop,.9));text-shadow:0 1px 8px rgba(0,0,0,.75)}\n#cv{z-index:2}\n.cam{position:relative;flex:1;min-height:0;aspect-ratio:3/4;max-width:100%;max-height:100%;overflow:hidden;background:#000;align-self:center}\n.cam canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}\n.cam.land{aspect-ratio:16/9;flex:none;width:100%;max-height:100%}\n.cam.mir canvas{transform:scaleX(-1)}\n.hud{position:absolute;left:0;right:0;top:0;padding:max(10px,env(safe-area-inset-top)) 12px 0;display:flex;justify-content:space-between;gap:8px;z-index:4;pointer-events:none}\n.pill{background:rgba(31,20,22,.78);border:1px solid rgba(255,255,255,.12);border-radius:99px;padding:4px 10px;font-size:12px;font-variant-numeric:tabular-nums}\n.pill.rec:before{content:\"\";display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--hot);margin-right:7px;animation:br 1s infinite}\n.subj{position:absolute;left:10px;right:140px;bottom:74px;top:auto;z-index:4;background:rgba(20,8,7,.6);border-radius:10px;padding:6px 10px;font-size:12px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;pointer-events:none}\n.chips{position:absolute;right:10px;bottom:74px;z-index:4;display:flex;flex-direction:column;gap:5px;align-items:flex-end}\n.fc{font-size:11px;border-radius:99px;padding:2px 8px;background:rgba(31,20,22,.78);border:1px solid rgba(255,255,255,.12)}.fc.ok{color:var(--ok)}.fc.ko{color:#FF9C85}\n.alert{position:absolute;left:12px;right:12px;bottom:90px;z-index:4;background:rgba(181,48,31,.92);border-radius:12px;padding:10px 14px;font-weight:600;text-align:center;opacity:0;transition:.25s;pointer-events:none}.alert.on{opacity:1}\n.live{position:absolute;left:0;right:0;bottom:0;z-index:4;padding:10px 14px;background:linear-gradient(transparent,rgba(0,0,0,.85));min-height:60px}\n.live .tr{font-size:13px;min-height:44px;color:#fff}.live .tr em{color:var(--mut);font-style:normal}\n.bar{position:relative;z-index:30;flex:none;width:100%;background:#000;padding:10px 12px max(12px,env(safe-area-inset-bottom))}\n.cset{position:absolute;left:10px;right:10px;bottom:84px;z-index:12;background:rgba(20,8,6,.96);border:1px solid rgba(217,164,58,.4);border-radius:14px;padding:6px 14px;max-height:60%;overflow:auto}.cset .row small{display:block;color:var(--mut);font-size:12px}.cset select{max-width:55%}\n.mini{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:12px}\n.chipb{background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:99px;padding:8px 14px;font:600 13px system-ui,sans-serif;cursor:pointer}\n.shut{display:grid;grid-template-columns:1fr auto 1fr;align-items:center}.shut .sp{width:52px}.shut .mid{display:grid;place-items:center}.shut .flip{justify-self:end;width:52px;height:52px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font-size:24px;cursor:pointer}\n.shutter{width:76px;height:76px;border-radius:50%;border:4px solid #fff;background:transparent;padding:0;cursor:pointer;position:relative;font-size:0;color:transparent}\n.shutter:after{content:\"\";position:absolute;inset:5px;border-radius:50%;background:#fff;transition:.15s}.shutter:active:after{inset:8px}\n.shutter.stopb:after{background:#e0352b;inset:20px;border-radius:8px}\n.shutter[hidden],.flip[hidden],.chipb[hidden]{display:none}\n.ctl{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}.ctl{flex-wrap:nowrap;gap:6px}#rep .ctl{flex-wrap:wrap}.ctl .btn{padding:11px 10px;font-size:13px;white-space:nowrap}\n.count{position:absolute;inset:0;z-index:6;display:none;align-items:center;justify-content:center;font:700 140px Didot,Georgia,serif;color:var(--lgold);background:rgba(0,0,0,.55)}.count.on{display:flex}\n.rot{position:fixed;inset:0;z-index:20;background:var(--deep);display:none;flex-direction:column;gap:14px;align-items:center;justify-content:center;text-align:center;padding:30px}\n.rot.on{display:flex}.rot b{font:600 28px Didot,Georgia,serif;color:var(--lgold)}\n/* rapport */\n.score{display:flex;align-items:center;gap:16px}\n.ring{width:96px;height:96px;flex:none;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--gold) calc(var(--p)*1%),rgba(255,255,255,.09) 0)}\n.ring div{width:74px;height:74px;border-radius:50%;background:var(--panel);display:grid;place-items:center;font:600 28px Didot,Georgia,serif}\n.vwrap{position:relative;background:#000;border-radius:14px;overflow:hidden;margin-bottom:6px;aspect-ratio:9/16;max-height:68vh;margin-inline:auto}\n.vwrap video,.vwrap canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.vwrap canvas{pointer-events:none}\n.mk{position:relative;height:30px;background:var(--ink);border-radius:8px;margin:8px 0 4px;overflow:hidden;cursor:pointer}\n.mk i{position:absolute;top:4px;bottom:4px;min-width:5px;border-radius:4px;opacity:.95}\n.mk .cur{position:absolute;top:0;bottom:0;width:2px;background:#fff;z-index:2}\n.i-bad{background:var(--hot)}.i-mid{background:#E0A030}.i-good{background:var(--ok)}.i-neu{background:#7A5A55}\n.iss{border-left:4px solid var(--hot);background:var(--ink);border-radius:12px;padding:12px;margin-bottom:10px}\n.iss.s1{border-color:#E0A030}.iss.s0{border-color:var(--ok)}.iss.n{border-color:#7A5A55}\n.iss h4{margin:0 0 4px;font:600 16px \"Avenir Next\",system-ui,sans-serif}.iss p{margin:5px 0;font-size:15px}\n.iss .w{color:var(--mut)}.iss .f{color:var(--lgold)}\n.play{font:600 13px \"Avenir Next\",system-ui,sans-serif;background:rgba(217,164,58,.18);color:var(--lgold);border:1px solid rgba(217,164,58,.5);border-radius:99px;padding:5px 12px;float:right;margin-left:8px}\n.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.k{background:var(--ink);border-radius:12px;padding:10px 12px}\n.k b{display:block;font:600 22px Didot,Georgia,serif;color:var(--lgold)}.k span{font-size:13px;color:var(--mut)}\n.tl{display:flex;height:18px;border-radius:6px;overflow:hidden;background:var(--ink)}.tl i{flex:1;min-width:1px}\n.c-force{background:#6FCF97}.c-basse{background:#E0A030}.c-haute{background:#5FA8E0}.c-cachee{background:#E8553B}.c-hors{background:#7A5A55}.c-absent{background:#222}\n.leg{display:flex;flex-wrap:wrap;gap:10px;font-size:12px;color:var(--mut);margin-top:8px}.leg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px}\n.trs{line-height:1.9}.trs span.w{cursor:pointer}.trs span.w.hl{background:rgba(232,85,59,.3);border-radius:4px}\ndetails summary{cursor:pointer;color:var(--lgold);font-weight:600;margin:4px 0 8px}\n.hist button{width:100%;text-align:left;background:var(--ink);border:1px solid rgba(255,255,255,.08);color:var(--txt);border-radius:12px;padding:12px;margin-bottom:8px;font:15px \"Avenir Next\",system-ui,sans-serif}\na{color:var(--lgold)}\n.tabs{display:flex;gap:6px;margin:0 0 12px;position:sticky;top:-18px;z-index:5;background:var(--deep);padding:8px 0}\n.tabs button{flex:1;font:600 15px \"Avenir Next\",system-ui,sans-serif;color:var(--mut);background:var(--ink);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 6px}\n.tabs button.on{color:var(--deep);background:var(--gold);border-color:var(--gold)}\n.metric{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-top:1px solid rgba(255,255,255,.07);font-size:15px}.metric:first-of-type{border-top:0}.metric b{text-align:right;color:var(--lgold);font-weight:600}\n.tag-ok{color:var(--ok)!important}.tag-warn{color:#E0A030!important}.tag-bad{color:#FF9C85!important}\n.pillars{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.pil{text-align:center}.pil b{font:600 2rem Didot,Georgia,serif;display:block;line-height:1}\n.small{font-size:13px}.muted{color:var(--mut)}\nmark.tic{background:rgba(232,85,59,.35);color:inherit;border-radius:3px}mark.att{background:rgba(224,160,48,.3);color:inherit;border-radius:3px}mark.vag{background:rgba(127,176,224,.28);color:inherit;border-radius:3px}\nsvg.chart{width:100%;height:90px;background:var(--ink);border-radius:8px;cursor:pointer;display:block;margin-top:4px}\n.hist .hdel{width:auto;margin:0}.hrow{display:flex;gap:8px;align-items:stretch;margin-bottom:8px}.hrow .hopen{flex:1;text-align:left;margin:0}.hdel{flex:none;font:600 13px \"Avenir Next\",system-ui,sans-serif;color:var(--lgold);background:transparent;border:1px solid rgba(217,164,58,.4);border-radius:12px;padding:0 12px}.hdel.danger,.btn.danger{color:#fff;background:#B23A28;border-color:#B23A28}\n\n.scr{z-index:1}\n:host{background:var(--deep);color:var(--txt);font:16px/1.45 \"Avenir Next\",Avenir,system-ui,sans-serif}\n", HTML="\n\n\n\n<section class=\"scr on\" id=\"s-set\">\n  <div class=\"hd\"><h2>Réglages</h2><span style=\"display:flex;gap:6px\"><button class=\"btn sec\" id=\"histBtn\" style=\"padding:9px 14px\">Mes essais</button><button class=\"btn sec\" id=\"back1\" style=\"padding:9px 14px\">Fermer</button></span></div>\n  <div class=\"card\" id=\"exoPick\" style=\"display:grid;gap:8px\"><h3>Exercice</h3><select id=\"exoSel\"><option value=\"\">Libre : je parle de ce que je veux</option></select><select id=\"discSel\" hidden><option value=\"\">Choisis un discours à lire</option></select><div id=\"exoSubj\" class=\"note\" hidden></div><div><button class=\"btn sec\" id=\"exoNew\" style=\"padding:9px 14px\" hidden>Autre sujet</button></div></div>\n  <div class=\"card\" id=\"exoBanner\" hidden><h3 id=\"exoT\"></h3><p class=\"note\" id=\"exoS\" style=\"margin:6px 0 0\"></p></div>\n  <div class=\"card\"><h3>Caméra</h3>\n    <div class=\"row\"><div>Caméra<small>Selfie ou arrière</small></div><div class=\"seg\" id=\"g-cam\"><button data-v=\"user\">Selfie</button><button data-v=\"environment\" class=\"on\">Arrière</button></div></div>\n    <div class=\"row\"><div>Objectif<small id=\"lensNote\">Ultra grand angle, si le téléphone le propose</small></div><select id=\"lens\"><option value=\"\">Par défaut</option></select></div>\n    <div class=\"row\"><div>Image<small>Vertical ou horizontal, à changer à chaque fois</small></div><div class=\"seg\" id=\"g-or\"><button data-v=\"v\" class=\"on\">Vertical</button><button data-v=\"h\">Horizontal</button></div></div>\n    <div class=\"row\"><div>Cadrage<small>Corps entier : ancrage et déplacements</small></div><div class=\"seg\" id=\"g-mode\"><button data-v=\"full\" class=\"on\">Corps entier</button><button data-v=\"upper\">Haut du corps</button></div></div>\n  </div>\n  <div class=\"card\"><h3>Prise de parole</h3>\n    <div class=\"row\"><div>Durée</div><div class=\"seg\" id=\"g-dur\"><button data-v=\"30\">30 s</button><button data-v=\"60\" class=\"on\">1 min</button><button data-v=\"120\">2 min</button><button data-v=\"300\">5 min</button><button data-v=\"0\">Libre</button></div></div>\n    <div class=\"row\"><div>Transcription<small>Sert à comprendre le contexte des gestes. Envoie la voix à Apple/Google (ok pour le test)</small></div><label class=\"sw\"><input type=\"checkbox\" id=\"stt\" checked><span></span></label></div>\n    <div class=\"row\"><div>Alertes en direct</div><label class=\"sw\"><input type=\"checkbox\" id=\"liveFb\" checked><span></span></label></div>\n  </div>\n  <div class=\"card\"><h3>Téléprompteur</h3>\n    <div class=\"row\"><div>Activer</div><label class=\"sw\"><input type=\"checkbox\" id=\"tpOn\"><span></span></label></div>\n    <div id=\"tpBox\" hidden>\n      <div class=\"row\"><div>Transparence du texte<small>Plus bas = plus transparent</small></div><input type=\"range\" id=\"tpOp\" min=\"0.25\" max=\"1\" step=\"0.05\"></div><div class=\"row\"><div>Fond derrière le texte<small>0 = aucun fond</small></div><input type=\"range\" id=\"tpBg\" min=\"0\" max=\"0.8\" step=\"0.05\"></div>\n      <div class=\"row\"><div>Vitesse</div><input type=\"range\" id=\"tpSpeed\" min=\"10\" max=\"120\" value=\"40\"></div>\n      <div class=\"row\"><div>Taille</div><input type=\"range\" id=\"tpSize\" min=\"20\" max=\"48\" value=\"30\"></div>\n      <textarea id=\"script\" placeholder=\"Colle ton texte ici…\"></textarea>\n      <p class=\"note\">Avec le téléprompteur, « tête baissée » n’est pas jugé.</p></div>\n  </div>\n  <div class=\"card\"><h3>Seuil</h3><div class=\"row\"><div>Mains cachées : à partir de<small id=\"hdv\">8 s</small></div><input type=\"range\" id=\"hidT\" min=\"3\" max=\"30\" value=\"8\"></div></div>\n  <div class=\"sticky\"><button class=\"btn\" id=\"start\">Continuer : autorisations</button></div>\n</section>\n\n<section class=\"scr\" id=\"s-perm\">\n  <div class=\"hd\"><h2>Autorisations</h2><button class=\"btn sec\" id=\"back4\" style=\"padding:9px 14px\">Retour</button></div>\n  <p class=\"note\" style=\"margin-top:0\">Tout est demandé ici, avant de commencer. Une fois les voyants au vert, tu pourras lancer ta prise de parole sans autre fenêtre.</p>\n  <div class=\"card\" id=\"permList\"></div>\n  <div class=\"sticky\"><button class=\"btn\" id=\"grant\">Tout autoriser</button></div>\n</section>\n\n<section class=\"scr\" id=\"s-run\">\n  <div class=\"stage\">\n    <div class=\"cam\" id=\"cam\"><video id=\"vid\" playsinline muted style=\"position:absolute;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none\"></video><canvas id=\"proc\"></canvas><div class=\"tp\" id=\"tp\"><div class=\"txt\" id=\"tpTxt\"></div></div><canvas id=\"cv\"></canvas>\n      <div class=\"hud\"><span class=\"pill rec\" id=\"timer\">0:00</span><span class=\"pill\" id=\"pst\">—</span></div>\n      <div class=\"chips\" id=\"chips\"></div><div class=\"subj\" id=\"subj\" hidden></div>\n      <div class=\"alert\" id=\"alert\"></div>\n      <div class=\"live\"><div class=\"tr\" id=\"tr\"><em>Place-toi dans le cadre. Image de travers ? Touche ↻ jusqu’à ce qu’elle soit droite : c’est mémorisé.</em></div></div>\n      <div class=\"count\" id=\"count\"></div>\n      <div class=\"cset\" id=\"camSet\" hidden>\n        <div class=\"row\"><div>Caméra</div><select id=\"csCam\"><option value=\"user\">Avant (selfie)</option><option value=\"environment\">Arrière</option></select></div>\n        <div class=\"row\"><div>Objectif<small>Ultra grand angle si dispo</small></div><select id=\"csLens\"></select></div>\n        <div class=\"row\"><div>Cadrage<small>« Image entière » ne recadre pas</small></div><select id=\"csFit\"><option value=\"native\">Image entière</option><option value=\"fill\">Remplir (zoomé)</option></select></div>\n        <div class=\"row\"><div>Zoom<small id=\"csZv\">×1.0</small></div><input type=\"range\" id=\"csZoom\" min=\"1\" max=\"2.5\" step=\"0.1\"></div>\n        <div class=\"row\"><div>Transparence du texte<small id=\"csTv\"></small></div><input type=\"range\" id=\"csTp\" min=\"0.25\" max=\"1\" step=\"0.05\"></div>\n        <div class=\"row\"><div>Miroir en selfie<small>Aperçu seulement, la vidéo n’est pas inversée</small></div><input type=\"checkbox\" id=\"csMir\"></div>\n      </div>\n    </div>\n    <div class=\"bar\"><div class=\"mini\"><button class=\"chipb\" id=\"orBtn\">Vertical</button><button class=\"chipb\" id=\"rotBtn\" title=\"Pivoter l’image\">↻</button><button class=\"chipb\" id=\"camBtn\">Réglages</button><button class=\"chipb\" id=\"quit\">✕ Quitter</button></div>\n      <div class=\"shut\"><span class=\"sp\"></span><div class=\"mid\"><button class=\"shutter\" id=\"go\" aria-label=\"Commencer\">Commencer</button><button class=\"shutter stopb\" id=\"stop\" aria-label=\"Terminer\" hidden>Terminer</button></div><button class=\"flip\" id=\"flip\" aria-label=\"Changer de caméra\">⟲</button></div></div>\n  </div>\n  \n</section>\n\n<section class=\"scr\" id=\"s-rep\"><div class=\"hd\"><h2>Rapport</h2><button class=\"btn sec\" id=\"back2\" style=\"padding:9px 14px\">Fermer</button></div><div id=\"rep\"></div></section>\n<section class=\"scr\" id=\"s-hist\"><div class=\"hd\"><h2>Mes essais</h2><button class=\"btn sec\" id=\"back3\" style=\"padding:9px 14px\">Retour</button></div><div class=\"hist\" id=\"histList\"></div></section>\n\n", cur=null;
window.AGGEST={
  open:function(o){
    if(cur)return; o=o||{};
    var host=document.createElement('div'); host.id='gest-host';
    var root=host.attachShadow({mode:'open'}); root.innerHTML='<style>'+CSS+'</style>'+HTML;
    document.body.appendChild(host); var clean=null;
    var close=function(){ if(!cur)return; try{clean&&clean();}catch(e){} host.remove(); cur=null; try{o.onClose&&o.onClose();}catch(e){} };
    cur={close:close};
    var opts={exos:o.exos||null,subject:o.subject||null,vendor:o.vendor||'gestuelle/vendor/',exo:o.exo||null,ns:o.ns||'/',demo:!!o.demo,open:o.open||null,close:close,done:function(it){ var h={id:it.id,date:it.date,score:it.r.score.total,duree:it.r.duree,exo:it.exo}; try{o.onDone&&o.onDone(h);}catch(e){} close(); }};
    var __reg=function(f){clean=f;};
    (async function(){

const APP_VERSION='int';let EXO=opts.exo||null;const NS=opts.ns||'/';
const DEMO=!!opts.demo;
let pb=null;const $=s=>root.querySelector(s);
const ls={get(k,d){try{const v=localStorage.getItem(NS+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(NS+k,JSON.stringify(v))}catch(e){}}};
const show=id=>{root.querySelectorAll('.scr').forEach(s=>s.classList.toggle('on',s.id===id));if(id!=='s-rep')stopPlayback();};
const fmt=AgoraEngine.fmt,esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LOC=f=>new URL(opts.vendor+'models/'+f,document.baseURI).href;
const MODEL_POSE='https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const MODEL_FACE='https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const MODEL_HAND='https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

/* ---- réglages (pas de taille : ça n’indique rien) ---- */
const S=Object.assign({orient:'v',cam:'environment',mode:'full',dur:60,tp:'ovl',tpOp:.9,tpBg:.3,lens:'',stt:true,liveFb:true,tpOn:false,tpSpeed:40,tpSize:26,script:'',hidT:8,fit:'native',zoom:1,mir:true},ls.get('agt_set',{}));
const save=()=>ls.set('agt_set',S);
if(EXO&&EXO.dur)S.dur=EXO.dur;
const seg=(id,key)=>{const g=$(id);g.querySelectorAll('button').forEach(b=>{b.classList.toggle('on',String(S[key])===b.dataset.v);b.onclick=()=>{S[key]=isNaN(b.dataset.v)||b.dataset.v===''?b.dataset.v:+b.dataset.v;g.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));save();}});};
seg('#g-cam','cam');seg('#g-or','orient');seg('#g-mode','mode');seg('#g-dur','dur');
const bind=(id,key,c)=>{const e=$(id);if(c){e.checked=!!S[key];e.onchange=()=>{S[key]=e.checked;save();sync();}}else{e.value=S[key];e.oninput=()=>{S[key]=e.value;save();sync();}}};
bind('#stt','stt',1);bind('#liveFb','liveFb',1);bind('#tpOn','tpOn',1);bind('#tpSpeed','tpSpeed');bind('#tpSize','tpSize');bind('#tpOp','tpOp');bind('#tpBg','tpBg');bind('#script','script');bind('#hidT','hidT');
const sync=()=>{$('#tpBox').hidden=!S.tpOn;$('#hdv').textContent=S.hidT+' s';};sync();
const exoSel=$('#exoSel');
(opts.exos||[]).forEach(x=>{const o=document.createElement('option');o.value=x.id;o.textContent=x.nom;exoSel.appendChild(o);});
if(EXO&&![...exoSel.options].some(o=>o.value===EXO.type)){const o=document.createElement('option');o.value=EXO.type;o.textContent=EXO.nom||EXO.type;exoSel.appendChild(o);}
exoSel.value=EXO?EXO.type:'';
const refreshExo=()=>{
  if(EXO)EXO.dur=S.dur||0;
  const sj=EXO?((EXO.sujet?'Sujet : '+EXO.sujet:'')+(EXO.stance?' · tu défends : '+EXO.stance:'')):'';
  $('#exoBanner').hidden=!EXO;
  if(EXO){$('#exoT').textContent='Exercice : '+(EXO.nom||EXO.type)+(EXO.dur?' · '+(EXO.dur<60?EXO.dur+' s':Math.round(EXO.dur/6)/10+' min'):'');$('#exoS').textContent=(sj||'Parle librement.')+' Tu seras filmé en entier : gestes, posture, voix et mots sont analysés.';}
  $('#exoSubj').hidden=!sj;$('#exoSubj').textContent=sj;
  $('#exoNew').hidden=!(EXO&&opts.subject&&EXO.type!=='lecture');
  $('#subj').textContent=EXO?(sj||EXO.nom||''):'';$('#subj').hidden=!sj;
};
exoSel.onchange=()=>{const v=exoSel.value;if(!v){EXO=null;}else{const s=(opts.subject&&opts.subject(v))||{};EXO={type:v,nom:exoSel.options[exoSel.selectedIndex].textContent,sujet:s.sujet||'',stance:s.stance||'',dur:S.dur||0};}refreshExo();};
$('#exoNew').onclick=()=>{if(!EXO||!opts.subject)return;const s=opts.subject(EXO.type)||{};EXO.sujet=s.sujet||'';EXO.stance=s.stance||'';refreshExo();};
$('#g-dur').addEventListener('click',()=>setTimeout(refreshExo,0));
const D_=window.AGDISC&&window.AGDISC.data;
if(D_){const o=document.createElement('option');o.value='lecture';o.textContent='Discours à jouer (texte prêt, au prompteur)';exoSel.appendChild(o);
  D_.sections.forEach(sec=>{const g=document.createElement('optgroup');g.label=sec.t;D_.discours.filter(d=>d.s===sec.id).forEach(d=>{const op=document.createElement('option');op.value=d.id;op.textContent=d.t;g.appendChild(op);});$('#discSel').appendChild(g);});
  if(EXO&&EXO.type==='lecture')exoSel.value='lecture';}
const setScript=(d)=>{S.script=d.l.join('\n');S.tpOn=true;S.dur=0;save();$('#script').value=S.script;$('#tpOn').checked=true;sync();$('#g-dur').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v==='0'));};
const exoSel2=exoSel.onchange;
exoSel.onchange=()=>{const lec=exoSel.value==='lecture';$('#discSel').hidden=!lec;if(lec){EXO={type:'lecture',nom:'Discours à jouer',sujet:'',stance:'',dur:0};$('#discSel').value='';refreshExo();}else exoSel2();};
$('#discSel').onchange=()=>{const d=D_&&D_.discours.find(x=>x.id===$('#discSel').value);if(!d||!EXO)return;EXO.sujet=d.t;setScript(d);refreshExo();};
$('#discSel').hidden=!(EXO&&EXO.type==='lecture');
refreshExo();show('s-set');
$('#back1').onclick=()=>opts.close();$('#back2').onclick=()=>opts.close();$('#back3').onclick=()=>show('s-set');
$('#back4').onclick=()=>{cleanup();show('s-set');};
$('#lens').onchange=e=>{S.lens=e.target.value;save();};
async function listLenses(){try{const d=(await navigator.mediaDevices.enumerateDevices()).filter(x=>x.kind==='videoinput'&&x.label);
  $('#lens').innerHTML='<option value="">Par défaut</option>'+d.map(l=>`<option value="${l.deviceId}">${esc(l.label)}</option>`).join('');$('#lens').value=S.lens||'';
  if(d.some(l=>/ultra|0[.,]5|grand/i.test(l.label)))$('#lensNote').textContent='Ultra grand angle détecté : choisis-le dans la liste.';}catch(e){}}

/* ---- stockage des vidéos (IndexedDB) ---- */
const idb={db:null,open(){return this.db?Promise.resolve(this.db):new Promise((res,rej)=>{const r=indexedDB.open(NS+'agora-gest',1);r.onupgradeneeded=()=>r.result.createObjectStore('s',{keyPath:'id'});r.onsuccess=()=>{this.db=r.result;res(r.result)};r.onerror=()=>rej(r.error);});},
 async put(o){const d=await this.open();return new Promise((res,rej)=>{const t=d.transaction('s','readwrite');t.objectStore('s').put(o);t.oncomplete=res;t.onerror=()=>rej(t.error);});},
 async get(id){const d=await this.open();return new Promise((res,rej)=>{const q=d.transaction('s').objectStore('s').get(id);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});},
 async del(id){const d=await this.open();return new Promise(res=>{const t=d.transaction('s','readwrite');t.objectStore('s').delete(id);t.oncomplete=res;t.onerror=res;});}};

/* ---- autorisations ---- */
const stt_ok=()=>!!(window.SpeechRecognition||window.webkitSpeechRecognition);
let P={cam:'',mic:'',stt:'',mod:''},stream=null,modelsOk=false,pose=null,hand=null,face=null,FC=[],FCI=[],FCP=[];
const permRows=()=>[['cam','Caméra','Pour te filmer, en portrait'],['mic','Micro','Pour enregistrer ta voix avec la vidéo'],['stt','Transcription vocale',S.stt?'Pour comprendre le contexte de tes gestes':'Désactivée dans les réglages'],['mod','Modèles d’analyse','Téléchargés une fois (connexion nécessaire)']];
function paintPerm(msgs={}){$('#permList').innerHTML=permRows().map(([k,t,d])=>{const v=P[k];const c=v==='ok'?'ok':v==='ko'?'ko':v==='wait'?'wait':'';const ic=v==='ok'?'✓':v==='ko'?'!':'';
  return `<div class="perm"><div class="dot ${c}">${ic}</div><div><b>${t}</b><small>${esc(msgs[k]||d)}</small></div></div>`}).join('');}
$('#start').onclick=()=>{P={cam:'',mic:'',stt:S.stt?'':'ok',mod:''};paintPerm();$('#grant').textContent='Tout autoriser';show('s-perm');listLenses();};
const portraitScreen=()=>matchMedia('(pointer:coarse)').matches;
let gW=null;
async function getStream(audio){
  const a=audio?{echoCancellation:true,noiseSuppression:true}:false;
  const sz=!portraitScreen()?{width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30}}:S.fit==='fill'?{width:{ideal:1080},height:{ideal:1920},aspectRatio:{ideal:9/16},frameRate:{ideal:30}}:{width:{ideal:1920},height:{ideal:1440},aspectRatio:{ideal:4/3},frameRate:{ideal:30}};
  const tries=[];
  if(S.lens)tries.push(Object.assign({},sz,{deviceId:{exact:S.lens}}));
  tries.push(Object.assign({},sz,{facingMode:{ideal:S.cam}}),{facingMode:{ideal:S.cam}},true);
  let err;
  for(let k=0;k<tries.length;k++){
    try{const r=await navigator.mediaDevices.getUserMedia({video:tries[k],audio:a});if(S.lens&&k>0){S.lens='';save();}return r;}
    catch(e){err=e;if(e&&(e.name==='NotAllowedError'||e.name==='SecurityError'))break;}
  }
  throw err;
}
$('#grant').onclick=async()=>{
  const msgs={};$('#grant').disabled=true;cleanup(true);
  P.cam='wait';P.mic='wait';paintPerm();
  try{stream=await getStream(true);P.cam='ok';P.mic='ok';}
  catch(e){try{stream=await getStream(false);P.cam='ok';P.mic='ko';msgs.mic='Micro refusé : réglages du navigateur, puis recharge la page.';}catch(e2){P.cam='ko';P.mic='ko';msgs.cam='Caméra refusée ou indisponible ('+(e2.name||e2)+').';}}
  paintPerm(msgs);
  if(stream){try{await listLenses();}catch(e){}
    const tr=stream.getVideoTracks()[0],st=tr.getSettings?tr.getSettings():{};
    if(S.fit==='fill'&&st.width&&st.height&&st.width>st.height&&portraitScreen()){try{await tr.applyConstraints({width:{ideal:1080},height:{ideal:1920}});}catch(e){}}
  }
  if(S.stt){P.stt='wait';paintPerm(msgs);
    if(!stt_ok()){P.stt='ko';msgs.stt='Non disponible sur ce navigateur (Safari ou Chrome récents).';}
    else{const r=await new Promise(res=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition,x=new SR();x.lang='fr-FR';let done=false;const f=v=>{if(!done){done=true;try{x.abort()}catch(e){}res(v)}};
      x.onstart=()=>setTimeout(()=>f('ok'),400);x.onerror=e=>f(e.error==='not-allowed'||e.error==='service-not-allowed'?'denied':'ok');setTimeout(()=>f('ok'),7000);try{x.start()}catch(e){f('ok')}});
      P.stt=r==='ok'?'ok':'ko';if(r!=='ok')msgs.stt='Refusée : active-la dans les réglages du navigateur, ou désactive la transcription.';}
    paintPerm(msgs);}
  P.mod='wait';paintPerm(msgs);
  try{if(DEMO){modelsOk=true;}else await loadModels();P.mod='ok';}catch(e){P.mod='ko';msgs.mod='Modèles non chargés : vérifie ta connexion. ('+(e.message||e)+')';console.error(e);}
  paintPerm(msgs);$('#grant').disabled=false;
  const need=[P.cam,P.mic,P.mod,S.stt?P.stt:'ok'];
  if(need.every(x=>x==='ok')){openRun();}
  else{$('#grant').textContent='Réessayer';if(P.cam==='ok'&&P.mod==='ok'&&P.mic!=='ok'){}}
};
async function loadModels(){
  if(pose&&hand&&face)return;
  const V=await import(new URL(opts.vendor+'vision_bundle.mjs',document.baseURI).href);const fs=await V.FilesetResolver.forVisionTasks(new URL(opts.vendor+'wasm',document.baseURI).href);
  const mk=async(cls,urls,extra)=>{let last;for(const url of urls){for(const d of ['GPU','CPU']){try{return await V[cls].createFromOptions(fs,{baseOptions:{modelAssetPath:url,delegate:d},runningMode:'VIDEO',...extra});}catch(e){last=e;}}}throw last;};
  pose=await mk('PoseLandmarker',[LOC('pose_landmarker_lite.task'),MODEL_POSE],{numPoses:1});hand=await mk('HandLandmarker',[LOC('hand_landmarker.task'),MODEL_HAND],{numHands:2});
  face=await mk('FaceLandmarker',[LOC('face_landmarker.task'),MODEL_FACE],{numFaces:1,outputFaceBlendshapes:false});
  try{FC=(V.FaceLandmarker.FACE_LANDMARKS_CONTOURS||[]).map(c=>[c.start,c.end]);FCI=[...new Set(FC.flat())];const pos={};FCI.forEach((v,i)=>pos[v]=i);FCP=FC.map(([a,b])=>[pos[a],pos[b]]);}catch(e){}
}

/* ---- session ---- */
const vid=$('#vid'),proc=$('#proc'),pctx=proc.getContext('2d'),cv=$('#cv'),ctx=cv.getContext('2d');
let aCtx=null,aProc=null,aSrc=null,pcmChunks=[],aSR=48000;
function startPCM(){stopPCM();pcmChunks=[];try{if(!stream||!stream.getAudioTracks().length)return;const AC=window.AudioContext||window.webkitAudioContext;aCtx=new AC();aSR=aCtx.sampleRate;aSrc=aCtx.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));aProc=aCtx.createScriptProcessor(4096,1,1);aProc.onaudioprocess=e=>{if(running)pcmChunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));};const g=aCtx.createGain();g.gain.value=0;aSrc.connect(aProc);aProc.connect(g);g.connect(aCtx.destination);aCtx.resume&&aCtx.resume();}catch(e){console.error(e);}}
function stopPCM(){try{aProc&&aProc.disconnect();aSrc&&aSrc.disconnect();aCtx&&aCtx.close();}catch(e){}aProc=aSrc=aCtx=null;}
let raf=0,running=false,an=null,rec=null,chunks=[],recMime='',tStart=0,t0perf=0,transcript=[],frames=[],lastAlert=0,tpRaf=0,recWanted=false,lastVT=-1,frameN=0,lastState='force',lastHands=null,lastHandsT=-9,lastFace=null,lastFaceT=-9,sttObj=null,lastDet=0,calibMiss=0,rotUser=0,calib=false,calibT=0,calibTries=0,calibOk=0;
let srcA=9/16,recTrack=null;
const PW=()=>{const a=S.fit==='native'?Math.min(.75,Math.max(9/16,srcA)):9/16,ev=n=>Math.round(n/2)*2;return S.orient==='v'?[720,ev(720/a)]:[ev(1280),ev(1280*a)];};
function applyOrient(){if(vid.videoWidth)srcA=Math.min(vid.videoWidth,vid.videoHeight)/Math.max(vid.videoWidth,vid.videoHeight);const [W,H]=PW();$('#cam').style.aspectRatio=W+'/'+H;if(proc.width!==W||proc.height!==H){proc.width=W;proc.height=H;}$('#cam').classList.toggle('land',S.orient==='h');$('#orBtn').textContent=S.orient==='v'?'Vertical':'Horizontal';resize();}
function drawProc(){const vw=vid.videoWidth,vh=vid.videoHeight;if(!vw)return;const [W,H]=PW();
  const auto=((vw>vh)===(S.orient==='v'))?1:0,q=(auto+rotUser)%4,sw=(q%2)?vh:vw,sh=(q%2)?vw:vh,sc=Math.max(W/sw,H/sh)*Math.max(1,+S.zoom||1);
  pctx.save();pctx.fillStyle='#000';pctx.fillRect(0,0,W,H);pctx.translate(W/2,H/2);pctx.rotate(q*Math.PI/2);pctx.drawImage(vid,-vw*sc/2,-vh*sc/2,vw*sc,vh*sc);pctx.restore();try{if(recTrack&&recTrack.requestFrame)recTrack.requestFrame();}catch(e){}}
const rotKey=()=>{const tr=stream&&stream.getVideoTracks()[0],f=(tr&&tr.getSettings&&tr.getSettings().facingMode)||S.cam;return 'agt_rot_'+f+'_'+S.orient+'_'+(vid.videoWidth>vid.videoHeight?'l':'p');};
function loadRot(){const v=ls.get(rotKey(),null);if(v!==null&&v!==undefined){rotUser=v%4;calib=true;}}
function saveRot(){ls.set(rotKey(),rotUser);}
function setMir(){const tr=stream&&stream.getVideoTracks()[0],f=tr&&tr.getSettings&&tr.getSettings().facingMode;$('#cam').classList.toggle('mir',S.mir!==false&&(f?f==='user':(S.cam==='user'&&!S.lens)));}
async function swapCam(){try{const old=stream.getTracks();old.forEach(t=>t.stop());stream=await getStream(true);vid.srcObject=stream;vid.play().catch(()=>{});rotUser=0;calib=false;calibT=0;calibTries=0;calibOk=0;await listLenses2();setTimeout(()=>{applyOrient();loadRot();setMir();},400);}catch(e){flash('Caméra indisponible');console.error(e);}}
async function listLenses2(){try{const d=(await navigator.mediaDevices.enumerateDevices()).filter(x=>x.kind==='videoinput'&&x.label);$('#csLens').innerHTML='<option value="">Par défaut</option>'+d.map(l=>`<option value="${l.deviceId}">${esc(l.label)}</option>`).join('');$('#csLens').value=S.lens||'';}catch(e){}}
function bindCamSet(){$('#csCam').value=S.cam;$('#csFit').value=S.fit;$('#csZoom').value=S.zoom;$('#csZv').textContent='×'+(+S.zoom).toFixed(1);$('#csMir').checked=S.mir!==false;$('#csTp').value=S.tpOp;listLenses2();}
$('#camBtn').onclick=()=>{const e=$('#camSet');e.hidden=!e.hidden;if(!e.hidden)bindCamSet();};
$('#csCam').onchange=e=>{S.cam=e.target.value;S.lens='';save();swapCam();};
$('#csLens').onchange=e=>{S.lens=e.target.value;save();swapCam();};
$('#csFit').onchange=e=>{S.fit=e.target.value;save();swapCam();};
$('#csZoom').oninput=e=>{S.zoom=+e.target.value;$('#csZv').textContent='×'+S.zoom.toFixed(1);save();};
$('#csTp').oninput=e=>{S.tpOp=+e.target.value;$('#tp').style.setProperty('--tpop',S.tpOp);save();};
$('#csMir').onchange=e=>{S.mir=e.target.checked;save();setMir();};
vid.addEventListener('loadedmetadata',()=>{if(!running&&$('#s-run').classList.contains('on'))applyOrient();});
vid.addEventListener('resize',()=>{if(!running&&$('#s-run').classList.contains('on'))applyOrient();});
function openRun(){
  show('s-run');rotUser=0;calib=false;calibT=0;calibTries=0;calibOk=0;
  setMir();
  const tp=$('#tp');tp.classList.toggle('on',!!S.tpOn);tp.style.setProperty('--tpop',S.tpOp);tp.style.setProperty('--tpbg',S.tpBg);
  $('#tpTxt').textContent=S.script||'(aucun texte)';$('#tpTxt').style.setProperty('--tps',S.tpSize+'px');$('#tpTxt').style.transform='translateY(0)';
  $('#go').hidden=false;$('#orBtn').hidden=false;$('#rotBtn').hidden=false;$('#camBtn').hidden=false;$('#camSet').hidden=true;$('#stop').hidden=true;$('#timer').textContent='0:00';
  vid.srcObject=stream;vid.play().catch(()=>{});
  try{const tr=stream.getVideoTracks()[0],cp=tr.getCapabilities?tr.getCapabilities():{};if(cp.zoom&&cp.zoom.min<1&&(+S.zoom||1)<=1)tr.applyConstraints({advanced:[{zoom:cp.zoom.min}]}).catch(()=>{});}catch(e){}
  $('#flip').hidden=false;
  setTimeout(()=>{applyOrient();loadRot();running=false;lastVT=-1;loop();},300);
}
const onWinResize=()=>{const g=$('#s-run');if(g&&g.classList.contains('on'))resize();};addEventListener('resize',onWinResize);
function resize(){const r=$('#cam').getBoundingClientRect();cv.width=Math.max(2,r.width*devicePixelRatio);cv.height=Math.max(2,r.height*devicePixelRatio);}
$('#orBtn').onclick=()=>{S.orient=S.orient==='v'?'h':'v';save();rotUser=0;calib=false;calibT=0;calibTries=0;calibOk=0;applyOrient();loadRot();};
$('#rotBtn').onclick=()=>{rotUser=(rotUser+1)%4;calib=true;saveRot();};
$('#flip').onclick=()=>{if(running)return;S.cam=S.cam==='user'?'environment':'user';S.lens='';save();swapCam();};
$('#quit').onclick=()=>{cleanup();show('s-set');};

/* synthèse de démonstration (?demo=1) : un corps simulé, pour tester tout le parcours sans modèle */
function demoFrame(t){
  const AS=proc.width/proc.height,ED=0.036,CX=.5,EY=.2;
  const L=Array.from({length:33},()=>({x:.5,y:.5,visibility:.99}));const s=(i,x,y,v)=>L[i]={x,y,visibility:v==null?.99:v};
  const e=ED/AS;s(0,CX,EY+.01);s(2,CX-e*.25,EY);s(5,CX+e*.25,EY);s(7,CX-e/2,EY+.005);s(8,CX+e/2,EY+.005);s(9,CX-e*.1,EY+ED*.5);s(10,CX+e*.1,EY+ED*.5);
  s(11,CX-.09,.33);s(12,CX+.09,.33);s(23,CX-.06,.62);s(24,CX+.06,.62);s(27,CX-.08,.93);s(28,CX+.08,.93);
  let wl=[.40,.48,.99],wr=[.60,.48,.99],hands=null;
  const hair=[CX+.01,EY-ED*1.0];
  const mk=(x,y,ratio=.5)=>{const pw=ratio*ED/AS;const H=Array.from({length:21},()=>({x,y}));H[5]={x:x-pw/2,y};H[17]={x:x+pw/2,y};[4,8,12,16,20].forEach((i,k)=>H[i]={x:x+(k-2)*pw/8,y:y-0.004*(k%2)});H[0]={x,y:y+.03};H[2]={x:x-pw/3,y:y+.01};[6,10,14,18].forEach(i=>H[i]={x,y:y-.005});return H;};
  const _set=()=>{s(15,...wl);s(16,...wr);[17,19,21].forEach(i=>s(i,wl[0],wl[1],wl[2]));[18,20,22].forEach(i=>s(i,wr[0],wr[1],wr[2]));};
  if(t>=5&&t<8.5){wl=[hair[0],hair[1],.99];hands=[mk(hair[0],hair[1])];}
  else if(t>=12&&t<22){wl=[.45,.6,.1];wr=[.55,.6,.1];}
  else if(t>=26&&t<29){wl=[hair[0],hair[1],.99];hands=[mk(hair[0],hair[1])];}
  else hands=[mk(wl[0],wl[1])];
  _set();
  const face=AgoraEngine.syntheticFace(CX,EY,ED,AS,0);
  return {L,hands,face};
}
const DEMO_WORDS=[[3,'bonjour'],[3.4,'à'],[3.7,'tous'],[4.2,'aujourd’hui'],[4.8,'je'],[5.2,'vais'],[5.6,'vous'],[6,'parler'],[6.4,'de'],[6.8,'notre'],[7.2,'projet'],[7.6,'de'],[8,'quartier'],[24.5,'ma'],[25,'couleur'],[25.5,'de'],[26,'cheveux'],[26.6,'est'],[27.2,'naturelle'],[28,'oui']];
(()=>{const extra='parce que premièrement soixante dix pour cent des jeunes osent rarement parler en public. Par exemple en 2024 une étude montre que deux jeunes sur trois ont peur. Alors imaginez ce que je ressens quand je raconte mon histoire. Euh je pense que nous devons agir ensemble. Donc voici trois raisons. Pourquoi pas vous ?'.split(' ');extra.forEach((w,i)=>DEMO_WORDS.push([9.2+i*.42,w]));DEMO_WORDS.sort((a,b)=>a[0]-b[0]);})();
let demoI=0;

/* nombre de quarts de tour (sens horaire) à appliquer pour que la tête soit en haut ; null si on ne voit personne */
function headTurns(fl,L){const W=proc.width,H=proc.height;let v=null;
  if(fl&&fl[33]&&fl[263]&&fl[152]){v=[((fl[33].x+fl[263].x)/2-fl[152].x)*W,((fl[33].y+fl[263].y)/2-fl[152].y)*H];}
  else if(L&&L[0]&&L[11]&&L[12]&&L[11].visibility>.5&&L[12].visibility>.5){v=[(L[0].x-(L[11].x+L[12].x)/2)*W,(L[0].y-(L[11].y+L[12].y)/2)*H];}
  return v?turnsFor(v[0],v[1]):null;}
function turnsFor(x,y){if(Math.abs(y)>=Math.abs(x))return y<0?0:2;return x>0?3:1;}
function loop(){
  raf=requestAnimationFrame(loop);
  if(vid.readyState<2)return;
  drawProc();
  const now=performance.now();if(!DEMO&&now-lastDet<50)return;
  if(vid.currentTime===lastVT)return;lastVT=vid.currentTime;frameN++;lastDet=now;let L=null,hl=null,fl=null;
  if(DEMO){const t=tStart?(now-tStart)/1000:0;const d=demoFrame(t);L=d.L;hl=d.hands;fl=d.face;}
  else{let pr=null;try{pr=pose.detectForVideo(proc,now);
      if(frameN%2===0){const hr=hand.detectForVideo(proc,now);lastHands=hr.landmarks&&hr.landmarks.length?hr.landmarks:null;lastHandsT=now;}
      else{const fr=face.detectForVideo(proc,now);lastFace=fr.faceLandmarks&&fr.faceLandmarks[0]?fr.faceLandmarks[0]:null;lastFaceT=now;}}catch(e){return;}
    L=pr&&pr.landmarks&&pr.landmarks[0];gW=pr&&pr.worldLandmarks&&pr.worldLandmarks[0]||null;hl=(now-lastHandsT<350)?lastHands:null;fl=(now-lastFaceT<350)?lastFace:null;}
  if(!DEMO&&!running&&!calib&&now-calibT>700){calibT=now;const k=headTurns(fl,L);if(k===null){if(++calibMiss>=3){calibMiss=0;if(++calibTries<=6)rotUser=(rotUser+1)%4;else calib=true;}}else{calibMiss=0;if(k===0){if(++calibOk>=2){calib=true;saveRot();}}else{calibOk=0;if(++calibTries<=6)rotUser=(rotUser+k)%4;else calib=true;}}}
  const t=(now-t0perf)/1000;
  if(running&&an&&tStart){
    an.setOpts({aspect:proc.width/proc.height});
    if(DEMO){while(demoI<DEMO_WORDS.length&&DEMO_WORDS[demoI][0]<=t){an.addWord(DEMO_WORDS[demoI][1],DEMO_WORDS[demoI][0]);transcript.push({w:DEMO_WORDS[demoI][1],t:DEMO_WORDS[demoI][0]});an.markSpeech(t);demoI++;}if(t<30&&t>3)an.markSpeech(t);}
    const out=an.push({t,pose:L,world:gW,hands:hl,face:fl});
    if(frameN%2===0&&L)frames.push([Math.round(t*100)/100,L.map(p=>[Math.round(p.x*1000),Math.round(p.y*1000),Math.round((p.visibility||0)*100)]),hl?hl.map(h=>h.map(p=>[Math.round(p.x*1000),Math.round(p.y*1000)])):null,(fl&&FCI.length)?FCI.map(i=>[Math.round(fl[i].x*1000),Math.round(fl[i].y*1000)]):null]);
    if(out&&out.state){lastState=out.state;$('#pst').textContent=LAB[out.state];$('#pst').style.borderColor=COL[out.state];}
    if(S.liveFb&&out&&out.alerts.length&&now-lastAlert>6000){lastAlert=now;flash(out.alerts[0]);}
    const el=Math.floor((now-tStart)/1000);$('#timer').textContent=Math.floor(el/60)+':'+String(el%60).padStart(2,'0');
    if(S.dur&&el>=S.dur)finish();
  }else if(!running&&L&&frameN%6===0)framing(L);
  drawLive(L,hl,fl);
}
function framing(L){const v=i=>L[i]&&L[i].visibility>.5&&L[i].y<1&&L[i].y>0;
  const chips=[['Tête',v(0)],['Mains',v(15)||v(16)],S.mode==='full'?['Pieds',v(27)&&v(28)]:null].filter(Boolean);
  $('#chips').innerHTML=chips.map(([n,ok])=>`<span class="fc ${ok?'ok':'ko'}">${ok?'✓':'✕'} ${n} dans le cadre</span>`).join('');}
const COL={force:'#6FCF97',basse:'#E0A030',haute:'#5FA8E0',cachee:'#E8553B',hors:'#7A5A55'};
const LAB={force:'Zone de force',basse:'Mains basses',haute:'Mains hautes',cachee:'Mains cachées',hors:'Mains hors cadre'};
const CONN=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
function skeleton(c,W,H,vw,vh,L,hands,wcol,fpts,fpairs){
  c.clearRect(0,0,W,H);if(!vw||!L)return null;
  const sc=Math.min(W/vw,H/vh),dw=vw*sc,dh=vh*sc,ox=(W-dw)/2,oy=(H-dh)/2,dp=devicePixelRatio||1;
  const X=p=>ox+p.x*dw,Y=p=>oy+p.y*dh,vis=i=>L[i].visibility>.4;
  if(vis(11)&&vis(12)){const sy=(L[11].y+L[12].y)/2,hy=(vis(23)&&vis(24))?(L[23].y+L[24].y)/2:sy+.25,sx=(L[11].x+L[12].x)/2,sw=Math.abs(L[11].x-L[12].x);
    c.fillStyle='rgba(111,207,151,.12)';c.strokeStyle='rgba(111,207,151,.6)';c.lineWidth=2*dp;c.setLineDash([8,6]);c.beginPath();c.rect(ox+(sx-sw*1.6)*dw,oy+sy*dh,sw*3.2*dw,(hy-sy)*dh);c.fill();c.stroke();c.setLineDash([]);}
  c.lineWidth=3*dp;c.strokeStyle='rgba(243,208,130,.9)';
  CONN.forEach(([a,b])=>{if(vis(a)&&vis(b)){c.beginPath();c.moveTo(X(L[a]),Y(L[a]));c.lineTo(X(L[b]),Y(L[b]));c.stroke();}});
  [0,11,12,13,14,23,24,25,26,27,28].forEach(i=>{if(vis(i)){c.fillStyle='#F3D082';c.beginPath();c.arc(X(L[i]),Y(L[i]),4*dp,0,7);c.fill();}});
  [15,16].forEach(i=>{c.fillStyle=wcol||'#fff';c.beginPath();c.arc(X(L[i]),Y(L[i]),8*dp,0,7);c.fill();});
  if(fpts){c.fillStyle='rgba(243,208,130,.75)';fpts.forEach(p=>{c.fillRect(X(p)-dp,Y(p)-dp,2*dp,2*dp);});
    if(fpairs){c.strokeStyle='rgba(243,208,130,.45)';c.lineWidth=1*dp;c.beginPath();fpairs.forEach(([a,b])=>{if(fpts[a]&&fpts[b]){c.moveTo(X(fpts[a]),Y(fpts[a]));c.lineTo(X(fpts[b]),Y(fpts[b]));}});c.stroke();}}
  if(hands)hands.forEach(h=>{c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=1.5*dp;[[0,1,2,3,4],[0,5,6,7,8],[9,10,11,12],[13,14,15,16],[0,17,18,19,20],[5,9,13,17]].forEach(ch=>{c.beginPath();ch.forEach((i,k)=>{const q=h[i];if(!q)return;k?c.lineTo(X(q),Y(q)):c.moveTo(X(q),Y(q));});c.stroke();});
    c.fillStyle='rgba(255,255,255,.95)';h.forEach(p=>{c.beginPath();c.arc(X(p),Y(p),2.2*dp,0,7);c.fill();});});
  return {X,Y,dp,ox,oy,dw,dh};
}
function drawLive(L,hl,fl){skeleton(ctx,cv.width,cv.height,proc.width,proc.height,L,hl,COL[lastState],fl,FC);}
function flash(m){const a=$('#alert');a.textContent=m;a.classList.add('on');setTimeout(()=>a.classList.remove('on'),2800);}

$('#go').onclick=async()=>{
  startPCM();
  $('#go').hidden=true;$('#chips').innerHTML='';$('#camSet').hidden=true;const c=$('#count');c.classList.add('on');
  an=AgoraEngine.createAnalyzer({aspect:proc.width/proc.height,mode:S.mode,teleprompter:!!S.tpOn,hiddenAlert:+S.hidT});transcript=[];frames=[];demoI=0;chunks=[];recMime='';t0perf=performance.now();
  $('#tr').innerHTML='<em>Parle dès maintenant, je t’écoute…</em>';startSTT();
  for(const n of [2,1]){c.textContent=n;await new Promise(r=>setTimeout(r,700));}
  c.classList.remove('on');
  $('#flip').hidden=true;$('#orBtn').hidden=true;$('#rotBtn').hidden=true;$('#camBtn').hidden=true;$('#camSet').hidden=true;
  try{if(window.MediaRecorder&&stream.getAudioTracks){const cand=['video/mp4;codecs=avc1,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];const m=cand.find(x=>MediaRecorder.isTypeSupported(x));
    const rawT=stream.getVideoTracks()[0],useRaw=!!(rawT&&vid.videoWidth&&((vid.videoWidth>vid.videoHeight)===(S.orient==='h'))&&rotUser===0&&(+S.zoom||1)<=1);/* Safari : on enregistre la caméra directement quand le cadrage ne change pas (l’enregistrement du canvas peut rester figé) */let vts;if(useRaw){vts=[rawT];recTrack=null;}else{const cs=proc.captureStream();recTrack=cs.getVideoTracks()[0]||null;vts=cs.getVideoTracks();}const rs=new MediaStream([...vts,...stream.getAudioTracks()]);rec=new MediaRecorder(rs,m?{mimeType:m,videoBitsPerSecond:2500000}:undefined);recMime=rec.mimeType||m||'video/webm';rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};rec.start(1000);}}catch(e){rec=null;console.error(e);}
  tStart=performance.now();t0perf=tStart;lastVT=-1;running=true;
  $('#stop').hidden=false;$('#stop').textContent='Terminer';startTP();
};
let stopping=false;const doStop=e=>{if(e)e.preventDefault();if(stopping)return;stopping=true;$('#stop').textContent='Analyse…';setTimeout(()=>{stopping=false;},4000);finish();};$('#stop').addEventListener('pointerup',doStop);$('#stop').addEventListener('click',doStop);
function startSTT(){
  if(!S.stt||DEMO)return;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
  recWanted=true;
  /* chaque mot est gardé dès qu'il apparaît (même provisoire) : sur iPhone, le texte « final » n'arrive souvent jamais */
  const begin=()=>{if(!recWanted)return;const x=new SR();sttObj=x;x.lang='fr-FR';x.continuous=true;x.interimResults=true;const commit=[];
    x.onresult=e=>{const t=running?(performance.now()-t0perf)/1000:0;an&&an.markSpeech(t);const arr=[];
      for(let i=0;i<e.results.length;i++)arr.push(...e.results[i][0].transcript.trim().split(/\s+/).filter(Boolean));
      for(let i=0;i<commit.length&&i<arr.length;i++)commit[i].w=arr[i];
      if(arr.length>commit.length){const nw=arr.slice(commit.length),dt=Math.min(nw.length*0.4,t);nw.forEach((w,k)=>{const o={w,t:t-dt+(k+1)*dt/nw.length};commit.push(o);transcript.push(o);});}
      $('#tr').textContent=transcript.slice(-20).map(w=>w.w).join(' ');};
    x.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){recWanted=false;$('#tr').innerHTML='<em>Transcription coupée.</em>';}};
    x.onend=()=>{if(recWanted)setTimeout(begin,120);};try{x.start()}catch(e){setTimeout(begin,400);}};
  begin();
}
function startTP(){if(!S.tpOn)return;cancelAnimationFrame(tpRaf);let y=0,last=performance.now();const el=$('#tpTxt');
  const step=n=>{if(!running)return;y+=(n-last)/1000*S.tpSpeed;last=n;el.style.transform=`translateY(${-y}px)`;tpRaf=requestAnimationFrame(step);};tpRaf=requestAnimationFrame(step);}
function cleanup(keepModels){running=false;recWanted=false;cancelAnimationFrame(raf);cancelAnimationFrame(tpRaf);try{sttObj&&sttObj.abort()}catch(e){}sttObj=null;
  try{rec&&rec.state!=='inactive'&&rec.stop()}catch(e){}rec=null;
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}vid.srcObject=null;tStart=0;lastVT=-1;}
async function fixMp4(blob,sec){
  /* MediaRecorder (Safari) écrit un mp4 « fragmenté » sans durée : Safari l’affiche « Diffusion en direct » et fige l’image. On écrit la durée connue dans l’en-tête. */
  const N=262144,head=new Uint8Array(await blob.slice(0,N).arrayBuffer()),dv=new DataView(head.buffer);
  const find=n=>{for(let i=4;i<head.length-8;i++)if(head[i]===n.charCodeAt(0)&&head[i+1]===n.charCodeAt(1)&&head[i+2]===n.charCodeAt(2)&&head[i+3]===n.charCodeAt(3))return i;return -1;};
  const m=find('mvhd');if(m<0)return blob;
  const ver=head[m+4];let ts,off;
  if(ver===0){ts=dv.getUint32(m+16);off=m+20;if(dv.getUint32(off)===0||dv.getUint32(off)===0xFFFFFFFF)dv.setUint32(off,Math.round(sec*ts));else return blob;}
  else{ts=dv.getUint32(m+24);off=m+28;if(dv.getUint32(off)===0&&dv.getUint32(off+4)===0){dv.setUint32(off+4,Math.round(sec*ts));}else return blob;}
  const e=find('mehd');if(e>0){const ev=head[e+4];if(ev===0&&dv.getUint32(e+8)===0)dv.setUint32(e+8,Math.round(sec*ts));else if(ev===1&&dv.getUint32(e+8)===0&&dv.getUint32(e+12)===0)dv.setUint32(e+12,Math.round(sec*ts));}
  return new Blob([head,blob.slice(N)],{type:blob.type});
}
const tmo=(p,ms)=>Promise.race([p,new Promise(r=>setTimeout(()=>r(undefined),ms))]);
async function finish(){
  if(!running||!an)return;running=false;const words=transcript.map(o=>({w:o.w,t:o.t})).sort((x,y)=>x.t-y.t);if(!DEMO)words.forEach(o=>an.addWord(o.w,o.t));const r=an.finish(),fr=frames,asp=proc.width/proc.height,fcp=FCP.slice();
  const pcmC=pcmChunks.slice(),sr=aSR;stopPCM();
  let blob=null;
  if(rec&&rec.state!=='inactive'){await new Promise(res=>{rec.onstop=res;setTimeout(res,2500);try{rec.stop()}catch(e){res()}});}
  if(chunks.length){blob=new Blob(chunks,{type:recMime||'video/webm'});if(/mp4/.test(blob.type)){try{blob=await fixMp4(blob,r.duree);}catch(e){console.error(e);}}}
  cleanup();
  const c=$('#count');c.textContent='Analyse de la voix…';c.style.fontSize='26px';c.classList.add('on');
  const item={id:Date.now(),date:new Date().toISOString(),r,words,frames:fr,blob,asp,fcp,exo:EXO};
  const rmsOf=a=>{let q=0;for(let i=0;i<a.length;i+=7)q+=a[i]*a[i];return Math.sqrt(q/Math.max(1,a.length/7));};
  let pcm=null,src='micro';
  try{pcm=AgoraVoice.resample16(pcmC,sr);}catch(e){console.error(e);}
  if((!pcm||pcm.length<32000||rmsOf(pcm)<0.002)&&blob){try{const AC=window.AudioContext||window.webkitAudioContext,ac=new AC(),buf=await tmo(ac.decodeAudioData(await blob.arrayBuffer()),10000);const p2=AgoraVoice.resample16([buf.getChannelData(0)],buf.sampleRate);try{ac.close()}catch(e){}if(p2&&p2.length>=32000&&rmsOf(p2)>(pcm?rmsOf(pcm):0)){pcm=p2;src='vidéo';}}catch(e){console.error(e);}}
  item.audioInfo={sec:pcm?Math.round(pcm.length/160)/100:0,rms:pcm?Math.round(rmsOf(pcm)*10000)/10000:0,src,micro:pcmC.length};
  try{item.sig=pcm&&pcm.length>=32000?(await tmo(AO_ANALYSIS.analyzeSignal(pcm),40000))||null:null;}catch(e){console.error(e);item.sig=null;}
  analyseText(item,words.map(w=>w.w).join(' '));
  c.classList.remove('on');c.style.fontSize='';
  const meta=ls.get('agt_hist',[]);meta.unshift({id:item.id,date:item.date,score:r.score.total,duree:r.duree,video:!!blob,prio:(r.priorites||[]).map(id=>(r.issues.find(i=>i.id===id)||{}).title).filter(Boolean),exo:EXO||undefined,an:EXO?{sig:item.sig&&item.sig.ok?item.sig:null,txt:item.txt,pil:item.pil,text:item.text}:undefined});
  try{await tmo(idb.put(item),10000);}catch(e){console.error(e);}
  meta.slice(6).forEach(m=>idb.del(m.id));ls.set('agt_hist',meta.slice(0,6));
  openReport(item);
}
function analyseText(item,text){
  item.text=text;const dur=item.sig&&item.sig.ok?(item.sig.spanSec||item.sig.durationSec):item.r.duree;
  let t=null;try{t=text.trim()?AO_ANALYSIS.analyzeText(text,dur):null;}catch(e){}
  item.txt=t&&t.ok?t:null;item.pil=AO_ANALYSIS.pillars(item.sig&&item.sig.ok?item.sig:null,item.txt);
  if(item.sig&&item.sig.pauses&&item.sig.pauses.list)item.sig.pauses.list=item.sig.pauses.list.slice(0,12);
  item.advice=AgoraVoice.advice(item.sig&&item.sig.ok?item.sig:null,item.txt);
}

/* ---- rapport : la vidéo, les moments à corriger, le contexte ---- */

function stopPlayback(){if(pb){cancelAnimationFrame(pb.raf);try{pb.v.pause()}catch(e){}if(pb.url)URL.revokeObjectURL(pb.url);pb=null;}}
function nearest(fr,t){let lo=0,hi=fr.length-1;if(!hi&&!fr.length)return null;while(lo<hi){const m=(lo+hi)>>1;if(fr[m][0]<t)lo=m+1;else hi=m;}const a=fr[Math.max(0,lo-1)],b=fr[lo];return Math.abs(a[0]-t)<Math.abs(b[0]-t)?a:b;}
function toLM(f){return f[1].map(p=>({x:p[0]/1000,y:p[1]/1000,visibility:p[2]/100}));}
function openReport(it){
  stopPlayback();show('s-rep');const r=it.r,dur=Math.max(1,r.duree);
  const sevCls=s=>s>=3?'':(s===2?'':'s1');
  const card=(i,kind)=>{const cls=kind==='n'?'n':kind==='g'?'s0':(i.sev>=2?'':'s1');
    return `<div class="iss ${cls}" data-id="${i.id}"><button class="play" data-t0="${i.t0}" data-t1="${i.t1}">▶ ${fmt(i.t0)}${i.t1-i.t0>1?'–'+fmt(i.t1):''}</button><h4>${esc(i.title)}</h4>
      <p>${esc(i.what)}</p>${i.ctx?`<p class="w">${esc(i.ctx)}</p>`:''}${i.why?`<p class="w">${esc(i.why)}</p>`:''}${i.fix?`<p class="f">→ ${esc(i.fix)}</p>`:''}${kind||!(window.AGREF&&(AGREF[i.kind]||[]).length)?'':`<button class="btn sec refb" data-k="${i.kind}" style="margin-top:8px">▶ Voir un exemple</button>`}</div>`;};
  const pri=r.issues.filter(i=>r.priorites.includes(i.id));
  const marks=[...r.issues.map(i=>[i,i.sev>=2?'i-bad':'i-mid']),...r.good.map(i=>[i,'i-good']),...r.neutral.map(i=>[i,'i-neu'])];
  const mk=marks.map(([i,c])=>`<i class="${c}" data-t0="${i.t0}" style="left:${100*i.t0/dur}%;width:${Math.max(0.8,100*(i.t1-i.t0)/dur)}%"></i>`).join('');
  const tlh=r.timeline.map(k=>`<i class="c-${k}"></i>`).join('');
  const ann=[];r.issues.forEach(i=>ann.push({t:i.t0,l:i.title}));
  const trs=it.words.length?it.words.map((w,k)=>`<span class="w" data-t="${w.t}">${esc(w.w)}</span>`).join(' '):'<span class="note">Pas de transcription pour cet essai.</span>';
  $('#rep').innerHTML=`
  <div class="card"><div class="score"><div class="ring" style="--p:${r.score.total}"><div>${r.score.total}</div></div>
    <div><h3 style="margin:0 0 4px">${r.issues.length?r.issues.length+' moment'+(r.issues.length>1?'s':'')+' à revoir':'Rien de grave détecté'}</h3><div class="note">${fmt(r.duree)} · corps visible ${r.corpsVisiblePct} % du temps</div><div class="note">Note indicative sur 100.</div></div></div></div>
  <div class="tabs" id="tabs"><button data-tab="g" class="on">Gestes</button><button data-tab="v">Voix</button><button data-tab="s">Discours</button></div>
  <div id="tab-g"><div class="card"><h3>Ta vidéo</h3>
   ${it.blob?`<div class="vwrap" style="aspect-ratio:${it.asp||9/16}"><video id="rv" playsinline controls></video><canvas id="rc"></canvas></div><div class="ctl" style="margin-top:10px"><button class="btn sec" id="saveVid">Enregistrer la vidéo</button><button class="btn sec" id="delVid">Supprimer la vidéo (garder l’analyse)</button><button class="btn sec" id="delRep">Supprimer cet essai</button></div><p class="note">La vidéo est gardée uniquement dans ce navigateur (les 6 derniers essais), jamais envoyée. Enregistre-la dans tes Photos pour la garder.</p>`:'<p class="note">Vidéo non disponible pour cet essai (enregistrement non pris en charge ou supprimé).</p>'}
   <div class="mk" id="mk">${mk}<div class="cur" id="cur"></div></div>
   <div class="leg"><span><i class="i-bad" style="display:inline-block;width:10px;height:10px;border-radius:3px"></i> à corriger</span><span><i class="i-mid" style="display:inline-block;width:10px;height:10px;border-radius:3px"></i> mineur</span><span><i class="i-good" style="display:inline-block;width:10px;height:10px;border-radius:3px"></i> bien</span><span><i class="i-neu" style="display:inline-block;width:10px;height:10px;border-radius:3px"></i> compris par le contexte</span></div>
   <p class="note">Touche une barre pour aller au moment. Sur la vidéo, ton squelette et le geste concerné s’affichent.</p></div>
  ${pri.length?`<div class="card"><h3>À corriger d’abord</h3>${pri.map(i=>card(i)).join('')}</div>`:''}
  <div class="card"><h3>Tous les moments à revoir (${r.issues.length})</h3>${r.issues.length?r.issues.map(i=>card(i)).join(''):'<p class="note">Aucun.</p>'}</div>
  ${r.good.length?`<div class="card"><h3>Ce qui était bien</h3>${r.good.map(i=>card(i,'g')).join('')}</div>`:''}
  ${r.neutral.length?`<div class="card"><details><summary>Gestes compris par le contexte (${r.neutral.length})</summary>${r.neutral.map(i=>card(i,'n')).join('')}</details></div>`:''}
  <div class="card"><h3>Zone des mains seconde par seconde</h3><div class="tl">${tlh}</div>
   <div class="leg">${Object.entries({force:'Force',basse:'Basses',haute:'Hautes',cachee:'Cachées',hors:'Hors cadre'}).map(([k,v])=>`<span><i class="c-${k}"></i>${v} ${r.hands[k]} %</span>`).join('')}</div></div>
  <div class="card"><h3>Chiffres</h3><div class="grid">
   <div class="k"><b>${r.hands.auMoinsUneEnForce} %</b><span>au moins une main en zone de force</span></div>
   <div class="k"><b>${r.hands.enForcePendantParole==null?'—':r.hands.enForcePendantParole+' %'}</b><span>…pendant que tu parles</span></div>
   <div class="k"><b>${r.balancement.perMin}</b><span>balancements / min</span></div>
   <div class="k"><b>${r.deplacements.total}</b><span>déplacements (${r.deplacements.utiles} bien placés, ${r.deplacements.parasites} parasites)</span></div>
   <div class="k"><b>${r.gestes.parMin}</b><span>gestes de mains / min</span></div>
   <div class="k"><b>${r.contacts.total}</b><span>contacts main–tête (${r.contacts.tics} comptés comme tics)</span></div></div>
   ${r.notes.length?'<ul style="margin:10px 0 0;padding-left:18px">'+r.notes.map(n=>'<li>'+esc(n)+'</li>').join('')+'</ul>':''}</div>
  <div class="card"><h3>Transcription</h3><div class="trs" id="trs">${trs}</div></div>
  <div class="card"><details><summary>Comment c’est jugé, et les limites</summary>
   <p class="note">Les gestes qui touchent la tête (cheveux, visage, cou) sont jugés avec ce que tu disais autour : si tu parlais de ta coiffure, de ta couleur de cheveux ou d’un visage caché, le geste est compris et non compté. Un contact bref n’est pas compté non plus. Un geste sans lien avec le propos, long ou répété, est signalé.</p>
   <p class="note">Les gestes d’auto-contact sont étudiés depuis <i>Ekman et Friesen (1969)</i>, qui les appellent « adaptateurs ». La recherche les associe plutôt à la tension, à la réflexion ou à l’habitude, mais il s’agit d’associations, pas de preuves, et la sincérité d’une personne ne se lit pas dessus. Voir par exemple <a href="https://www.uh.edu/news-events/stories/2025/october/10152025-spontaneous-facial-self-touching-study.php" target="_blank" rel="noopener">l’étude de l’Université de Houston (2025)</a> et <a href="https://repozytorium.umk.pl/bitstream/handle/item/4029/Self-regulators%20%e2%80%93%20A%20hidden%20dimension%20of%20interaction%20PREPRINT.pdf?sequence=1" target="_blank" rel="noopener">cet article sur les auto-régulateurs</a>.</p>
   <p class="note">Limites : la caméra donne une image plate. Je compare la taille de ta main à celle de ta tête pour savoir si elle touche vraiment le visage, mais cela reste une estimation (« sûr » ou « probable » est indiqué). Le contexte vient de la transcription et de mots-clés, pas d’une vraie compréhension. Revois toujours la vidéo avant de te juger.</p></details></div></div>
  <div id="tab-v" hidden>${AgoraVoice.voiceHtml(it.sig,it.txt,it.advice)}${audioDiag(it)}</div>
  <div id="tab-s" hidden>${AgoraVoice.speechHtml(it.txt,it.pil,it.text,AO_ANALYSIS)}</div>`;
  bindTabs(it);
  if(!it.blob){root.querySelectorAll('.play').forEach(b=>b.disabled=true);return;}
  const v=$('#rv'),c=$('#rc'),cx=c.getContext('2d'),url=URL.createObjectURL(it.blob);pb={v,url,raf:0,stopAt:null};v.src=url;
  twoTap($('#delRep'),async()=>{await delItem(it.id);histRender();show('s-hist');});
  const dv=$('#delVid');if(dv)twoTap(dv,async()=>{it.blob=null;try{await idb.put(it)}catch(e){console.error(e)}const mh=ls.get('agt_hist',[]);mh.forEach(x=>{if(x.id===it.id)x.video=false});ls.set('agt_hist',mh);openReport(it);});
  $('#saveVid').onclick=async()=>{const ext=/mp4/.test(it.blob.type)?'mp4':'webm',f=new File([it.blob],'agora-gestuelle-'+new Date(it.date).toISOString().slice(0,16).replace(/[:T]/g,'-')+'.'+ext,{type:it.blob.type});try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f]});return;}}catch(e){if(e&&e.name==='AbortError')return;}const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=f.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},3000);};
  const fixDur=()=>{if(v.duration===Infinity&&!/mp4/.test(it.blob.type)){v.currentTime=1e7;v.ontimeupdate=()=>{v.ontimeupdate=null;v.currentTime=0;};}};v.onloadedmetadata=fixDur;
  const act=t=>[...r.issues,...r.neutral].find(i=>t>=i.t0-0.2&&t<=i.t1+0.2);
  const tick=()=>{pb.raf=requestAnimationFrame(tick);const t=v.currentTime;$('#cur').style.left=(100*t/dur)+'%';
    if(pb.stopAt!=null&&t>=pb.stopAt){v.pause();pb.stopAt=null;}
    const rc=c.getBoundingClientRect();if(c.width!==Math.round(rc.width*devicePixelRatio)){c.width=rc.width*devicePixelRatio;c.height=rc.height*devicePixelRatio;}
    const f=it.frames.length?nearest(it.frames,t):null;const a=act(t);
    const g=f&&Math.abs(f[0]-t)<0.5?skeleton(cx,c.width,c.height,v.videoWidth||9,v.videoHeight||16,toLM(f),f[2]?f[2].map(h=>h.map(p=>({x:p[0]/1000,y:p[1]/1000}))):null,a&&(a.kind==='cachees')?'#E8553B':'#6FCF97',f[3]?f[3].map(p=>({x:p[0]/1000,y:p[1]/1000})):null,it.fcp):(cx.clearRect(0,0,c.width,c.height),null);
    if(a){const bad=r.issues.includes(a);cx.fillStyle=bad?'rgba(181,48,31,.9)':'rgba(90,60,55,.9)';const h=34*devicePixelRatio;cx.fillRect(0,0,c.width,h);cx.fillStyle='#fff';cx.font=`600 ${14*devicePixelRatio}px sans-serif`;cx.fillText(a.title,10*devicePixelRatio,22*devicePixelRatio);
      if(g&&f&&a.zone){const L=f[1];const n=L[0],ex=(L[7][0]+L[8][0])/2000,cxn=n[0]/1000,cyn=(L[2][1]+L[5][1])/2000;cx.strokeStyle=bad?'#E8553B':'#B0A0A0';cx.lineWidth=4*devicePixelRatio;cx.beginPath();cx.ellipse(g.ox+cxn*g.dw,g.oy+(cyn-0.01)*g.dh,Math.abs(L[7][0]-L[8][0])/1000*g.dw*1.2+14,Math.abs(L[7][0]-L[8][0])/1000*g.dw*1.5+18,0,0,7);cx.stroke();}
      if(g&&f&&a.kind==='cachees'){[15,16].forEach(i=>{cx.strokeStyle='#E8553B';cx.lineWidth=4*devicePixelRatio;cx.beginPath();cx.arc(g.X({x:f[1][i][0]/1000}),g.Y({y:f[1][i][1]/1000}),16*devicePixelRatio,0,7);cx.stroke();});}}
    root.querySelectorAll('#trs .w').forEach(s=>s.classList.toggle('hl',Math.abs(+s.dataset.t-t)<0.45));};
  tick();
  const seek=(t0,t1)=>{v.currentTime=Math.max(0,t0-1);pb.stopAt=t1!=null?Math.min(dur,t1+1.2):null;v.play().catch(()=>{});$('#rv').scrollIntoView({behavior:'smooth',block:'center'});};
  root.querySelectorAll('.play').forEach(b=>b.onclick=()=>seek(+b.dataset.t0,+b.dataset.t1));
  $('#mk').onclick=e=>{const rc=$('#mk').getBoundingClientRect(),t=(e.clientX-rc.left)/rc.width*dur;const m=e.target.closest('i[data-t0]');if(m)seek(+m.dataset.t0,null);else{v.currentTime=t;}};
  root.querySelectorAll('#trs .w').forEach(s=>s.onclick=()=>{v.currentTime=Math.max(0,+s.dataset.t-.5);v.play().catch(()=>{});});
}

function audioDiag(it){const a=it.audioInfo;if(!a)return '';return `<p class="note small">Son capté : ${a.sec} s, niveau ${a.rms} (source : ${a.src}). ${a.rms<0.002?'Le niveau est quasi nul : le micro a été coupé pendant la transcription vocale du téléphone.':''}</p>`;}
function bindTabs(it){
  if(it.exo){$('#rep').insertAdjacentHTML('afterbegin','<div class="ctl" style="margin-bottom:10px"><button class="btn" id="toExo" style="width:100%">Retour à l’exercice →</button></div>');$('#toExo').onclick=()=>{opts.done(it);};const hb=(window.AGREF_howBtn&&it.exo&&it.exo.type)?AGREF_howBtn(it.exo.type):'';if(hb)$('#rep').insertAdjacentHTML('afterbegin',hb);}
  root.querySelectorAll('.refb').forEach(b=>b.onclick=()=>{const L=(window.AGREF&&AGREF[b.dataset.k])||[];if(!L.length)return;let n=0;
    let m=root.querySelector('#refm');if(!m){m=document.createElement('div');m.id='refm';m.style.cssText='position:fixed;inset:0;z-index:50;background:rgba(10,6,5,.86);display:flex;align-items:center;justify-content:center;padding:16px';root.appendChild(m);}
    const draw=()=>{const x=L[n];m.innerHTML='<div style="width:min(720px,100%);background:#1b1210;border:1px solid rgba(199,151,70,.35);border-radius:16px;padding:14px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px"><b style="color:#fff">'+esc(x.t||'Exemple')+'</b><button class="btn sec" id="refx">✕</button></div>'+(navigator.onLine?'<a href="'+AGREF_link(x)+'" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:8px;min-height:120px;border-radius:10px;background:#000;color:#F3D082;font-weight:600;text-decoration:none;text-align:center;padding:16px">▶ Voir cette vidéo sur YouTube</a>':'<p class="note">Connecte-toi à internet pour voir cet exemple.</p>')+(L.length>1?'<div class="ctl" style="margin-top:10px"><button class="btn sec" id="refn">Autre exemple ('+(n+1)+'/'+L.length+')</button></div>':'')+'</div>';
      m.querySelector('#refx').onclick=()=>{m.remove()};const nb=m.querySelector('#refn');if(nb)nb.onclick=()=>{n=(n+1)%L.length;draw()};};
    draw();m.onclick=e=>{if(e.target===m)m.remove()};});
  const sw=t=>{root.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));['g','v','s'].forEach(k=>{const e=$('#tab-'+k);if(e)e.hidden=k!==t;});};
  root.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>sw(b.dataset.tab));
  window.__goSeek=t=>{sw('g');const v=$('#rv');if(v){v.currentTime=Math.max(0,t-0.5);v.play().catch(()=>{});v.scrollIntoView({behavior:'smooth',block:'center'});}};
  const fillTrs=()=>{const el=$('#trs2');if(!el)return;const ws=it.words,text=ws.map(w=>w.w).join(' '),kAt=new Array(text.length+1).fill(null);
    try{let pos=0;AO_ANALYSIS.markTics(text).forEach(p=>{if(p.k)for(let i=0;i<p.t.length;i++)kAt[pos+i]=p.k;pos+=p.t.length;});}catch(e){}
    let pos=0;el.innerHTML=ws.length?ws.map(w=>{const k=kAt[pos];pos+=w.w.length+1;const h=`<span class="w" data-t="${w.t}">${esc(w.w)}</span>`;return k?`<mark class="${k}">${h}</mark>`:h;}).join(' '):'<span class="note">Pas de transcription pour cet essai.</span>';
    el.querySelectorAll('.w').forEach(sp=>sp.onclick=()=>window.__goSeek(+sp.dataset.t));};
  const hook=()=>{fillTrs();root.querySelectorAll('svg.chart').forEach(c=>c.onclick=e=>{const rc=c.getBoundingClientRect();window.__goSeek((e.clientX-rc.left)/rc.width*(+c.dataset.dur));});
    const b=$('#reAn');if(b)b.onclick=()=>{const txt=$('#trEdit').value;analyseText(it,txt);$('#tab-s').innerHTML=AgoraVoice.speechHtml(it.txt,it.pil,it.text,AO_ANALYSIS);$('#tab-v').innerHTML=AgoraVoice.voiceHtml(it.sig,it.txt,it.advice)+audioDiag(it);it.words=it.words.length&&txt.trim()===it.words.map(w=>w.w).join(' ')?it.words:txt.trim().split(/\s+/).filter(Boolean).map((w,i,a)=>({w,t:(it.r.duree*i/Math.max(1,a.length))}));hook();idb.put(it).catch(()=>{});};};
  hook();
}
/* ---- historique ---- */
async function delItem(id){try{await idb.del(id);}catch(e){}ls.set('agt_hist',ls.get('agt_hist',[]).filter(m=>m.id!==id));}
function twoTap(btn,fn){let t=null;btn.onclick=()=>{if(btn.dataset.arm){clearTimeout(t);fn();return;}btn.dataset.arm='1';const old=btn.textContent;btn.textContent='Confirmer ?';btn.classList.add('danger');t=setTimeout(()=>{delete btn.dataset.arm;btn.textContent=old;btn.classList.remove('danger');},3000);};}
function histRender(){const h=ls.get('agt_hist',[]);const L=$('#histList');
  L.innerHTML=h.length?h.map(x=>`<div class="hrow"><button class="hopen" data-id="${x.id}"><b>${new Date(x.date).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</b> — ${x.score}/100 · ${fmt(x.duree)}${x.video?' · vidéo':''}</button><button class="hdel" data-id="${x.id}">Supprimer</button></div>`).join(''):'<p class="note">Aucun essai pour l’instant.</p>';
  L.querySelectorAll('.hopen').forEach(b=>b.onclick=async()=>{try{const it=await idb.get(+b.dataset.id);if(it)openReport(it);else flash('Cet essai n’est plus disponible.');}catch(e){}});
  L.querySelectorAll('.hdel').forEach(b=>twoTap(b,async()=>{await delItem(+b.dataset.id);histRender();}));}
$('#histBtn').onclick=()=>{histRender();show('s-hist');};
addEventListener('pagehide',()=>cleanup());
__reg(()=>{cleanup();removeEventListener('resize',onWinResize);});

if(opts.open){(async()=>{try{const it=await idb.get(+opts.open);if(it)openReport(it);else opts.close();}catch(e){console.error(e);opts.close();}})();}

    })().catch(function(e){console.error(e);});
  },
  isOpen:function(){return !!cur;}
};
})();
