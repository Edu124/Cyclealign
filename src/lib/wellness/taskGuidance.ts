import type { PhaseKey } from '@/types/models';

/**
 * Phase-aware PREPARE / PERFORM / RECOVER guidance (Developer Spec §3–4, §7).
 * Shown when a task can't be moved to its ideal window — converts the cycle
 * timing read into an actionable plan instead of just flagging the day.
 */

export interface TaskGuidance {
  prepare: string[];
  perform: string[];
  recover: string[];
}

/** Phase framework (§3) — the "CycleAlign approach" line on the result screen. */
export const PHASE_APPROACH: Record<PhaseKey, string> = {
  menstrual: 'Reflect & Reset',
  follicular: 'Create & Explore',
  ovulation: 'Connect & Communicate',
  luteal: 'Execute & Close',
};

export const TASK_GUIDANCE: Record<string, Record<PhaseKey, TaskGuidance>> = {
  HIGH_CONVO: {
    menstrual: {
      prepare: ['Prepare key points in writing; define the desired outcome.'],
      perform: ['Keep the conversation structured.', 'Avoid unnecessary topics.'],
      recover: ['Leave 10–15 minutes afterward before another demanding task.'],
    },
    follicular: {
      prepare: ['Draft talking points and explore multiple approaches.'],
      perform: ['Use the conversation to explore possibilities before committing.'],
      recover: ['Capture ideas and next steps while they are fresh.'],
    },
    ovulation: {
      prepare: ['Prepare the big-picture objective and desired alignment.'],
      perform: ['Prioritize connection, questions and clear communication.'],
      recover: ['Document agreements and relationship follow-ups.'],
    },
    luteal: {
      prepare: ['Prepare an agenda, boundaries and concrete examples.'],
      perform: ['Stay focused; pause before responding.', 'Avoid unnecessary improvisation.'],
      recover: ['Allow recovery time and capture action items immediately.'],
    },
  },
  DECISION: {
    menstrual: {
      prepare: ['Write the decision down and separate facts from feelings.'],
      perform: ['Define 2–3 options and use a decision framework.'],
      recover: ['For irreversible decisions, consider a review period when possible.'],
    },
    follicular: {
      prepare: ['Generate alternatives and challenge assumptions.'],
      perform: ['Explore possibilities and long-term options.'],
      recover: ['Record promising ideas for follow-up.'],
    },
    ovulation: {
      prepare: ['Identify stakeholders whose input matters.'],
      perform: ['Discuss, negotiate and test the decision through conversation.'],
      recover: ['Document alignment, objections and next steps.'],
    },
    luteal: {
      prepare: ['Reduce unnecessary options and define decision criteria.'],
      perform: ['Check details, risks and missing information.'],
      recover: ['Ask: "What information would actually change my decision?"'],
    },
  },
  DEEP_FOCUS: {
    menstrual: {
      prepare: ['Break work into smaller focus blocks and remove distractions.'],
      perform: ['Use an existing outline; prioritize editing/refining if useful.'],
      recover: ['Add recovery between demanding focus blocks.'],
    },
    follicular: {
      prepare: ['Create a distraction-free environment and capture ideas.'],
      perform: ['Prioritize brainstorming, writing, experimentation and new concepts.'],
      recover: ['Save unfinished ideas instead of forcing immediate perfection.'],
    },
    ovulation: {
      prepare: ['Prepare material for collaboration or review.'],
      perform: ['Use workshops, co-creation, presentations and collaborative creative work.'],
      recover: ['Capture decisions and delegate follow-ups.'],
    },
    luteal: {
      prepare: ['Choose a concrete deliverable and checklist.'],
      perform: ['Prioritize editing, proofreading, documentation and quality control.'],
      recover: ['Close incomplete work and record remaining items.'],
    },
  },
  MEETING: {
    menstrual: {
      prepare: ['Review the agenda and define 1–2 objectives.'],
      perform: ['Keep the meeting structured and use notes.'],
      recover: ['Leave a short buffer before the next demanding task.'],
    },
    follicular: {
      prepare: ['Use the meeting for brainstorming, strategy and new initiatives.'],
      perform: ['Explore ideas and opportunities.'],
      recover: ['Capture experiments and next steps.'],
    },
    ovulation: {
      prepare: ['Use the meeting for networking, client conversations, interviews or alignment.'],
      perform: ['Prioritize communication and relationship-building.'],
      recover: ['Send concise follow-ups and commitments.'],
    },
    luteal: {
      prepare: ['Prepare a clear agenda and desired outputs.'],
      perform: ['Prioritize status, review, tracking and execution.'],
      recover: ['Close action items and update project records.'],
    },
  },
  ADMIN: {
    menstrual: {
      prepare: ['Batch small tasks and use templates.'],
      perform: ['Use one focused admin block rather than constant switching.'],
      recover: ['Stop when the planned block is complete; avoid overload.'],
    },
    follicular: {
      prepare: ['Create templates, systems and automations.'],
      perform: ['Improve workflows and organize new processes.'],
      recover: ['Document the new system for future reuse.'],
    },
    ovulation: {
      prepare: ['Delegate or coordinate tasks requiring other people.'],
      perform: ['Follow up for approvals and information.'],
      recover: ['Record ownership and deadlines.'],
    },
    luteal: {
      prepare: ['Create a closure checklist.'],
      perform: ['Prioritize documentation, expenses, filing, compliance and outstanding tasks.'],
      recover: ['Close loops and leave a clean task list.'],
    },
  },
  PERSONAL: {
    menstrual: {
      prepare: ['Give yourself preparation time; journal or write before responding.'],
      perform: ['For emotionally charged matters, create space before reacting.'],
      recover: ['Build in time to decompress after difficult interactions.'],
    },
    follicular: {
      prepare: ['Explore what you want and possible solutions.'],
      perform: ['Plan new routines or approaches.'],
      recover: ['Choose one experiment or next step.'],
    },
    ovulation: {
      prepare: ['Have important conversations where communication matters.'],
      perform: ['Ask for support and clarify expectations.'],
      recover: ['Record agreements and boundaries.'],
    },
    luteal: {
      prepare: ['Review boundaries and unresolved responsibilities.'],
      perform: ['Reduce unnecessary commitments and use clear structure.'],
      recover: ['Protect recovery time and close unresolved loops.'],
    },
  },
  OTHER: {
    menstrual: {
      prepare: ['Classify the task by its main demand: people, decision, focus, admin or personal.'],
      perform: ['Choose a lower-friction execution approach.'],
      recover: ['Add recovery if the task is demanding.'],
    },
    follicular: {
      prepare: ['If the task involves creation or exploration, use brainstorming and experimentation.'],
      perform: ['If unclear, break it into a small first step.'],
      recover: ['Capture new ideas for later.'],
    },
    ovulation: {
      prepare: ['If people are central, use communication and collaboration deliberately.'],
      perform: ['Seek alignment and clarify ownership.'],
      recover: ['Document the outcome.'],
    },
    luteal: {
      prepare: ['If possible, convert the task into a checklist.'],
      perform: ['Prioritize structure, detail and completion.'],
      recover: ['Close open loops and document next actions.'],
    },
  },
};

export function taskGuidanceFor(categoryId: string, phase: PhaseKey): TaskGuidance {
  return TASK_GUIDANCE[categoryId]?.[phase] ?? TASK_GUIDANCE.OTHER[phase];
}

/** §7 — "Other" is not a dead end: ask what the task is closest to, then use that category's guidance. */
export interface OtherSubtype {
  id: string;
  label: string;
  /** TASK_SYNC_CATEGORIES id whose guidance content applies. */
  guidanceCategory: string;
}

export const OTHER_SUBTYPES: OtherSubtype[] = [
  { id: 'creative', label: 'Creative', guidanceCategory: 'DEEP_FOCUS' },
  { id: 'focus', label: 'Focus', guidanceCategory: 'DEEP_FOCUS' },
  { id: 'people', label: 'People', guidanceCategory: 'MEETING' },
  { id: 'decision', label: 'Decision', guidanceCategory: 'DECISION' },
  { id: 'admin', label: 'Admin', guidanceCategory: 'ADMIN' },
  { id: 'personal', label: 'Personal', guidanceCategory: 'PERSONAL' },
  { id: 'other', label: 'Other', guidanceCategory: 'OTHER' },
];
