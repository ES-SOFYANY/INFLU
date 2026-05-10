import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessAiCampaignPage } from './ai-campaign.page';

describe('BusinessAiCampaignPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessAiCampaignPage, TranslateModule.forRoot()],
    })
      .overrideComponent(BusinessAiCampaignPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(BusinessAiCampaignPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
