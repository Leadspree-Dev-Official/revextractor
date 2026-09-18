import { Baby, IdCard, ShieldCheck, Users2 } from 'lucide-react';
import {
  CONSENT_STRENGTH, STAGE_LABELS, dependantAge, isDependantMinor, type PersonProfile,
} from '@/lib/people';
import { Panel, PanelTitle, Pill } from '@/components/ui';

/**
 * What a salesperson sees before they pick up the phone.
 *
 * Everything here describes the household so a conversation can be specific —
 * and nothing here is a way to contact a child. Dependants hold no contact
 * details at all.
 */

export interface IdentityRecord {
  kind: 'pan' | 'aadhaar_ref' | 'gstin';
  last4: string;
  state: 'unverified' | 'pending' | 'verified' | 'failed';
  provider?: string;
  purpose: string;
}

const IDENTITY_LABEL: Record<IdentityRecord['kind'], string> = {
  pan: 'PAN',
  aadhaar_ref: 'Aadhaar (verified offline)',
  gstin: 'GSTIN',
};

export function HouseholdCard({
  person, identities,
}: { person: PersonProfile; identities?: IdentityRecord[] }) {
  const dependants = person.dependants ?? [];
  const minors = dependants.filter(isDependantMinor);
  const grown = dependants.filter((d) => !isDependantMinor(d));

  if (dependants.length === 0 && !identities?.length) return null;

  return (
    <Panel>
      <PanelTitle action={<Pill tone="info" icon={Users2}>{dependants.length + 1} in household</Pill>}>
        Household
      </PanelTitle>

      {minors.length > 0 ? (
        <>
          <div className="cap mb-2">Children</div>
          {minors.map((d) => (
            <div key={d.id} className="flex items-center gap-2.5 py-2 border-b border-rule last:border-0">
              <span className="w-[22px] h-[22px] rounded-md bg-info-bg text-info-fg flex items-center justify-center shrink-0">
                <Baby size={11} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-ink truncate-1">
                  {d.firstName ?? 'Child'} · {dependantAge(d.birthYear)}
                </div>
                <div className="text-[10.5px] text-muted truncate-1">
                  {d.classYear ? `Class ${d.classYear}` : STAGE_LABELS[d.stage]}
                  {d.stageClass === 'inferred' ? ' · projected' : ''}
                </div>
              </div>
              <Pill tone={CONSENT_STRENGTH[d.consentMethod].strong ? 'good' : 'warn'}>
                {CONSENT_STRENGTH[d.consentMethod].label}
              </Pill>
            </div>
          ))}
          <p className="text-[10.5px] text-muted-2 mt-2 leading-relaxed">
            Context for the conversation, not contacts. A child record holds no email, phone or
            address — speak to {person.name.split(' ')[0]}.
          </p>
        </>
      ) : null}

      {grown.length > 0 ? (
        <div className="mt-3 pt-3 border-t border-rule">
          <div className="cap mb-2">Now adults</div>
          {grown.map((d) => (
            <div key={d.id} className="flex items-center gap-2.5 py-1.5">
              <span className="text-[12px] text-ink-3 flex-1 truncate-1">
                {d.firstName ?? 'Dependant'} · {dependantAge(d.birthYear)}
              </span>
              <Pill tone="mute">Needs own consent</Pill>
            </div>
          ))}
        </div>
      ) : null}

      {identities?.length ? (
        <div className="mt-3 pt-3 border-t border-rule">
          <div className="cap mb-2">Identity on file</div>
          {identities.map((i) => (
            <div key={i.kind} className="flex items-center gap-2.5 py-1.5">
              <span className="w-[22px] h-[22px] rounded-md bg-line-soft text-muted flex items-center justify-center shrink-0">
                <IdCard size={11} strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] text-ink truncate-1">
                  {IDENTITY_LABEL[i.kind]} <span className="num text-muted">••••{i.last4}</span>
                </div>
                <div className="text-[10.5px] text-muted-2 truncate-1">{i.purpose}</div>
              </div>
              <Pill tone={i.state === 'verified' ? 'good' : i.state === 'failed' ? 'bad' : 'warn'}>
                {i.state}
              </Pill>
            </div>
          ))}
          <p className="flex items-start gap-1.5 text-[10.5px] text-muted-2 mt-2 leading-relaxed">
            <ShieldCheck size={11} className="shrink-0 mt-px text-good-fg" />
            Stored as a hash plus the last four. Aadhaar is never held as a number — only the
            reference a licensed verifier returned.
          </p>
        </div>
      ) : null}
    </Panel>
  );
}
