import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessDiscoveryPage } from './discovery.page';

describe('BusinessDiscoveryPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessDiscoveryPage, TranslateModule.forRoot()],
    })
      .overrideComponent(BusinessDiscoveryPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(BusinessDiscoveryPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
