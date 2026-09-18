import type { Tone } from './types';

/** Consumer demographics. Mirrors supabase/09_people.sql. */

export type LifeStage =
  | 'infant' | 'school_primary' | 'school_middle' | 'school_secondary' | 'school_senior'
  | 'undergraduate' | 'postgraduate' | 'job_seeking' | 'employed' | 'self_employed'
  | 'homemaker' | 'retired' | 'unknown';

export type AgeBand = '0-5' | '6-12' | '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' | 'unknown';
export type CityTier = 'metro' | 'tier-1' | 'tier-2' | 'tier-3' | 'rural' | 'unknown';
export type IncomeBand = 'under-3L' | '3-6L' | '6-12L' | '12-25L' | '25-50L' | '50L+' | 'unknown';
export type Employment =
  | 'salaried' | 'self_employed' | 'business_owner' | 'freelance' | 'contract'
  | 'student' | 'homemaker' | 'unemployed' | 'retired' | 'unknown';
export type Gender = 'female' | 'male' | 'other' | 'undisclosed';

export const STAGE_LABELS: Record<LifeStage, string> = {
  infant: 'Pre-school',
  school_primary: 'School · classes 1–5',
  school_middle: 'School · classes 6–8',
  school_secondary: 'School · classes 9–10',
  school_senior: 'School · classes 11–12',
  undergraduate: 'Undergraduate',
  postgraduate: 'Postgraduate',
  job_seeking: 'Looking for work',
  employed: 'Employed',
  self_employed: 'Self-employed',
  homemaker: 'Homemaker',
  retired: 'Retired',
  unknown: 'Unknown',
};

/** Stages that mean a minor. These are never targetable. */
export const MINOR_STAGES: LifeStage[] = [
  'infant', 'school_primary', 'school_middle', 'school_secondary',
];
export const MINOR_AGES: AgeBand[] = ['0-5', '6-12', '13-17'];

export const AGE_BANDS: AgeBand[] = ['0-5', '6-12', '13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
export const TIERS: CityTier[] = ['metro', 'tier-1', 'tier-2', 'tier-3', 'rural'];
export const INCOMES: IncomeBand[] = ['under-3L', '3-6L', '6-12L', '12-25L', '25-50L', '50L+'];
export const EMPLOYMENT: Employment[] = [
  'salaried', 'self_employed', 'business_owner', 'freelance', 'student', 'homemaker', 'unemployed', 'retired',
];
export const GENDERS: Gender[] = ['female', 'male', 'other', 'undisclosed'];

export const INTERESTS = [
  'Home loan', 'Car insurance', 'Health cover', 'Mutual funds', 'Travel',
  'Child education', 'Real estate', 'Two-wheeler', 'Gold', 'Term insurance',
  'Credit card', 'Personal loan', 'Fitness', 'Consumer durables',
];

export const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad',
  'Pune', 'Ahmedabad', 'Jaipur', 'Kochi', 'Chandigarh', 'Bhubaneswar',
];

export type FieldClass = 'observed' | 'inferred' | 'enriched' | 'verified';

export const classTone: Record<FieldClass, Tone> = {
  observed: 'mute', inferred: 'warn', enriched: 'ai', verified: 'good',
};

/**
 * A child in a household. Note what is absent: no email, no phone, no address.
 * A dependant is described, never contacted — mirrors dependants in 11_households.sql.
 */
export interface Dependant {
  id: number;
  firstName?: string;
  relationship: 'child' | 'ward' | 'stepchild' | 'grandchild';
  birthYear: number;
  gender: Gender;
  stage: LifeStage;
  classYear?: number;
  stageClass: 'observed' | 'inferred';
  consentMethod: ConsentMethod;
  consentAt?: string;
}

export type ConsentMethod =
  | 'self_declared' | 'otp_verified' | 'payment_instrument' | 'government_id'
  | 'in_person' | 'unknown';

export const CONSENT_STRENGTH: Record<ConsentMethod, { label: string; strong: boolean }> = {
  government_id:      { label: 'Government ID', strong: true },
  payment_instrument: { label: 'Payment method', strong: true },
  otp_verified:       { label: 'OTP verified', strong: true },
  in_person:          { label: 'In person', strong: true },
  self_declared:      { label: 'Ticked a box', strong: false },
  unknown:            { label: 'Not recorded', strong: false },
};

export const dependantAge = (birthYear: number) => new Date().getFullYear() - birthYear;

/**
 * Identity on file. Never a number — a hash for matching, four characters for a
 * human, and for Aadhaar only the reference a licensed verifier returned.
 */
