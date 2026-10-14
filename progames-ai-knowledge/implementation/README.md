> Stan historyczny. Naprawa wdrożona w PR #1, commit 0911ba3. Patch pozostaje w oryginalnej paczce ZIP; nie dublujemy go w tym repozytorium. Bieżący monitoring: ../../growth/README.md.

# Poprawka publikacji statycznej

Status: przygotowane i lokalnie zweryfikowane, **niewdrożone**.

Repo: wspolpracabajkowyskate-commits/websiteprogames, katalog progames-redesign.
Branch: ai/progames-knowledge-seo.

Plik `website-seo-recovery.patch` zawiera generator i wygenerowane 47 brakujących stron oraz zmianę poleceń npm. Zastosowanie od katalogu głównego repo: `git apply website-seo-recovery.patch`.
Następnie w `progames-redesign`: `npm ci --ignore-scripts`, `npm run build`, `npm run test:i18n`.

Vercel obecnie publikuje gotowe pliki, dlatego wszystkie nowe HTML muszą być w commicie. Nie wykonano push, PR ani publikacji. Przed publikacją zweryfikować preview w przeglądarce. Powrót do poprzedniej wersji: revert pojedynczego commita z poprawką. Historyczny generator całego katalogu jest niekompletny; `build:legacy` i `test:legacy` dokumentują poprzednie, uszkodzone polecenia i nie są działającymi bramkami.
