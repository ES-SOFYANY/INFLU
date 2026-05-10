import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-business-ai-campaign-page',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-6xl px-6 py-12">
      <h1 class="text-3xl font-semibold text-text-primary">AI Campaign</h1>
      <p class="mt-2 text-text-secondary">Placeholder — to be implemented by Story Implementer.</p>
    </section>
  `,
})
export class BusinessAiCampaignPage {}
