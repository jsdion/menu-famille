# Menu famille — planification de repas (28 soupers)

Application autonome de planification de repas familiale : un fichier HTML
principal (`index.html`, ~460 Ko), vanilla JS, données dans localStorage.
PWA : `manifest.webmanifest`, `sw.js` (service worker), `icons/`. Utilisée sur
deux iPhones (l'utilisateur et sa conjointe).
L'utilisateur n'est pas développeur professionnel : expliquer les choix
techniques au fur et à mesure, en termes accessibles.

## Contraintes absolues

1. **SEED_DATA et ING_LINKS sont fragiles.** Ce sont des JSON sur UNE SEULE
   ligne avec échappement ASCII (`é` pour é, etc.). Ne jamais :
   - réordonner, insérer ou supprimer d'entrées dans les tableaux `ing` des
     recettes ;
   - réordonner, insérer ou supprimer d'entrées dans les listes d'épicerie
     S1–S4.

   Raison : `ING_LINKS` et les ids d'épicerie (`S1-0`, `S1-1`, …) sont indexés
   **par position**. Tout décalage corrompt silencieusement les liens
   ingrédient ↔ ligne d'épicerie.

2. **Incrémenter `CACHE_VERSION`** (const en tête de `sw.js`) à chaque
   publication d'une nouvelle version de l'app, sinon les téléphones gardent
   l'ancienne copie en cache hors-ligne.

3. **Incrémenter `DATA_VERSION`** (const en début de section STATE & STORAGE,
   valeur actuelle : 11) à chaque modification de `SEED_DATA`. C'est ce qui
   déclenche la migration du contenu graine sur les téléphones déjà installés
   sans perdre les données personnelles.

4. **Tout le contenu est en français**, orthographe rectifiée de 1990 :
   « maitrise », « cout », « ile », etc. (pas d'accent circonflexe sur i/u).
   Cela vaut pour l'interface, les messages d'erreur, les commentaires de code
   et les textes de commit.

5. **Garder l'app utilisable comme fichier unique** (`index.html` ouvert
   directement doit rester fonctionnel — le service worker ne s'active que
   servi par https ou localhost) le plus longtemps
   possible. N'éclater en plusieurs fichiers que quand c'est indispensable
   (ex. : manifest.json et service worker pour la PWA), et faire en sorte que
   le HTML seul reste fonctionnel en ouverture directe.

## Repères dans le code

- Clés localStorage : toutes préfixées `mf:` — définies dans l'objet `SK`
  (`mf:recipes`, `mf:schedule`, `mf:shopping`, `mf:meta`, `mf:settings`,
  `mf:daySkips`, `mf:planSel`, `mf:ingChecks`, `mf:dataVersion`,
  `mf:pristine`). Tout export/import/synchro doit couvrir le préfixe `mf:*`
  dynamiquement, pas une liste figée.
- `DATA_VERSION` et la migration : section `STATE & STORAGE` (~ligne 1510).
- Page « Réglages » : fonction de rendu vers la ligne 2928 — emplacement
  naturel pour les nouvelles options (sauvegarde, synchro…).
- Liens ingrédients ↔ épicerie : `ING_LINKS[jour][indexIngrédient] = idÉpicerie`.
- Retirer une ligne d'épicerie : mettre son champ `"c"` (catégorie) à `""` dans
  `SEED_DATA` — l'affichage l'ignore (`weekShoppingItems`) et les ids ne bougent
  pas. Ne JAMAIS supprimer l'entrée. Ajouter une ligne : uniquement en FIN de
  liste (S1-99, S2-86 à 91, S3-88/89, S4-100 ajoutés ainsi, audit 2026-07-23).
- `SHARED_CONTRIB` (quantités partagées par jour, vers la ligne 2501) est
  indexée par le **libellé exact** (`a`) des lignes d'épicerie : si on modifie
  un libellé, mettre à jour la clé correspondante.
- Un ingrédient ne peut porter qu'UN lien : pour les composites (« Vinaigrette
  dijonnaise »), le lien pointe vers le composant le plus spécifique; les
  autres composants restent seulement mentionnés dans le libellé d'épicerie.

## Feuille de route convenue (2026-07-14)

1. ✅ Export/import JSON de toutes les clés `mf:*` avec partage via la feuille
   iOS (Web Share API) — filet de sécurité avant le reste. (2026-07-23)
2. ✅ PWA : manifest.webmanifest, service worker (cache hors-ligne), icônes.
   (2026-07-23)
3. ✅ Déploiement GitHub Pages (étape faite avant la synchro, d'un commun
   accord, pour tester sur les iPhones). (2026-07-23)
4. À faire — synchro à deux via Supabase (palier gratuit) : table clé-valeur
   par foyer, horodatage par clé (last-write-wins), auth par code partagé
   simple, Supabase Realtime pour les coches d'épicerie en direct.

## Déploiement

- Dépôt public : https://github.com/jsdion/menu-famille (compte `jsdion`).
- Site : https://jsdion.github.io/menu-famille/ — GitHub Pages, branche
  `master`, racine.
- Publier une nouvelle version = incrémenter `CACHE_VERSION` dans `sw.js`
  (+ `DATA_VERSION` si `SEED_DATA` a changé), commit, `git push`. Pages
  reconstruit en une à deux minutes.
- GitHub CLI (`gh`) installé et authentifié sur la machine
  (`C:\Program Files\GitHub CLI\gh.exe`).

## Développement local

- Pas de Node ni de Python sur la machine. Serveur statique maison :
  `.claude/serveur.ps1` (PowerShell, port 4173), déclaré dans
  `.claude/launch.json` sous le nom `menu-famille` pour le panneau navigateur
  (`preview_start`). Le panneau refuse les URL `file://`.

## Manières de travailler

- Proposer un plan et le faire valider avant de coder chaque étape.
- La copie d'origine du fichier est dans `C:\Users\jsdio\Downloads\` (ne pas y
  toucher, elle sert de sauvegarde de référence).
