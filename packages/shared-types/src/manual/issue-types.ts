export const ISSUE_TYPES = [
  'BUG',
  'FEATURE_REQUEST',
  'PERFORMANCE',
  'UI_ISSUE',
  'CAMPAIGN_ISSUE',
  'OTHER',
] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export const SUPPORT_REPORT_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const;
export type SupportReportStatus = (typeof SUPPORT_REPORT_STATUSES)[number];
