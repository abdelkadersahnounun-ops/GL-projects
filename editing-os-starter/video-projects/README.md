# video-projects/

C'est ici qu'atterrit ton travail. Un dossier par tournage, daté :

    video-projects/AA-MM-JJ-sujet-en-kebab/

Le plus simple est de laisser le skill s'en charger — ouvre Claude Code à la
racine et lance `/reel-format`. Il pose une question, choisit le format et
crée le dossier avec son squelette.

À la main :

    mkdir video-projects/26-01-15-mon-sujet
    cp -R style-templates/reel-01-split-carte/. video-projects/26-01-15-mon-sujet/
    cd video-projects/26-01-15-mon-sujet
    # puis édite meta.json, dépose ton rush dans assets/, et suis PROCESS.md

Chaque projet est autonome : `index.html`, `compositions/`, `assets/`,
`renders/`, `hyperframes.json`, `meta.json`.
