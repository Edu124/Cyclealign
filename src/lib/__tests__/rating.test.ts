jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { RATING_RULES, ratingBlockReason, storeName, storeReviewUrls, type RatingContext, type RatingState } from '../rating';

const DAY = 86_400_000;
const NOW = new Date(2026, 10, 11, 12, 0).getTime();

const engaged: RatingState = {
  firstSeenAt: NOW - 10 * DAY,
  activeDays: ['2026-11-02', '2026-11-04', '2026-11-08', '2026-11-11'],
  shownCount: 0,
  lastShownAt: null,
  rated: false,
  optedOut: false,
};
const ctx: RatingContext = {
  now: NOW,
  platform: 'ios',
  enabled: true,
  signedInAndOnboarded: true,
  checkIns: 5,
  otherPromptRecently: false,
  quietHours: false,
};

describe('rating prompt eligibility', () => {
  it('asks an engaged user on iOS and Android', () => {
    expect(ratingBlockReason(engaged, ctx)).toBeNull();
    expect(ratingBlockReason(engaged, { ...ctx, platform: 'android' })).toBeNull();
  });

  it('never asks new users, during onboarding, or on the web', () => {
    expect(ratingBlockReason({ ...engaged, firstSeenAt: NOW - DAY }, ctx)).toBe('too_new');
    expect(ratingBlockReason({ ...engaged, activeDays: ['2026-11-11'] }, ctx)).toBe('not_enough_active_days');
    expect(ratingBlockReason(engaged, { ...ctx, checkIns: 1 })).toBe('not_enough_check_ins');
    expect(ratingBlockReason(engaged, { ...ctx, signedInAndOnboarded: false })).toBe('not_onboarded');
    expect(ratingBlockReason(engaged, { ...ctx, platform: 'web' })).toBe('no_store_on_platform');
  });

  it('stops for good after Rate or "Don\'t ask again", and after the max number of asks', () => {
    expect(ratingBlockReason({ ...engaged, rated: true }, ctx)).toBe('already_rated');
    expect(ratingBlockReason({ ...engaged, optedOut: true }, ctx)).toBe('opted_out');
    expect(ratingBlockReason({ ...engaged, shownCount: RATING_RULES.maxAsks }, ctx)).toBe('max_asks');
  });

  it('waits after "Maybe later"', () => {
    expect(ratingBlockReason({ ...engaged, shownCount: 1, lastShownAt: NOW - 3 * DAY }, ctx)).toBe('asked_recently');
    expect(ratingBlockReason({ ...engaged, shownCount: 1, lastShownAt: NOW - 31 * DAY }, ctx)).toBeNull();
  });

  it('never stacks on another pop-up, during quiet hours, or when switched off', () => {
    expect(ratingBlockReason(engaged, { ...ctx, otherPromptRecently: true })).toBe('other_prompt');
    expect(ratingBlockReason(engaged, { ...ctx, quietHours: true })).toBe('quiet_hours');
    expect(ratingBlockReason(engaged, { ...ctx, enabled: false })).toBe('switched_off');
  });

  it('links to the right store', () => {
    expect(storeName('ios')).toBe('the App Store');
    expect(storeName('android')).toBe('Google Play');
    expect(storeReviewUrls('ios')[0]).toContain('id6788590698?action=write-review');
    expect(storeReviewUrls('android')[1]).toBe('https://play.google.com/store/apps/details?id=com.cyclealign.app');
  });
});
