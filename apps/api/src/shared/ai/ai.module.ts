import { Global, Injectable, Module } from '@nestjs/common';

export interface AiGenerateInput {
  prompt: string;
  systemPrompt?: string;
  locale?: string;
}

export interface AiGenerateOutput {
  text: string;
}

export abstract class AiProvider {
  abstract generate(input: AiGenerateInput): Promise<AiGenerateOutput>;
}

@Injectable()
export class MockAiProvider extends AiProvider {
  async generate(input: AiGenerateInput): Promise<AiGenerateOutput> {
    return Promise.resolve({ text: `[mock-ai] ${input.prompt.slice(0, 80)}` });
  }
}

@Global()
@Module({
  providers: [{ provide: AiProvider, useClass: MockAiProvider }],
  exports: [AiProvider],
})
export class AiModule {}
