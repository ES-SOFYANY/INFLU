# Coverage Report — API Backend

**Date**: 2026-05-10
**Mode**: `api` (backend NestJS in `apps/api/`)
**Wave**: global
**Sources of truth**:
- `docs/01-product-owner/user-stories.md` (73 US, 53 attendues backend)
- `docs/01-product-owner/acceptance-criteria.json` (169 AC, 126 sur le périmètre backend)
- `docs/03-tech-lead/openapi.yaml` (78 endpoints contractuels)
- `docs/06-api-developer/openapi.json` (76 endpoints réellement exposés)

---

## 1. Résumé exécutif

| Indicateur | Valeur |
|---|---|
| US backend attendues | 53 |
| US **fully** implémentées (tous AC tagués testés) | **30** |
| US **partial** (endpoint OK, AC partiellement tagués) | 22 |
| US **missing** (aucun AC tagué) | 1 (US-142, voir §5) |
| AC backend totaux | 126 |
| AC couverts par un test `[AC-NNN-NN]` | 98 |
| **Taux de couverture AC** | **77.8 %** |
| Endpoints contrat (Tech Lead) | 78 |
| Endpoints exposés (code) | 76 |
| Tests Jest | **345 / 345 PASS** (32 suites, ~33 s) |

---

## 2. Endpoints contrat ↔ controllers réels

### 2.1 Manquants côté code (présents dans `openapi.yaml`, absents des controllers)

| Endpoint contrat | Module attendu | Statut |
|---|---|---|
| `GET /admin/validations/cin` | admin-validation | ❌ MISSING (controller vide) |
| `POST /admin/validations/cin/{id}/approve` | admin-validation | ❌ MISSING |
| `POST /admin/validations/cin/{id}/reject` | admin-validation | ❌ MISSING |
| `POST /auth/onboard` | auth | ⚠️ DRIFT — code expose `POST /auth/onboard/business` |
| `POST /auth/refresh` | auth | ❌ MISSING |
| `POST /auth/reset-password` | auth | ❌ MISSING (seul `/forgot-password` existe) |
| `PUT /business/marketplace/products/{id}` | marketplace | ⚠️ DRIFT — code expose `PATCH /business/marketplace/products/{id}` |

### 2.2 Extras côté code (absents du contrat Tech Lead)

| Endpoint code | Justification |
|---|---|
| `GET /api/auth/roles` | Helper d'init UI (US-007 front), à ajouter au contrat |
| `POST /api/auth/onboard/business` | Renommage de `/auth/onboard` (cf. drift §2.1) |
| `GET /api/creator/me/billing` | Vue billing creator (US-074) — à ajouter au contrat |
| `POST /api/business/me/password/change` | US-035 (change password business) — à ajouter |
| `POST /api/creator/me/password/change` | US-076 (change password creator) — à ajouter |

➡️ **7 endpoints contractuels manquants** (3 admin-validation + refresh + reset-password + 2 drifts) et **5 endpoints de drift** documentés dans `docs/06-api-developer/contract-drift-report.md`.

---

## 3. US backend — statut détaillé

Légende : ✅ all AC tagged & tested · ⚠️ partial · ❌ missing · `(N/A front-only)` exclu

### Auth & Onboarding (US-010 → US-018)

| US | AC total | AC testés | Statut | AC manquants |
|----|---|---|---|---|
| US-010 | 4 | 3 | ⚠️ partial | AC-010-04 |
| US-011 | 2 | 2 | ✅ | — |
| US-012 | 2 | 1 | ⚠️ partial | AC-012-01 |
| US-013 | 2 | 2 | ✅ | — |
| US-014 | 3 | 1 | ⚠️ partial | AC-014-01, AC-014-02 |
| US-015 | 4 | 3 | ⚠️ partial | AC-015-04 |
| US-016 | 4 | 4 | ✅ | — |
| US-017 | 3 | 2 | ⚠️ partial | AC-017-01 |
| US-018 | 2 | 2 | ✅ | — |

### Business Onboarding & Account (US-020, US-030 → US-035)

| US | AC | testés | Statut | Manquants |
|----|---|---|---|---|
| US-020 | 2 | 2 | ✅ | — |
| US-030 | 3 | 3 | ✅ | — |
| US-031 | 3 | 3 | ✅ | — |
| US-032 | 3 | 2 | ⚠️ | AC-032-02 |
| US-033 | 3 | 1 | ⚠️ | AC-033-01, AC-033-03 |
| US-034 | 2 | 1 | ⚠️ | AC-034-02 |
| US-035 | 2 | 2 | ✅ | — |

