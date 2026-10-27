#!/usr/bin/env python3
"""Generates the MONSTER GAME pages (/games/ EN, /pl/gry/ PL) from one template.
Run from progames-redesign/:  python3 build/games-pages.py"""
import json, pathlib

ORIGIN = 'https://www.progamespoland.com'
ROOT = pathlib.Path(__file__).resolve().parent.parent

T = {
  'en': {
    'path': 'games/index.html', 'url': '/games/', 'home': '/', 'locale': 'en_GB',
    'title': 'MONSTER GAME – free browser arcade platformer',
    'desc': 'Play MONSTER GAME for free in your browser: punch, kick and smash through 5 stages with the MONSTER 3IN1 mascot and beat the BIG BAG boss. No download.',
    'nav': [('/#machines', 'Products'), ('/catalog.html?catalog=machines', 'Catalogs'), ('/#business', 'For business'), ('/#distributors', 'Distributors'), ('/#trade-shows', 'Trade shows'), ('/games/', 'Games'), ('/#contact', 'Contact')],
    'cta': ('/#contact', 'Request a quote'), 'skip': 'Skip to the game', 'menu': 'Open menu', 'home_label': 'PRO-GAMES home',
    'kicker': 'PRO-GAMES ARCADE · PLAY IN YOUR BROWSER',
    'lead': 'The MONSTER from our MONSTER 3IN1 machine has escaped onto the web. Punch crates, kick the ball, smash with the hammer and beat BIG BAG in 5 stages.',
    'bar': 'MONSTER GAME', 'pause': 'Pause', 'sound': 'Sound on/off', 'full': 'Fullscreen',
    'canvas': 'MONSTER GAME – game screen',
    'tagline': 'Punch, kick and smash through 5 stages. Beat BIG BAG!',
    'play': 'Play', 'cont': 'Continue – stage', 'stages': 'Stages', 'best': 'Best score',
    'keys': '← → move · Space jump · J punch · K kick · ↓ smash · P pause',
    'paused': 'Paused', 'resume': 'Resume', 'restart': 'Restart stage', 'menu_btn': 'Menu',
    'clear': 'Stage clear!', 'next': 'Next stage', 'tokens': 'Tokens', 'time': 'Time', 'timebonus': 'Time bonus', 'perfect': 'No-hit bonus', 'hearts': 'Hearts bonus', 'total': 'Total score', 'stage_score': 'Stage score',
    'over': 'Game over', 'over_txt': 'Insert a coin and try this stage again (score resets).', 'retry': 'Continue', 'score': 'Score',
    'end_h': 'You beat BIG BAG!', 'end_txt': 'You are the real MONSTER. Now try the machine that inspired the game.', 'again': 'Play again', 'real': 'See the real MONSTER 3IN1',
    'product': '/en/products/monster-3in1.html',
    'how_h': 'How to play', 'how_lead': 'Three moves, straight from the MONSTER 3IN1 machine: boxer, kicker and hammer.',
    'cards': [
      ('punch', 'PUNCH', 'J or X', 'Breaks crates and knocks out enemies in front of you. Crates hide tokens and hearts.'),
      ('kick', 'KICK', 'K or C', 'Kicks a bouncing ball that flattens enemies in its path. Great against electric Sparkies.'),
      ('smash', 'SMASH', '↓ in the air', 'Hammer drop: crushes cracked floors, stuns everything around and launches you off springs. On the ground ↓ breaks cracked walls.')
    ],
    'tips_h': 'Tips', 'tips': ['Jump on Baggers and Glovers – but never on electric Sparkies.', 'Fill the RAGE bar to unleash MONSTER RAGE: 7 seconds of invincibility.', 'Every 100 tokens gives an extra life. Arcade machines along the way save your progress.', 'BIG BAG can only be hit while it lies dazed after a slam. Jump over its shockwaves!'],
    'touch_note': 'On a phone or tablet use the on-screen buttons – fullscreen works best in landscape.',
    'machine_k': 'INSPIRED BY THE MACHINE', 'machine_h': 'MONSTER 3IN1 – boxer, kicker and hammer in one cabinet', 'machine_p': 'The animations in this game come from the real MONSTER 3IN1 by PRO-GAMES: a commercial amusement machine combining a boxer, a kicker and a hammer, with tournament mode for up to three players.', 'machine_btn': 'View MONSTER 3IN1', 'contact_btn': 'Ask about the machine',
    'contact': '/#contact', 'lang_label': 'English — Choose language', 'lang_code': 'EN',
    'footer': '© 2026 PRO-GAMES POLAND Sp. z o.o.', 'footer2': 'Made in Poland / Built for operators',
    'ld_genre': ['Platform game', 'Arcade'], 'ld_lang': 'en'
  },
  'pl': {
    'path': 'pl/gry/index.html', 'url': '/pl/gry/', 'home': '/pl/', 'locale': 'pl_PL',
    'title': 'MONSTER GAME – darmowa gra platformowa w przeglądarce',
    'desc': 'Zagraj za darmo w MONSTER GAME w przeglądarce: uderzaj, kopaj i rozbijaj młotem przez 5 etapów z maskotką automatu MONSTER 3IN1 i pokonaj bossa BIG BAG.',
    'nav': [('/pl/#machines', 'Produkty'), ('/pl/katalog.html?catalog=machines', 'Katalogi'), ('/pl/#business', 'Dla biznesu'), ('/pl/#distributors', 'Dystrybutorzy'), ('/pl/#trade-shows', 'Targi'), ('/pl/gry/', 'Gry'), ('/pl/#contact', 'Kontakt')],
    'cta': ('/pl/#contact', 'Zapytaj o ofertę'), 'skip': 'Przejdź do gry', 'menu': 'Otwórz menu', 'home_label': 'PRO-GAMES — strona główna',
    'kicker': 'PRO-GAMES ARCADE · GRAJ W PRZEGLĄDARCE',
    'lead': 'MONSTER z naszego automatu MONSTER 3IN1 uciekł do internetu. Rozbijaj skrzynie, kopnij piłkę, uderz młotem i pokonaj BIG BAG w 5 etapach.',
    'bar': 'MONSTER GAME', 'pause': 'Pauza', 'sound': 'Dźwięk wł./wył.', 'full': 'Pełny ekran',
    'canvas': 'MONSTER GAME – ekran gry',
    'tagline': 'Uderzaj, kopaj i rozbijaj młotem przez 5 etapów. Pokonaj BIG BAG!',
    'play': 'Graj', 'cont': 'Kontynuuj – etap', 'stages': 'Etapy', 'best': 'Najlepszy wynik',
    'keys': '← → ruch · Spacja skok · J cios · K kopnięcie · ↓ młot · P pauza',
    'paused': 'Pauza', 'resume': 'Wróć do gry', 'restart': 'Zacznij etap od nowa', 'menu_btn': 'Menu',
    'clear': 'Etap ukończony!', 'next': 'Następny etap', 'tokens': 'Żetony', 'time': 'Czas', 'timebonus': 'Bonus za czas', 'perfect': 'Bonus bez trafienia', 'hearts': 'Bonus za serca', 'total': 'Wynik łączny', 'stage_score': 'Wynik etapu',
    'over': 'Koniec gry', 'over_txt': 'Wrzuć monetę i spróbuj tego etapu jeszcze raz (wynik się zeruje).', 'retry': 'Kontynuuj', 'score': 'Wynik',
    'end_h': 'Pokonałeś BIG BAG!', 'end_txt': 'Jesteś prawdziwym MONSTEREM. Teraz sprawdź automat, który zainspirował grę.', 'again': 'Zagraj jeszcze raz', 'real': 'Zobacz prawdziwy MONSTER 3IN1',
    'product': '/pl/produkty/monster-3in1.html',
    'how_h': 'Jak grać', 'how_lead': 'Trzy ruchy prosto z automatu MONSTER 3IN1: boxer, kopacz i młot.',
    'cards': [
      ('punch', 'CIOS', 'J lub X', 'Rozbija skrzynie i nokautuje przeciwników przed tobą. W skrzyniach są żetony i serca.'),
      ('kick', 'KOPNIĘCIE', 'K lub C', 'Wykopuje skaczącą piłkę, która zmiata przeciwników. Najlepsze na elektryczne Iskry.'),
      ('smash', 'MŁOT', '↓ w powietrzu', 'Uderzenie młotem z góry: kruszy pęknięte podłogi, ogłusza wszystko dookoła i wystrzeliwuje ze sprężyn. Na ziemi ↓ kruszy pęknięte ściany.')
    ],
    'tips_h': 'Wskazówki', 'tips': ['Skacz na Worki i Rękawice – ale nigdy na elektryczne Iskry.', 'Napełnij pasek SZAŁ, aby uwolnić SZAŁ MONSTERA: 7 sekund nietykalności.', 'Co 100 żetonów dostajesz dodatkowe życie. Automaty po drodze zapisują postęp.', 'BIG BAG można trafić tylko, gdy leży ogłuszony po uderzeniu. Przeskakuj fale uderzeniowe!'],
    'touch_note': 'Na telefonie i tablecie użyj przycisków na ekranie – najlepiej w trybie pełnoekranowym, poziomo.',
    'machine_k': 'INSPIRACJA: AUTOMAT', 'machine_h': 'MONSTER 3IN1 – boxer, kopacz i młot w jednym automacie', 'machine_p': 'Animacje w tej grze pochodzą z prawdziwego automatu MONSTER 3IN1 od PRO-GAMES: komercyjnego urządzenia rozrywkowego łączącego boxera, kopacza i młot, z trybem turniejowym dla maksymalnie trzech graczy.', 'machine_btn': 'Zobacz MONSTER 3IN1', 'contact_btn': 'Zapytaj o automat',
    'contact': '/pl/#contact', 'lang_label': 'Polski — Wybierz język', 'lang_code': 'PL',
    'footer': '© 2026 PRO-GAMES POLAND Sp. z o.o.', 'footer2': 'Polska produkcja / Stworzone dla operatorów',
    'ld_genre': ['Gra platformowa', 'Arcade'], 'ld_lang': 'pl'
  }
}
VER = '1'

