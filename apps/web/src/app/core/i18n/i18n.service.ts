import { inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export const SUPPORTED_LOCALES = ['fr', 'en', 'ar'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly translate = inject(TranslateService);
  private readonly _locale = signal<Locale>(this.read());
  readonly locale = this._locale.asReadonly();

  setLocale(locale: Locale): void {
    this._locale.set(locale);
    this.translate.use(locale);
    if (typeof localStorage !== 'undefined') localStorage.setItem('locale', locale);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    }
  }

  private read(): Locale {
    if (typeof localStorage === 'undefined') return 'fr';
    const stored = localStorage.getItem('locale');
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) return stored as Locale;
    return 'fr';
  }
}
