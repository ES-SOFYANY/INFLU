import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CreatorAiCoachPage } from './ai-coach.page';

const SESSION_ID = 'sess-1';
const FIRST_MESSAGE = "Comment te positionnes-tu en tant qu'influenceur ?";

describe('CreatorAiCoachPage', () => {
  let fixture: ComponentFixture<CreatorAiCoachPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorAiCoachPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(CreatorAiCoachPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function startSession(firstMessage: string = FIRST_MESSAGE): void {
    http.expectOne('/api/v1/creator/me/ai-coach/sessions').flush({
      sessionId: SESSION_ID,
      firstMessage,
    });
    fixture.detectChanges();
  }

  it('[AC-050-01] first assistant bubble is the EXACT French question', () => {
    startSession();
    const bubble = el().querySelector('[data-testid="bubble-assistant"]');
    expect(bubble?.textContent).toContain("Comment te positionnes-tu en tant qu'influenceur ?");
  });

  it('[AC-051-01] Send button is disabled while textarea is empty', () => {
    startSession();
    const send = el().querySelector<HTMLButtonElement>('[data-testid="send-button"]')!;
    expect(send.disabled).toBeTrue();
    const ta = el().querySelector<HTMLTextAreaElement>('[data-testid="message-input"]')!;
    ta.value = 'Je crée du contenu lifestyle.';
    ta.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(send.disabled).toBeFalse();
  });

  it('[AC-050-02] sending a message POSTs to messages endpoint and shows the next assistant question', () => {
    startSession();
    const ta = el().querySelector<HTMLTextAreaElement>('[data-testid="message-input"]')!;
    ta.value = 'Je crée du contenu lifestyle.';
    ta.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el().querySelector<HTMLFormElement>('form')!.requestSubmit();
    fixture.detectChanges();
    const req = http.expectOne(`/api/v1/creator/me/ai-coach/sessions/${SESSION_ID}/messages`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'Je crée du contenu lifestyle.' });
    req.flush({
      userMessage: { id: 'u1', role: 'USER', content: 'Je crée du contenu lifestyle.', createdAt: new Date().toISOString() },
      aiResponse: { id: 'a1', role: 'ASSISTANT', content: 'Sur quels réseaux es-tu présent ?', createdAt: new Date().toISOString() },
    });
    fixture.detectChanges();
    const assistantBubbles = el().querySelectorAll('[data-testid="bubble-assistant"]');
    expect(assistantBubbles.length).toBe(2);
    expect(assistantBubbles[1].textContent).toContain('Sur quels réseaux es-tu présent ?');
    expect(el().querySelector('[data-testid="bubble-user"]')?.textContent).toContain('Je crée du contenu lifestyle.');
  });

  it('[AC-051-02] Restart calls the restart endpoint and resets to the first question', () => {
    startSession();
    const ta = el().querySelector<HTMLTextAreaElement>('[data-testid="message-input"]')!;
    ta.value = 'hello';
    ta.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el().querySelector<HTMLFormElement>('form')!.requestSubmit();
    fixture.detectChanges();
    http.expectOne(`/api/v1/creator/me/ai-coach/sessions/${SESSION_ID}/messages`).flush({
      userMessage: { id: 'u1', role: 'USER', content: 'hello', createdAt: new Date().toISOString() },
      aiResponse: { id: 'a1', role: 'ASSISTANT', content: 'Réponse 2', createdAt: new Date().toISOString() },
    });
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="restart-button"]')!.click();
    fixture.detectChanges();
    const req = http.expectOne(`/api/v1/creator/me/ai-coach/sessions/${SESSION_ID}/restart`);
    expect(req.request.method).toBe('POST');
    req.flush({ sessionId: 'sess-2', firstMessage: FIRST_MESSAGE });
    fixture.detectChanges();
    expect(el().querySelectorAll('[data-testid="bubble-assistant"]').length).toBe(1);
    expect(el().querySelector('[data-testid="bubble-assistant"]')?.textContent).toContain(FIRST_MESSAGE);
    expect(el().querySelector('[data-testid="bubble-user"]')).toBeNull();
  });
});

