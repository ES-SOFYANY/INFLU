import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CreatorAccountDocumentsPage } from './account-documents.page';

describe('CreatorAccountDocumentsPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorAccountDocumentsPage, TranslateModule.forRoot()],
    })
      .overrideComponent(CreatorAccountDocumentsPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(CreatorAccountDocumentsPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
