# Prompt : générer le guide de supervision du site « Spill the News »

> **Mode d'emploi** : copie tout ce qui est sous la ligne `--- DÉBUT DU PROMPT ---` jusqu'à `--- FIN DU PROMPT ---` et colle-le dans Claude (claude.ai ou l'app Claude). Remplace d'abord les `[À COMPLÉTER]`. Tu peux aussi le coller dans Claude Code, ouvert dans le dossier du projet : l'IA pourra alors vérifier les détails dans le code.

--- DÉBUT DU PROMPT ---

## Rôle

Tu es un formateur pédagogue et un ingénieur logiciel senior. Tu rédiges un **guide complet, pas à pas, en français**, pour une personne qui reprend la supervision d'un site web sans jamais avoir utilisé les outils de développement modernes (Git, terminal, éditeur de code, IA de programmation).

## Public cible

- **Profil** : [À COMPLÉTER : prénom / rôle, ex. « rédactrice en chef du média, très à l'aise avec Word et les réseaux sociaux »].
- **Niveau technique** : zéro. Elle/il ne sait pas ce qu'est un terminal, un dépôt Git, une branche, un déploiement, une variable d'environnement.
- **Système d'exploitation** : [À COMPLÉTER : Windows 11 / macOS / ne sait pas]. Si non précisé, donne les instructions pour Windows ET macOS, clairement séparées.
- **Objectif** : pouvoir **modifier le site en toute sécurité** (textes, design, petites fonctionnalités) en s'aidant d'une IA, **sans casser le site en ligne**, et savoir à qui demander de l'aide quand ça se complique.

## Le projet (faits vérifiés, ne pas les inventer ni les contredire)

- **Nom** : Spill the News, média étudiant (articles + podcast) en français sur la culture, les arts et la société.
- **Dépôt GitHub** : https://github.com/clement-rubin/Spill-the-News (branche principale : `main`).
- **Stack** : Next.js 14 (App Router) + React 18 + TypeScript, CSS global dans `app/globals.css`, animations GSAP, tests avec Vitest.
- **Backend / données / comptes** : Supabase (base de données + authentification native Supabase Auth). L'ancien système NextAuth a été supprimé.
- **Emails (newsletter, confirmations)** : Resend.
- **Hébergement / déploiement** : Netlify (build `npm run build`, dossier `.next`). Le détail du déclenchement automatique (push sur `main` = mise en ligne ?) est à confirmer : [À COMPLÉTER ou « vérifie dans netlify.toml / dis-moi comment le vérifier dans l'interface Netlify »].
- **Structure utile** :
  - `app/` : pages (accueil, `articles/`, `podcast/`, `signup/`, `forgot-password/`, `reset-password/`), `app/admin/` (espace d'administration : articles, épisodes, newsletter, compte, login), `app/api/`.
  - `components/`, `lib/`, `middleware.ts`, `public/`.
  - `docs/supabase-auth-setup.md` : guide d'installation de l'auth Supabase.
  - `scripts/migrate-users-to-supabase-auth.mjs` : script de migration (déjà exécuté, ne pas relancer).
- **Commandes npm** : `npm install`, `npm run dev` (site local sur http://localhost:3000), `npm test` (Vitest), `npm run lint`, `npm run build`.
- **Variables d'environnement** (fichier `.env`, jamais commité) : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_SECRET`, `SITE_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET`. Il existe un modèle `.env.example`.
- **Attention** : `PRODUCT.md` et `README.md` sont obsolètes (ils décrivent un ancien site HTML statique / sont vides). Le projet réel est le Next.js décrit ci-dessus.

## Ce que le guide doit contenir (dans cet ordre)

Pour **chaque étape** : (1) à quoi ça sert, en une phrase simple ; (2) les actions exactes (clic par clic ou commande à copier-coller) ; (3) comment **vérifier que ça a marché** (ce qu'on doit voir à l'écran) ; (4) les **erreurs fréquentes** et leur solution.

0. **Vue d'ensemble en 1 page** : schéma simple (texte ou Mermaid) « mon ordinateur → GitHub → Netlify → site en ligne », et Supabase/Resend en support. Explique chaque mot de jargon utilisé dans le guide (dépôt, clone, commit, push, branche, pull request, déploiement, terminal, variable d'environnement) via un **glossaire** d'une ligne chacun.
1. **Comptes à créer / accès à demander** : GitHub (et comment je l'invite comme collaborateur), accès Netlify, accès Supabase, accès Resend (liste de ce qu'il faut me demander, avec le rôle minimal nécessaire pour chaque service).
2. **Installer les outils**, un par un, avec liens officiels et vérification (`node -v`, `git --version`) : Git, Node.js (version LTS), éditeur de code **Visual Studio Code**, puis l'IA de programmation (**Claude Code** : app de bureau ou extension VS Code, et comment se connecter). Section dédiée aux problèmes classiques (PATH, droits administrateur, PowerShell qui bloque les scripts sous Windows).
3. **Cloner le dépôt** : choisir un dossier **hors OneDrive/Dropbox** (explique pourquoi : OneDrive corrompt `node_modules` et `.git`), `git clone`, ouvrir le dossier dans VS Code.
4. **Configurer l'environnement local** : copier `.env.example` en `.env`, où trouver chaque valeur (Supabase > Settings > API, Resend > API Keys…), comment générer `APP_SECRET` et `CRON_SECRET`, `npm install`, `npm run dev`, ouvrir http://localhost:3000. Précise que je (l'ancien responsable) transmets les secrets par un **canal sécurisé** (gestionnaire de mots de passe, jamais email/WhatsApp en clair) et que **rien de tout cela ne doit jamais être commité ni collé dans une conversation publique**.
5. **Visite guidée du projet** : à quoi sert chaque dossier, où modifier quoi (un texte de la page d'accueil, un style, une page de l'admin). Exemples concrets avec le chemin des fichiers.
6. **Travailler avec l'IA (Claude Code)** : comment la lancer dans le dossier du projet, comment formuler une demande efficace (contexte, résultat voulu, contraintes), **5 à 8 exemples de prompts prêts à copier** adaptés à ce site (ex. « change le texte du bouton X », « ajoute une section Y sur la page podcast », « corrige l'affichage mobile de la page article »), comment relire ce que l'IA a modifié (`git diff` / panneau Source Control de VS Code), quand dire non, et comment **annuler** une modification.
7. **Le cycle de modification sûr** (le cœur du guide) : toujours travailler sur une **nouvelle branche** (jamais directement sur `main`), vérifier en local, lancer `npm test` + `npm run lint` + `npm run build`, faire un commit avec un message clair, pousser, ouvrir une **Pull Request** sur GitHub, vérifier l'aperçu Netlify s'il existe, **fusionner seulement quand tout est vert**. Donne la séquence de commandes exacte et une checklist « avant de fusionner ». Précise ce que fusionner sur `main` déclenche (mise en ligne) [À COMPLÉTER si confirmé].
8. **Vérifier le site en ligne après une mise en ligne** : où voir l'état du déploiement dans Netlify, quoi tester à la main (accueil, un article, le podcast, connexion admin, inscription, mot de passe oublié), comment **revenir à la version précédente** (rollback Netlify et/ou `git revert`) si quelque chose casse.
9. **Tâches courantes d'un superviseur** : publier un article / un épisode via l'admin (sans toucher au code), gérer la newsletter, ajouter ou supprimer un compte admin dans Supabase (et la subtilité : supprimer un utilisateur Auth laisse une ligne orpheline dans la table `users`), renouveler une clé API.
10. **Règles de sécurité et de prudence** : ne jamais commiter `.env`, ne jamais partager `SUPABASE_SERVICE_ROLE_KEY` / `RESEND_API_KEY`, ne pas toucher à la base Supabase ni aux variables Netlify sans accord, ne pas relancer le script de migration, ne jamais utiliser `git push --force`, ne jamais accepter une commande de l'IA qu'on ne comprend pas sans demander.
11. **Aide-mémoire final (1 page imprimable)** : les 10 commandes/gestes à connaître et l'arbre de décision « J'ai un problème → que faire ».
12. **Quand arrêter et appeler à l'aide** : liste de situations (le site en ligne est cassé, message mentionnant « secret » ou « clé », conflit Git incompréhensible, l'IA propose de supprimer beaucoup de fichiers) + [À COMPLÉTER : mes coordonnées / canal de contact].

## Contraintes de forme

- Français, tutoiement [À COMPLÉTER : ou vouvoiement], ton rassurant et direct. Aucune phrase condescendante.
- Chaque commande dans un bloc de code séparé, une commande par bloc, sans le symbole `$`. Indique toujours **où** la taper (terminal intégré de VS Code, dossier du projet).
- Numérote les étapes. Pas de paragraphe de plus de 4 lignes. Utilise des encadrés « ⚠️ Attention » et « ✅ Vérification ».
- Ne suppose **aucune** connaissance préalable : si un terme n'est pas dans le glossaire, définis-le à la première occurrence.
- Quand une information dépend de l'interface d'un service (Netlify, Supabase, GitHub) qui change souvent, dis-le et décris l'intention (« cherche l'onglet Deploys ») plutôt qu'un clic exact fragile.
- **N'invente aucun fait sur le projet.** Si tu n'es pas sûr (ex. déclenchement du déploiement, existence d'aperçus de déploiement), écris-le explicitement dans une section « À vérifier » en fin de guide au lieu de deviner.
- Longueur : complet mais utilisable. Vise un document qu'on peut suivre en une à deux heures la première fois.

## Format de sortie

Un seul document **Markdown** structuré avec sommaire cliquable, prêt à être enregistré en `GUIDE-SUPERVISION.md` (ou exporté en PDF). À la fin, ajoute : (a) la section « À vérifier / informations manquantes », (b) une checklist « Prêt à superviser » avec cases à cocher que la personne peut valider une fois tout installé.

--- FIN DU PROMPT ---

## Notes pour toi (hors prompt)

Avant de déléguer, prépare ces points, sinon le guide restera théorique :

1. **Accès** : invite la personne comme collaborateur GitHub (rôle Write), et donne-lui un accès Netlify / Supabase / Resend avec le rôle minimal. Évite de partager ton propre compte.
2. **Secrets** : transmets les valeurs du `.env` via un gestionnaire de mots de passe (Bitwarden, 1Password), pas par message.
3. **Protège `main`** : sur GitHub, Settings > Branches > règle de protection sur `main` (exiger une Pull Request). Ça empêche qu'un débutant pousse directement en production par erreur.
4. **Corrige les docs obsolètes** : `README.md` est vide et `PRODUCT.md` décrit un ancien site statique. Mets-les à jour (ou demande à Claude de le faire), le superviseur et son IA les liront.
5. **Fais un test à blanc** : donne le guide généré à quelqu'un et regarde où il bloque, puis corrige le guide.
