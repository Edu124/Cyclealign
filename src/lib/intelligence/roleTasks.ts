import type { PhaseKey } from '@/types/models';
import type { UserRole } from '@/lib/roles';

export interface RoleTask {
  label: string;
  hint: string;
}

const TASKS: Record<PhaseKey, Record<UserRole, RoleTask[]>> = {
  // ── REFLECT (menstrual) ────────────────────────────────────────────────────
  menstrual: {
    corporate: [
      { label: 'Review last quarter results',        hint: 'Pull reports and find patterns' },
      { label: 'Set your personal KPIs',             hint: 'Clarity on what matters most this cycle' },
      { label: 'Audit your calendar',                hint: 'Identify energy drains and white space' },
      { label: 'Do strategic solo deep-work',        hint: 'No meetings — just thinking' },
      { label: 'Write a career journal entry',       hint: 'Where are you headed, honestly?' },
    ],
    entrepreneur: [
      { label: 'Review business metrics',            hint: 'Revenue, churn, MRR — the full picture' },
      { label: 'Journal your 12-month vision',       hint: 'Where do you want to be?' },
      { label: 'Audit what is working and what is not', hint: 'Honest, data-driven assessment' },
      { label: 'Plan your next follicular sprint',   hint: 'Set focus before energy rises' },
      { label: 'Read customer feedback end-to-end',  hint: 'What are they really saying?' },
    ],
    homemaker: [
      { label: 'Plan upcoming family events',        hint: 'Get a month-view in your head' },
      { label: 'Review household budget',            hint: 'Numbers and spending patterns' },
      { label: 'Journal your personal goals',        hint: 'What do you want for yourself?' },
      { label: 'Assess routines that are not working', hint: 'Low energy = clarity on friction' },
      { label: 'Rest intentionally',                 hint: 'This is productive, not lazy' },
    ],
    student: [
      { label: 'Review academic progress',           hint: 'Grades, deadlines, gaps' },
      { label: 'Plan your next study schedule',      hint: 'Map the following 4 weeks' },
      { label: 'Journal your learning goals',        hint: 'Why does this subject matter to you?' },
      { label: 'Assess which study methods work',    hint: 'Time to adjust your approach' },
      { label: 'Rest and let your brain consolidate', hint: 'Sleep aids memory consolidation' },
    ],
    other: [
      { label: 'Review recent decisions',            hint: 'Were they aligned with your values?' },
      { label: 'Set intentions for the month',       hint: 'Simple and specific' },
      { label: 'Journal your wins',                  hint: 'Even the small ones count' },
      { label: 'Plan ahead quietly',                 hint: 'No pressure, just possibilities' },
      { label: 'Rest deeply',                        hint: 'You have permission' },
    ],
  },

  // ── CREATE (follicular) ────────────────────────────────────────────────────
  follicular: {
    corporate: [
      { label: 'Brainstorm new team initiatives',    hint: 'Ideas flow easily right now' },
      { label: 'Draft a proposal or strategy deck',  hint: 'Start — do not perfect yet' },
      { label: 'Reach out to new contacts',          hint: 'First emails, coffees, introductions' },
      { label: 'Enrol in a course or training',      hint: 'Learning sticks better this phase' },
      { label: 'Start the project you have been delaying', hint: 'Energy is rising — go' },
    ],
    entrepreneur: [
      { label: 'Brainstorm new product ideas',       hint: 'Capture everything, filter later' },
      { label: 'Draft your next launch plan',        hint: 'Rough outline, not a final plan' },
      { label: 'Reach out to potential collaborators', hint: 'Cold emails land well now' },
      { label: 'Explore a new market or audience',   hint: 'Research mode on' },
      { label: 'Start that thing you have been putting off', hint: 'This phase is for beginnings' },
    ],
    homemaker: [
      { label: 'Start a home improvement project',   hint: 'Even a small refresh counts' },
      { label: 'Try a new recipe or meal plan',      hint: 'Exploration is energising' },
      { label: 'Learn a new skill',                  hint: 'Craft, language, fitness — anything' },
      { label: 'Reconnect with a friend you miss',   hint: 'Make a plan to meet' },
      { label: 'Rearrange or refresh your space',    hint: 'Channel that creative energy' },
    ],
    student: [
      { label: 'Start a new research topic',         hint: 'Curiosity is high — follow it' },
      { label: 'Try a different study method',       hint: 'Mind maps, flashcards, voice notes' },
      { label: 'Begin an assignment early',          hint: 'Future you will be grateful' },
      { label: 'Talk to a mentor or professor',      hint: 'Ask that question you have been holding' },
      { label: 'Join a new club or activity',        hint: 'Put yourself out there' },
    ],
    other: [
      { label: 'Start something you have been curious about', hint: 'Now is the time' },
      { label: 'Brainstorm freely',                  hint: 'No filter, just ideas' },
      { label: 'Learn something new',                hint: 'A skill, a topic, a language' },
      { label: 'Connect with someone inspiring',     hint: 'Energy attracts energy' },
      { label: 'Make a rough plan for a goal',       hint: 'Broad strokes, not perfection' },
    ],
  },

  // ── CONNECT (ovulation) ───────────────────────────────────────────────────
  ovulation: {
    corporate: [
      { label: 'Present to leadership or stakeholders', hint: 'You are at your most persuasive' },
      { label: 'Lead a high-stakes meeting',         hint: 'Charisma and clarity are peaking' },
      { label: 'Negotiate — salary, contracts, resources', hint: 'Best window for hard asks' },
      { label: 'Give feedback to your team',         hint: 'Words land well right now' },
      { label: 'Attend a networking event',          hint: 'Connection feels natural this phase' },
    ],
    entrepreneur: [
      { label: 'Pitch investors or clients',         hint: 'Confidence is at its peak' },
      { label: 'Go live on social media',            hint: 'Your energy translates on screen' },
      { label: 'Record a podcast, video or reel',    hint: 'You will sound and look great' },
      { label: 'Host or attend a networking event',  hint: 'Visibility pays off now' },
      { label: 'Send your newsletter or launch',     hint: 'Your words are magnetic right now' },
    ],
    homemaker: [
      { label: 'Have that important conversation',   hint: 'You can articulate yourself well now' },
      { label: 'Advocate for yourself or your family', hint: 'Speak up — your voice carries' },
      { label: 'Connect with other parents or community', hint: 'Social energy is high' },
      { label: 'Lead a school or community activity', hint: 'Natural authority right now' },
      { label: 'Make important family decisions together', hint: 'You communicate clearly now' },
    ],
    student: [
      { label: 'Present in class or seminar',        hint: 'Confidence is at its highest' },
      { label: 'Lead your study group',              hint: 'You have the energy for it' },
      { label: 'Attend a career or networking event', hint: 'Introductions stick now' },
      { label: 'Talk to a professor about opportunities', hint: 'Self-advocacy is strong' },
      { label: 'Do an interview or audition',        hint: 'Peak communication window' },
    ],
    other: [
      { label: 'Have an important conversation',     hint: 'Say what needs to be said' },
      { label: 'Put yourself out there',             hint: 'Visibility is your friend right now' },
      { label: 'Share your ideas or work',           hint: 'Others will receive it well' },
      { label: 'Connect with someone new',           hint: 'Your magnetism is at its peak' },
      { label: 'Do the thing that requires courage', hint: 'This is your window' },
    ],
  },

  // ── EXECUTE (luteal) ──────────────────────────────────────────────────────
  luteal: {
    corporate: [
      { label: 'Finalise and submit your report',    hint: 'Detail work is your superpower now' },
      { label: 'Review and polish team deliverables', hint: 'Editor mode on' },
      { label: 'Clear your inbox and action list',   hint: 'Satisfying and energising' },
      { label: 'Update project documentation',       hint: 'Future you will thank you' },
      { label: 'Set clear boundaries on your calendar', hint: 'Protect energy for what matters' },
    ],
    entrepreneur: [
      { label: 'Ship that feature or product update', hint: 'Finishing energy is strong' },
      { label: 'Clear outstanding invoices and admin', hint: 'Money matters — tackle them now' },
      { label: 'Finalise and send contracts',        hint: 'Detail attention peaks this phase' },
      { label: 'Polish website copy or listings',    hint: 'Refine what is already there' },
      { label: 'Close all open loops',               hint: 'What is 90% done? Finish it' },
    ],
    homemaker: [
      { label: 'Deep-clean one room',                hint: 'Channel that organising energy' },
      { label: 'Meal prep and batch cook',           hint: 'Future-week you says thank you' },
      { label: 'Organise household finances',        hint: 'Good time for detail work' },
      { label: 'Sort the family schedule and logistics', hint: 'You can hold the detail now' },
      { label: 'Declutter one area',                 hint: 'Small, satisfying, done' },
    ],
    student: [
      { label: 'Complete and submit pending work',   hint: 'Finishing power is high' },
      { label: 'Organise and review your notes',     hint: 'Consolidation is key now' },
      { label: 'Proofread and polish written work',  hint: 'Detail attention is sharp' },
      { label: 'Tidy your study space',              hint: 'Environment affects output' },
      { label: 'Submit any pending admin or forms',  hint: 'Get it off your plate' },
    ],
    other: [
      { label: 'Tie up loose ends',                  hint: 'What has been waiting? Finish it' },
      { label: 'Organise your physical space',       hint: 'External order supports inner calm' },
      { label: 'Clear your digital inbox',           hint: 'Delete, archive, respond' },
      { label: 'Complete that thing at 90%',         hint: 'Cross the finish line' },
      { label: 'Set clear limits on your energy',    hint: 'Say no with ease right now' },
    ],
  },
};

export function getTasksForPhaseAndRole(phase: PhaseKey, role?: string | null): RoleTask[] {
  const key = (role as UserRole) ?? 'other';
  return TASKS[phase][key] ?? TASKS[phase].other;
}
