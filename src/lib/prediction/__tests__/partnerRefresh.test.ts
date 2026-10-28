import { shouldRefreshLink, type SharedSnapshot } from '../../../../supabase/functions/_shared/partnerDigest';

const luteal: SharedSnapshot = { shared_phase: 'luteal', shared_tough_day: false, shared_message: 'A' };
const menstrual: SharedSnapshot = { shared_phase: 'menstrual', shared_tough_day: true, shared_message: 'B' };
const at = (iso: string) => new Date(iso).getTime();

describe('partner refresh job — shouldRefreshLink', () => {
  const base = { staleAfterHours: 20, todayISO: '2026-10-28' };

  it('refreshes a link that was never published', () => {
    expect(shouldRefreshLink({ ...base, sharedUpdatedAt: null, current: luteal, next: luteal, now: at('2026-10-28T06:00:00Z') })).toBe(true);
  });

  it('refreshes a link not updated for 20+ hours', () => {
    expect(
      shouldRefreshLink({ ...base, sharedUpdatedAt: '2026-10-27T05:00:00Z', current: luteal, next: luteal, now: at('2026-10-28T06:00:00Z') }),
    ).toBe(true);
  });

  it('fixes an old phase from yesterday even when it is under 20 hours old', () => {
    // She published last night (phase: luteal); her period started today and the app stayed in the background.
    expect(
      shouldRefreshLink({ ...base, sharedUpdatedAt: '2026-10-27T17:00:00Z', current: luteal, next: menstrual, now: at('2026-10-28T00:00:00Z') }),
    ).toBe(true);
  });

  it('leaves yesterday\'s status alone when nothing has changed', () => {
    expect(
      shouldRefreshLink({ ...base, sharedUpdatedAt: '2026-10-27T17:00:00Z', current: luteal, next: luteal, now: at('2026-10-28T00:00:00Z') }),
    ).toBe(false);
  });

  it('never overwrites something she published today', () => {
    // She edited her period dates on her phone this morning; the server's copy may lag.
    expect(
      shouldRefreshLink({ ...base, sharedUpdatedAt: '2026-10-28T03:00:00Z', current: menstrual, next: luteal, now: at('2026-10-28T06:00:00Z') }),
    ).toBe(false);
  });
});
