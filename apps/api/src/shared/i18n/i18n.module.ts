import { Global, Injectable, Module } from '@nestjs/common';
import { LOCALES, type Locale } from '@my-app/shared-types';

@Injectable()
export class I18nService {
  resolveLocale(input: string | undefined): Locale {
    if (!input) return 'fr';
    const head = input.split(',')[0]?.trim().slice(0, 2).toLowerCase();
    return (LOCALES as readonly string[]).includes(head ?? '') ? (head as Locale) : 'fr';
  }
}

@Global()
@Module({
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nModule {}
