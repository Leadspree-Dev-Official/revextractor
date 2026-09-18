import { useState } from 'react';
import { useApp } from '@/lib/store';
import { pool } from '@/lib/pool';
import { Button, Input, Modal, Pill } from '@/components/ui';

/** Fields a customer may propose a change to — mirrors editable_pool_field(). */
const FIELDS: Array<[string, string]> = [
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['company_name', 'Company name'],
  ['first_name', 'Name'],
  ['job_title', 'Job title'],
  ['domain', 'Website'],
  ['industry', 'Industry'],
  ['city', 'City'],
  ['state', 'State'],
];

/**
 * Anything a customer can propose a correction to, whichever screen it came
 * from. Keyed by the pool lead id, because that is what request_data_change()
 * takes — a registry filing is not correctable, the contact copied out of it is.
 */
export interface Correctable {
  /** platform_leads.id */
  id: number;
  label: string;
  /** Current values, keyed by the field names above. */
  values: Record<string, string>;
}

/**
 * A correction is a request, not an edit. It goes to LeadBro for review, and
 * only an approval changes the shared record — at which point its updated date
 * moves to that day.
 *
 * Two ways to file one, because they are genuinely different reports: "this is
 * wrong and here is the right value", and "this is wrong and I don't know the
 * right value". The second is still worth having — a dead number that nobody
 * can replace should still stop being handed to the next customer.
 */
export function SuggestChange({ lead, onClose }: { lead: Correctable; onClose(): void }) {
  const { flash, activeCampaign } = useApp();
  const [field, setField] = useState('phone');
  const [mode, setMode] = useState<'correct' | 'wrong'>('correct');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const current = lead.values[field] ?? '';
  const blocked = mode === 'correct'
    ? !value.trim() || value.trim() === current
    : reason.trim().length < 3;

  const submit = async () => {
    setBusy(true);
    const { error } = await pool.requestChange(
      activeCampaign?.id ?? 'default-campaign',
      lead.id,
      field,
      mode === 'correct' ? value.trim() : '',
      reason.trim(),
    );
    setBusy(false);
    onClose();
    flash(error
      ? `Could not send — ${error}`
      : 'Sent for review — you’ll see it applied once it’s approved');
  };

  return (
    <Modal
      onClose={onClose}
      title="Report or correct"
      width={460}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button kind="primary" disabled={blocked || busy} onClick={submit}>
            {busy ? 'Sending…' : 'Send for review'}
          </Button>
        </>
      }
    >
      <p className="text-xs text-ink-3 leading-relaxed mb-3.5">
        Corrections are reviewed before anything changes. Your own copy of{' '}
        <span className="font-medium text-ink">{lead.label}</span> is unaffected either way — edit
        that directly in Leads.
      </p>

      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="sc-field" className="cap block mb-1">What is wrong</label>
          <select
            id="sc-field"
            value={field}
            onChange={(e) => { setField(e.target.value); setValue(''); }}
            className="w-full h-[30px] px-2 rounded-md border border-line-strong bg-panel text-xs text-ink cursor-pointer focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          >
            {FIELDS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          {([['correct', 'I know the right value'], ['wrong', 'It’s wrong, I don’t know']] as const)
            .map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={mode === key}
                onClick={() => setMode(key)}
                className={mode === key
                  ? 'px-2 py-1 rounded-[5px] text-[11px] border border-primary bg-primary-soft text-primary-ink font-semibold cursor-pointer'
                  : 'px-2 py-1 rounded-[5px] text-[11px] border border-line-strong bg-panel text-ink-3 cursor-pointer hover:border-ghost'}
              >
                {label}
              </button>
            ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="cap block mb-1">Currently</span>
            <div className="h-[30px] px-2.5 flex items-center rounded-md border border-line-soft bg-subtle num text-[11px] text-muted truncate-1">
              {current || '—'}
            </div>
          </div>
          <div>
            <label htmlFor="sc-value" className="cap block mb-1">Should be</label>
            {mode === 'correct' ? (
              <Input
                id="sc-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Corrected value"
                className="w-full"
              />
            ) : (
              <div className="h-[30px] flex items-center">
                <Pill tone="warn">Flagged as unusable</Pill>
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="sc-reason" className="cap block mb-1">
            How do you know?{mode === 'wrong' ? '' : ' (optional)'}
          </label>
          <textarea
            id="sc-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={mode === 'wrong'
              ? 'e.g. called twice, number unobtainable'
              : 'A link or a sentence — it makes review much faster.'}
            className="w-full px-2.5 py-2 rounded-md border border-line-strong bg-panel text-xs text-ink resize-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>
      </div>
    </Modal>
  );
}
