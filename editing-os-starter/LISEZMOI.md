# Editing OS — prise en main

**Un studio de montage vidéo piloté par des agents IA, qui tourne entièrement sur ta
machine.** Tu déposes un rush face caméra, cinq agents s'enchaînent : couper les blancs,
couper les erreurs, vérifier que les coupes ont bien atterri, poser les animations, poser
la b-roll. Tu valides à chaque étape. Rien ne part dans le cloud, aucun abonnement.

La différence avec un auto-cut classique : **tout est piloté par la transcription mot à
mot**, pas par le volume audio. Un transcript avec les timestamps de chaque mot est
produit une fois, et chaque décision derrière (quelle coupe, à quelle image démarre une
animation, quand la b-roll entre) se cale sur ces timestamps. C'est pour ça que les
coupes tombent sur la syllabe et pas à côté.

---

## 1. Ce dont tu as besoin

| | Quoi | Vérifier / installer |
|---|---|---|
| Machine | **macOS** (Apple Silicon idéalement) | c'est le chemin testé ; Linux devrait marcher, Windows non testé |
| | **Node 20 ou plus** | `node -v` — sinon https://nodejs.org |
| | **FFmpeg** | `ffmpeg -version` — sinon `brew install ffmpeg` |
| | **Google Chrome** | c'est lui qui fait le rendu des compositions |
| | **whisper.cpp** | `brew install whisper-cpp` (transcription locale, gratuite) |
| | **Python 3** | déjà présent sur macOS — sert aux scripts de vérification |
| Outil | **Claude Code** | c'est l'interface : les agents sont des skills Claude Code |

Pas de clé API obligatoire. La transcription tourne en local ; le modèle whisper
(~1,6 Go) se télécharge tout seul dans `models/` au premier usage.

---

## 2. Installation (5 minutes)

```bash
cd editing-os-starter
npm install
```

Puis la vérification d'environnement :

```bash
npx hyperframes doctor
```

Il te dit ligne par ligne ce qui manque (Node, FFmpeg, Chrome). Corrige, relance.

Les clés API sont **toutes optionnelles** :

```bash
cp .env.example .env
```

- `ELEVENLABS_API_KEY` — transcription hébergée en secours, si tu ne veux pas de whisper local
- `PEXELS_API_KEY` / `PIXABAY_API_KEY` / `UNSPLASH_ACCESS_KEY` — permettent à l'agent b-roll d'aller chercher des plans de stock sur le web. Sans elles il travaille avec ta bibliothèque locale.

Dernière étape, ouvre le tableau de bord :

```bash
npm run os
```

→ http://localhost:4200

(Sur Mac tu peux aussi double-cliquer `editing-os/Editing OS.command`.)

---

## 3. Ton premier montage

### a. Créer le projet

Ouvre **Claude Code** dans ce dossier, et lance :

```
/reel-format
```

Il te pose une seule question — *qu'est-ce que le spectateur doit avoir compris à la
seconde 3 ?* — choisit le format, crée `video-projects/AA-MM-JJ-ton-sujet/` et pose le
squelette de composition.

Tu peux aussi le faire à la main : voir `video-projects/README.md`.

### b. Déposer le rush

Ré-encode ton enregistrement en H.264 avant de le référencer (ça évite 90 % des
problèmes de lecture) :

```bash
ffmpeg -i rush.mov -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 192k \
  -movflags +faststart video-projects/<ton-projet>/assets/clip.mp4
```

### c. Transcrire

```bash
node scripts/transcribe-whisper.mjs video-projects/<ton-projet>/assets/clip.mp4
```

Ça écrit un `clip.json` à côté du fichier : le transcript mot à mot. C'est la matière
première de tout le reste. (~7× le temps réel sur un M4 Pro.)

### d. Lancer les agents, dans l'ordre

Dans Claude Code, en langage naturel :

```
coupe les silences de video-projects/<ton-projet>/assets/clip.mp4
```

puis

```
coupe les erreurs et les reprises
vérifie les coupes
ajoute les motion graphics
ajoute la b-roll
```

Trois de ces agents sont **review-gated** : ils te proposent chaque coupe avec son
contexte et sa raison, et ne rendent rien tant que tu n'as pas validé.

