# Editing OS — Workspace Guide

A modular agent pipeline that turns a raw talking-head recording into a polished,
human-feeling edit. Built on [HyperFrames](https://hyperframes.heygen.com) (HTML-native
video, **not** Remotion).

Everything here is transcript-driven. A word-level transcript is produced once, and every
downstream decision (what to cut, where a motion-graphic beat lands, when b-roll enters)
is timed off those word timestamps. That is why the edits feel hand-made instead of
volume-gated.

## Les formats standard (à lire avant PROCESS.md)

**`formats/`** contient les trois formats de reel standardisés le 18/08 depuis les 6
reels publiés : `01-split-carte` (défaut), `02-avant-apres`,
`03-recreer-viral`. Chaque spec porte la géométrie canonique, la structure timecodée,
la place du CTA et une checklist ; les chiffres sont prouvés dans `formats/MESURES.md`.
Les squelettes clonables vivent dans `style-templates/reel-0*` et le skill
**`reel-format`** choisit le format puis instancie le projet. Un nouveau reel commence
par `reel-format`, puis suit `PROCESS.md` normalement.

## Le process de référence

**`PROCESS.md` est la recette complète d'un reel** (validée le 17/08 sur 17
versions) : préparation, montage parole (transcript puis décibel), direction artistique (`design-beats`), composition,
vérification (autoverify + master -14 LUFS), boucle de review. À lire avant de
démarrer toute nouvelle vidéo courte.

## The pipeline

Five agents, each a self-contained skill under `.claude/skills/`, run in order:

| # | Agent | Skill | What it does |
| --- | --- | --- | --- |
| 1 | **Snip** | `cut-silences` | Trims pauses and dead air off the word timestamps |
| 2 | **Redo** | `cut-mistakes` | Removes stutters, false starts, repeats, and retakes |
| 2.5 | **Vera** | `verify-cuts` | Re-transcribes the render and proves every cut landed |
| 3 | **Mo** | `motion-graphics` | Adds tiered motion-graphic cards from the style library |
| 4 | **Scout** | `insert-broll` | Adds cutaways, screenshots, logos, and stock footage |

Agents 1, 2, and 4 are **review-gated**: they propose every change with context and a
reason, you approve, and only then does anything get rendered.

**Stage 4 of `cut-mistakes` is the part people miss.** After the first verified render it
re-transcribes and reads the whole fresh transcript editorially, piecing together the best
take of every re-recorded sentence. The mechanical detector alone catches a small fraction
of real retakes. If you re-record lines while shooting, this is the step that saves you.

**`verify-cuts` is the trust step.** It never edits video. It re-transcribes the rendered
file and makes at least three full passes (silence sweep, cuts sweep, ledger sweep). PASS
is the precondition for motion graphics and b-roll. Failures route back to agents 1 and 2.

## Editing OS dashboard

```bash
npm run os          # http://localhost:4200
```

A live view of the workspace with the filesystem as the only source of truth. No database,
no build step, Node builtins only. It scans `video-projects/`, `style-library/`,
`asset-library/`, and git state, and caches one snapshot for 60 seconds.

Views: Mission Control (project grid showing each project's latest-render thumbnail and a
plain-French state — à démarrer / en montage / prêt à relire / à re-rendre / livré — plus a
vertical/horizontal format filter; the 9-stage rail lives on the project page, not here),
Project Detail (the
latest render on top, with **Apporter des modifications** leading straight to the
frame-by-frame review — the review has no menu entry, you enter it through the project),
**Studio** (an 8-bit office where the five agents sit at desks and light up when their
stage has recent activity), Libraries, and Activity.

**A project is a shoot, not a video.** One rush yields four or five different ads; one
YouTube long yields several vertical cuts. The dashboard groups renders into
**deliverables** (`editing-os/lib/deliverables.mjs`): the render's base name once version
suffixes (`-v3`, `-master`, `-draft`, timestamps) are stripped, with `compositions/<name>.html`
taking precedence when it exists. Renders target their own composition
(`-c compositions/<id>.html` → `renders/<id>-draft.mp4`), and the prune rule keeps the 3
most recent **per deliverable** — keeping "the 3 most recent renders of the project" would
throw away finished ads.

Compositions are served **bare** by `/workspace/` — the hub does not inject the HyperFrames
runtime. It did briefly, for a homegrown editor since replaced by the Studio, and that froze the
style-library previews: the runtime takes ownership of the timeline and pauses it, while those
thumbnails play it themselves. The Studio brings its own runtime when one is needed.

