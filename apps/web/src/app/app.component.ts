import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main-content">{{ 'common.skipToContent' | translate }}</a>
    <main id="main-content" class="min-h-screen bg-bg-base text-text-primary">
      <router-outlet />
    </main>
  `,
})
export class AppComponent implements OnInit {
  private readonly translate = inject(TranslateService);

  ngOnInit(): void {
    const supported = ['fr', 'en', 'ar'] as const;
    this.translate.addLangs([...supported]);
    const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('locale')) || '';
    const browser = (this.translate.getBrowserLang() ?? 'fr').slice(0, 2);
    const initial = (supported as readonly string[]).includes(stored)
      ? stored
      : (supported as readonly string[]).includes(browser)
        ? browser
        : 'fr';
    this.translate.use(initial);
    this.applyDirection(initial);
  }

  private applyDirection(lang: string): void {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
}
