import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { RegisterRolesPage } from './register-roles.page';

describe('RegisterRolesPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterRolesPage, TranslateModule.forRoot()],
    })
      .overrideComponent(RegisterRolesPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(RegisterRolesPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
