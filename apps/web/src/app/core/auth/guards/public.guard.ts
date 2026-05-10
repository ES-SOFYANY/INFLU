import { CanMatchFn } from '@angular/router';

/** Marker guard for public routes — currently always permits. */
export const publicGuard: CanMatchFn = () => true;
