import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessAiManagerPage } from './ai-manager.page';

describe('BusinessAiManagerPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessAiManagerPage, TranslateModule.forRoot()],
    })
      .overrideComponent(BusinessAiManagerPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(BusinessAiManagerPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
