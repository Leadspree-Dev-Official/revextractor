import type { SavedCampaign, Tone } from './types';

export interface CampaignQualityMetrics {
  totalLeads: number;
  // 1. Email Verification
  verifiedCount: number;
  validFormatCount: number;
  riskyCount: number;
  invalidCount: number;
  unknownCount: number;
  deliverabilityPct: number;
  // 2. Phone Verification
  hasPhoneCount: number;
  phoneVerifiedCount: number;
  phoneReachabilityPct: number;
  // 3. DND Verification
  dndCheckedCount: number;
  nonDndCount: number;
  dndCount: number;
  dndCompliancePct: number;
  // General completeness & score
  hasEmailCount: number;
  hasDomainCount: number;
  completenessPct: number;
  readinessScore: number;
  issues: Array<{
    id: string;
    label: string;
    detail: string;
    count: number;
    tone: Tone;
    action: 'enrich' | 'verify';
  }>;
}

export function computeCampaignQuality(campaign?: SavedCampaign | null): CampaignQualityMetrics {
  if (!campaign || campaign.leads.length === 0) {
    return {
      totalLeads: 0,
      verifiedCount: 0,
      validFormatCount: 0,
      riskyCount: 0,
      invalidCount: 0,
      unknownCount: 0,
      deliverabilityPct: 0,
      hasPhoneCount: 0,
      phoneVerifiedCount: 0,
      phoneReachabilityPct: 0,
      dndCheckedCount: 0,
      nonDndCount: 0,
      dndCount: 0,
      dndCompliancePct: 0,
      hasEmailCount: 0,
      hasDomainCount: 0,
      completenessPct: 0,
      readinessScore: 0,
      issues: [],
    };
  }

  const total = campaign.leads.length;
  // Email metrics
  const verifiedCount = campaign.leads.filter((l) => Boolean(l.verified)).length;
  const hasEmailCount = campaign.leads.filter((l) => Boolean(l.email)).length;
  const validFormatCount = Math.max(0, hasEmailCount - verifiedCount);
  const unknownCount = Math.max(0, total - hasEmailCount);
  const riskyCount = Math.round(validFormatCount * 0.2);
  const invalidCount = Math.round(unknownCount * 0.1);
  const deliverabilityPct = Math.min(100, Math.round((verifiedCount / total) * 100));

  // Phone metrics
  const hasPhoneCount = campaign.leads.filter((l) => Boolean(l.phone)).length;
  const phoneVerifiedCount = campaign.leads.filter((l) => Boolean(l.phoneVerified)).length;
  const phoneReachabilityPct = Math.min(100, Math.round((hasPhoneCount / total) * 100));

  // DND metrics
  const nonDndCount = campaign.leads.filter((l) => l.dndStatus === 'Non-DND').length;
  const dndCount = campaign.leads.filter((l) => l.dndStatus === 'DND').length;
  const dndCheckedCount = nonDndCount + dndCount;
  const dndCompliancePct = dndCheckedCount > 0 ? Math.round((nonDndCount / dndCheckedCount) * 100) : 0;

  const hasDomainCount = campaign.leads.filter((l) => Boolean(l.domain)).length;
  const completenessPct = Math.min(
    100,
    Math.round(((hasEmailCount + hasPhoneCount + hasDomainCount) / (total * 3)) * 100),
  );
  const readinessScore = Math.min(
    100,
    Math.round(deliverabilityPct * 0.4 + phoneReachabilityPct * 0.3 + (dndCompliancePct || 50) * 0.1 + completenessPct * 0.2),
  );

  const issues: CampaignQualityMetrics['issues'] = [];

  const unverified = total - verifiedCount;
  if (unverified > 0) {
    issues.push({
      id: 'unverified-emails',
      label: 'Unverified email addresses',
      detail: `${unverified} of ${total} leads lack verified mailbox confirmation. High risk of bounce.`,
      count: unverified,
      tone: 'warn',
      action: 'verify',
    });
  }

  const missingPhone = total - hasPhoneCount;
  if (missingPhone > 0) {
    issues.push({
      id: 'missing-phones',
      label: 'Missing direct phone numbers',
      detail: `${missingPhone} leads cannot be reached by voice or WhatsApp.`,
      count: missingPhone,
      tone: 'bad',
      action: 'enrich',
    });
  }

  const missingDomain = total - hasDomainCount;
  if (missingDomain > 0) {
    issues.push({
      id: 'missing-domains',
      label: 'Missing company websites',
      detail: `${missingDomain} records have no company domain to infer firmographics.`,
      count: missingDomain,
      tone: 'info',
      action: 'enrich',
    });
  }

  return {
    totalLeads: total,
    verifiedCount,
    validFormatCount,
    riskyCount,
    invalidCount,
    unknownCount,
    deliverabilityPct,
    hasPhoneCount,
    phoneVerifiedCount,
    phoneReachabilityPct,
    dndCheckedCount,
    nonDndCount,
    dndCount,
    dndCompliancePct,
    hasEmailCount,
    hasDomainCount,
    completenessPct,
    readinessScore,
    issues,
  };
}
