import {
  registerDecorator,
  type ValidationOptions,
  type ValidationArguments,
} from 'class-validator';

function regexValidator(name: string, regex: RegExp, defaultMessage: string) {
  return (validationOptions?: ValidationOptions) =>
    (object: object, propertyName: string): void => {
      registerDecorator({
        name,
        target: object.constructor,
        propertyName,
        options: validationOptions,
        validator: {
          validate(value: unknown): boolean {
            return typeof value === 'string' && regex.test(value);
          },
          defaultMessage(_args: ValidationArguments): string {
            return defaultMessage;
          },
        },
      });
    };
}

/** Moroccan ICE — 15 digits, e.g. 000153226000012 */
export const IsIce = regexValidator(
  'IsIce',
  /^\d{15}$/,
  'ICE must be exactly 15 digits',
);

/** Moroccan RIB — 24 digits */
export const IsRib = regexValidator(
  'IsRib',
  /^\d{24}$/,
  'RIB must be exactly 24 digits',
);

/** Moroccan IF — 7 to 9 digits */
export const IsIfNumber = regexValidator(
  'IsIfNumber',
  /^\d{7,9}$/,
  'IF must be 7 to 9 digits',
);

/** Moroccan RC — digits only */
export const IsRc = regexValidator('IsRc', /^\d+$/, 'RC must contain only digits');

/** Moroccan TVA — digits only */
export const IsTva = regexValidator('IsTva', /^\d+$/, 'TVA must contain only digits');

/** Moroccan CIN — 1 or 2 letters then 5 or 6 digits (case-insensitive) */
export const IsCin = regexValidator(
  'IsCin',
  /^[A-Z]{1,2}\d{5,6}$/i,
  'CIN must match Moroccan format (e.g. AB123456)',
);

/** Moroccan phone — strictly +212 followed by 9 digits */
export const IsMoroccanPhone = regexValidator(
  'IsMoroccanPhone',
  /^\+212\d{9}$/,
  'Phone must start with +212 followed by 9 digits',
);

/** Tagged social account — @handle, 2-30 chars [a-zA-Z0-9._] */
export const IsTaggedAccount = regexValidator(
  'IsTaggedAccount',
  /^@[a-zA-Z0-9._]{2,30}$/,
  'Account must be @handle (2 to 30 chars: letters, digits, dot, underscore)',
);