**`#/edit/<slug>` embeds the HyperFrames Studio** (`editing-os/lib/studio.mjs`) rather than a
homegrown editor: the Studio already has per-property keyframes, razor, snapping, a WebAudio mixer
with server-side waveforms, lint and export, and it writes to source through a transactional API
that snapshots into `.hyperframes/backup` first. Lifecycle constraints, all measured: it is
detached (survives the hub, so it cannot live in `jobs.mjs`), it exposes no CORS headers (all
dialogue goes through the server) but iframes fine, and it costs 400-600 MB per open project —
hence a cap of 3 with LRU eviction. Discovery scans `GET /__hyperframes_config` over ports
3900-3999, the CLI's own window; session files miss orphans. Opening a Studio rewrites `data-hf-id`
attributes into the source, so the hub snapshots into `.backup/` first. Renders launched from the
Studio bypass the hub's single-render lock and produce timestamped names that miss their
deliverable — render from the project page instead.

The project page carries an **Actions** panel that runs the pipeline from the browser —
lint, draft render, draft+verify, standard render, master+verify — streaming each step's
output into the page. The action list is closed (`editing-os/lib/jobs.mjs`), nothing is
built from the URL, no shell, and only one render runs at a time. Review feedback is
written to `video-projects/<slug>/review/<render>.json` instead of the browser's
localStorage, so any session can read it without copy-paste.

Thumbnails and render dimensions come from ffmpeg/ffprobe, generated on demand and cached
in `editing-os/.cache/` (gitignored, keyed by file mtime). The Renders panel of a project
offers **« Ne garder que les 3 derniers »**: it moves older renders to the system Trash —
never deleting, always listing them first, and always protecting masters (`-master.mp4`)
and `renders/final/`.

The Studio reads real file mtimes. An agent shows as working for 15 minutes after its
stage writes an artifact, winds down for 2 hours, then goes idle and strolls the office.
For screenshots and demos you can force any state:

```
http://localhost:4200/#/studio?force=silences:working,motion:working
http://localhost:4200/#/studio?fixture=1            # standalone, no server needed
http://localhost:4200/#/studio?fixture=1&lights=off # after-hours mood
```

See `editing-os/README.md` for stage-detection details and known limits.

## Setup

**Prerequisites:** Node 20+, FFmpeg, Chrome, and whisper-cpp. Run `npx hyperframes doctor`
to check them at once.

```bash
npm install
brew install whisper-cpp  # local transcription (no API key)
cp .env.example .env      # optional keys only
npx hyperframes doctor
npm run os                # confirm the dashboard comes up on :4200
```

**No API key is required.** Transcription runs locally via whisper.cpp; the model downloads
itself to `models/` on first use. Every key in `.env` is optional: `ELEVENLABS_API_KEY`
only enables the hosted transcriber fallback, and Pexels / Pixabay / Unsplash only affect
`insert-broll`'s ability to fetch new stock footage from the web.

## Workspace layout

```
.
├── CLAUDE.md, MOTION_PHILOSOPHY.md   ← workspace docs
├── .claude/skills/                   ← the agents (pipeline + hyperframes + gsap)
├── editing-os/                       ← the dashboard (npm run os)
├── scripts/                          ← transcribe, validate, preflight
├── style-library/                    ← 8 motion-graphic card styles
├── style-templates/                  ← reusable look templates for new projects
├── asset-library/                    ← b-roll / logo / screenshot database
└── video-projects/<slug>/            ← one self-contained folder per video
```

Each project under `video-projects/<slug>/` is self-contained: `index.html` (root
composition), `compositions/` (sub-comps), `assets/`, `renders/` (gitignored),
`hyperframes.json`, `meta.json`.

**Always run the HyperFrames CLI from inside the project folder** — it resolves `assets/`,
`compositions/`, and `renders/` relative to the current working directory.

### Adding a new video project

1. `mkdir video-projects/<slug>` (kebab-case)
2. `cd video-projects/<slug>`
3. `npx hyperframes init`, or copy `hyperframes.json` / `meta.json` from
   `style-templates/<look>/` and edit `meta.json`
4. Build the composition, then lint and render from inside this folder

Name folders **date first** (convention de nommage, 17/08) : `AA-MM-JJ-sujet-en-kebab`,
ex. `26-08-17-montage-video-par-ia`. La date permet de les retrouver ; le kebab-case
reste obligatoire pour la CLI et le dashboard.

