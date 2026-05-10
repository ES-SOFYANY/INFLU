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
}

@Global()
@Module({
  providers: [{ provide: AiProvider, useClass: MockAiProvider }],
  exports: [AiProvider],
})
export class AiModule {}
