export interface WorkItemVisual {
  emoji: string;
  image: string;
}

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=600&q=80&auto=format&fit=crop`;

/**
 * Photo + emoji per LEAN IN / GO EASY item from PHASE_STRATEGY
 * (src/lib/intelligence/framework.ts). Keyed by the exact strategy text —
 * if that copy ever changes, visualFor() falls back gracefully instead of
 * breaking, since framework.ts is the one source of truth for the wording.
 */
const WORK_ITEM_VISUALS: Record<string, WorkItemVisual> = {
  // Menstrual
  'Reviewing results & strategy': { emoji: '📊', image: img('1454165804606-c3d57bc86b40') },
  'Big-picture planning': { emoji: '🗺️', image: img('1531973576160-7125cd663d86') },
  'Analytical, solo deep work': { emoji: '🧠', image: img('1499750310107-5fef28a66643') },
  'Low-stakes admin': { emoji: '🗂️', image: img('1586281380349-632531db7ed4') },
  'High-visibility pitching': { emoji: '🎤', image: img('1552664730-d307ca884978') },
  'Hard negotiations': { emoji: '🤝', image: img('1573164713988-8665fc963095') },
  'Packed social schedules': { emoji: '👥', image: img('1517048676732-d65bc937f952') },

  // Follicular
  'Ideation & brainstorming': { emoji: '💡', image: img('1517245386807-bb43f82c33c4') },
  'Starting new projects': { emoji: '🚀', image: img('1553028826-f4804a6dafd3') },
  'Learning new skills': { emoji: '📚', image: img('1522202176988-66273c2fd55f') },
  'Outreach & first conversations': { emoji: '📞', image: img('1521791136064-7986c2920216') },
  'Tedious finishing work': { emoji: '📋', image: img('1586282391129-76a6df230234') },
  'Rigid, repetitive tasks': { emoji: '🔁', image: img('1586282391129-76a6df230234') },

  // Ovulation
  'Pitching & presenting': { emoji: '🎯', image: img('1552664730-d307ca884978') },
  'Negotiating': { emoji: '🤝', image: img('1573164713988-8665fc963095') },
  'Networking & interviews': { emoji: '🌐', image: img('1521737604893-d14cc237f11d') },
  'High-visibility meetings': { emoji: '👔', image: img('1517048676732-d65bc937f952') },
  'Heads-down solo deep work': { emoji: '🎧', image: img('1499750310107-5fef28a66643') },
  'Big decisions made in isolation': { emoji: '⚖️', image: img('1544027993-37dbfe43562a') },

  // Luteal
  'Finishing & shipping work': { emoji: '📦', image: img('1586528116311-ad8dd3c8310d') },
  'Editing & detail work': { emoji: '✂️', image: img('1517842645767-c639042777db') },
  'Organising & systems': { emoji: '🗃️', image: img('1524758631624-e2822e304c36') },
  'Setting boundaries': { emoji: '🛑', image: img('1506905925346-21bda4d32df4') },
  'Starting brand-new things': { emoji: '🌱', image: img('1553028826-f4804a6dafd3') },
  'Big social or visibility bets': { emoji: '🎪', image: img('1511578314322-379afb476865') },
};

const FALLBACK: WorkItemVisual = { emoji: '💼', image: img('1454165804606-c3d57bc86b40') };

export function visualFor(text: string): WorkItemVisual {
  return WORK_ITEM_VISUALS[text] ?? FALLBACK;
}
