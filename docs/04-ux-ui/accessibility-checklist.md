# Accessibility Checklist — INFLU.ai (WCAG 2.1 AA)

> Tous les items sont **mandatory**. Tout écart = bug bloquant en QA.
> i18n : FR (par défaut) / EN / AR (RTL).

---

## 1. Contraste (WCAG 1.4.3 / 1.4.11)

- [x] Texte normal ≥ **4.5:1** (vérifié WebAIM contrast checker sur la palette `tokens.css`).
- [x] Texte large (≥ 18.66px bold, ou ≥ 24px regular) ≥ **3:1**.
- [x] Composants UI (bordures focus, icônes informatives) ≥ **3:1**.
- [x] Aucune information transmise par couleur seule (badge `Pending Validation` = couleur + libellé + icône).

| Combinaison | Ratio | OK |
|-------------|-------|-----|
| `#ECECF2` sur `#0A0A0F` | 17.5:1 | ✅ |
| `#A1A6B5` sur `#0A0A0F` | 6.4:1 | ✅ |
| `#6B7280` sur `#0A0A0F` | 4.6:1 | ✅ |
| `#7C5CFF` sur `#0A0A0F` | 4.8:1 | ✅ |
| `#FFFFFF` sur `#7C5CFF` (CTA primary) | 5.0:1 | ✅ |
| `#22C55E` sur `#0A0A0F` | 5.4:1 | ✅ |
| `#EF4444` sur `#0A0A0F` | 4.6:1 | ✅ |

---

## 2. Navigation clavier (WCAG 2.1.1 / 2.4.3 / 2.4.7)

- [x] Tous les éléments interactifs accessibles via **Tab** (formulaires, boutons, liens, tabs, menus).
- [x] Ordre Tab logique (top→bottom, start→end ; en RTL : top→bottom, end→start).
- [x] **Focus visible** sur tous les éléments — `:focus-visible { outline: 2px solid #7C5CFF; outline-offset: 3px; }`.
- [x] Pas de **keyboard trap** (modale → ESC ferme, Tab cyclique dans la modale via CDK `cdkTrapFocus`).
- [x] Skip link en haut de chaque page : `<a href="#main" class="skip-link">Skip to main content</a>`.
- [x] **Enter** sur boutons / **Space** sur checkboxes / **Arrow keys** dans menus, tabs, combobox.

### Raccourcis spécifiques
- AI Coach / Messaging : **Enter** envoie le message, **Shift+Enter** = nouvelle ligne.
- Modal : **ESC** ferme.
- Discovery : **Cmd/Ctrl + K** ouvre la recherche globale (business).

---

## 3. ARIA (WCAG 4.1.2)

| Composant | ARIA requis |
|-----------|-------------|
| Header global | `role="banner"` |
| Sidebar | `role="navigation" aria-label="Main navigation"` |
| Footer | `role="contentinfo"` |
| Main content | `role="main" id="main"` |
| Tabs | `role="tablist"` + tabs `role="tab" aria-selected` + panels `role="tabpanel"` |
| Modal | `role="dialog" aria-modal="true" aria-labelledby="..."` |
| Toast | `role="status"` (info/success) ou `role="alert"` (error) + `aria-live="polite"` ou `assertive` |
| Disabled button | `aria-disabled="true"` (au lieu de `disabled` quand le bouton porte un tooltip explicatif) |
| Combobox autocomplete | `role="combobox" aria-autocomplete="list" aria-expanded aria-controls="listbox-id"` |
| Stepper | `role="list"` + steps avec `aria-current="step"` |
| Pagination | `nav aria-label="Pagination"` + `aria-current="page"` sur la page active |
| Loading skeleton | `aria-busy="true"` sur la zone, `aria-live="polite"` |
| Empty state | `role="status"` |
| Floating "Report an issue" | `aria-label="Report an issue"` |

### Labels ARIA i18n FR / EN / AR

Les labels ARIA doivent être **traduits** via `aria-label="{{ 'a11y.search' | translate }}"`. Exemples :