export const demoIdentities: Record<string, Array<{
  kind: 'pan' | 'aadhaar_ref' | 'gstin';
  last4: string;
  state: 'unverified' | 'pending' | 'verified' | 'failed';
  provider?: string;
  purpose: string;
}>> = {
  'Aarti Deshmukh': [
    { kind: 'pan', last4: '7291', state: 'verified', purpose: 'Home loan application' },
    { kind: 'aadhaar_ref', last4: '4402', state: 'verified', provider: 'Offline KYC', purpose: 'Loan KYC' },
  ],
  'Sneha Bhatt': [
    { kind: 'pan', last4: '1180', state: 'verified', purpose: 'Business account opening' },
    { kind: 'gstin', last4: '1ZM4', state: 'verified', purpose: 'Supplier onboarding' },
  ],
  'Sanjay Sharma': [
    { kind: 'pan', last4: '9930', state: 'pending', purpose: 'Child education plan' },
  ],
};

export interface PersonProfile {
  id: number;
  name: string;
  gender: Gender;
  ageBand: AgeBand;
  stage: LifeStage;
  stageSince: string;
  stageClass: FieldClass;
  stageConfidence?: number;
  classYear?: number;
  employment: Employment;
  occupation?: string;
  income: IncomeBand;
  city: string;
  tier: CityTier;
  interests: string[];
  isMinor: boolean;
  guardianConsent: boolean;
  /** children in this household — the reason a parent is reachable for them */
  dependants?: Dependant[];
}

export const demoProfiles: PersonProfile[] = [
  ['Aarti Deshmukh', 'female', '35-44', 'employed', 'Mar 2022', 'observed', undefined, undefined, 'salaried', 'Operations Manager', '12-25L', 'Pune', 'tier-1', ['Home loan', 'Child education'], false, false],
  ['Rohan Pillai', 'male', '25-34', 'employed', 'Jul 2024', 'observed', undefined, undefined, 'salaried', 'Software Engineer', '12-25L', 'Kochi', 'tier-2', ['Car insurance', 'Mutual funds'], false, false],
  ['Sneha Bhatt', 'female', '45-54', 'self_employed', 'Jan 2019', 'observed', undefined, undefined, 'business_owner', 'Boutique owner', '25-50L', 'Ahmedabad', 'tier-1', ['Child education', 'Gold'], false, false],
  ['Imran Sheikh', 'male', '25-34', 'job_seeking', 'Jun 2026', 'observed', undefined, undefined, 'unemployed', undefined, '3-6L', 'Hyderabad', 'metro', ['Personal loan', 'Credit card'], false, false],
  ['Divya Menon', 'female', '18-24', 'undergraduate', 'Aug 2023', 'inferred', 74, 3, 'student', undefined, 'under-3L', 'Thrissur', 'tier-3', ['Travel', 'Fitness'], false, false],
  ['Karan Malhotra', 'male', '35-44', 'employed', 'Apr 2021', 'observed', undefined, undefined, 'salaried', 'Regional Sales Head', '25-50L', 'Gurugram', 'metro', ['Health cover', 'Real estate'], false, false],
  ['Lakshmi Iyer', 'female', '55-64', 'retired', 'Sep 2024', 'observed', undefined, undefined, 'retired', undefined, '6-12L', 'Chennai', 'metro', ['Term insurance', 'Gold'], false, false],
  ['Vikas Yadav', 'male', '18-24', 'undergraduate', 'Jul 2024', 'inferred', 81, 2, 'student', undefined, 'under-3L', 'Jaipur', 'tier-2', ['Two-wheeler', 'Fitness'], false, false],
  ['Meera Nambiar', 'female', '45-54', 'homemaker', 'Feb 2018', 'observed', undefined, undefined, 'homemaker', undefined, '6-12L', 'Kochi', 'tier-2', ['Child education', 'Mutual funds'], false, false],
  ['Sanjay Sharma', 'male', '45-54', 'employed', 'Jan 2016', 'observed', undefined, undefined, 'salaried', 'Bank Manager', '12-25L', 'Delhi', 'metro', ['Child education', 'Term insurance'], false, false],
  ['Ritu Roy', 'female', '35-44', 'employed', 'Sep 2020', 'observed', undefined, undefined, 'salaried', 'Consultant', '25-50L', 'Kolkata', 'metro', ['Child education', 'Real estate'], false, false],
].map(([name, gender, ageBand, stage, stageSince, stageClass, stageConfidence, classYear, employment, occupation, income, city, tier, interests, isMinor, guardianConsent], i) => ({
  id: i + 1,
  name, gender, ageBand, stage, stageSince, stageClass, stageConfidence, classYear,
  employment, occupation, income, city, tier, interests, isMinor, guardianConsent,
} as PersonProfile));

/**
 * Households. A child is an attribute of the parent, and the parent is who a
 * business actually contacts — which is what makes this lawful where targeting
 * the child directly is not.
 */
