#!/usr/bin/env python3
"""Generates the MONSTER GAME pages (/games/ EN, /pl/gry/ PL) from one template.
The pages are hidden for now: not linked in the navigation, not in the sitemap, noindex.
Run from progames-redesign/:  python3 build/games-pages.py"""
import json, pathlib

ORIGIN = 'https://www.progamespoland.com'
ROOT = pathlib.Path(__file__).resolve().parent.parent
VER = "6"

T = {
  'en': {
    'path': 'games/index.html', 'url': '/games/', 'home': '/', 'locale': 'en_GB',
    'title': 'MONSTER GAME – free browser arcade platformer',
    'desc': 'Play MONSTER GAME for free in your browser: punch, kick and smash through 5 stages with the MONSTER 3in1 mascot and beat the BIG BAG boss.',
    'nav': [('/#machines', 'Products'), ('/catalog.html?catalog=machines', 'Catalogs'), ('/#business', 'For business'), ('/#distributors', 'Distributors'), ('/#trade-shows', 'Trade shows'), ('/#contact', 'Contact')],
    'cta': ('/#contact', 'Request a quote'), 'skip': 'Skip to the game', 'menu': 'Open menu', 'home_label': 'PRO-GAMES home',
    'canvas': 'MONSTER GAME – game screen. Use the arrow keys and Enter in the menu.',
    'btn': {'left': '◀', 'right': '▶', 'jump': 'JUMP', 'punch': 'PUNCH', 'kick': 'KICK', 'smash': 'SMASH'}, 'pause': 'Pause',
    'machine_k': 'INSPIRED BY THE MACHINE', 'machine_h': 'MONSTER 3in1 – boxer, kicker and hammer in one cabinet',
    'machine_p': 'The MONSTER comes from the real MONSTER 3in1 by PRO-GAMES: a commercial amusement machine combining a boxer, a kicker and a hammer, with tournament mode for up to three players.',
    'machine_btn': 'View MONSTER 3in1', 'contact_btn': 'Ask about the machine', 'product': '/en/products/monster-3in1.html', 'contact': '/#contact',
    'lang_label': 'English — Choose language', 'lang_code': 'EN',
    'footer': '© 2026 PRO-GAMES POLAND Sp. z o.o.', 'footer2': 'Made in Poland / Built for operators', 'ld_lang': 'en', 'navlabel': 'Main navigation', 'langword': 'Language'
  },
  'pl': {
    'path': 'pl/gry/index.html', 'url': '/pl/gry/', 'home': '/pl/', 'locale': 'pl_PL',
    'title': 'MONSTER GAME – darmowa gra platformowa w przeglądarce',
    'desc': 'Zagraj za darmo w MONSTER GAME w przeglądarce: uderzaj, kopaj i rozbijaj młotem przez 5 etapów z maskotką automatu MONSTER 3in1 i pokonaj bossa BIG BAG.',
    'nav': [('/pl/#machines', 'Produkty'), ('/pl/katalog.html?catalog=machines', 'Katalogi'), ('/pl/#business', 'Dla biznesu'), ('/pl/#distributors', 'Dystrybutorzy'), ('/pl/#trade-shows', 'Targi'), ('/pl/#contact', 'Kontakt')],
    'cta': ('/pl/#contact', 'Zapytaj o ofertę'), 'skip': 'Przejdź do gry', 'menu': 'Otwórz menu', 'home_label': 'PRO-GAMES — strona główna',
    'canvas': 'MONSTER GAME – ekran gry. W menu użyj strzałek i klawisza Enter.',
    'btn': {'left': '◀', 'right': '▶', 'jump': 'SKOK', 'punch': 'CIOS', 'kick': 'KOP', 'smash': 'MŁOT'}, 'pause': 'Pauza',
    'machine_k': 'INSPIRACJA: AUTOMAT', 'machine_h': 'MONSTER 3in1 – boxer, kopacz i młot w jednym automacie',
    'machine_p': 'MONSTER pochodzi z prawdziwego automatu MONSTER 3in1 od PRO-GAMES: komercyjnego urządzenia rozrywkowego łączącego boxera, kopacza i młot, z trybem turniejowym dla maksymalnie trzech graczy.',
    'machine_btn': 'Zobacz MONSTER 3in1', 'contact_btn': 'Zapytaj o automat', 'product': '/pl/produkty/monster-3in1.html', 'contact': '/pl/#contact',
    'lang_label': 'Polski — Wybierz język', 'lang_code': 'PL',
    'footer': '© 2026 PRO-GAMES POLAND Sp. z o.o.', 'footer2': 'Polska produkcja / Stworzone dla operatorów', 'ld_lang': 'pl', 'navlabel': 'Nawigacja główna', 'langword': 'Język'
  }
}

def esc(s):
  return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