## MOTION_PHILOSOPHY.md — read before any creative session

`MOTION_PHILOSOPHY.md` is the canonical motion-graphics aesthetic, deconstructed from a
reference spot. Read it in full at the start of any creative session (composition, scene,
storyboard, palette, transitions, kinetic typography, logo reveal). Re-read section 0 (the
11 Laws) and section 4 (pre-flight checklist) every iteration, and run the pre-flight
checklist before calling any motion piece done.

Defaults: ~1.5s average scene length, black canvas with perspective grid and vignette,
chrome-gradient text with halo glow, motion-blurred whip transitions (never hard cuts),
5 or fewer symbolic colors, 4 to 6s outro hold, rule of threes. When a brand brief demands
a different look, keep the *discipline* (one idea per beat, motion in the transitions,
breathing outros, callbacks) and adapt the palette and texture.

## Skills — invoke these first

Always invoke the matching skill before writing or modifying compositions. Skills encode
framework-specific patterns (`window.__timelines` registration, `data-*` attribute
semantics, shader-compatible CSS, relative-timing syntax) that are **not** in generic web
docs. Skipping them produces broken compositions.

| Skill | When to use |
| --- | --- |
| `design-beats` | AVANT toute composition de reel : écoute le transcript et propose un storyboard d'animations avancées quasi chaque seconde (le designer) |
| `hyperframes` | Authoring compositions, captions, TTS, audio-reactive animation, transitions |
| `hyperframes-cli` | CLI: `init`, `add`, `lint`, `preview`, `render`, `transcribe`, `tts`, `doctor` |
| `gsap` | GSAP animation: timelines, easing, stagger, plugins, performance |
| `hyperframes-registry` | Installing catalog blocks via `npx hyperframes add <name>` |
| `hyperframes-video-beats` | Planning tiered beats (paper takeover vs glass card) |
| `hyperframes-to-ae` | Exporting layered footage with alpha for After Effects |

## Commands

```bash
# Authoring loop (run from inside a project folder)
npx hyperframes preview                          # Studio + hot reload (port 3002)
npx hyperframes lint                             # static HTML check — always before rendering
npx hyperframes compositions                     # list comp IDs + resolved durations
npx hyperframes render --quality draft    --output renders/draft.mp4
npx hyperframes render --quality standard --output renders/final.mp4

# From the workspace root
node scripts/transcribe-whisper.mjs <video-or-audio>      # word timestamps → <stem>.json
npm run os                                                # the dashboard
npx hyperframes doctor                                    # env check
```

**Render flags:** `--quality draft|standard|high` (CRF 28/18/15) · `--fps 24|30|60` ·
`--format mp4|mov|webm` · `--gpu` · `--crf <n>` · `--video-bitrate 10M`.

On an M-series Mac, `--workers auto --browser-gpu --gpu` is dramatically faster.

## Render Contract (must-dos and must-not-dos)

1. Root `<div>` needs `id`, `data-composition-id`, `data-start="0"`, `data-width`, `data-height`.
2. Timed visible elements need `class="clip"` — **except** `<video>` and `<audio>` (adding
   `class="clip"` to a `<video>` breaks it).
3. Every timed element needs `data-start`, `data-duration`, `data-track-index`.
4. `data-start` can reference another clip's id: `data-start="intro + 2"`. Same-track clips
   cannot overlap — use different `data-track-index`.
5. `<video>` must be `muted`; audio belongs in a sibling `<audio>` for the mixer. Set
   `data-has-audio="true"` only when the video's own audio feeds the mix.
6. Every composition registers exactly one GSAP timeline, paused, on
   `window.__timelines["<data-composition-id>"]`. The key must match `data-composition-id` exactly.
7. Composition duration = `tl.duration()`. Pad with `tl.set({}, {}, <seconds>)` to extend.
8. Never call `.play()` / `.pause()` or set `.currentTime` on media — the framework owns playback.
9. Never animate `width` / `height` / `top` / `left` on a `<video>` — wrap it in a `<div>`
   and animate the wrapper.
10. Sub-compositions use `<template>` + `data-composition-src`; their timelines auto-link
    to the parent.
11. Determinism: no `Date.now()`, no unseeded `Math.random()`, no render-time network
    fetches. Use seeded PRNGs.

## Authoring loop (with mandatory gates)