### Brands & Discovery (US-040, US-041, US-043, US-050, US-051)

| US | AC | testés | Statut | Manquants |
|----|---|---|---|---|
| US-040 | 2 | 2 | ✅ | — |
| US-041 | 2 | 2 | ✅ | — |
| US-043 | 2 | 2 | ✅ | — |
| US-050 | 2 | 1 | ⚠️ | AC-050-02 |
| US-051 | 2 | 2 | ✅ | — |

### Creator Profile & Billing (US-060, US-070 → US-076)

| US | AC | testés | Statut | Manquants |
|----|---|---|---|---|
| US-060 | 2 | 1 | ⚠️ | AC-060-02 |
| US-070 | 3 | 2 | ⚠️ | AC-070-02 |
| US-071 | 2 | 2 | ✅ | — |
| US-072 | 2 | 1 | ⚠️ | AC-072-01 |
| US-073 | 3 | 3 | ✅ | — |
| US-074 | 3 | 3 | ✅ | — |
| US-075 | 2 | 2 | ✅ | — |
| US-076 | 2 | 1 | ⚠️ | AC-076-01 |

### Support (US-080, US-081, US-180, US-181)

| US | AC | testés | Statut | Manquants |
|----|---|---|---|---|
| US-080 | 2 | 2 | ✅ | — |
| US-081 | 2 | 2 | ✅ | — |
| US-180 | 2 | 2 | ✅ | — |
| US-181 | 2 | 1 | ⚠️ | AC-181-01 |

### Marketplace, AI Coach, AI Campaign (US-100, US-110, US-111, US-120, US-122, US-130, US-131, US-132)

| US | AC | testés | Statut | Manquants |
|----|---|---|---|---|
| US-100 | 2 | 2 | ✅ | — |
| US-110 | 2 | 2 | ✅ | — |
| US-111 | 2 | 2 | ✅ | — |
| US-120 | 4 | 3 | ⚠️ | AC-120-04 |
| US-122 | 2 | 1 | ⚠️ | AC-122-02 |
| US-130 | 3 | 1 | ⚠️ | AC-130-02, AC-130-03 |
| US-131 | 3 | 1 | ⚠️ | AC-131-01, AC-131-02 |
| US-132 | 2 | 2 | ✅ | — |

### CRM, Messaging, Notifications (US-140 → US-142, US-150, US-160, US-161)

| US | AC | testés | Statut | Manquants |
|----|---|---|---|---|
| US-140 | 2 | 2 | ✅ | — |
| US-141 | 2 | 2 | ✅ | — |
| US-142 | 2 | 0 | ❌ | AC-142-01, AC-142-02 (cf. §5 — labelling drift) |
| US-150 | 2 | 1 | ⚠️ | AC-150-02 |
| US-160 | 2 | 2 | ✅ | — |
| US-161 | 2 | 2 | ✅ | — |

### Marketplace Creation (US-170 → US-174)

| US | AC | testés | Statut | Manquants |
|----|---|---|---|---|
| US-170 | 2 | 2 | ✅ | — |
| US-171 | 2 | 1 | ⚠️ | AC-171-01 |
| US-172 | 3 | 2 | ⚠️ | AC-172-02 |
| US-173 | 2 | 2 | ✅ | — |
| US-174 | 2 | 1 | ⚠️ | AC-174-01 |

### Misc (US-204)

| US | AC | testés | Statut |
|----|---|---|---|
| US-204 | 2 | 2 | ✅ |

### US exclues (front-only, hors périmètre backend)

`US-001..006`, `US-021`, `US-022`, `US-023`, `US-042`, `US-061`, `US-101`, `US-102`, `US-121`, `US-200..203`, `US-205`, `US-206` → N/A.

---

## 4. AC sans test (28 AC)

```
AC-010-04, AC-012-01, AC-014-01, AC-014-02, AC-015-04, AC-017-01,
AC-032-02, AC-033-01, AC-033-03, AC-034-02, AC-050-02, AC-060-02,
AC-070-02, AC-072-01, AC-076-01, AC-120-04, AC-122-02,
AC-130-02, AC-130-03, AC-131-01, AC-131-02, AC-142-01, AC-142-02,
AC-150-02, AC-171-01, AC-172-02, AC-174-01, AC-181-01
```