def page(lang):
  t = T[lang]
  canon = ORIGIN + t['url']
  langs = ''.join(
    f'<a href="{T[l]["url"]}" lang="{l}" hreflang="{l}"' + (' class="active" aria-current="page"' if l == lang else '') + f'>{"English" if l == "en" else "Polski"}</a>'
    for l in ('en', 'pl'))
  langsw = f'<details class="pg-language" data-no-translate=""><summary aria-label="{t["lang_label"]}"><span>{t["lang_code"]}</span></summary><div class="pg-language-list">{langs}</div></details>'
  nav = '\n      '.join(f'<a href="{h}">{esc(n)}</a>' for h, n in t['nav'])
  ld = {'@context': 'https://schema.org', '@type': 'VideoGame', '@id': canon + '#game', 'name': 'MONSTER GAME', 'url': canon, 'description': t['desc'], 'inLanguage': t['ld_lang'],
        'gamePlatform': 'Web browser', 'playMode': 'SinglePlayer', 'isAccessibleForFree': True, 'image': ORIGIN + '/games/assets/monster-face.png',
        'author': {'@id': ORIGIN + '/#organization'}, 'publisher': {'@id': ORIGIN + '/#organization'}}
  b = t['btn']
  tb = lambda k, cls='': f'<button type="button" class="mg-tb{cls}" data-btn="{k}" data-label="{esc(b[k])}" aria-label="{esc(b[k])}">{esc(b[k])}</button>'
  return f'''<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{esc(t['title'])}</title>
  <meta name="description" content="{esc(t['desc'])}">
  <meta name="theme-color" content="#06041a">
  <meta name="robots" content="noindex,follow">
  <link rel="canonical" href="{canon}">
  <link rel="alternate" hreflang="en" href="{ORIGIN}/games/">
  <link rel="alternate" hreflang="pl" href="{ORIGIN}/pl/gry/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="PRO-GAMES">
  <meta property="og:locale" content="{t['locale']}">
  <meta property="og:title" content="{esc(t['title'])}">
  <meta property="og:description" content="{esc(t['desc'])}">
  <meta property="og:url" content="{canon}">
  <meta property="og:image" content="{ORIGIN}/games/assets/monster-face.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/fonts/fonts.css">
  <link rel="stylesheet" href="/styles.css?v=25">
  <link rel="stylesheet" href="/i18n.css?v=39">
  <link rel="stylesheet" href="/games/monster-game.css?v={VER}">
  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False).replace('<', chr(92) + 'u003c')}</script>
</head>
<body class="mg-body" data-page-kind="games">
  <a href="#monster-game" class="skip-link">{esc(t['skip'])}</a>
  <header class="site-header compact scrolled" id="header">
    <a class="brand" href="{t['home']}" aria-label="{esc(t['home_label'])}"><img decoding="async" class="header-emblem" src="/assets/progames-emblem-256.webp" alt="" width="256" height="256">
      <img class="brand-logo" src="/assets/progames-wordmark.webp" alt="PRO-GAMES POLAND" width="720" height="223" decoding="async">
    </a>
    <nav class="desktop-nav" aria-label="{t['navlabel']}">
      {nav}
    </nav>
    <div class="language-switch header-language" aria-label="{t['langword']}">{langsw}</div><a class="btn btn-primary header-cta" href="{t['cta'][0]}">{esc(t['cta'][1])}</a>
    <button class="menu-toggle" aria-label="{esc(t['menu'])}" aria-expanded="false"><span></span><span></span></button>
  </header>
  <div class="mobile-nav" id="mobileNav"><div aria-label="{t['langword']}" class="mobile-language">{langsw}</div>
    {nav}
  </div>

  <main class="mg-page" id="top">
    <h1 class="mg-sr">MONSTER GAME</h1>
    <section class="mg" id="monster-game" data-lang="{lang}" aria-label="MONSTER GAME">
      <div class="mg-stage">
        <canvas class="mg-canvas" width="400" height="225" tabindex="0" aria-label="{esc(t['canvas'])}"></canvas>
      </div>
      <div class="mg-touch">
        <div class="mg-pad">{tb('left')}{tb('right')}</div>
        <button type="button" class="mg-tb mg-tb-small mg-only-play" data-act="pause" data-label="II" aria-label="{esc(t['pause'])}">II</button>
        <div class="mg-pad mg-pad-act">{tb('smash', ' mg-tb-smash')}{tb('kick', ' mg-tb-kick')}{tb('punch', ' mg-tb-punch')}{tb('jump', ' mg-tb-jump')}</div>
      </div>
    </section>

    <section class="mg-machine">
      <a class="mg-machine-photo" href="{t['product']}"><img src="/assets/products/monster-3in1-red.webp" alt="MONSTER 3in1 – PRO-GAMES" width="580" height="850" loading="lazy" decoding="async"></a>
      <div>
        <p class="kicker">{esc(t['machine_k'])}</p>
        <h2>{esc(t['machine_h'])}</h2>
        <p>{esc(t['machine_p'])}</p>
        <div class="mg-actions">
          <a class="btn btn-primary" href="{t['product']}">{esc(t['machine_btn']).replace('3in1', '3<span class="mg-lc">in</span>1')}</a>
          <a class="btn btn-ghost" href="{t['contact']}">{esc(t['contact_btn'])}</a>
        </div>
      </div>
    </section>
    <div class="mg-brand"><img src="/games/assets/games-monster-logo.webp" alt="GAMES MONSTER" width="1000" height="436" loading="lazy" decoding="async"></div>
  </main>

  <footer class="footer mg-footer"><div class="footer-bottom"><span>{t['footer']}</span><span>{esc(t['footer2'])}</span></div></footer>
  <script>
  (function(){{var t=document.querySelector('.menu-toggle'),m=document.getElementById('mobileNav');if(!t||!m)return;t.addEventListener('click',function(){{var o=t.getAttribute('aria-expanded')==='true';t.setAttribute('aria-expanded',String(!o));m.classList.toggle('open',!o);}});m.querySelectorAll('a').forEach(function(a){{a.addEventListener('click',function(){{m.classList.remove('open');t.setAttribute('aria-expanded','false');}});}});}})();
  </script>
  <script src="/games/monster-game-levels.js?v={VER}" defer></script>
  <script src="/games/monster-game.js?v={VER}" defer></script>
</body>
</html>
'''

for lang, t in T.items():
  p = ROOT / t['path']
  p.parent.mkdir(parents=True, exist_ok=True)
  p.write_text(page(lang), encoding='utf-8')
  print('wrote', t['path'])
