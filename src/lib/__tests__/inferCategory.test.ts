import { inferCategory } from '@/lib/googleCalendar';

describe('inferCategory', () => {
  it('matches whole words only, not letters inside names', () => {
    expect(inferCategory('Meeting with Shreya')).toBe('MEETING');
    expect(inferCategory('Shraddha meeting')).toBe('MEETING');
    expect(inferCategory('Three-way meeting')).toBe('MEETING');
    expect(inferCategory('Meeting with Christina')).toBe('MEETING');
    expect(inferCategory('Retrograde talk')).toBe('MEETING');
  });

  it('still recognises real keywords, including plurals and punctuation', () => {
    expect(inferCategory('HR review')).toBe('ADMIN');
    expect(inferCategory('Email follow-up')).toBe('ADMIN');
    expect(inferCategory('Investor pitch')).toBe('HIGH_CONVO');
    expect(inferCategory('Pitches')).toBe('HIGH_CONVO');
    expect(inferCategory('Board meeting')).toBe('HIGH_CONVO');
    expect(inferCategory('Client meeting')).toBe('HIGH_CONVO');
    expect(inferCategory('Sprint planning')).toBe('DECISION');
    expect(inferCategory('1:1 with Shruti')).toBe('MEETING');
    expect(inferCategory('Daily stand-up')).toBe('MEETING');
    expect(inferCategory('Doctor appointment')).toBe('PERSONAL');
  });

  it('treats anything unrecognised as a meeting', () => {
    expect(inferCategory('Meeting')).toBe('MEETING');
    expect(inferCategory('Lunch with Aurang')).toBe('MEETING');
  });
});
