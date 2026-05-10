import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ServerErrorPage } from './server-error.page';

describe('ServerErrorPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [ServerErrorPage, TranslateModule.forRoot()],
    })
      .overrideComponent(ServerErrorPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(ServerErrorPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
