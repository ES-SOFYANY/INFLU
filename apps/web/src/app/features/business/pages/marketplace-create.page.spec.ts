import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { BusinessMarketplaceCreatePage } from './marketplace-create.page';

const PRODUCT_ID = 'p-1';
const BRAND_ID = 'b-1';

function wizardDto(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: PRODUCT_ID,
    brandId: BRAND_ID,
    status: 'DRAFT',
    currentStep: 'BRAND_INFO',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('BusinessMarketplaceCreatePage', () => {
  let fixture: ComponentFixture<BusinessMarketplaceCreatePage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessMarketplaceCreatePage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessMarketplaceCreatePage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    // Initial brands load
    http.expectOne('/api/v1/business/brands').flush([{ id: BRAND_ID, name: 'Eucerin' }]);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function setInput(testid: string, value: string): void {
    const input = el().querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `[data-testid="${testid}"]`,
    )!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function clickNext(): void {
    el().querySelector<HTMLButtonElement>('[data-testid="btn-next"]')!.click();
    fixture.detectChanges();
  }

  it('[AC-120-01] Step A — Next is disabled until both fields filled, then POSTs draft', () => {
    expect(el().querySelector('[data-testid="step-brand-info"]')).toBeTruthy();
    let next = el().querySelector<HTMLButtonElement>('[data-testid="btn-next"]')!;
    expect(next.textContent).toContain('Next: Describe product');
    expect(next.disabled).toBeTrue();

    setInput('input-brandId', BRAND_ID);
    expect(el().querySelector<HTMLButtonElement>('[data-testid="btn-next"]')!.disabled).toBeTrue();

    setInput('input-brandDescription', 'A premium skincare brand.');
    next = el().querySelector<HTMLButtonElement>('[data-testid="btn-next"]')!;
    expect(next.disabled).toBeFalse();

    next.click();
    fixture.detectChanges();
    const req = http.expectOne('/api/v1/business/marketplace/products');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      brandId: BRAND_ID,
      brandDescription: 'A premium skincare brand.',
    });
    req.flush(wizardDto());
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="step-product-details"]')).toBeTruthy();
  });

  it('[AC-120-02] Step B requires the 4 fields, then PATCHes step', () => {
    advanceToStep('PRODUCT_DETAILS');
    let next = el().querySelector<HTMLButtonElement>('[data-testid="btn-next"]')!;
    expect(next.disabled).toBeTrue();
    setInput('input-productName', 'Oil Control Serum');
    setInput('input-productDescription', 'Reduces shine');
    setInput('input-requestedContent', 'A 30s reel');
    setInput('input-miniScript', 'Tag the brand in caption');
    next = el().querySelector<HTMLButtonElement>('[data-testid="btn-next"]')!;
    expect(next.disabled).toBeFalse();
    next.click();
    fixture.detectChanges();
    const req = http.expectOne(`/api/v1/business/marketplace/products/${PRODUCT_ID}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.step).toBe('PRODUCT_DETAILS');
    req.flush(wizardDto({ currentStep: 'ACCEPTANCE_CRITERIA' }));
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="step-acceptance-criteria"]')).toBeTruthy();
  });

  it('[AC-120-03] Step C — add/remove criteria, "Specify deliverables" advances', () => {
    advanceToStep('ACCEPTANCE_CRITERIA');
    el().querySelector<HTMLButtonElement>('[data-testid="criterion-add"]')!.click();
    fixture.detectChanges();
    let next = el().querySelector<HTMLButtonElement>('[data-testid="btn-next"]')!;
    expect(next.textContent).toContain('Specify deliverables');
    expect(next.disabled).toBeTrue();
    setInput('criterion-0', 'Speak french');
    next = el().querySelector<HTMLButtonElement>('[data-testid="btn-next"]')!;
    expect(next.disabled).toBeFalse();
    el().querySelector<HTMLButtonElement>('[data-testid="criterion-remove-0"]')!.click();
    fixture.detectChanges();
    expect(el().querySelector<HTMLButtonElement>('[data-testid="btn-next"]')!.disabled).toBeTrue();
  });

  it('[AC-121-03] Step D — Next is disabled when no deliverable is added', () => {
    advanceToStep('DELIVERABLES');
    expect(el().querySelector('[data-testid="deliverables-empty-hint"]')).toBeTruthy();
    expect(el().querySelector<HTMLButtonElement>('[data-testid="btn-next"]')!.disabled).toBeTrue();
  });

  it('[AC-121-02] Step D — Specify dates is disabled while a delivery is partially filled', () => {
    advanceToStep('DELIVERABLES');
    el().querySelector<HTMLButtonElement>('[data-testid="deliverable-add"]')!.click();
    fixture.detectChanges();
    setInput('deliverable-platform-0', 'INSTAGRAM');
    setInput('deliverable-contentType-0', 'reel');
    setInput('deliverable-quantity-0', '1');
    setInput('deliverable-unitPrice-0', '4000');
    // taggedAccount left empty -> still invalid
    expect(el().querySelector('[data-testid="dates-disabled-hint"]')).toBeTruthy();
    expect(el().querySelector<HTMLButtonElement>('[data-testid="btn-next"]')!.disabled).toBeTrue();
    setInput('deliverable-taggedAccount-0', 'eucerin_ma');
    expect(el().querySelector<HTMLButtonElement>('[data-testid="btn-next"]')!.disabled).toBeFalse();
  });

  it('[AC-121-01] Step D — Tagged account is auto-prefixed with "@" when sent', () => {
    advanceToStep('DELIVERABLES');
    el().querySelector<HTMLButtonElement>('[data-testid="deliverable-add"]')!.click();
    fixture.detectChanges();
    setInput('deliverable-platform-0', 'INSTAGRAM');
    setInput('deliverable-contentType-0', 'reel');
    setInput('deliverable-quantity-0', '1');
    setInput('deliverable-unitPrice-0', '4000');
    setInput('deliverable-taggedAccount-0', 'eucerin_ma');
    el().querySelector<HTMLButtonElement>('[data-testid="btn-next"]')!.click();
    fixture.detectChanges();
    const req = http.expectOne(`/api/v1/business/marketplace/products/${PRODUCT_ID}`);
    expect(req.request.body.step).toBe('DELIVERABLES');
    expect(req.request.body.deliverables[0].taggedAccount).toBe('@eucerin_ma');
    req.flush(wizardDto({ currentStep: 'DATES' }));
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="step-dates"]')).toBeTruthy();
  });

  it('[BUG-MAN-008] Step D — typing "@@yassir" is normalized to a single "@" in payload', () => {
    advanceToStep('DELIVERABLES');
    el().querySelector<HTMLButtonElement>('[data-testid="deliverable-add"]')!.click();
    fixture.detectChanges();
    setInput('deliverable-platform-0', 'INSTAGRAM');
    setInput('deliverable-contentType-0', 'reel');
    setInput('deliverable-quantity-0', '1');
    setInput('deliverable-unitPrice-0', '4000');
    // User pastes/types value WITH leading '@' (or two) — must be normalized to a single '@'
    setInput('deliverable-taggedAccount-0', '@@yassir');
    el().querySelector<HTMLButtonElement>('[data-testid="btn-next"]')!.click();
    fixture.detectChanges();
    const req = http.expectOne(`/api/v1/business/marketplace/products/${PRODUCT_ID}`);
    expect(req.request.body.deliverables[0].taggedAccount).toBe('@yassir');
    req.flush(wizardDto({ currentStep: 'DATES' }));
  });

  it('[AC-120-04] Step E — Publish requires reception+publication and POSTs publish', () => {
    advanceToStep('DATES');
    expect(el().querySelector<HTMLButtonElement>('[data-testid="btn-publish"]')!.disabled).toBeTrue();
    setInput('dates-reception-0', '2026-05-01');
    setInput('dates-publication-0', '2026-05-10');
    expect(el().querySelector<HTMLButtonElement>('[data-testid="btn-publish"]')!.disabled).toBeFalse();

    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate');
    el().querySelector<HTMLButtonElement>('[data-testid="btn-publish"]')!.click();
    fixture.detectChanges();
    const saveReq = http.expectOne(`/api/v1/business/marketplace/products/${PRODUCT_ID}`);
    expect(saveReq.request.method).toBe('PATCH');
    saveReq.flush(wizardDto({ currentStep: 'DATES' }));
    const pubReq = http.expectOne(`/api/v1/business/marketplace/products/${PRODUCT_ID}/publish`);
    expect(pubReq.request.method).toBe('POST');
    pubReq.flush(wizardDto({ status: 'PUBLISHED' }));
    expect(spy).toHaveBeenCalledWith(['/business/marketplace']);
  });

  it('[AC-121-02] datePublication < dateReception keeps Publish disabled', () => {
    advanceToStep('DATES');
    setInput('dates-reception-0', '2026-05-10');
    setInput('dates-publication-0', '2026-05-01');
    expect(el().querySelector<HTMLButtonElement>('[data-testid="btn-publish"]')!.disabled).toBeTrue();
  });

  // ─── helpers ─────────────────────────────────────────────────────────────
  function advanceToStep(target: 'PRODUCT_DETAILS' | 'ACCEPTANCE_CRITERIA' | 'DELIVERABLES' | 'DATES'): void {
    setInput('input-brandId', BRAND_ID);
    setInput('input-brandDescription', 'A premium brand.');
    clickNext();
    http.expectOne('/api/v1/business/marketplace/products').flush(wizardDto());
    fixture.detectChanges();
    if (target === 'PRODUCT_DETAILS') return;

    setInput('input-productName', 'Serum');
    setInput('input-productDescription', 'Description');
    setInput('input-requestedContent', 'Reel');
    setInput('input-miniScript', 'Script');
    clickNext();
    http
      .expectOne(`/api/v1/business/marketplace/products/${PRODUCT_ID}`)
      .flush(wizardDto({ currentStep: 'ACCEPTANCE_CRITERIA' }));
    fixture.detectChanges();
    if (target === 'ACCEPTANCE_CRITERIA') return;

    el().querySelector<HTMLButtonElement>('[data-testid="criterion-add"]')!.click();
    fixture.detectChanges();
    setInput('criterion-0', 'Speak french');
    clickNext();
    http
      .expectOne(`/api/v1/business/marketplace/products/${PRODUCT_ID}`)
      .flush(wizardDto({ currentStep: 'DELIVERABLES' }));
    fixture.detectChanges();
    if (target === 'DELIVERABLES') return;

    el().querySelector<HTMLButtonElement>('[data-testid="deliverable-add"]')!.click();
    fixture.detectChanges();
    setInput('deliverable-platform-0', 'INSTAGRAM');
    setInput('deliverable-contentType-0', 'reel');
    setInput('deliverable-quantity-0', '1');
    setInput('deliverable-unitPrice-0', '4000');
    setInput('deliverable-taggedAccount-0', 'eucerin_ma');
    clickNext();
    http
      .expectOne(`/api/v1/business/marketplace/products/${PRODUCT_ID}`)
      .flush(wizardDto({ currentStep: 'DATES' }));
    fixture.detectChanges();
  }
});
