/* Assemble la PWA : node build.js  → index.html, app.js, style.css, sw.js, manifest.webmanifest */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const R = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const W = (f, s) => fs.writeFileSync(path.join(__dirname, f), s);
const parts = ['src/analysis.js','src/data-orators.js','src/data-eristic.js','src/data-course-1.js','src/data-course-2.js','src/data-course-3.js','src/data-course-4.js','src/data-course-5.js','src/data-connect-course.js','src/data-erist-course.js','src/data-exercises.js','src/data-quiz.js','src/data-themes.js','src/app.js'];
let js = parts.map(R).join('\n;\n')
  .replace('/*@@LEVELS@@*/', () => R('src/levels.js'))
  .replace('/*@@PREP@@*/', () => R('src/prep.js'))
  .replace('/*@@ERIST@@*/', () => R('src/erist.js'))
  .replace('/*@@EXPRESS@@*/', () => R('src/express.js'))
  .replace('/*@@PWA@@*/', () => R('src/pwa.js'));
if (/\/\*@@/.test(js)) throw new Error('marqueur non remplacé');
const css = R('src/styles.css') + '\n' + R('src/pwa.css');
const mark = R('icons/mark.svg').trim();
const assets = fs.readdirSync(path.join(__dirname, 'fonts')).filter(f => f.endsWith('.woff2')).map(f => 'fonts/' + f)
  .concat(['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/mark.svg']);
const h = crypto.createHash('sha256');
[js, css, R('src/theme-boot.js'), R('src/index.template.html'), R('src/manifest.template.json')].forEach(s => h.update(s));
assets.forEach(a => h.update(fs.readFileSync(path.join(__dirname, a))));
const hash = h.digest('hex').slice(0, 10);
W('app.js', "window.AGORA_BUILD='" + hash + "';\n" + js);
W('style.css', css);
W('theme-boot.js', R('src/theme-boot.js'));
W('index.html', R('src/index.template.html').replace('@@MARK@@', mark).replace(/@@HASH@@/g, hash));
W('manifest.webmanifest', R('src/manifest.template.json'));
const files = ['./', 'index.html', 'app.js', 'style.css', 'theme-boot.js', 'manifest.webmanifest'].concat(assets);
W('sw.js', R('src/sw.template.js').replace('@@HASH@@', hash).replace('@@FILES@@', JSON.stringify(files, null, 1)));
console.log('build', hash, 'app.js', Math.round(fs.statSync('app.js').size / 1024) + ' Ko');