const HOUSEHOLDS: Record<string, Dependant[]> = {
  'Sanjay Sharma': [
    { id: 1, firstName: 'Arnav', relationship: 'child', birthYear: 2011, gender: 'male',
      stage: 'school_secondary', classYear: 10, stageClass: 'observed',
      consentMethod: 'otp_verified', consentAt: 'Jun 2025' },
    { id: 2, firstName: 'Ira', relationship: 'child', birthYear: 2017, gender: 'female',
      stage: 'school_primary', classYear: 3, stageClass: 'observed',
      consentMethod: 'otp_verified', consentAt: 'Jun 2025' },
  ],
  'Ritu Roy': [
    { id: 3, firstName: 'Tanya', relationship: 'child', birthYear: 2009, gender: 'female',
      stage: 'school_senior', classYear: 11, stageClass: 'inferred',
      consentMethod: 'self_declared', consentAt: 'Jun 2024' },
  ],
  'Aarti Deshmukh': [
    { id: 4, firstName: 'Vivaan', relationship: 'child', birthYear: 2013, gender: 'male',
      stage: 'school_middle', classYear: 8, stageClass: 'observed',
      consentMethod: 'payment_instrument', consentAt: 'Mar 2024' },
  ],
  'Sneha Bhatt': [
    { id: 5, firstName: 'Aanya', relationship: 'child', birthYear: 2008, gender: 'female',
      stage: 'school_senior', classYear: 12, stageClass: 'observed',
      consentMethod: 'otp_verified', consentAt: 'Apr 2025' },
  ],
  'Meera Nambiar': [
    { id: 6, firstName: 'Rohit', relationship: 'child', birthYear: 2007, gender: 'male',
      stage: 'undergraduate', classYear: undefined, stageClass: 'inferred',
      consentMethod: 'self_declared', consentAt: 'Jul 2023' },
  ],
};

demoProfiles.forEach((p) => { p.dependants = HOUSEHOLDS[p.name]; });

/** A dependant who has reached 18 must be graduated, not targeted through. */
export const isDependantMinor = (d: Dependant) => dependantAge(d.birthYear) < 18;

/** Guardians reachable for a child matching these filters. */
export function householdMatches(
  profiles: PersonProfile[],
  filters: { stages?: LifeStage[]; classes?: number[]; ageMin?: number; ageMax?: number },
): PersonProfile[] {
  const any = filters.stages?.length || filters.classes?.length
    || filters.ageMin != null || filters.ageMax != null;
  if (!any) return [];

  return profiles.filter((p) => {
    if (p.isMinor) return false;                 // a guardian must be an adult
    return (p.dependants ?? []).some((d) => {
      if (!isDependantMinor(d)) return false;    // over 18: graduated, not a filter
      if (filters.stages?.length && !filters.stages.includes(d.stage)) return false;
      if (filters.classes?.length && (d.classYear == null || !filters.classes.includes(d.classYear))) return false;
      const age = dependantAge(d.birthYear);
      if (filters.ageMin != null && age < filters.ageMin) return false;
      if (filters.ageMax != null && age > filters.ageMax) return false;
      return true;
    });
  });
}

/** Dependants who have turned 18 and now need their own consent. */
export function graduatingDependants(profiles: PersonProfile[]) {
  return profiles.flatMap((p) =>
    (p.dependants ?? [])
      .filter((d) => !isDependantMinor(d))
      .map((d) => ({ guardian: p.name, dependant: d, age: dependantAge(d.birthYear) })));
}

/**
 * Mirrors project_stage() in 09_people.sql — a school year is arithmetic, so it
 * runs the same way here and there.
 */
export function projectStage(stage: LifeStage, yearsAhead: number, classYear?: number): {
  stage: LifeStage; confidence: number; note: string;
} {
  if (classYear && stage.startsWith('school')) {
    const target = classYear + Math.floor(yearsAhead);
    const next: LifeStage =
      target <= 5 ? 'school_primary'
      : target <= 8 ? 'school_middle'
      : target <= 10 ? 'school_secondary'
      : target <= 12 ? 'school_senior'
      : 'undergraduate';
    return {
      stage: next,
      confidence: Math.max(45, 92 - Math.floor(yearsAhead) * 6),
      note: target <= 12
        ? `Would be in class ${target}`
        : `Would have finished school — likely in a degree`,
    };
  }

  const ladder: Partial<Record<LifeStage, [LifeStage, number, number]>> = {
    infant: ['school_primary', 3, 85],
    school_primary: ['school_middle', 5, 92],
    school_middle: ['school_secondary', 3, 92],
    school_secondary: ['school_senior', 2, 90],
    school_senior: ['undergraduate', 2, 78],
    undergraduate: ['job_seeking', 3, 65],
    postgraduate: ['job_seeking', 2, 70],
    job_seeking: ['employed', 0.6, 55],
  };

  let current = stage;
  let remaining = yearsAhead;
  let confidence = 100;
  let hops = 0;

  while (hops < 4) {
    const step = ladder[current];
    if (!step || remaining < step[1]) break;
    remaining -= step[1];
    current = step[0];
    confidence = Math.max(30, Math.round((confidence * step[2]) / 100));
    hops += 1;
  }

  return {
    stage: current,
    confidence: hops === 0 ? 95 : confidence,
    note: hops === 0 ? 'No transition due yet' : `${hops} step${hops > 1 ? 's' : ''} along the ladder`,
  };
}
