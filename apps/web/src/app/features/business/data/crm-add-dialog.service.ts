import { inject, Injectable, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import type { SchemaCrmListDetailDto } from '@my-app/shared-types';

import { BusinessApiService } from './business-api.service';

export interface CrmAddDialogResult {
  readonly listId: string;
  readonly creatorId: string;
}

/**
 * US-142 — Service centralisé qui ouvre la modale "Add to CRM" depuis n'importe
 * quelle surface (Discovery, Profil créateur, etc.). Le composant host
 * `CrmAddDialogHost` (monté dans le BusinessLayout) consomme l'état et exécute
 * la requête `POST /business/crm/lists/{id}/creators/{creatorId}`.
 */
@Injectable({ providedIn: 'root' })
export class CrmAddDialogService {
  private readonly api = inject(BusinessApiService);
  private readonly resultSubject = new Subject<CrmAddDialogResult | null>();

  readonly creatorId = signal<string | null>(null);
  readonly isOpen = signal(false);

  /** Open the dialog for the given creator. Resolves on confirm or close. */
  open(creatorId: string): Observable<CrmAddDialogResult | null> {
    this.creatorId.set(creatorId);
    this.isOpen.set(true);
    return this.resultSubject.asObservable();
  }

  close(result: CrmAddDialogResult | null = null): void {
    this.isOpen.set(false);
    this.creatorId.set(null);
    this.resultSubject.next(result);
  }

  addCreatorToList(listId: string, creatorId: string): Observable<SchemaCrmListDetailDto> {
    return this.api.addCreatorToCrmList(listId, creatorId);
  }
}
