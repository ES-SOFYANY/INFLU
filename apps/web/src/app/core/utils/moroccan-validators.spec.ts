import { FormControl } from '@angular/forms';

import { MoroccoValidators } from './moroccan-validators';

describe('MoroccoValidators', () => {
  it('validates ICE (15 digits)', () => {
    expect(MoroccoValidators.ice(new FormControl('001234567890123'))).toBeNull();
    expect(MoroccoValidators.ice(new FormControl('123'))).toEqual({ invalidIce: true });
  });

  it('validates Moroccan phone (+212 + 9 digits)', () => {
    expect(MoroccoValidators.phone(new FormControl('+212612345678'))).toBeNull();
    expect(MoroccoValidators.phone(new FormControl('0612345678'))).toEqual({ invalidMoroccanPhone: true });
  });

  it('passes when value is empty', () => {
    expect(MoroccoValidators.ice(new FormControl(''))).toBeNull();
    expect(MoroccoValidators.rib(new FormControl(null))).toBeNull();
  });
});
