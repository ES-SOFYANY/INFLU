---
name: mcp-playwright-toolkit
description: Cheat sheet des outils MCP Playwright utilisés pour QA manuelle assistée par navigateur (QA Manual, Bug Fixer General). Liste toutes les fonctions de navigation, interaction, capture, lecture d'état et patterns d'usage typiques. À charger pour tout agent qui pilote un vrai navigateur.
user-invocable: false
---

# Boîte à outils MCP Playwright

Ces outils permettent de piloter un vrai navigateur pour tester l'application comme un utilisateur réel. Utilisés par **QA Manual** (exécution de tests) et **Bug Fixer General** (reproduction et vérification de bugs).

## Outils de navigation

| Outil | Usage |
|-------|-------|
| `mcp_playwright_browser_navigate` | Naviguer vers une URL (ex : `http://localhost:4200/auth/login`) |
| `mcp_playwright_browser_resize` | Changer le viewport (desktop 1280×800 / mobile 375×812) |
| `mcp_playwright_browser_press_key` | Appuyer sur une touche (Tab, Enter, Escape) |

## Outils d'interaction

| Outil | Usage |
|-------|-------|
| `mcp_playwright_browser_click` | Cliquer un bouton ou un lien |
| `mcp_playwright_browser_type` | Taper du texte dans un champ |
| `mcp_playwright_browser_fill_form` | Remplir un formulaire complet (multi-champs) |
| `mcp_playwright_browser_select_option` | Sélectionner une option dans un `<select>` |

## Outils de lecture d'état

| Outil | Usage |
|-------|-------|
| `mcp_playwright_browser_snapshot` | Lire le DOM courant (pour trouver les sélecteurs) |
| `mcp_playwright_browser_console_messages` | Récupérer les erreurs / logs console JS |
| `mcp_playwright_browser_evaluate` | Exécuter du JS pour lire `localStorage`, `sessionStorage`, etc. |
| `mcp_playwright_browser_wait_for` | Attendre un élément, une URL, un état |

## Outil de capture

| Outil | Usage |
|-------|-------|
| `mcp_playwright_browser_take_screenshot` | Capture d'écran (PNG) — sauvegarder dans le bon dossier |

## Patterns d'usage typiques

### Pattern 1 — Login d'un persona
```
1. browser_navigate → /auth/login
2. browser_take_screenshot → before-login.png
3. browser_fill_form → email + password (depuis test-credentials.md)
4. browser_click → button[type=submit]
5. browser_wait_for → URL contains /dashboard
6. browser_take_screenshot → after-login.png
7. browser_console_messages → vérifier 0 erreur JS
```

### Pattern 2 — Reproduction d'un bug
```
1. Lire le bug-report.md (étapes de reproduction)
2. browser_navigate → page concernée (avec compte du persona)
3. browser_take_screenshot → BUG-NNN-before.png
4. Suivre les étapes de reproduction
5. browser_take_screenshot → BUG-NNN-FAIL.png
6. browser_console_messages → coller dans le bug
```

### Pattern 3 — Vérification après fix
```
1. browser_navigate → page concernée
2. Reproduire les étapes du bug
3. Vérifier que le comportement est correct
4. browser_take_screenshot → BUG-NNN-after.png
5. Tester sur mobile : browser_resize → 375×812
6. Re-screenshot mobile
7. browser_console_messages → vérifier 0 erreur introduite
```

### Pattern 4 — Discovery d'application
```
1. Pour chaque URL de base connue :
   - browser_navigate → URL
   - browser_take_screenshot → discovery/page-<nom>.png
   - browser_snapshot → lister liens, boutons, formulaires
2. Cartographier dans app-map.md
```

## Conventions de stockage des screenshots

| Agent | Convention |
|-------|------------|
| QA Manual (discovery) | `docs/10-qa-manual/screenshots/discovery/page-<nom>.png` |
| QA Manual (test cases) | `docs/10-qa-manual/screenshots/iteration-<N>/<persona>/<TC-NNN>-<status>.png` |
| Bug Fixer General | `docs/11-bugfix-general/screenshots/<BUG-MAN-NNN>-<before\|after>.png` |

## Règles dures

- ✅ Un screenshot par étape importante (before / during / after / FAIL / PASS)
- ✅ Toujours capturer les console messages avant de conclure
- ✅ Tester desktop ET mobile pour les pages principales
- ✅ Snapshot DOM avant de cliquer pour confirmer le sélecteur
- ❌ Ne pas conclure un test sans screenshot de preuve
- ❌ Ne pas ignorer les erreurs console JS (les documenter dans le bug)
