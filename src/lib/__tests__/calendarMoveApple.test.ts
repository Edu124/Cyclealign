const mockGetEvent = jest.fn();
const mockUpdate = jest.fn();
const mockGetCalendars = jest.fn();

jest.mock('expo-calendar', () => ({
  getEventAsync: (...a: unknown[]) => mockGetEvent(...a),
  updateEventAsync: (...a: unknown[]) => mockUpdate(...a),
  getCalendarsAsync: (...a: unknown[]) => mockGetCalendars(...a),
  EntityTypes: { EVENT: 'event' },
  Availability: { NOT_SUPPORTED: 'notSupported' },
}));
jest.mock('@/lib/googleCalendar', () => ({ refreshGoogleAccessToken: jest.fn() }));
jest.mock('@/lib/outlookCalendar', () => ({ refreshOutlookAccessToken: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { moveCalendarEvent } from '@/lib/calendarMove';

describe('moving an Apple Calendar event', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCalendars.mockResolvedValue([{ id: 'cal1', allowsModifications: true }]);
    mockGetEvent.mockResolvedValue({
      id: 'E1',
      calendarId: 'cal1',
      title: 'Pitch',
      notes: 'Bring the deck',
      location: 'Office',
      alarms: [{ relativeOffset: -15 }],
      allDay: false,
      availability: 'busy',
      timeZone: 'Asia/Kolkata',
      startDate: '2026-10-14T05:30:00.000Z',
      endDate: '2026-10-14T06:30:00.000Z',
      organizer: { isCurrentUser: true },
    });
    mockUpdate.mockResolvedValue('E1');
  });

  it('sends the event\'s own details back with the new dates, so nothing is blanked', async () => {
    const res = await moveCalendarEvent(
      { id: 'ap-E1', title: 'Pitch', categoryId: 'HIGH_CONVO', dateISO: '2026-10-14', timeLabel: '11:00', isPrivate: false },
      '2026-10-24',
    );
    expect(res).toEqual({ ok: true });
    const [id, details] = mockUpdate.mock.calls[0];
    expect(id).toBe('E1');
    expect(details).toMatchObject({
      title: 'Pitch',
      notes: 'Bring the deck',
      location: 'Office',
      alarms: [{ relativeOffset: -15 }],
      allDay: false,
      availability: 'busy',
      timeZone: 'Asia/Kolkata',
    });
    expect((details.startDate as Date).getTime() - new Date('2026-10-14T05:30:00.000Z').getTime()).toBe(10 * 86_400_000);
  });

  it('does not move an event she was only invited to', async () => {
    mockGetEvent.mockResolvedValueOnce({
      id: 'E2', calendarId: 'cal1', title: 'Board meeting', startDate: '2026-10-14T05:30:00.000Z',
      endDate: '2026-10-14T06:30:00.000Z', organizer: { isCurrentUser: false },
    });
    const res = await moveCalendarEvent(
      { id: 'ap-E2', title: 'Board meeting', categoryId: 'HIGH_CONVO', dateISO: '2026-10-14', timeLabel: '11:00', isPrivate: false },
      '2026-10-24',
    );
    expect(res).toMatchObject({ ok: false, reason: 'not-organizer' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
