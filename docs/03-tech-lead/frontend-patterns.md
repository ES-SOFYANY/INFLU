# Frontend Patterns — INFLU.ai (Angular 18)

> Patterns frontend imposés. Toute déviation = refus PR. Source de vérité ADR : `ADR-004-frontend.md`, `ADR-007-testing.md`, `ADR-012-i18n-localization.md`.

---

## 1. Architecture composants — Smart / Dumb

| Type | Rôle | Localisation |
|---|---|---|
| **Smart (container)** | Injecte services, gère state, dispatch actions, lit signals/observables | `<feature>/pages/<page>.component.ts` |
| **Dumb (presentational)** | `@Input` signals + `@Output` events uniquement, pas d'injection de services métier | `shared/ui/` ou `<feature>/components/` |

Règles dures :
- Un composant dumb **ne** doit **jamais** importer un service HTTP ni le `Router`.
- Un composant smart ne contient **pas** de logique de présentation complexe : il délègue au template + dumbs.
- `ChangeDetectionStrategy.OnPush` partout (zoneless-ready).
- Standalone components uniquement (`standalone: true`). Pas de `NgModule`.

---

## 2. State management — Signals d'abord, NgRx si besoin

- **Par défaut** : Angular Signals + `signal()`, `computed()`, `effect()` pour les états locaux et de feature.
- **NgRx** uniquement pour : Auth global, Notifications cloche, conversations Messaging (cross-route persistant).
- ❌ Pas de `BehaviorSubject` exposé publiquement. Wrap derrière un signal ou un store NgRx.

---

## 3. Reactive Forms + validators marocains réutilisables

Tous les formulaires : `ReactiveFormsModule` + `FormBuilder.nonNullable`. Pas de Template-Driven Forms.

### `apps/web/src/app/shared/validators/morocco.validators.ts`

```ts
import { AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

export const MOROCCO_REGEX = {
  ICE: /^\d{15}$/,
  RIB: /^\d{24}$/,
  IF: /^\d{7,9}$/,
  RC: /^\d+$/,
  TVA: /^\d+$/,
  CIN: /^[A-Z]{1,2}\d{5,6}$/i,
  PHONE: /^\+212\d{9}$/,
  TAGGED_ACCOUNT: /^@[a-zA-Z0-9._]{2,30}$/,
} as const;

export const MoroccoValidators = {
  ice: regex(MOROCCO_REGEX.ICE, 'invalidIce'),
  rib: regex(MOROCCO_REGEX.RIB, 'invalidRib'),
  if: regex(MOROCCO_REGEX.IF, 'invalidIf'),
  rc: regex(MOROCCO_REGEX.RC, 'invalidRc'),
  tva: regex(MOROCCO_REGEX.TVA, 'invalidTva'),
  cin: regex(MOROCCO_REGEX.CIN, 'invalidCin'),
  phone: regex(MOROCCO_REGEX.PHONE, 'invalidMoroccanPhone'),
  taggedAccount: regex(MOROCCO_REGEX.TAGGED_ACCOUNT, 'invalidTaggedAccount'),
};

function regex(rx: RegExp, errorKey: string): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    const v = c.value;
    if (v === null || v === undefined || v === '') return null;
    return rx.test(String(v)) ? null : { [errorKey]: true };
  };
}
```

### Composants de saisie typés (dumb)

`shared/ui/inputs/` :
- `<app-ice-input>` — masque 15 chiffres + bouton "Search ICE" (US-072) qui appelle `BrandsService.searchByIce()`.
- `<app-rib-input>` — masque 24 chiffres avec espacement visuel `XXXX XXXX XXXX XXXX XXXX XXXX`.
- `<app-phone-input>` — préfixe `+212` figé + 9 digits.
- `<app-cin-input>` — uppercase auto + masque alphanum.
- `<app-mad-amount-input>` — number + suffix `MAD`, séparateur milliers locale-aware.
- `<app-tagged-account-input>` — préfixe `@` figé + validation handle.

