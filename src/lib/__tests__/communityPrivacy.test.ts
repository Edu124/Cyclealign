import { phaseToShare } from '../communityPrivacy';

const mockInsert = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase', () => {
  const chain: any = {};
  chain.insert = (row: unknown) => {
    mockInsert(row);
    return chain;
  };
  chain.select = () => chain;
  chain.single = () => mockSingle();
  chain.eq = () => chain;
  return {
    isSupabaseConfigured: true,
    supabase: {
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
      from: () => chain,
    },
  };
});

import { createPost } from '../community';

beforeEach(() => {
  mockInsert.mockClear();
  mockSingle.mockReset();
  mockSingle.mockResolvedValue({
    data: { id: 'p1', user_id: 'u1', topic_id: null, content: 'hi', is_anonymous: true, phase_key: null, created_at: new Date().toISOString() },
  });
});

describe('what a Community post may carry', () => {
  test('a post never includes her phase or cycle day unless she opted in', async () => {
    await createPost({ content: 'hi', isAnonymous: true });
    const row = mockInsert.mock.calls[0][0];
    expect(row.phase_key).toBeNull();
    expect(row.cycle_day).toBeNull();
  });

  test('even when she opts in, the day of her cycle is never sent', async () => {
    await createPost({ content: 'hi', isAnonymous: false, phaseKey: 'luteal' });
    const row = mockInsert.mock.calls[0][0];
    expect(row.phase_key).toBe('luteal');
    expect(row.cycle_day).toBeNull();
  });

  test('the returned post never exposes a cycle day', async () => {
    const post = await createPost({ content: 'hi', isAnonymous: true });
    expect(post?.cycleDay).toBeNull();
  });
});

describe('phaseToShare', () => {
  test('nothing is shared by default', () => {
    expect(phaseToShare({ optedIn: false, mode: 'regular', phase: 'luteal' })).toBeNull();
  });

  test('a regular user can choose to share her phase', () => {
    expect(phaseToShare({ optedIn: true, mode: 'regular', phase: 'luteal' })).toBe('luteal');
  });

  test('irregular and perimenopause users never share a phase, even if the toggle were somehow on', () => {
    expect(phaseToShare({ optedIn: true, mode: 'pcos_irregular', phase: 'luteal' })).toBeNull();
    expect(phaseToShare({ optedIn: true, mode: 'perimenopause', phase: 'follicular' })).toBeNull();
  });

  test('no known phase means nothing to share, rather than a guess', () => {
    expect(phaseToShare({ optedIn: true, mode: 'regular', phase: null })).toBeNull();
    expect(phaseToShare({ optedIn: true, mode: 'regular', phase: undefined })).toBeNull();
  });
});
