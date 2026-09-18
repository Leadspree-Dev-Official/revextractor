import { Mail, Phone } from 'lucide-react';
import { Pill, cx } from '@/components/ui';

export function EmailAvailability({
  available,
  compact = false,
  className,
}: {
  available: boolean;
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return available ? (
      <Pill tone="good" icon={Mail} className={className}>
        Email available
      </Pill>
    ) : (
      <Pill tone="mute" icon={Mail} className={className}>
        No email
      </Pill>
    );
  }

  return available ? (
    <span
      className={cx(
        'inline-flex items-center gap-1 text-[11px] font-medium text-good-fg select-none',
        className,
      )}
      title="Verified corporate or personal email available to unlock in campaign"
    >
      <Mail size={12} className="shrink-0 text-good-fg" />
      <span>Email available</span>
    </span>
  ) : (
    <span
      className={cx('inline-flex items-center gap-1 text-[11px] text-muted-2 select-none', className)}
      title="No email found on record"
    >
      <Mail size={12} className="shrink-0 opacity-40" />
      <span>Email not available</span>
    </span>
  );
}

export function PhoneAvailability({
  available,
  compact = false,
  className,
}: {
  available: boolean;
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return available ? (
      <Pill tone="good" icon={Phone} className={className}>
        Phone available
      </Pill>
    ) : (
      <Pill tone="mute" icon={Phone} className={className}>
        No phone
      </Pill>
    );
  }

  return available ? (
    <span
      className={cx(
        'inline-flex items-center gap-1 text-[11px] font-medium text-good-fg select-none',
        className,
      )}
      title="Direct or corporate phone number available to unlock in campaign"
    >
      <Phone size={11} className="shrink-0 text-good-fg" />
      <span>Phone available</span>
    </span>
  ) : (
    <span
      className={cx('inline-flex items-center gap-1 text-[11px] text-muted-2 select-none', className)}
      title="No phone found on record"
    >
      <Phone size={11} className="shrink-0 opacity-40" />
      <span>Phone not available</span>
    </span>
  );
}

/**
 * Masks an email for discovery preview (e.g. "a•••••@domain.com")
 */
export function maskEmail(email?: string): string {
  if (!email) return 'Not available';
  const parts = email.split('@');
  if (parts.length !== 2) return 'Available';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name[0]}${'•'.repeat(Math.min(name.length - 2, 5))}${name[name.length - 1]}` : `${name[0]}•••`;
  return `${maskedName}@${domain}`;
}

/**
 * Masks a phone number for discovery preview (e.g. "+91 98301 •••••")
 */
export function maskPhone(phone?: string): string {
  if (!phone) return 'Not available';
  const cleaned = phone.trim();
  if (cleaned.length <= 6) return '••••••';
  const visiblePrefix = cleaned.slice(0, Math.min(cleaned.length - 5, 8));
  return `${visiblePrefix} •••••`;
}
