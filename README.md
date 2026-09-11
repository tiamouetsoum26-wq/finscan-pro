FinScan Pro
Dépouillement automatisé des états financiers SYSCOHADA / OHADA.
FinScan Pro extrait automatiquement, par intelligence artificielle, les postes d'un bilan, d'un compte de résultat et d'un tableau des flux de trésorerie (sur 3 exercices : N, N-1, N-2) à partir d'un simple PDF, et restitue un dossier structuré exploitable immédiatement — sans ressaisie manuelle.
Édité par CABINET BAFING FORMATION (SARL, Côte d'Ivoire).
🔗 Site : finscanpro.net
---
Sommaire
Ce que fait FinScan Pro
Architecture
Fonctionnalités
Contrôle qualité de l'extraction
Sécurité
Charte graphique
Structure du dépôt
Déploiement
Dépôt lié
Limitations connues / feuille de route
---
Ce que fait FinScan Pro
Un expert-comptable, un cabinet ou une entreprise dépose un bilan (au format PDF, idéalement un export natif de son logiciel comptable) et obtient en quelques minutes :
Le bilan (actif/passif) sur 3 exercices
Le compte de résultat sur 3 exercices
Le tableau des flux de trésorerie sur 3 exercices
Un fichier Excel SYSCOHADA prêt à l'emploi
Des alertes automatiques (cohérence actif/passif, signaux de risque)
Sans ressaisie manuelle, sans erreur de colonne (N / N-1 / N-2), sans confusion de milliers/millions.
Architecture
```
┌─────────────────────┐        ┌──────────────────────┐        ┌─────────────────────┐
│   finscan-pro        │        │    finscan-api        │        │   Anthropic API      │
│   (ce dépôt)          │──────▶│   (Flask + Postgres)  │──────▶│   Claude Sonnet 5     │
│   Netlify (statique)  │  HTTPS│   Render               │  HTTPS│   (extraction IA)     │
└─────────────────────┘        └──────────────────────┘        └─────────────────────┘
```
Frontend (ce dépôt) : une seule page (`index.html`), aucun framework — HTML/CSS/JS natifs. Hébergée sur Netlify, servie statiquement.
Backend (finscan-api) : API Flask, base PostgreSQL, hébergée sur Render. Gère l'authentification, les quotas, l'historique, l'administration, et orchestre l'appel à l'IA.
IA d'extraction : Claude (Anthropic), appelé exclusivement côté serveur — le prompt système et la clé API ne transitent jamais par le navigateur.
Fonctionnalités
Espace client
Inscription avec validation manuelle par l'administrateur (aucun accès libre)
Acceptation obligatoire des CGU et de la politique de confidentialité à l'inscription ; mentions légales en accès libre
Connexion sécurisée, session unique (une connexion simultanée suspecte suspend automatiquement le compte)
Dépôt de documents PDF (bilan, CR, flux de trésorerie), multi-fichiers
Suivi du quota mensuel et de la date d'expiration de l'abonnement
Historique des dépouillements, réexportables à tout moment
Export du résultat en fichier Excel SYSCOHADA
Espace administrateur
Validation / refus / suspension / réactivation / suppression des comptes
Gestion des quotas et durées d'abonnement par client
Tableau de bord de reporting (usage, quotas consommés, top clients)
Gestion des publicités affichées sur l'écran de connexion
Emails automatiques envoyés au client à chaque changement de statut de son compte (validation, refus, suspension, expiration, suppression)
Alerte email à l'administrateur en cas de nouvelle inscription, de tentative de brute-force sur le compte admin, ou d'erreur serveur non gérée
Contrôle qualité de l'extraction
C'est le principe central de fiabilité de l'outil : FinScan Pro ne devine jamais un chiffre.
Si un chiffre est visible mais illisible avec certitude (flou, tache, coupure), il n'est jamais inventé — la ligne est signalée comme incertaine plutôt que remplie au hasard.
Si le document dans son ensemble est trop dégradé pour être exploité de façon fiable, l'extraction est bloquée avant restitution, avec une explication claire et des conseils pour améliorer la qualité du document — et la tentative n'est pas comptabilisée dans le quota du client (plafonné pour éviter les abus).
Un écart entre le total actif et le total passif d'un exercice ne bloque jamais l'extraction : il déclenche une alerte visible, sans jamais empêcher le client d'obtenir son dossier.
Toutes les colonnes d'années (N / N-1 / N-2) sont vérifiées explicitement par rapport à leur en-tête, jamais devinées par leur position.
Sécurité
Résumé (voir aussi le README de `finscan-api` pour le détail côté serveur) :
HTTPS de bout en bout, en-têtes de sécurité durcis (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy — voir `netlify.toml`)
Mots de passe et jetons de session hachés, jamais stockés en clair
Limitation de débit (anti brute-force) sur la connexion, l'inscription et la réinitialisation de mot de passe
Réservation de quota atomique côté serveur (impossible de contourner le quota affiché en appelant l'API directement)
CORS restreint aux domaines de production connus (`finscanpro.net`, `www.finscanpro.net`)
Prompt d'extraction et clé API Anthropic non exposés au client
Audité en septembre 2026 : aucune faille critique identifiée (pas d'injection SQL, pas de XSS exploitable, pas de contournement d'authentification).
Charte graphique
Bleu Confiance — palette officielle depuis septembre 2026 :
Rôle	Couleur
Primaire	`#2563EB`
Secondaire / accent foncé	`#1E3A8A`
Accent	`#F59E0B`
Structure du dépôt
```
finscan-pro/
├── index.html        # Toute l'application (HTML + CSS + JS inline)
├── netlify.toml       # En-têtes de sécurité + configuration Netlify
└── README.md
```
Choix assumé : une seule page, tout embarqué, pour un déploiement Netlify statique simple sans étape de build.
Déploiement
Déploiement automatique sur Netlify à chaque push sur la branche de production. Aucune fonction Netlify utilisée (l'ancien proxy Anthropic côté Netlify, non authentifié, a été retiré — toute la logique sensible vit désormais dans `finscan-api`).
Dépôt lié
finscan-api — API backend (Flask), base de données, orchestration de l'extraction IA, administration, emails.
Limitations connues / feuille de route
Le contenu de l'historique des dépouillements (`HistoryEntry.data`, côté API) n'est pas encore chiffré au niveau applicatif — chiffrement disque actif chez l'hébergeur, chiffrement applicatif supplémentaire à l'étude.
Seul le format PDF est accepté en entrée (l'entrée Excel a été évaluée puis volontairement abandonnée : l'API d'extraction IA ne supporte pas nativement les feuilles de calcul).
La purge automatique des données 6 mois après suppression d'un compte (prévue dans la politique de confidentialité) n'est pas encore implémentée en code.
Numéro RCCM du Cabinet à compléter dans les mentions légales.
