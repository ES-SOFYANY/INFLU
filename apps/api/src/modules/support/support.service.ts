import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  CreateReportDto,
  FaqEntryDto,
  PaginatedReportsDto,
  SupportReportDto,
} from './dto';
import {
  SupportRepository,
  type SupportReportRecord,
} from './support.repository';

/**
 * US-080 / US-180 — Static FAQ entries (English MVP).
 * AC-080-02 mandates EXACTLY these 5 questions in this order.
 */
export const FAQS: readonly FaqEntryDto[] = Object.freeze([
  {
    id: 'what-is-influ',
    question: 'What is INFLU?',
    answer:
      'INFLU is an influencer marketing platform that connects creators with businesses to launch, manage and measure collaboration campaigns end-to-end.',
  },
  {
    id: 'how-influ-helps',
    question: 'How does INFLU help with influencer marketing?',
    answer:
      'INFLU centralizes creator discovery, briefs, deliverables, payments and reporting in one place, so brands can run campaigns faster and creators can focus on content.',
  },
  {
    id: 'real-time-tracking',
    question: 'Can I track campaign performance in real time?',
    answer:
      'Yes — every campaign exposes a live dashboard with reach, engagement and deliverable status updated as soon as creators publish.',
  },
  {
    id: 'multi-platform',
    question: 'Does INFLU support multiple social media platforms?',
    answer:
      'INFLU supports Instagram, TikTok, YouTube and X (Twitter). More platforms can be plugged via the integrations roadmap.',
  },
  {
    id: 'small-businesses',
    question: 'Is INFLU suitable for small businesses?',
    answer:
      'Absolutely — small businesses get the same discovery, AI-assisted brief generation and self-serve marketplace as larger advertisers, with no minimum spend.',
  },
]);

@Injectable()
export class SupportService {
  constructor(private readonly repo: SupportRepository) {}

  /**
   * US-080 / US-180 — `GET /support/faq`. Returns the static list (English MVP).
   * AC-080-02: must return exactly the 5 questions defined in `FAQS`.
   */
  getFaq(): FaqEntryDto[] {
    return FAQS.map((f) => ({ ...f }));
  }

  /**
   * US-080 / US-180 — `GET /support/reports`. Lists the current user's reports
   * (newest first). Empty state returns `{items: [], total: 0}` (AC-080-01 /
   * AC-180-02).
   */
  async listMyReports(userId: string): Promise<PaginatedReportsDto> {
    const records = await this.repo.listForUser(userId);
    const items = records
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map(toDto);
    return { items, total: items.length };
  }

  /**
   * US-081 / US-181 — `POST /support/reports`. Persists a new support report
   * with status `OPEN` and returns it (AC-081-02 / AC-181-02).
   */
  async submitReport(
    userId: string,
    body: CreateReportDto,
  ): Promise<SupportReportDto> {
    const now = new Date().toISOString();
    const record: SupportReportRecord = {
      id: randomUUID(),
      userId,
      issueType: body.issueType,
      title: body.title,
      description: body.description,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };
    await this.repo.putReport(record);
    return toDto(record);
  }
}

function toDto(r: SupportReportRecord): SupportReportDto {
  return {
    id: r.id,
    issueType: r.issueType,
    title: r.title,
    description: r.description,
    status: r.status,
    createdAt: r.createdAt,
  };
}
