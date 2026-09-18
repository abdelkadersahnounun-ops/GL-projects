# AvatarStudio

Une application SaaS complète et **fonctionnelle** pour créer automatiquement des vidéos avec des avatars IA :
choix d'un avatar, import et transformation de voix (ex. vers une voix féminine), choix d'un décor,
configuration des paramètres vidéo, génération asynchrone avec suivi de progression, prévisualisation,
téléchargement et historique des projets.

Le pipeline de génération (transformation de voix et composition vidéo) tourne **réellement en local avec
ffmpeg** — aucune clé API externe n'est nécessaire pour tester l'application de bout en bout.

## Stack technique

| Domaine | Choix |
| --- | --- |
| Frontend | Next.js 16 (App Router) · TypeScript · React 19 · Tailwind CSS v4 · shadcn/ui-style · lucide-react |
| Backend | Next.js Route Handlers + Server Components · TypeScript |
| Base de données | PostgreSQL · Prisma ORM |
| Authentification | Auth.js (NextAuth v5) · Credentials + `bcryptjs` · Prisma Adapter |
| Stockage | Abstraction `StorageProvider` : disque local par défaut, S3 / Cloudflare R2 / Supabase Storage en un flag |
| Traitement audio/vidéo | ffmpeg (`fluent-ffmpeg` + appels directs) — conversion de voix et composition vidéo réelles |
| Files d'attente | File de jobs en base (Prisma) + worker Node (in-process ou standalone) |
| Déploiement | Compatible Vercel (web) + worker Docker séparé pour la charge ffmpeg |

## Architecture

```
src/
  app/                       routes Next.js (App Router)
    (auth)/login, register   pages publiques d'authentification
    (app)/dashboard,         zone applicative protégée (proxy.ts + layout)
         avatars,
         projects, projects/new, projects/[id]
    api/                     route handlers (avatars, backgrounds, audio, projects, files, auth)
  components/                composants UI (shadcn-style) + composants métier (wizard, project-detail...)
  server/
    storage/                 StorageProvider (local | s3) — abstraction de stockage
    avatars/                 AvatarProvider (mock aujourd'hui, branchable sur une vraie API demain)
    voice/                   VoiceProvider (ffmpeg : pitch/formant shifting réel)
    video/                   VideoProvider (ffmpeg : composition avatar + décor + audio -> mp4)
    ffmpeg/                  utilitaires bas niveau (spawn, progress parsing, ffprobe)
    jobs/                    file d'attente + worker + processor (pipeline de génération)
    backgrounds/             accès aux décors (catalogue démo)
    db.ts                    client Prisma singleton
  lib/                       auth.ts / auth.config.ts (Auth.js), utils
  proxy.ts                   protection des routes (remplace middleware.ts sous Next 16)
prisma/
  schema.prisma              modèle de données complet
  seed.ts, seed-assets.ts    génère le catalogue démo (avatars + décors) via ffmpeg et crée un compte démo
scripts/
  worker.ts                  worker de rendu vidéo autonome (process séparé, optionnel)
```

### Le principe des "providers"

Quatre abstractions permettent de remplacer un fournisseur externe sans toucher au reste de l'application :

- **`StorageProvider`** (`src/server/storage`) : `local` (disque, par défaut) ou `s3` (AWS S3 / Cloudflare R2 /
  Supabase Storage — même code, seul l'endpoint/les identifiants changent).
- **`AvatarProvider`** (`src/server/avatars`) : `mock` fournit un catalogue de démonstration prêt à l'emploi
  (généré procéduralement, voir plus bas). Une intégration HeyGen/D-ID/Synthesia s'ajoute en implémentant la
  même interface (`listAvatars`, `getAvatar`) et en changeant `AVATAR_PROVIDER`.
- **`VoiceProvider`** (`src/server/voice`) : `ffmpeg` applique une vraie transformation de pitch/formant locale
  (filtre `rubberband`) — la conversion "voix féminine" fonctionne réellement, sans API payante. Une API de
  voice-cloning neuronal peut être branchée derrière la même interface (`convert`).
- **`VideoProvider`** (`src/server/video`) : `ffmpeg` compose un vrai MP4 (décor + avatar animé + audio +
  visualiseur audio réactif + sous-titres incrustés optionnels). Un vrai avatar parlant (HeyGen/D-ID/Synthesia)
  peut être branché derrière la même interface (`compose`).

Chaque provider est sélectionné via une variable d'environnement (`STORAGE_PROVIDER`, `AVATAR_PROVIDER`,
`VOICE_PROVIDER`, `VIDEO_PROVIDER`) et instancié par une factory (`getXProvider()`), sans singleton exposé
directement — le reste du code ne connaît que l'interface.

### Pipeline de génération vidéo

1. L'utilisateur crée un projet (avatar + décor + audio + paramètres) → un ou plusieurs `VideoJob` (`PENDING`)
   sont créés en base (`variantCount`).
2. Un worker (in-process au démarrage du serveur via `instrumentation.ts`, ou processus autonome
   `npm run worker`) réclame les jobs `PENDING` de façon atomique (`updateMany` conditionnel — sûr avec
   plusieurs workers).