### e. Rendre et vérifier

```bash
cd video-projects/<ton-projet>
npx hyperframes lint                    # toujours avant un rendu
npx hyperframes render --quality draft --output renders/draft.mp4
```

Puis, depuis la racine :

```bash
npm run verify        -- --project <ton-projet>   # le son et la parole
npm run verif-montage -- --project <ton-projet>   # ce qui se voit
```

Le premier re-transcrit le rendu et prouve que rien n'a été perdu : mots de fin de
segment présents, aucune phrase jouée deux fois, pas de queue morte, pas de blanc
résiduel.

Le second regarde ce que le premier ne voit pas — parce qu'il ne regarde que le
son : un `<!DOCTYPE html>` en tête d'une composition (qui fait disparaître toutes
tes animations du rendu, sans aucun message d'erreur), des plans d'un dixième de
seconde isolés, un départ sur une image noire, une bande noire sur un bord, une
animation déclarée mais invisible.

Tant que les deux ne passent pas, le montage n'est pas fini.

Quand c'est bon :

```bash
npx hyperframes render --quality standard --output renders/final.mp4
npm run master -- --project <ton-projet>       # master à −14 LUFS
```

### f. Relire et corriger

Sur la page du projet dans le dashboard : **Apporter des modifications**. Tu navigues
image par image, tu notes tes retours horodatés, tu cliques « Copier pour Claude », tu
colles dans Claude Code. Les corrections se font au timecode, chirurgicalement.

---

## 4. Ce qu'il y a dans le dossier

```
LISEZMOI.md          ce fichier
README.md            la version courte, en anglais
CLAUDE.md            le guide que Claude Code lit automatiquement — le contrat de rendu
PROCESS.md           la recette complète d'un reel, de A à Z
MOTION_PHILOSOPHY.md l'esthétique motion design (à lire avant toute session créative)

.claude/skills/      les agents + les références HyperFrames / GSAP
editing-os/          le tableau de bord (npm run os)
formats/             3 formats de reel documentés : géométrie, structure, CTA
style-templates/     squelettes de projet prêts à cloner
style-library/       12 styles de cartes motion, ~1700 cartes HTML
asset-library/       b-roll, logos, captures — et la banque de sound effects
scripts/             transcription, vérification, mastering
video-projects/      vide : c'est là que ton travail atterrit
```

