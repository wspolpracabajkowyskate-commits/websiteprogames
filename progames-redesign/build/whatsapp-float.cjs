/* Floating WhatsApp button (main sales line, Poland and export: +48 536 068 912).
   Static HTML link inserted before </body> on every page in the page's language (no script needed;
   styles: .wa-float in styles.css). Idempotent: an existing button is replaced.
   Not added to the browser game, the 3D configurator or internal pages.
   Runs in build:languages after extra-languages.cjs, so the generated languages get it too.
   Usage: node build/whatsapp-float.cjs */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const NUMBER = '48536068912';
const COPY = {
  en: ['Chat with PRO-GAMES POLAND sales on WhatsApp', 'Hello PRO-GAMES POLAND, I am interested in your machines. Please contact me.'],
  pl: ['Napisz do działu sprzedaży PRO-GAMES POLAND na WhatsApp', 'Dzień dobry, jestem zainteresowany automatami PRO-GAMES POLAND. Proszę o kontakt.'],
  es: ['Escribe a ventas de PRO-GAMES POLAND por WhatsApp', 'Hola PRO-GAMES POLAND, estoy interesado en sus máquinas. Por favor, contáctenme.'],
  de: ['Vertrieb von PRO-GAMES POLAND per WhatsApp kontaktieren', 'Guten Tag, ich interessiere mich für die Automaten von PRO-GAMES POLAND. Bitte kontaktieren Sie mich.'],
  fr: ['Écrire au service commercial PRO-GAMES POLAND sur WhatsApp', 'Bonjour, je suis intéressé par les machines PRO-GAMES POLAND. Merci de me contacter.'],
  el: ['Επικοινωνήστε με τις πωλήσεις της PRO-GAMES POLAND στο WhatsApp', 'Γεια σας, ενδιαφέρομαι για τα μηχανήματα της PRO-GAMES POLAND. Παρακαλώ επικοινωνήστε μαζί μου.'],
  it: ['Scrivi alle vendite PRO-GAMES POLAND su WhatsApp', 'Buongiorno, sono interessato alle macchine PRO-GAMES POLAND. Vi prego di contattarmi.'],
  ar: ['تواصل مع مبيعات PRO-GAMES POLAND عبر واتساب', 'مرحباً، أنا مهتم بآلات PRO-GAMES POLAND. يرجى التواصل معي.'],
  ro: ['Scrie vânzărilor PRO-GAMES POLAND pe WhatsApp', 'Bună ziua, sunt interesat de aparatele PRO-GAMES POLAND. Vă rog să mă contactați.'],
  cs: ['Napište obchodu PRO-GAMES POLAND přes WhatsApp', 'Dobrý den, mám zájem o automaty PRO-GAMES POLAND. Prosím o kontakt.'],
  hu: ['Írjon a PRO-GAMES POLAND értékesítésének WhatsAppon', 'Jó napot! Érdeklődöm a PRO-GAMES POLAND automatái iránt. Kérem, vegyék fel velem a kapcsolatot.'],
  ru: ['Написать в отдел продаж PRO-GAMES POLAND в WhatsApp', 'Здравствуйте, меня интересуют автоматы PRO-GAMES POLAND. Пожалуйста, свяжитесь со мной.'],
  bg: ['Пишете на продажбите на PRO-GAMES POLAND в WhatsApp', 'Здравейте, интересувам се от автоматите на PRO-GAMES POLAND. Моля, свържете се с мен.'],
};
const ICON = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>';
const SKIP_DIRS = new Set(['node_modules', '.git', 'creator', 'creator-assets', 'api', 'assets', 'build', 'verification', 'verification-output', 'games', 'gry']);
const SKIP_FILES = new Set(['KONTROLA_WARIANTOW.html']);
const OLD = /\n?<a class="wa-float"[^>]*data-wa-float[^>]*>[\s\S]*?<\/a>/g;
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function button(lang) {
  const [label, text] = COPY[lang] || COPY.en;
  return `<a class="wa-float" data-wa-float href="https://wa.me/${NUMBER}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener" aria-label="${esc(label)}" title="${esc(label)}">${ICON}</a>`;
}

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) yield* walk(path.join(dir, e.name)); }
    else if (e.name.endsWith('.html') && !SKIP_FILES.has(e.name)) yield path.join(dir, e.name);
  }
}

let n = 0;
for (const file of walk(root)) {
  const src = fs.readFileSync(file, 'utf8');
  if (!/<\/body>/i.test(src) || /<meta[^>]+http-equiv="refresh"/i.test(src)) continue;
  const lang = ((src.match(/<html[^>]*\blang="([a-z]{2})/i) || [])[1] || 'en').toLowerCase();
  const out = src.replace(OLD, '').replace(/<\/body>/i, button(lang) + '\n</body>');
  if (out !== src) { fs.writeFileSync(file, out); n++; }
}
console.log(`WhatsApp button on ${n} pages updated.`);