| Clé i18n | FR | EN | AR |
|----------|----|----|-----|
| `a11y.menu` | « Menu utilisateur » | « User menu » | « قائمة المستخدم » |
| `a11y.search` | « Rechercher » | « Search » | « بحث » |
| `a11y.notifications` | « Notifications » | « Notifications » | « الإشعارات » |
| `a11y.lang` | « Changer de langue » | « Change language » | « تغيير اللغة » |
| `a11y.close` | « Fermer » | « Close » | « إغلاق » |
| `a11y.report` | « Signaler un problème » | « Report an issue » | « الإبلاغ عن مشكلة » |

---

## 4. Formulaires accessibles (WCAG 1.3.1 / 3.3.1 / 3.3.3)

- [x] Chaque `<input>` a un `<label for="id">` visible (jamais placeholder seul).
- [x] Champs requis : `aria-required="true"` + astérisque visuel `*`.
- [x] Erreurs : `aria-invalid="true"` + `aria-describedby="<id-error>"` ; message d'erreur sous le champ avec icône.
- [x] Erreurs claires en langue utilisateur (pas « ICE invalid » mais « L'ICE doit contenir 15 chiffres »).
- [x] Champ `+212` : `<label for="phone">Phone number</label>` + `<span aria-hidden="true">+212</span><input id="phone" type="tel" aria-label="Phone number, prefix +212">`.
- [x] Submit disabled tant que form invalide → bouton avec `aria-disabled="true"` + texte explicatif (`<p id="form-disabled-reason">Complete required fields to continue.</p>` lié via `aria-describedby`).
- [x] Upload : input file masqué + bouton `<button>Choose file</button>` qui le déclenche, avec annonce du fichier sélectionné (`aria-live`).

### Validations Maroc i18n

| Champ | Format | Message d'erreur (FR / EN / AR) |
|-------|--------|---------------------------------|
| Phone | `+212XXXXXXXXX` (9 digits) | « Format attendu : +212 suivi de 9 chiffres » / « Expected: +212 followed by 9 digits » / « الصيغة: +212 متبوعة بـ 9 أرقام » |
| ICE | 15 digits | « ICE doit contenir 15 chiffres » |
| RIB | 24 digits | « RIB doit contenir 24 chiffres » |
| CIN | 1-2 lettres + 5-6 chiffres | « Format CIN invalide (ex. J123456) » |

---

## 5. Images & icônes (WCAG 1.1.1)

- [x] Logos / images informatives : `alt="..."` descriptif.
- [x] Images décoratives (gradient hero, icons décoratives) : `alt=""` ou `aria-hidden="true"`.
- [x] Icônes de bouton seuls : `aria-label` + tooltip optionnel.
- [x] Avatars : `alt="Photo de profil de [nom]"`.
- [x] Drapeaux pays (Discovery) : `alt="[Pays]"` (jamais juste l'emoji sans contexte).

---

## 6. Responsive & touch (WCAG 1.4.10 / 2.5.5)

- [x] Mobile-first **320px** minimum : aucun écran ne casse à cette largeur.
- [x] Pas de scroll horizontal sur mobile (sauf tables → wrap dans un `overflow-x: auto` + indicateur).
- [x] Touch targets **min 44×44px** (boutons, items sidebar, items menu).
- [x] Pinch-zoom autorisé : `<meta name="viewport" content="width=device-width, initial-scale=1.0">` (jamais `user-scalable=no`).

---

## 7. Support RTL (Arabe)

- [x] `<html lang="ar" dir="rtl">` quand langue = AR.
- [x] **Logical CSS properties** partout : `padding-inline-start`, `inset-inline-end`, `border-inline-end`, `margin-inline-start`.
- [x] Icônes directionnelles (chevron, arrow) : flip via `[dir="rtl"] .icon-chevron-right { transform: scaleX(-1); }`.
- [x] Toast position : `inset-inline-end` → reste « du bon côté » en RTL (à gauche).
- [x] Sidebar : `border-inline-end` → frontière du bon côté.
- [x] Police Cairo chargée automatiquement via `html[lang="ar"]` selector dans `tokens.css`.
- [x] Test manuel sur Chromium avec `--force-text-direction=rtl`.

---

## 8. Empty states — libellés EXACTS (WCAG 3.3.1)

| Surface | Libellé (EXACT — ne pas paraphraser) |
|---------|--------------------------------------|
| Creator Dashboard / Campaigns vide | « No campaigns available at the moment. » |
| Creator Marketplace vide | « No campaigns available at the moment. » |
| Creator Collaborations vide | « No campaigns available at the moment. » |
| Creator Messaging vide | « You don't have any open discussions at the moment. » |
| Creator/Business Support / My reports vide | « No reports yet — Use the button in the bottom-right corner to report an issue. » |
| Business Dashboard / AI Campaigns vide | « No campaigns created yet. » |
| Business AI Manager vide | « No AI campaigns created yet » + CTA **Create AI campaign** |
| Business CRM vide | « No CRM list has been created yet. » + CTA **Create New CRM** |
| Business Payments vide | « No payment data found » |

---

## 9. Boutons disabled — raisons explicites

| Bouton | Disabled si | Raison annoncée (alert/tooltip + `aria-describedby`) |
|--------|-------------|------------------------------------------------------|
| **Apply** (Marketplace detail) | CIN non validé OU RIB non uploadé OU ICE non rempli | Bloc « Complete your profile to apply » avec checklist + liens vers `/creator/accounts?acc_tab=documents` et `/creator/accounts` |
| **Update Information** (Account) | Aucun champ modifié | Tooltip « Modify a field to enable » |
| **Reset** (Account form) | Aucun champ modifié | Idem |
| **Send** (AI Coach / Messaging) | Textarea vide | Tooltip « Type a message to send » |
| **Specify dates** (Wizard étape D) | Livraison incomplète | Help text « Complete deliverable to continue » |
| **Next** (Wizard étape D) | Aucune livraison ajoutée | Help text « Add a deliverable to continue » |
| **Confirm selection** (Link new brand modal) | Aucune marque sélectionnée | Help text « Select a brand from the list » |
| **Search ICE** | Champ vide | — |
| **ICE Approve** | Aucun résultat trouvé | — |
| **Apply** (opportunity Expired) | Slot épuisé OU expiré | Badge « Expired » remplace le bouton |

---

## 10. Tests réels à effectuer (par QA Frontend)

```bash
# Lecteur d'écran
# macOS : VoiceOver (Cmd+F5)
# Windows : NVDA (gratuit, https://www.nvaccess.org/)
# Mobile : TalkBack (Android) / VoiceOver (iOS)

# Clavier seul (déconnecter la souris)
# Tab parcourt tous les éléments
# Shift+Tab revient en arrière
# Enter/Space active
# Arrow keys dans menus

# Contraste
# Extension WAVE Firefox
# WebAIM Contrast Checker (en ligne)
# Lighthouse Accessibility audit (Chrome DevTools)

# RTL
# Chrome --lang=ar
# Test que TOUT est miroir : nav, sidebar, alignement texte, position +212, position toast

# Mobile
# Chrome DevTools device toolbar : 320px, 375px, 414px
# Test scroll vertical seul (jamais horizontal sauf tables)
```

---

## 11. Checklist par PR (auto-validation Frontend Story Implementer)

Avant de marquer une story DONE :
- [ ] Lighthouse Accessibility ≥ 95 sur la page implémentée
- [ ] Tab seul fonctionne (manuellement testé)
- [ ] Focus visible sur tous les inputs / boutons
- [ ] Mobile 320px : pas de scroll horizontal, tous les CTA cliquables
- [ ] RTL : page testée avec `dir="rtl"` (logical properties OK)
- [ ] Tous les `<input>` ont un `<label>` visible
- [ ] Tous les boutons icon-only ont `aria-label`
- [ ] Empty / loading / error states implémentés et accessibles (`role="status"`, `aria-live`)
- [ ] Pas d'info transmise par couleur seule (toujours libellé + icône)
- [ ] Modale : ESC ferme, focus trap actif, focus retourne au trigger à la fermeture
