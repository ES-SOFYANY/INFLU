import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { AdminCinValidationQueuePage } from './cin-validation-queue.page';

describe('AdminCinValidationQueuePage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCinValidationQueuePage, TranslateModule.forRoot()],
    })
      .overrideComponent(AdminCinValidationQueuePage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AdminCinValidationQueuePage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