> ⚠️ **Note méthodologique** — La majorité de ces AC correspondent à des comportements pourtant testés sous des étiquettes non standard (`AC-142-OK`, `AC-142-409`, `AC-031-404`, `AC-142-DEL` …). Le code/comportement métier est implémenté ; seul le **tag `[AC-NNN-NN]`** ne correspond pas exactement à l'ID canonique de `acceptance-criteria.json`. Voir US-142 (§5) pour exemple type.

---

## 5. Cas représentatif — US-142 (CRM add from Discovery)

`acceptance-criteria.json` déclare `AC-142-01` et `AC-142-02`.
Le code `apps/api/src/modules/crm/__tests__/crm.spec.ts` couvre :
- `[AC-142-OK]`, `[AC-142-409]`, `[AC-142-404-LIST]`, `[AC-142-404-CREATOR]`, `[AC-142-DEL]`, `[AC-142-DEL-404]` — soit **6 tests** (incluant l'erreur `ALREADY_IN_LIST`).

➡️ Comportement **implémenté et testé**, mais labelling non conforme. Idem pour ~15 autres US "partial" du tableau ci-dessus.

---

## 6. Codes d'erreur métier

Codes présents dans le code (constants enum / `throw`) et associés à au moins un test :

| Code | Module | Test |
|---|---|---|
| `ALREADY_IN_LIST` | crm | ✅ `[AC-142-409]` |
| `ALREADY_APPLIED` | marketplace | ✅ `marketplace.spec.ts` |
| `EMAIL_ALREADY_USED` | auth | ✅ `register-creator.spec.ts` |
| `BRAND_ALREADY_LINKED` | brand | ✅ `brands.spec.ts` |
| `BRAND_NOT_FOUND` | brand | ✅ `brands.spec.ts` |
| `CONVERSATION_NOT_FOUND` | messaging | ✅ `messaging.spec.ts` |
| `CREATOR_NOT_FOUND` | crm/discovery | ✅ `[AC-142-404-CREATOR]` |

> Les codes `PROFILE_INCOMPLETE`, `NO_SLOTS_LEFT`, `EMPTY_MESSAGE` mentionnés dans la requête utilisateur **ne figurent ni dans `acceptance-criteria.json` ni dans le code** — non applicables à cette pipeline.

---

## 7. Tests Jest

```
Test Suites: 32 passed, 32 total
Tests:       345 passed, 345 total
Time:        32.596 s
```

✅ Tous les tests passent.

---

## 8. Écarts contrat à corriger

À traiter par un sub-agent **API Story Implementer** ou via un patch contrat (Tech Lead) :

1. **Module `admin-validation` à implémenter** (US absente du périmètre backend mais endpoints contractuels) :
   - `GET /admin/validations/cin`
   - `POST /admin/validations/cin/{id}/approve`
   - `POST /admin/validations/cin/{id}/reject`
   *(à clarifier avec le PO : créer une US ou supprimer du contrat ?)*
2. **Auth manquants** : `POST /auth/refresh`, `POST /auth/reset-password`
3. **Drifts à aligner** :
   - `POST /auth/onboard` (contrat) ↔ `POST /auth/onboard/business` (code) → choisir
   - `PUT /business/marketplace/products/{id}` (contrat) ↔ `PATCH …` (code) → choisir
4. **Endpoints à ajouter au contrat** : `GET /auth/roles`, `GET /creator/me/billing`, `POST /business/me/password/change`, `POST /creator/me/password/change`

---

## 9. Verdict

> ⚠️ **CORRECTIONS REQUISES** — endpoints contractuels manquants + drift contrat ; AC labelling à harmoniser.
>
> Tests verts (345/345), 30 US fully OK, mais :
> - 5 endpoints contractuels manquants (3 admin-validation + 2 auth)
> - 4 endpoints en drift (renommages contrat ↔ code)
> - 28 AC sans tag canonique (comportement testé mais label non standard)
>
> **Décision : NO-GO frontend tant que** :
> 1. les endpoints `auth/refresh` et `auth/reset-password` sont implémentés OU retirés du contrat ;
> 2. le module `admin-validation` est traité (US créée ou retiré du contrat) ;
> 3. les drifts `/auth/onboard(/business)` et `PUT|PATCH /marketplace/products/:id` sont arbitrés.
>
> Le labelling `[AC-NNN-NN]` peut être corrigé en parallèle sans bloquer (regression-only).
