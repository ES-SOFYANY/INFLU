import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const MOROCCO_REGEX = {
  ICE: /^\d{15}$/,
  RIB: /^\d{24}$/,
  IF: /^\d{7,9}$/,
  RC: /^\d+$/,
  TVA: /^\d+$/,
  CIN: /^[A-Z]{1,2}\d{5,6}$/i,
  PHONE: /^\+212\d{9}$/,
  TAGGED_ACCOUNT: /^@[a-zA-Z0-9._]{2,30}$/,
} as const;

function regex(rx: RegExp, errorKey: string): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    const v = c.value as unknown;
    if (v === null || v === undefined || v === '') return null;
    return rx.test(String(v)) ? null : { [errorKey]: true };
  };
}

export const MoroccoValidators = {
  ice: regex(MOROCCO_REGEX.ICE, 'invalidIce'),
  rib: regex(MOROCCO_REGEX.RIB, 'invalidRib'),
  if: regex(MOROCCO_REGEX.IF, 'invalidIf'),
  rc: regex(MOROCCO_REGEX.RC, 'invalidRc'),
  tva: regex(MOROCCO_REGEX.TVA, 'invalidTva'),
  cin: regex(MOROCCO_REGEX.CIN, 'invalidCin'),
  phone: regex(MOROCCO_REGEX.PHONE, 'invalidMoroccanPhone'),
  taggedAccount: regex(MOROCCO_REGEX.TAGGED_ACCOUNT, 'invalidTaggedAccount'),
};