3. Étape 1 — **conversion de voix** (si sélectionnée) : ffmpeg (`rubberband`, formant préservé) transforme
   l'audio, l'objet transformé est stocké et réutilisé pour les générations suivantes du même fichier audio.
4. Étape 2 — **composition vidéo** : ffmpeg superpose le décor, une carte avatar animée (respiration douce via
   un zoom sinusoïdal), un visualiseur audio réactif (`showwaves`, lié au vrai fichier audio) et, si activé,
   une légende incrustée (`drawtext`).
5. Le résultat est uploadé via le `StorageProvider`, un enregistrement `Video` est créé, le job passe à
   `COMPLETED` et le projet à `completed`.
6. Le frontend interroge `GET /api/projects/[id]` toutes les 2 secondes tant qu'un job est actif pour afficher
   la progression en temps réel (étape + pourcentage).

## Démarrage rapide

### Prérequis

- Node.js 20+
- PostgreSQL (local, Docker, ou un service managé)
- `ffmpeg` (avec le filtre `rubberband` — présent dans les builds `ffmpeg` standards récents, y compris via
  `apt install ffmpeg` sur Debian/Ubuntu)

### Installation

```bash
cd web
npm install
cp .env.example .env      # puis éditez DATABASE_URL / AUTH_SECRET si besoin
```

Générez un secret pour l'authentification :

```bash
openssl rand -base64 32   # -> collez le résultat dans AUTH_SECRET
```

### Base de données

Avec Docker (fourni, `docker-compose.yml`) :

```bash
docker compose up -d
```

Ou pointez `DATABASE_URL` vers un PostgreSQL déjà existant. Puis :

```bash
npx prisma migrate dev     # crée le schéma
npm run db:seed            # génère les avatars/décors de démo + un compte de test
```

Le seed crée un compte de démonstration :

```
email : demo@avatarstudio.app
mot de passe : Demo1234!
```

### Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000). Le worker de génération vidéo démarre automatiquement
avec le serveur (voir `WORKER_INLINE` ci-dessous) : aucune commande supplémentaire n'est nécessaire pour tester
la génération de vidéos.

### Déploiement en production

- **Frontend + API** : déployables sur Vercel (ou tout hébergeur Next.js).
- **Worker vidéo** : pour ne pas faire concurrencer le rendu ffmpeg (CPU) avec le serveur web, mettez
  `WORKER_INLINE=false` sur le déploiement web et lancez le worker comme process/service séparé :
  ```bash
  npm run worker
  ```
  (conteneurisable indépendamment — voir `scripts/worker.ts`).
- **Stockage** : passez `STORAGE_PROVIDER=s3` et renseignez les variables `S3_*` pour utiliser AWS S3,
  Cloudflare R2 ou Supabase Storage en production plutôt que le disque local.

## Variables d'environnement

Voir `.env.example` pour la liste complète et commentée. Points clés :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | connexion PostgreSQL (Prisma) |
| `AUTH_SECRET` | secret de session Auth.js |
| `STORAGE_PROVIDER` | `local` (défaut) ou `s3` |
| `AVATAR_PROVIDER` | `mock` (défaut) |
| `VOICE_PROVIDER` | `ffmpeg` (défaut) |
| `VIDEO_PROVIDER` | `ffmpeg` (défaut) |
| `WORKER_INLINE` | `true` par défaut : le serveur web traite aussi la file de jobs. Mettre `false` en prod pour utiliser un worker séparé (`npm run worker`) |
| `WORKER_POLL_INTERVAL_MS` | fréquence de scrutation de la file de jobs |

## Fonctionnalités

- ✅ Authentification (inscription / connexion / session sécurisée, mots de passe hachés avec `bcrypt`)
- ✅ Bibliothèque d'avatars (photo, nom, type, style, genre, langue, sélection) — catalogue de démo prêt à
  l'emploi, architecture prête pour un vrai fournisseur
- ✅ Import de fichier audio (validation de format/taille, durée détectée via `ffprobe`)
- ✅ Transformation de voix réelle (féminine, masculine, grave, aiguë, robotique) avec aperçu audio avant
  génération
- ✅ Choix de décor (studio, bureau, extérieur, abstrait, couleur unie)
- ✅ Paramètres vidéo : format (16:9 / 9:16 / 1:1), résolution (720p / 1080p / 4K), sous-titres incrustés,
  position/échelle de l'avatar, nombre de variantes à générer
- ✅ Génération asynchrone avec file d'attente et suivi de progression en temps réel (étape + %)
- ✅ Prévisualisation et téléchargement des vidéos générées
- ✅ Historique complet des projets (statuts, relance en cas d'échec)
- ✅ Architecture "provider" prête pour brancher de vrais fournisseurs IA (avatar, voix, vidéo) et un stockage
  S3-compatible en production

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | serveur de développement (+ worker in-process) |
| `npm run build` / `npm run start` | build et lancement en production |
| `npm run worker` | worker de rendu vidéo autonome |
| `npm run db:seed` | génère le catalogue démo (avatars/décors) + compte de démo |
| `npm run db:migrate` | applique les migrations Prisma |
| `npm run db:studio` | ouvre Prisma Studio |
| `npm run lint` | ESLint |
