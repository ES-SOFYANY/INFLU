import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CreatorCollaborationsPage } from './collaborations.page';

describe('CreatorCollaborationsPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorCollaborationsPage, TranslateModule.forRoot()],
    })
      .overrideComponent(CreatorCollaborationsPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(CreatorCollaborationsPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