Tous reçoivent `formControl: FormControl<string>` via `@Input()`. Aucun ne fait d'appel HTTP (sauf le bouton ICE search qui émet un `@Output()`).

---

## 4. HTTP — services typés via `@my-app/shared-types`

### Règle absolue
Toutes les requêtes HTTP utilisent les types générés depuis l'OpenAPI. **Aucune** interface dupliquée côté frontend.

```ts
// ✅ correct
import type { components, paths } from '@my-app/shared-types';

type CreatorProfile = components['schemas']['CreatorProfile'];
type ApplyResponse = paths['/api/v1/marketplace/products/{id}/apply']['post']['responses']['201']['content']['application/json'];

@Injectable({ providedIn: 'root' })
export class MarketplaceService {
  private http = inject(HttpClient);

  apply(productId: string): Observable<ApplyResponse> {
    return this.http.post<ApplyResponse>(`/api/v1/marketplace/products/${productId}/apply`, {});
  }
}
```

```ts
// ❌ interdit — duplication de type
interface CreatorProfile { id: string; bio: string; ... }
```

### Interceptors (ordre déterministe)

1. `AuthInterceptor` — injecte `Authorization: Bearer <accessToken>`, gère refresh on 401 (rotation transparente).
2. `LocaleInterceptor` — injecte `Accept-Language: fr | en | ar`.
3. `ErrorInterceptor` — mappe `error.code` (cf. §7 coding-standards) vers une notification i18n + toast.
4. `RetryInterceptor` — retry exponentiel (3 tentatives) sur GET idempotents uniquement (5xx + network error).
5. `LoadingInterceptor` — incrémente/décrémente un signal global `requestsInFlight`.

---

## 5. Query params persistés — Discovery & filtres

US-130 : `disc_filter` (base64 JSON) + `disc_seed` (uuid pagination stable) + `disc_page` (int) **doivent** être dans l'URL pour être bookmarkables et partageables.

### Pattern réutilisable : `UrlStateService<T>`

```ts
@Injectable()
export class UrlStateService<T extends object> {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly state = toSignal(
    this.route.queryParamMap.pipe(map(p => this.decode(p.get(this.paramName)))),
    { initialValue: this.defaultValue }
  );

  constructor(
    private paramName: string,
    private defaultValue: T,
  ) {}

  patch(partial: Partial<T>): void {
    const next = { ...this.state(), ...partial };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [this.paramName]: this.encode(next) },
      queryParamsHandling: 'merge',
    });
  }

  private encode(v: T): string { return btoa(JSON.stringify(v)); }
  private decode(s: string | null): T {
    if (!s) return this.defaultValue;
    try { return { ...this.defaultValue, ...JSON.parse(atob(s)) }; }
    catch { return this.defaultValue; }
  }
}
```

Usage Discovery :
```ts
const filters = inject(UrlStateService<DiscoveryFilters>); // configuré 'disc_filter'
const seed = inject(UrlStateService<{ seed: string }>);    // 'disc_seed'
const page = inject(UrlStateService<{ page: number }>);    // 'disc_page'
```

Toggle Table/Grid : également persisté en URL (`?disc_view=table|grid`).

---

## 6. Tailwind CSS — dark theme moderne (anti-admin Bootstrap)

### Setup
- `tailwindcss@^3.4` + `@tailwindcss/forms` + `@tailwindcss/typography`.
- Config dans `apps/web/tailwind.config.ts` — `darkMode: 'class'`, dark **par défaut** sur `<html>`.
- Police : `Inter` (variable) + `Geist Mono` pour code.

### Design tokens (extrait `tailwind.config.ts`)

```ts
export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0B0D12', subtle: '#11141B', card: '#161A23' },
        border: { DEFAULT: '#222632', subtle: '#1A1E28' },
        text: { DEFAULT: '#E6E8EC', muted: '#8B92A1', subtle: '#5C6473' },
        brand: { 50: '#EEF7FF', 500: '#2D8CFF', 600: '#1F6FE0', 700: '#1759BC' },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.25rem' },
      boxShadow: { card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.32)' },
      fontFamily: { sans: ['Inter var', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
```