1. Read `MOTION_PHILOSOPHY.md` if you haven't this session.
2. Invoke the matching skill before editing.
3. Edit `index.html` or `compositions/<name>.html`.
4. **Gate 0 — transcript-sync validator** (projects with `assets/transcript.json` + beat
   chains): `node scripts/validate-beat-sync.mjs` must exit 0. Every beat carries
   `data-anchor="<verbatim phrase>"`; the validator enforces
   `-0.2s ≤ (wordStart − beatStart) ≤ 1.8s`. Animations enter just before the anchor word,
   never late.
5. `npx hyperframes lint` — fix errors, triage warnings.
6. **Gate 1 — live Studio preview** before any render, even a draft. Scrub the sub-comps
   and sign off.
7. After sign-off: `render --quality draft`.
8. **Visual verification** — extract one frame per scene at its hero moment and actually
   look at every PNG (face not cropped, transitions land on the intended word, captions
   readable, no overflow). Lint passing is not the same as the design working.
9. Run the `MOTION_PHILOSOPHY.md` pre-flight checklist.
10. **Gate 2 — rendered MP4 preview** on `localhost:8080` (serve with `npx serve . -p 8080 -n`,
    **not** Python's `http.server` — it has no Range support, so scrubbing breaks).
11. Final: `render --quality standard`.

"Lint passes" and "the CSS looks correct" are **not** verification. A frame you actually
looked at is.

## Boucle de review (validée sur le reel montage-ia, 17/08)

Chaque projet vidéo peut embarquer une interface de review frame par frame
(`review.html` à la racine du projet, modèle dans
`video-projects/reel-montage-ia/review.html`) : navigation image par image,
retours horodatés, export « Copier pour Claude ». Le cycle est : rendu draft →
le créateur note ses retours dans l'interface → il colle le bloc → corrections
chirurgicales par timecode → nouveau rendu. Pointer le `src` de la vidéo sur le
dernier rendu à chaque itération.

## Auto-vérification (obligatoire avant d'envoyer un rendu)

Demandée au tournage le 17/08 : « la plupart des retours, tu aurais pu t'en
rendre compte toi-même en regardant ou écoutant la vidéo ». Aucun rendu ne
lui est envoyé sans avoir passé :

```bash
npm run verify -- --project <slug>            # dernier rendu du projet
npm run verify -- --project <slug> --master   # dernier master
npm run verify -- video-projects/<slug>/renders/<rendu>.mp4
```

Le script vit dans `scripts/autoverify.py`, **une seule fois pour tout le
workspace** — il n'y a plus de copie à maintenir par projet (les copies
n'existaient que dans un projet sur quatre, donc trois projets sur quatre
n'étaient pas vérifiables). Sa configuration est optionnelle et tient dans le
`meta.json` du projet :

```json
"verify": { "sentinels": ["…"], "forbiddenRepeats": ["…"], "topZone": true, "tailMax": 1.6 }
```

Sans configuration : les mots-sentinelles se déduisent du transcript **du
montage** (`assets/transcript.json`, `edit.json`, `clean.json`) — jamais d'un
rush, qui contient les phrases coupées volontairement — et la passe « zone
haute » ne tourne que sur un format vertical. Le master s'obtient avec
`npm run master -- --project <slug>` (`scripts/master.py`).

Il re-transcrit le rendu et vérifie : mots-sentinelles présents (fins de
segments non coupées), aucune phrase répétée (prises multiples), parole qui
se termine près de la fin de la vidéo, zone haute jamais visuellement vide.
En complément : les frontières de segments se calculent depuis les VRAIS
`start`/`end` des mots du transcript (jamais estimées), et les groupes
séparés par moins de ~0.3s se fusionnent (moins de coupes = moins de risques).
Puis passe FINALE au niveau sonore (demandée au tournage, 17/08) : whisper
étire les mots sur les pauses, donc les micro-blancs échappent au transcript.
`silencedetect` (~-36 dB, min 0.25s) sur l'audio monté, raboter le milieu de
chaque blanc en laissant ~0.25s de respiration, et re-silencedetect sur le
rendu pour prouver qu'il ne reste rien. Le découpage au niveau sonore prime
sur le transcript pour les blancs.
Leçon v10 : vérifier aussi que le bake ffmpeg utilise bien le MÊME EDL que la
composition — c'est le désaccord bake/composition qui a produit tous les
défauts de la v10.

## Transcription

Default to **local whisper.cpp** for any transcript. It is offline, free, and needs no
API key. Do **not** use `npx hyperframes transcribe`, or openai-whisper /
faster-whisper (avoid the 3 GB PyTorch install).

```bash
node scripts/transcribe-whisper.mjs path/to/video.mp4         # → <stem>.json next to input
# options: --output path · --model large-v3-turbo|base.en|<path.bin> · --language en
#          --threads N · --prompt "..." · --keep-audio · --verbose
#          --no-vad · --no-align · --silence-db -30 · --silence-min 0.2
```

Requires `brew install whisper-cpp`. The ggml model (~1.6 GB for `large-v3-turbo`) and the
silero VAD model download automatically to `models/` on first use; `models/` is gitignored.
Roughly 7x realtime on an M4 Pro.

Output schema is identical to ElevenLabs Scribe, so every downstream agent is unchanged:
`{ language_code, text, words: [{ text, start, end, type, speaker_id }], audio_duration_secs }`
where `start` / `end` are seconds and `type` is `"word"` or `"spacing"`.

**Two defaults you should not turn off.** Raw whisper.cpp word timestamps are not usable by
this pipeline, and the script corrects them in two ways:

1. **`--vad` (silero).** Without it whisper smears words across leading silence. On a test
   clip whose speech provably starts at 2.10s, the first word was stamped **0.00s** — a 2.1s
   error that would misplace every downstream cut. With VAD it lands at 2.13s.
2. **`--align`.** whisper stretches words over pauses instead of leaving gaps. On the same
   clip, three real pauses (0.93s / 0.65s / 0.71s) were entirely swallowed by words only
   0.54–1.14s long, so `cut-silences` saw **no inter-word silence at all** — and the
   `clamp-stretched-tokens` pre-pass never fired, because its threshold is >1.2s. The align
   pass runs `silencedetect` on the source, pulls word edges back to real speech, and snaps
   late onsets back to the true attack. After it, first/last word land within **2 ms** of
   ground truth and all three gaps are recovered.

The `clamp-stretched-tokens` pre-pass in `cut-silences` is still mandatory — it catches the
long screen-recording waits the align pass leaves alone.

**Known artifact — doubled words.** `--max-len 1 --split-on-word` occasionally repeats a
word across a segment boundary ("so so", "without without"), which `verify-cuts` PASS 2
then reports as a residual stutter. Before cutting one, re-transcribe that window with
natural segmentation (drop `-ml 1 -sow`) and check whether the doubling is really there —
cutting a hallucinated repeat clips real speech:

```bash
ffmpeg -y -ss <t-2> -t 7 -i clean.mp4 -vn -ac 1 -ar 16000 -c:a pcm_s16le /tmp/w.wav
whisper-cli -m models/ggml-large-v3-turbo.bin -f /tmp/w.wav -l en \
  --vad -vm models/ggml-silero-v5.1.2.bin -np
```

ElevenLabs Scribe remains available as a hosted fallback (better raw word alignment, needs a
key and an upload):

```bash
node scripts/transcribe-elevenlabs.mjs path/to/video.mp4
```

## Asset prep

Re-encode raw recordings to H.264 before referencing them as a `<video src>`:

```bash
ffmpeg -i raw.mov -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 192k \
  -movflags +faststart assets/clip.mp4
```

## Documentation

- Agent index: https://hyperframes.heygen.com/llms.txt
- Catalog block props: `https://hyperframes.heygen.com/catalog/blocks/<slug>`
- HTML schema (authoritative): https://hyperframes.heygen.com/reference/html-schema
- Inline: `npx hyperframes docs <topic>`

## Trois pièges de derush, payés le 02/09

**Un EDL n'est pas forcément chronologique.** Sur une vidéo longue montée ici,
celui du rush principal revient en arrière au plan 219 : une prise refaite plus tard est remise à sa
place dans le propos. Un remontage qui trie les plans par temps source annule
ce travail en silence — et supprime au passage tout ce qui dépendait de
l'ordre. Ne jamais trier ; fusionner uniquement des plans **voisins dans l'EDL
et contigus dans la source** (`0 <= écart < colle`).

**La détection des phrases dites deux fois ne marche pas sur le transcript
complet.** Whisper, en lisant tout le fichier, fusionne une phrase répétée en
une seule occurrence. Les trois reprises que le créateur avait entendues à
l'oreille étaient toutes absentes du transcript global et toutes présentes en
fenêtre isolée. Il faut découper le montage en fenêtres de 8 à 14 s, transcrire
chaque morceau seul, et faire **deux passes de tailles différentes** : whisper
n'est pas stable vis-à-vis de la longueur de fenêtre. Surtout pas `-ml 1 -sow`,
qui redécode et fait disparaître les reprises.

**Un montage peut être à cheval sur deux rushes.** Un CTA monté ici assemblait
deux clips différents ; son EDL décrit la passe décibel appliquée à cet assemblage,
pas à un rush. Le traiter comme une source unique a coupé exactement le
passage qu'il fallait garder. Avant de réutiliser un EDL, vérifier de quoi il
est l'EDL.

## Ne jamais mettre `<!DOCTYPE html>` en tête d'une composition

Mesuré le 02/09, deux rendus du même chapitre à un caractère près : avec la
déclaration, `data-composition-src` ne charge plus rien et **toutes les
sous-compositions disparaissent** — sans erreur au rendu, sans avertissement au
lint. Sans elle, elles reviennent. Je l'avais ajoutée pour faire taire un
avertissement du linter sur `index.html` ; elle a rendu six animations
invisibles dans un master qui passait par ailleurs autoverify 20/20.

Corollaire de méthode : **autoverify ne voit pas ce qui manque à l'image.** Il
vérifie le son, les mots-sentinelles, la fin de parole. Un plan qui aurait dû
porter une animation et qui n'en porte pas lui est invisible. Seule la planche
de contact regardée en entier attrape ça.

## Un master ne commence pas par une image noire

Le démuxeur concat ne fait pas toujours démarrer le flux vidéo à zéro : sur un
montage assemblé ici il commençait à `start_pts=164` (10,7 ms) quand l'audio
était à 0. Un lecteur posé sur t=0 n'a alors aucune image à afficher et montre
du noir — défaut réel, parti dans deux masters d'affilée avant d'être vu.

Aucun remux standard ne le corrige : `-avoid_negative_ts make_zero` l'aggrave
(164 → 492), `-muxdelay 0 -muxpreload 0`, `-copyts` et un réencodage audio le
laissent tel quel. Ce qui marche, sans réencoder la vidéo, c'est le filtre de
flux : `-bsf:v setts=ts=TS-<start_pts>`. `scripts/master.py` lit désormais le
`start_pts` de la vidéo et le ramène à zéro tout seul.

**Et une couverture doit CHEVAUCHER ce qui la suit.** Une surcouche qui s'arrête
au bord d'une carte laisse voir l'écran pendant le fondu d'entrée de la carte —
0,4 s, soit une douzaine d'images, largement assez pour qu'on lise ce qu'on
voulait masquer.

## Le nettoyage des éclats est une passe FINALE, pas un pré-filtre

Un « éclat » est un plan trop court pour se lire — deux, de 0,12 s et 0,33 s,
ont survécu jusqu'au master livré, pris à deux endroits sans rapport du
rush. Deux erreurs de méthode à ne pas refaire :

**Le critère.** « Ne porte aucun mot du transcript » ne marche pas : le
transcript couvre presque toute la timeline, donc un éclat de 0,12 s chevauche
forcément un mot. Le critère qui marche est géométrique — moins de 0,6 s **et**
isolé dans la source (aucun voisin de montage ne le prolonge, écart > 0,4 s des
deux côtés). Sous 0,3 s, éclat quoi qu'il arrive.

**Le moment.** Filtrer avant les exclusions et la fusion ne suffit pas : les
deux en RECRÉENT (une coupe laisse un moignon, une borne de bloc tombe au milieu
d'une prise). Il faut repasser à la fin, en boucle — retirer un éclat peut en
isoler un autre — et sur **toutes** les EDL, y compris celles construites par un
autre script. Onze éclats survivaient à la première approche.

## Le paquet pour les élèves

```bash
node scripts/paquet-eleves.mjs --zip     # → dist-eleves/editing-os-starter.zip
```

Le paquet du 26/08 avait été assemblé à la main ; celui-ci se reconstruit. Le
contenu est une **liste blanche** — une liste noire oublie toujours le fichier
qu'on vient d'ajouter — et trois assertions bloquent la construction plutôt que
de l'avertir : aucun nom personnel, aucun chemin machine, aucune clé renseignée,
aucun média de plus de 6 Mo. Le style `10-maison` devient `10-maison`,
`video-projects/` part vide avec son mode d'emploi, et les rushes, `models/`,
`node_modules/` et `.env` ne partent jamais.

Après toute modification de la table de remplacement, **relire les fichiers
produits** : « au créateur » et « the brand yellow » sont passés au
travers d'une première version, parce qu'en JavaScript `\b` est une frontière
ASCII et ne se déclenche pas devant un « à ».