Le paquet se reconstruit à l'identique avec `node scripts/paquet-eleves.mjs --zip`
(liste blanche + trois assertions qui refusent de produire l'archive si un nom,
un chemin machine ou une clé s'y est glissé).

Trois documents portent tout le savoir-faire, dans cet ordre :

1. **`formats/README.md`** — quelle forme donner au reel (et pourquoi, chiffres à l'appui dans `MESURES.md`)
2. **`PROCESS.md`** — l'enchaînement complet, phase par phase
3. **`MOTION_PHILOSOPHY.md`** — comment le motion doit se comporter (les 11 lois, la checklist pre-flight)

---

## 5. Personnaliser l'espace

Tout est prévu pour être repris. Rien n'est codé en dur dans les cartes.

### Ta charte graphique

Le **style 10 « Maison »** (`style-library/10-maison/`) est le style par défaut : c'est
celui avec lequel on monte. Les onze autres sont des références dont on s'inspire.

Pour le passer à tes couleurs, un seul fichier : `style-library/10-maison/tokens.css`.

```css
--jaune:  #FFD935;   /* l'accent — la SEULE couleur saturée du style */
--navy:   #02060F;   /* fond des cartes plein écran */
--cream:  #F7F5C9;   /* fond des montages typographiques */
```

Change ces trois valeurs, les 68 cartes du style suivent.

### Tes polices

Par défaut le style tourne sur **Outfit** (Google Fonts, gratuite). Pour poser ta police
de marque :

1. dépose tes `.woff2` dans `style-library/10-maison/fonts/`
2. remplace le bloc `@font-face` en haut de `tokens.css`
3. change `--font-display` et `--font-body`

Aucune carte ne code une police en dur, donc rien d'autre ne bouge.

### Tes sons

`asset-library/sfx/` contient une banque de sound effects prête à l'emploi (whoosh, pop,
click, impact, riser, cash, buzzer…). **Les noms de fichiers sont des rôles** : pour
changer un son, remplace le fichier en gardant son nom, rien d'autre ne bouge. Le mapping
son ↔ animation est documenté dans `asset-library/sfx/README.md`.

### Tes formats

`formats/` documente trois formats de reel vertical avec leur géométrie exacte. Si tu
tournes autre chose, écris ton propre `formats/04-mon-format.md` sur le même modèle et
clone un scaffold dans `style-templates/`. Le dashboard et le skill `reel-format` les
détectent automatiquement.

### L'interface du dashboard

`editing-os/public/style.css`, tout en haut : mêmes tokens, même logique.

---

## 6. Ce qui n'est pas dans le paquet (et pourquoi)

- **Les vidéos, rushes et rendus** — c'est le travail du créateur d'origine, pas du logiciel.
  `video-projects/`, `formats/exemples/` et `formats/references/` démarrent vides.
- **Les polices de marque sous licence** — remplacées par Outfit (libre). Voir §5.
- **Les planches de références** des styles (captures d'écran de vidéos d'autres créateurs,
  qui servaient de moodboard) — les specs `DESIGN.md` décrivent tout ce qu'il faut savoir.
- **Le modèle whisper** (1,6 Go) et `node_modules` — ils se téléchargent à l'installation.

---

## 7. Si ça coince

| Symptôme | Cause probable |
|---|---|
| `npx hyperframes doctor` échoue | FFmpeg ou Chrome manquant → `brew install ffmpeg` |
| La transcription met des plombes | normal au 1er lancement : le modèle se télécharge (~1,6 Go) |
| Les coupes tombent à côté | ne désactive jamais `--vad` ni `--align` sur le transcript ; ces deux options corrigent des erreurs de plusieurs secondes |
| `lint` passe mais le rendu est cassé | « lint passe » ≠ « le design marche ». Extrait une image par scène et regarde-la vraiment. C'est écrit dans `CLAUDE.md`, c'est la règle la plus rentable du workspace |
| Le dashboard est vide | `video-projects/` est vide au départ — c'est normal |
| Un rendu part avec un défaut évident | tu as sauté `npm run verify` ou `npm run verif-montage` |
| Tes animations n'apparaissent pas dans le rendu | un `<!DOCTYPE html>` s'est glissé en tête d'une composition. Il casse `data-composition-src` sans le dire — `verif-montage` l'attrape |
| Des plans d'un dixième de seconde clignotent | des « éclats » : trop courts pour se lire, isolés dans le rush. Le nettoyage doit être la passe **finale** du montage parole, pas un pré-filtre |
| La vidéo s'ouvre sur une image noire | le flux vidéo ne démarre pas à zéro. `npm run master` le corrige tout seul depuis le 02/09 |

---

## 8. Les trois choses que la machine ne fera pas à ta place

Les deux scripts de vérification attrapent ce qui se mesure. Trois contrôles
restent manuels, et sauter l'un des trois coûte systématiquement un
aller-retour :

**Regarde ta vidéo en entier, en planche de contact.** Une vignette toutes les
cinq secondes, sur toute la durée. C'est le seul contrôle qui trouve ce qu'on ne
cherchait pas : une fenêtre restée ouverte à l'écran, une messagerie, un
document personnel, une animation qui manque. Aucun script ne sait qu'une
fenêtre n'aurait pas dû être là.

**Cherche les phrases dites deux fois en fenêtres isolées, à deux tailles.**
Whisper fusionne une phrase répétée quand il lit tout le fichier : les reprises
n'apparaissent tout simplement pas dans le transcript. Et il n'est pas stable
vis-à-vis de la longueur de fenêtre — une reprise peut sortir en fenêtre de 8 s
et disparaître en 12 s. Une seule passe en rate.

**Relis les raccords en pleine résolution.** Un cache doit CHEVAUCHER ce qui le
suit : arrêté au bord d'une animation, il laisse voir l'écran pendant les 0,4 s
de fondu d'entrée — une douzaine d'images, largement assez pour lire ce qu'on
voulait masquer.

---

## Licence

MIT. Fais-en ce que tu veux.
