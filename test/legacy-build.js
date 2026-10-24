// Génère une page de test monolithique (sans couverture ni service worker) pour les anciens tests de logique
const fs=require('fs');const r=f=>fs.readFileSync(__dirname+'/../'+f,'utf8');
fs.writeFileSync(__dirname+'/_legacy/artifact.html','<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Agora</title><style>'+r('style.css')+'</style><div id="app"></div><nav id="tabbar" class="tabbar"></nav><script>'+r('app.js').replace(/<\/script/g,'<\\/script')+'</script>');
fs.copyFileSync(__dirname+'/_legacy/artifact.html',__dirname+'/_legacy/standalone.html');
