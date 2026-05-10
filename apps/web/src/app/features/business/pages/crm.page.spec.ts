import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessCrmPage } from './crm.page';

describe('BusinessCrmPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessCrmPage, TranslateModule.forRoot()],
    })
      .overrideComponent(BusinessCrmPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(BusinessCrmPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
