import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CreatorMarketplaceDetailPage } from './marketplace-detail.page';

const PRODUCT_ID = 'p-123';

function makeProduct(over: Partial<Record<string, unknown>> = {}): unknown {
  const base = {
    id: PRODUCT_ID,
    brand: { id: 'b1', name: 'Eucerin', description: 'Eucerin is a leading brand.' },
    callToAction: 'Sois créative !',
    currency: 'MAD',
    deliverables: [
      {
        platform: 'INSTAGRAM',
        contentType: 'Reel',
        contentName: 'Reel',
        quantity: 1,
        unitPrice: 4000,
        taggedAccount: '@eucerin',
        dateReception: '2026-04-21T00:00:00Z',
        datePublication: '2026-04-24T00:00:00Z',
      },
    ],
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    hashtags: ['#ad', '#sponsorisé', '#partenariat_rémunéré'],
    isExpired: false,
    miniScript: '',
    paidByInflu: true,
    platform: 'INSTAGRAM',
    productDescription: 'Sérum Oil Control',
    productName: 'Eucerin Serum Oil Control',
    requestedContent: '1 REEL + 1 SET OF STORIES',
    segmentTier: 'MICRO',
    slotsLeft: 22,
    totalCompensationDhs: 4000,
  };
  return { ...base, ...over };
}