def esc(s):
  return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

def page(lang):
  t = T[lang]
  other = 'pl' if lang == 'en' else 'en'
  canon = ORIGIN + t['url']
  langs = ''.join(
    f'<a href="{T[l]["url"]}" lang="{l}" hreflang="{l}"' + (' class="active" aria-current="page"' if l == lang else '') + f'>{"English" if l == "en" else "Polski"}</a>'
    for l in ('en', 'pl'))
  langsw = f'<details class="pg-language" data-no-translate=""><summary aria-label="{t["lang_label"]}"><span>{t["lang_code"]}</span></summary><div class="pg-language-list">{langs}</div></details>'
  nav = '\n      '.join(f'<a href="{h}"' + (' class="nav-games" aria-current="page"' if h == t['url'] else '') + f'>{esc(n)}</a>' for h, n in t['nav'])
  ld = [
    {'@context': 'https://schema.org', '@type': 'WebPage', '@id': canon + '#webpage', 'url': canon, 'name': t['title'], 'description': t['desc'], 'inLanguage': t['ld_lang'],
     'isPartOf': {'@id': ORIGIN + '/#website'}, 'publisher': {'@id': ORIGIN + '/#organization'}, 'primaryImageOfPage': {'@type': 'ImageObject', 'url': ORIGIN + '/games/assets/monster-face.png'}},
    {'@context': 'https://schema.org', '@type': 'VideoGame', '@id': canon + '#game', 'name': 'MONSTER GAME', 'url': canon, 'description': t['desc'], 'inLanguage': t['ld_lang'],
     'genre': t['ld_genre'], 'gamePlatform': 'Web browser', 'applicationCategory': 'Game', 'operatingSystem': 'Any', 'playMode': 'SinglePlayer', 'numberOfPlayers': {'@type': 'QuantitativeValue', 'value': 1},
     'image': ORIGIN + '/games/assets/monster-face.png', 'isAccessibleForFree': True, 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'EUR'},
     'author': {'@id': ORIGIN + '/#organization'}, 'publisher': {'@id': ORIGIN + '/#organization'}},
    {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
      {'@type': 'ListItem', 'position': 1, 'name': 'PRO-GAMES', 'item': ORIGIN + t['home']},
      {'@type': 'ListItem', 'position': 2, 'name': 'MONSTER GAME', 'item': canon}]}
  ]
  ldtags = ''.join('<script type="application/ld+json">' + json.dumps(x, ensure_ascii=False).replace('<', '\\u003c') + '</script>' for x in ld)
  cards = '\n'.join(f'''        <article class="mg-card">
          <img src="/games/assets/{k}.webp" alt="" width="96" height="96" loading="lazy" decoding="async">
          <div><h3>{esc(name)}</h3><p class="mg-key">{esc(key)}</p><p>{esc(txt)}</p></div>
        </article>''' for k, name, key, txt in t['cards'])
  tips = ''.join(f'<li>{esc(x)}</li>' for x in t['tips'])
  btn = lambda act, label, extra='': f'<button type="button" class="mg-btn{extra}" data-act="{act}">{label}</button>'
  icon = {
    'pause': '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    'sound': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="mg-wave" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path class="mg-mute" d="M16 9l6 6M22 9l-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    'full': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
  }
  return f'''<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{esc(t['title'])}</title>
  <meta name="description" content="{esc(t['desc'])}">
  <meta name="theme-color" content="#07090c">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="{canon}">
  <link rel="alternate" hreflang="en" href="{ORIGIN}/games/">
  <link rel="alternate" hreflang="pl" href="{ORIGIN}/pl/gry/">
  <link rel="alternate" hreflang="x-default" href="{ORIGIN}/games/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="PRO-GAMES">
  <meta property="og:locale" content="{t['locale']}">
  <meta property="og:title" content="{esc(t['title'])}">
  <meta property="og:description" content="{esc(t['desc'])}">
  <meta property="og:url" content="{canon}">
  <meta property="og:image" content="{ORIGIN}/games/assets/monster-face.png">
  <meta property="og:image:width" content="768">
  <meta property="og:image:height" content="768">
  <meta property="og:image:alt" content="MONSTER GAME">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(t['title'])}">
  <meta name="twitter:description" content="{esc(t['desc'])}">
  <meta name="twitter:image" content="{ORIGIN}/games/assets/monster-face.png">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="/games/assets/logo.webp" as="image">
  <link rel="stylesheet" href="/assets/fonts/fonts.css">
  <link rel="stylesheet" href="/styles.css?v=25">
  <link rel="stylesheet" href="/i18n.css?v=39">
  <link rel="stylesheet" href="/games/monster-game.css?v={VER}">
  {ldtags}
</head>
<body class="mg-body" data-page-kind="games">
  <a href="#monster-game" class="skip-link">{esc(t['skip'])}</a>
  <header class="site-header compact scrolled" id="header">
    <a class="brand" href="{t['home']}" aria-label="{esc(t['home_label'])}"><img decoding="async" class="header-emblem" src="/assets/progames-emblem-256.webp" alt="" width="256" height="256">
      <img class="brand-logo" src="/assets/progames-wordmark.webp" alt="PRO-GAMES POLAND" width="720" height="223" decoding="async">
    </a>
    <nav class="desktop-nav" aria-label="{'Main navigation' if lang == 'en' else 'Nawigacja główna'}">
      {nav}
    </nav>
    <div class="language-switch header-language" aria-label="{'Language' if lang == 'en' else 'Język'}">{langsw}</div><a class="btn btn-primary header-cta" href="{t['cta'][0]}">{esc(t['cta'][1])}</a>
    <button class="menu-toggle" aria-label="{esc(t['menu'])}" aria-expanded="false"><span></span><span></span></button>
  </header>
  <div class="mobile-nav" id="mobileNav"><div aria-label="{'Language' if lang == 'en' else 'Język'}" class="mobile-language">{langsw}</div>
    {nav}
  </div>

  <main class="mg-page" id="top">
    <section class="mg-intro">
      <p class="kicker"><span class="mg-dot"></span>{esc(t['kicker'])}</p>
      <h1>MONSTER <em>GAME</em></h1>
      <p class="mg-lead">{esc(t['lead'])}</p>
    </section>

    <section class="mg" id="monster-game" data-lang="{lang}" aria-label="MONSTER GAME">
      <div class="mg-bar">
        <span class="mg-bar-title"><span class="mg-dot"></span>{t['bar']}</span>
        <span class="mg-bar-tools">
          <button type="button" class="mg-icon mg-only-play" data-act="pause" aria-label="{esc(t['pause'])}" title="{esc(t['pause'])} (P)">{icon['pause']}</button>
          <button type="button" class="mg-icon" data-act="sound" aria-label="{esc(t['sound'])}" title="{esc(t['sound'])} (M)" aria-pressed="true">{icon['sound']}</button>
          <button type="button" class="mg-icon" data-act="fullscreen" aria-label="{esc(t['full'])}" title="{esc(t['full'])}">{icon['full']}</button>
        </span>
      </div>
      <div class="mg-stage" tabindex="-1">
        <canvas class="mg-canvas" width="400" height="225" role="img" aria-label="{esc(t['canvas'])}"></canvas>

        <div class="mg-screen mg-title" data-screen="title">
          <img class="mg-logo" src="/games/assets/logo.webp" alt="MONSTER 3IN1 by PRO-GAMES" width="96" height="96">
          <div class="mg-title-main">
            <h2 class="mg-h">MONSTER <em>GAME</em></h2>
            <p class="mg-tag">{esc(t['tagline'])}</p>
            <div class="mg-actions">
              <button type="button" class="mg-btn mg-btn-primary" data-act="play" data-primary>{esc(t['play'])}</button>
              <button type="button" class="mg-btn" data-act="continue" hidden>{esc(t['cont'])} <span data-field="cont-stage">1</span></button>
            </div>
            <p class="mg-sub">{esc(t['stages'])}</p>
            <div class="mg-stages" data-field="stages"></div>
            <p class="mg-best">{esc(t['best'])}: <b data-field="top">000000</b></p>
            <p class="mg-keys mg-hide-touch">{esc(t['keys'])}</p>
          </div>
        </div>

        <div class="mg-screen" data-screen="pause" hidden>
          <h2 class="mg-h">{esc(t['paused'])}</h2>
          <div class="mg-actions mg-actions-col">
            <button type="button" class="mg-btn mg-btn-primary" data-act="resume" data-primary>{esc(t['resume'])}</button>
            {btn('restart', esc(t['restart']))}
            {btn('menu', esc(t['menu_btn']))}
          </div>
          <p class="mg-keys mg-hide-touch">{esc(t['keys'])}</p>
        </div>

        <div class="mg-screen mg-result" data-screen="clear" hidden>
          <figure class="mg-board"><img data-field="rank-img" data-base="/games/assets/" src="/games/assets/finish-good.webp" alt="" width="96" height="96"><figcaption data-field="score">000000</figcaption></figure>
          <div class="mg-result-main">
            <p class="mg-sub">{esc(t['clear'])} · <span data-field="stage-name"></span></p>
            <p class="mg-rank" data-field="rank">GOOD</p>
            <dl class="mg-stats">
              <div><dt>{esc(t['tokens'])}</dt><dd data-field="tokens"></dd></div>
              <div><dt>{esc(t['time'])}</dt><dd data-field="time"></dd></div>
              <div><dt>{esc(t['timebonus'])}</dt><dd data-field="timebonus"></dd></div>
              <div><dt>{esc(t['perfect'])}</dt><dd data-field="perfect"></dd></div>
              <div><dt>{esc(t['hearts'])}</dt><dd data-field="hearts"></dd></div>
              <div class="mg-total"><dt>{esc(t['total'])}</dt><dd data-field="total"></dd></div>
            </dl>
            <div class="mg-actions">
              <button type="button" class="mg-btn mg-btn-primary" data-act="next" data-primary>{esc(t['next'])} →</button>
              {btn('menu', esc(t['menu_btn']))}
            </div>
          </div>
        </div>

        <div class="mg-screen mg-result" data-screen="ending" hidden>
          <figure class="mg-board"><img data-field="rank-img" data-base="/games/assets/" src="/games/assets/finish-monster.webp" alt="" width="96" height="96"><figcaption data-field="score">000000</figcaption></figure>
          <div class="mg-result-main">
            <h2 class="mg-h">{esc(t['end_h'])}</h2>
            <p class="mg-tag">{esc(t['end_txt'])}</p>
            <p class="mg-rank"><span data-field="rank">MONSTER!</span></p>
            <dl class="mg-stats"><div class="mg-total"><dt>{esc(t['total'])}</dt><dd data-field="total"></dd></div></dl>
            <div class="mg-actions">
              <button type="button" class="mg-btn mg-btn-primary" data-act="again" data-primary>{esc(t['again'])}</button>
              <a class="mg-btn" href="{t['product']}">{esc(t['real'])} ↗</a>
              {btn('menu', esc(t['menu_btn']))}
            </div>
          </div>
        </div>

        <div class="mg-screen mg-result" data-screen="over" hidden>
          <figure class="mg-board mg-board-plain"><img src="/games/assets/play-again.webp" alt="" width="96" height="96" loading="lazy"></figure>
          <div class="mg-result-main">
            <h2 class="mg-h">{esc(t['over'])}</h2>
            <p class="mg-tag">{esc(t['over_txt'])}</p>
            <p class="mg-best">{esc(t['score'])}: <b data-field="over-score">000000</b></p>
            <div class="mg-actions">
              <button type="button" class="mg-btn mg-btn-primary" data-act="retry-over" data-primary>{esc(t['retry'])}</button>
              {btn('menu', esc(t['menu_btn']))}
            </div>
          </div>
        </div>
      </div>

      <div class="mg-touch" aria-hidden="true">
        <div class="mg-pad">
          <button type="button" class="mg-tb" data-btn="left" aria-label="left">◀</button>
          <button type="button" class="mg-tb" data-btn="right" aria-label="right">▶</button>
        </div>
        <button type="button" class="mg-tb mg-tb-small mg-only-play" data-act="pause" aria-label="{esc(t['pause'])}">II</button>
        <div class="mg-pad mg-pad-act">
          <button type="button" class="mg-tb mg-tb-smash" data-btn="smash">{esc(t['cards'][2][1])}</button>
          <button type="button" class="mg-tb mg-tb-kick" data-btn="kick">{'KICK' if lang == 'en' else 'KOP'}</button>
          <button type="button" class="mg-tb mg-tb-punch" data-btn="punch">{esc(t['cards'][0][1])}</button>
          <button type="button" class="mg-tb mg-tb-jump" data-btn="jump">{'JUMP' if lang == 'en' else 'SKOK'}</button>
        </div>
      </div>
      <p class="mg-touch-note">{esc(t['touch_note'])}</p>
    </section>

    <section class="mg-howto" aria-labelledby="mg-how">
      <div class="mg-howto-head">
        <h2 id="mg-how">{esc(t['how_h'])}</h2>
        <p>{esc(t['how_lead'])}</p>
      </div>
      <div class="mg-cards">
{cards}
      </div>
      <div class="mg-tips">
        <h3>{esc(t['tips_h'])}</h3>
        <ul>{tips}</ul>
      </div>
    </section>

    <section class="mg-machine">
      <img src="/games/assets/finish-monster.webp" alt="" width="96" height="96" loading="lazy" decoding="async">
      <div>
        <p class="kicker">{esc(t['machine_k'])}</p>
        <h2>{esc(t['machine_h'])}</h2>
        <p>{esc(t['machine_p'])}</p>
        <div class="mg-actions mg-actions-left">
          <a class="btn btn-primary" href="{t['product']}">{esc(t['machine_btn'])}</a>
          <a class="btn btn-ghost" href="{t['contact']}">{esc(t['contact_btn'])}</a>
        </div>
      </div>
    </section>
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
