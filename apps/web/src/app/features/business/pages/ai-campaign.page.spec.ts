import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { BusinessAiCampaignPage } from './ai-campaign.page';

const SESSION_ID = 'sess-ai-1';
const FIRST_QUESTION =
  'What kind of campaign would you like to launch, and what scope are you aiming for?';

describe('BusinessAiCampaignPage', () => {
  let fixture: ComponentFixture<BusinessAiCampaignPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessAiCampaignPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessAiCampaignPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function startSession(firstMessage: string = FIRST_QUESTION): void {
    http.expectOne('/api/business/ai-campaign/sessions').flush({
      sessionId: SESSION_ID,
      firstMessage,
      scopeOptions: [
        'BRANDING',
        'VISIBILITY_AWARENESS',
        'POSITIONING_STORYTELLING',
        'NEW_PRODUCT_LAUNCH',
        'PROMOTIONS',
        'EVENT_PROMOTION',
        'ENGAGEMENT_INTERACTIONS',
      ],
    });
    fixture.detectChanges();
  }

  it('[AC-110-01] first assistant bubble is the EXACT question with 7 multi-select options', () => {
    startSession();
    const bubble = el().querySelector('[data-testid="bubble-assistant"]');
    expect(bubble?.textContent).toContain(FIRST_QUESTION);
    const options = el().querySelectorAll('[data-testid="scope-options"] input[type="checkbox"]');
    expect(options.length).toBe(7);
    const labels = Array.from(el().querySelectorAll('[data-testid="scope-options"] label')).map(
      (l) => l.textContent?.trim(),
    );
    expect(labels).toEqual([
      'Branding',
      'Visibility / Awareness',
      'Positioning / Storytelling',
      'New Product Or Service Launch',
      'Promotions (Flash Sales, etc.)',
      'Event Promotion',
      'Engagement & Interactions',
    ]);
  });

  it('[AC-110-01] Send button is disabled when nothing is selected and textarea empty', () => {
    startSession();
    const send = el().querySelector<HTMLButtonElement>('[data-testid="send-button"]')!;
    expect(send.disabled).toBeTrue();
  });

  it('[AC-110-02] selecting 2 scopes enables Send and POSTs them', () => {
    startSession();
    const cb1 = el().querySelector<HTMLInputElement>('[data-testid="scope-BRANDING"]')!;
    const cb2 = el().querySelector<HTMLInputElement>(
      '[data-testid="scope-VISIBILITY_AWARENESS"]',
    )!;
    cb1.click();
    cb2.click();
    fixture.detectChanges();
    const send = el().querySelector<HTMLButtonElement>('[data-testid="send-button"]')!;
    expect(send.disabled).toBeFalse();

    el().querySelector<HTMLFormElement>('form')!.requestSubmit();
    fixture.detectChanges();
    const req = http.expectOne(`/api/business/ai-campaign/sessions/${SESSION_ID}/messages`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      selectedScopes: ['BRANDING', 'VISIBILITY_AWARENESS'],
    });
    req.flush({
      session: {
        sessionId: SESSION_ID,
        status: 'IN_PROGRESS',
        selectedScopes: ['BRANDING', 'VISIBILITY_AWARENESS'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      aiResponse: {
        id: 'a1',
        role: 'ASSISTANT',
        content: 'Great. Tell me more about your goals.',
        createdAt: new Date().toISOString(),
      },
    });
    fixture.detectChanges();
    const assistant = el().querySelectorAll('[data-testid="bubble-assistant"]');
    expect(assistant.length).toBe(2);
    expect(assistant[1].textContent).toContain('Great. Tell me more about your goals.');
  });

  it('navigates to AI Manager when AI flow returns a campaign draft', () => {
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate');
    startSession();
    el().querySelector<HTMLInputElement>('[data-testid="scope-BRANDING"]')!.click();
    fixture.detectChanges();
    el().querySelector<HTMLFormElement>('form')!.requestSubmit();
    fixture.detectChanges();
    http.expectOne(`/api/business/ai-campaign/sessions/${SESSION_ID}/messages`).flush({
      session: {
        sessionId: SESSION_ID,
        status: 'COMPLETED',
        selectedScopes: ['BRANDING'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      aiResponse: {
        id: 'a1',
        role: 'ASSISTANT',
        content: 'Done',
        createdAt: new Date().toISOString(),
      },
      campaign: {
        id: 'c1',
        name: 'My Campaign',
        source: 'AI_CAMPAIGN',
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(['/business/ai-manager']);
  });

  it('keeps Send disabled while sending (after submit)', () => {
    startSession();
    el().querySelector<HTMLInputElement>('[data-testid="scope-BRANDING"]')!.click();
    fixture.detectChanges();
    el().querySelector<HTMLFormElement>('form')!.requestSubmit();
    fixture.detectChanges();
    const send = el().querySelector<HTMLButtonElement>('[data-testid="send-button"]')!;
    expect(send.disabled).toBeTrue();
    http.expectOne(`/api/business/ai-campaign/sessions/${SESSION_ID}/messages`).flush({
      session: {
        sessionId: SESSION_ID,
        status: 'IN_PROGRESS',
        selectedScopes: ['BRANDING'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      aiResponse: {
        id: 'a1',
        role: 'ASSISTANT',
        content: 'Next?',
        createdAt: new Date().toISOString(),
      },
    });
  });
});