describe('CreatorMarketplaceDetailPage', () => {
  let fixture: ComponentFixture<CreatorMarketplaceDetailPage>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorMarketplaceDetailPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => PRODUCT_ID } }, paramMap: of({ get: () => PRODUCT_ID }) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreatorMarketplaceDetailPage);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flush(opts: {
    product?: unknown;
    cin?: { status: string };
    billing?: { ice: string | null };
  } = {}): void {
    http.expectOne((r) => r.url === `/api/marketplace/products/${PRODUCT_ID}`).flush(
      (opts.product ?? makeProduct()) as object,
    );
    http.expectOne('/api/creator/me/documents/cin').flush(opts.cin ?? { status: 'VALIDATED' });
    http.expectOne('/api/creator/me/billing').flush(opts.billing ?? { ice: '000000000000001' });
    fixture.detectChanges();
  }

  it('[AC-031-01] renders the required sections (brand, product, deliverables, hashtags, CTA, slots)', () => {
    flush();
    expect(el().querySelector('[data-testid="brand-block"]')?.textContent).toContain('Brand overview');
    expect(el().querySelector('[data-testid="product-block"]')?.textContent).toContain('Product overview');
    expect(el().querySelector('[data-testid="product-block"]')?.textContent).toContain('Requested content');
    expect(el().querySelector('[data-testid="deliverables-block"]')?.textContent).toContain('Product deliverables');
    expect(el().querySelector('[data-testid="product-details-block"]')?.textContent).toContain('Available slots');
    expect(el().querySelector('[data-testid="product-details-block"]')?.textContent).toContain('Time remaining');
    expect(el().querySelector('[data-testid="hashtags"]')?.textContent).toContain('#ad');
    expect(el().querySelector('[data-testid="product-details-block"]')?.textContent).toContain('Call to Action');
  });

  it('[AC-031-02] deliverables table exposes the 5 columns (Platform, Content, Date Reception, Date Publication, Price/unit)', () => {
    flush();
    const headers = Array.from(el().querySelectorAll('[data-testid="deliverables-block"] thead th')).map(
      (th) => th.textContent?.trim(),
    );
    expect(headers).toEqual(['Platform', 'Content', 'Date Reception', 'Date Publication', 'Price/unit']);
  });

  it('[AC-031-03] legal hashtags are displayed and not editable', () => {
    flush();
    const hashtags = el().querySelector('[data-testid="hashtags"]')!;
    expect(hashtags.textContent).toContain('#ad');
    expect(hashtags.textContent).toContain('#sponsorisé');
    expect(hashtags.textContent).toContain('#partenariat_rémunéré');
    expect(hashtags.querySelectorAll('input,textarea').length).toBe(0);
  });

  it('[AC-034-01] payment block displays the amount in Dhs and "Paid by INFLU"', () => {
    flush();
    const pay = el().querySelector('[data-testid="payment-block"]')!;
    expect(pay.textContent?.replace(/\s+/g, ' ')).toContain('You will get up');
    expect(pay.textContent?.replace(/\s+/g, ' ')).toContain('4 000');
    expect(pay.textContent).toContain('Dhs');
    expect(el().querySelector('[data-testid="paid-by-influ"]')?.textContent).toContain('Paid by INFLU');
  });

  it('[AC-035-01] non-expired badge says "Expires in N days"', () => {
    flush();
    const badge = el().querySelector('[data-testid="badge-expires"]');
    expect(badge?.textContent).toMatch(/Expires in \d+ day/);
  });

  it('[AC-035-02] expired product shows the EXACT "Expired" badge', () => {
    flush({ product: makeProduct({ isExpired: true }) });
    expect(el().querySelector('[data-testid="badge-expired"]')?.textContent?.trim()).toBe('Expired');
  });

  it('[AC-032-01] Apply is disabled when ICE is missing', () => {
    flush({ cin: { status: 'VALIDATED' }, billing: { ice: null } });
    const btn = el().querySelector<HTMLButtonElement>('[data-testid="apply-button"]')!;
    expect(btn.disabled).toBeTrue();
    expect(el().querySelector('[data-testid="profile-incomplete-block"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="checklist-ice"]')?.textContent).toContain('Fill in your');
  });

  it('[AC-032-02] checklist links point to documents and account screens', () => {
    flush({ cin: { status: 'NONE' }, billing: { ice: null } });
    const ribLink = el().querySelector<HTMLAnchorElement>('[data-testid="link-rib"]')!;
    const iceLink = el().querySelector<HTMLAnchorElement>('[data-testid="link-ice"]')!;
    expect(ribLink.getAttribute('href')).toBe('/creator/accounts?acc_tab=documents');
    expect(iceLink.getAttribute('href')).toBe('/creator/accounts');
  });

  it('[AC-032-03] CIN PENDING_VALIDATION keeps Apply disabled', () => {
    flush({ cin: { status: 'PENDING_VALIDATION' }, billing: { ice: '000000000000001' } });
    const btn = el().querySelector<HTMLButtonElement>('[data-testid="apply-button"]')!;
    expect(btn.disabled).toBeTrue();
    expect(el().querySelector('[data-testid="checklist-cin"]')?.textContent).toContain('pending validation');
  });

  it('[AC-033-01] Apply enabled when CIN validated, ICE filled, slots>0, not expired', () => {
    flush();
    const btn = el().querySelector<HTMLButtonElement>('[data-testid="apply-button"]')!;
    expect(btn.disabled).toBeFalse();
  });

  it('[AC-033-02] Successful Apply navigates to /creator/collaborations', () => {
    flush();
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    el().querySelector<HTMLButtonElement>('[data-testid="apply-button"]')!.click();
    const req = http.expectOne(`/api/marketplace/products/${PRODUCT_ID}/apply`);
    req.flush({ id: 'app-1', creatorId: 'c1', productId: PRODUCT_ID, appliedAt: new Date().toISOString(), status: 'APPLIED' });
    expect(navSpy).toHaveBeenCalledWith('/creator/collaborations');
  });

  it('[AC-033-03] Apply is disabled when product is expired', () => {
    flush({ product: makeProduct({ isExpired: true }) });
    expect(el().querySelector<HTMLButtonElement>('[data-testid="apply-button"]')!.disabled).toBeTrue();
  });

  it('handles 409 PROFILE_INCOMPLETE missing=[RIB] by showing the RIB row as missing', () => {
    flush();
    el().querySelector<HTMLButtonElement>('[data-testid="apply-button"]')!.click();
    http.expectOne(`/api/marketplace/products/${PRODUCT_ID}/apply`).flush(
      { code: 'PROFILE_INCOMPLETE', missing: ['RIB'] },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="profile-incomplete-block"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="checklist-rib"]')?.textContent).toContain('Add your');
    expect(el().querySelector('[data-testid="apply-error"]')?.textContent).toContain('Complete your profile');
  });

  it('handles 409 NO_SLOTS_LEFT', () => {
    flush();
    el().querySelector<HTMLButtonElement>('[data-testid="apply-button"]')!.click();
    http.expectOne(`/api/marketplace/products/${PRODUCT_ID}/apply`).flush(
      { code: 'NO_SLOTS_LEFT' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="apply-error"]')?.textContent).toContain('No slots left');
  });

  it('handles 410 PRODUCT_EXPIRED', () => {
    flush();
    el().querySelector<HTMLButtonElement>('[data-testid="apply-button"]')!.click();
    http.expectOne(`/api/marketplace/products/${PRODUCT_ID}/apply`).flush(
      { code: 'PRODUCT_EXPIRED' },
      { status: 410, statusText: 'Gone' },
    );
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="apply-error"]')?.textContent).toContain('expired');
  });

  it('handles 409 ALREADY_APPLIED', () => {
    flush();
    el().querySelector<HTMLButtonElement>('[data-testid="apply-button"]')!.click();
    http.expectOne(`/api/marketplace/products/${PRODUCT_ID}/apply`).flush(
      { code: 'ALREADY_APPLIED' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="apply-error"]')?.textContent).toContain('already applied');
  });
});

