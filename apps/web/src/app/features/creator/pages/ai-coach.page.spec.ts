import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CreatorAiCoachPage } from './ai-coach.page';

describe('CreatorAiCoachPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorAiCoachPage, TranslateModule.forRoot()],
    })
      .overrideComponent(CreatorAiCoachPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(CreatorAiCoachPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