### Règles design system

- ✅ Cartes `bg-bg-card border border-border rounded-2xl shadow-card p-6`.
- ✅ Boutons primary `bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-4 py-2`.
- ✅ Inputs `bg-bg-subtle border border-border focus:border-brand-500 rounded-xl`.
- ✅ Espacement systématique multiples de `4` (`p-2`, `gap-4`, `space-y-6`).
- ❌ Pas de `box-shadow` aggressif. Pas de gradients criards. Pas de bordures > 1px (sauf focus ring).
- ❌ Pas de couleur en dur dans les composants — toujours via tokens (`bg-bg`, `text-text-muted`).

Conformité visuelle vérifiée par skill `wireframe-modernity-check`.

---

## 7. i18n FR / EN / AR + RTL

- `@angular/localize` activé. 3 builds : `fr`, `en`, `ar`.
- Fichiers messages dans `apps/web/src/locale/messages.{fr,en,ar}.xlf`.
- **RTL automatique** quand `ar` :
  - `<html dir="rtl" lang="ar">` au bootstrap.
  - Tailwind classes logiques : utiliser `start`/`end` au lieu de `left`/`right` (`ms-2`, `me-4`, `text-start`).
  - Icônes directionnelles (chevrons) : flip via `[class.rtl-flip]="locale === 'ar'"`.
- Détection initiale : `navigator.language` → fallback `fr`. Stocké dans `localStorage` + cookie pour SSR éventuel.
- Pluriels via `$localize` ICU.
- Dates / nombres / monnaie via `Intl.NumberFormat` et `Intl.DateTimeFormat` localisés (currency = `MAD`).

---

## 8. Angular 18 — fonctionnalités modernes obligatoires

| Pattern | Règle |
|---|---|
| Standalone components | Toujours. Pas de `NgModule`. |
| Signals | Inputs `input()`, `model()`, `output()` (signal-based) — pas `@Input()` decorator legacy. |
| Control flow | `@if`, `@for`, `@switch`, `@defer` — pas de `*ngIf`, `*ngFor`. |
| `inject()` | Préférer à l'injection par constructeur (plus court, friendly avec functional guards). |
| Functional guards / resolvers | `CanActivateFn`, `ResolveFn` — pas de classes Guard. |
| Lazy loading | `loadChildren: () => import('./creator/creator.routes').then(m => m.CREATOR_ROUTES)`. |
| Deferred views | `@defer` pour les sections lourdes (ex. AI Coach chat panel, Creator Report preview). |

---

## 9. Accessibilité — WCAG 2.1 AA

- Contrastes vérifiés en CI via Playwright + `@axe-core/playwright` sur les routes critiques (login, dashboard, marketplace detail, apply, payments).
- Tous les inputs : `<label>` associé (`for` + `id`) ou `aria-label`.
- Focus ring visible (`focus-visible:ring-2 ring-brand-500`).
- Modals : trap focus + `role="dialog"` + `aria-modal="true"` + close on Escape.
- Tableaux Discovery / Payments : `<table>` sémantique avec `<thead>`/`<th scope="col">`.
- Annonces dynamiques (notifications, erreurs apply) : `aria-live="polite"`.
- Navigation clavier : tab order logique, skip-link en haut de page.

---

## 10. Test patterns frontend

- Component tests : Karma + Jasmine + `@angular/cdk/testing` (harnesses).
- E2E : Playwright (`tests/e2e/`), `data-testid` plutôt que sélecteurs CSS fragiles.
- Mock HTTP : `HttpTestingController` (unit) ou MSW (intégration).
- Naming : `[AC-NNN-NN] <description>` (cf. coding-standards §6).
- Coverage ≥ 80 % bloquant CI.
