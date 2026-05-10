import { Global, Injectable, Module } from '@nestjs/common';

export interface AiGenerateInput {
  prompt: string;
  systemPrompt?: string;
  locale?: string;
}

export interface AiGenerateOutput {
  text: string;
}

export interface CoachHistoryEntry {
  role: 'USER' | 'ASSISTANT';
  content: string;
}

export interface CampaignChatInput {
  /** User-typed message (may be empty when only `selectedScopes` is sent). */
  content?: string;
  /** Multi-select scope chosen at step 1 of the chat (US-110, AC-110-02). */
  selectedScopes?: string[];
}

export interface CampaignChatOutput extends AiGenerateOutput {
  /** True when the assistant has finished interviewing the user (briefJson is filled). */
  briefReady: boolean;
  /** Structured brief generated when `briefReady=true`. */
  briefJson?: Record<string, unknown>;
  /** Human-friendly campaign name proposed by the AI. */
  campaignName?: string;
}

export abstract class AiProvider {
  abstract generate(input: AiGenerateInput): Promise<AiGenerateOutput>;
  /**
   * US-050/US-051 — Generate the next AI Coach reply given the conversation
   * history and the user's latest message. Mock implementation returns a
   * deterministic structured echo; production swaps in a Bedrock/OpenAI call.
   */
  abstract respondToCoachQuestion(
    history: CoachHistoryEntry[],
    content: string,
  ): Promise<AiGenerateOutput>;
  /**
   * US-110 — Generate the next AI Campaign chat reply. The mock detects
   * `/finalize` in the user content (case-insensitive) to mark the brief as
   * ready, which allows tests to deterministically trigger Campaign creation.
   */
  abstract respondToCampaignChat(
    history: CoachHistoryEntry[],
    input: CampaignChatInput,
  ): Promise<CampaignChatOutput>;
}

@Injectable()
export class MockAiProvider extends AiProvider {
  generate(input: AiGenerateInput): Promise<AiGenerateOutput> {
    return Promise.resolve({ text: `[mock-ai] ${input.prompt.slice(0, 80)}` });
  }

  respondToCoachQuestion(
    _history: CoachHistoryEntry[],
    content: string,
  ): Promise<AiGenerateOutput> {
    return Promise.resolve({ text: `Réponse mock à : ${content}` });
  }

  respondToCampaignChat(
    _history: CoachHistoryEntry[],
    input: CampaignChatInput,
  ): Promise<CampaignChatOutput> {
    if (input.selectedScopes && input.selectedScopes.length > 0) {
      return Promise.resolve({
        text: `Got it — drafting a brief for: ${input.selectedScopes.join(', ')}. What audience do you target?`,
        briefReady: false,
      });
    }
    const txt = (input.content ?? '').trim();
    if (/\/finalize/i.test(txt)) {
      return Promise.resolve({
        text: 'Brief is ready. I generated your draft campaign.',
        briefReady: true,
        campaignName: 'AI Campaign — auto-draft',
        briefJson: { audience: 'GenZ', platforms: ['INSTAGRAM'], format: 'REEL' },
      });
    }
    return Promise.resolve({
      text: `[mock-ai-campaign] ${txt.slice(0, 80)}`,
      briefReady: false,
    });
  }
}

@Global()
@Module({
  providers: [{ provide: AiProvider, useClass: MockAiProvider }],
  exports: [AiProvider],
})
export class AiModule {}
