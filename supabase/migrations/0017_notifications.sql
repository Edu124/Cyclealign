-- Personalized Cycle Notifications (developer spec, sections 9 & 11).
--
-- 1. notification_events: delivery / interaction events for debugging and
--    product analytics. Ids, statuses and the phase category only — never the
--    message text or anything she logged. Each user can only insert and read
--    her own rows; 180-day retention via the cleanup function below.
-- 2. app_content 'notification_library': the editable content library and
--    schedule defaults (cap, quiet hours, default time). Edit the JSON in the
--    Table Editor to change copy, pause a message ("paused": true) or change a
--    default without an app release. Needs 0015 (app_content) to have run.

CREATE TABLE IF NOT EXISTS public.notification_events (
  id                bigserial PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id          text,
  notification_type text,
  content_id        text,
  content_version   int,
  channel           text CHECK (channel IS NULL OR channel IN ('push', 'in_app')),
  status            text NOT NULL,
  phase_estimate    text,
  confidence        text,
  detail            text,
  occurred_at       timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_events_user_idx ON public.notification_events (user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS notification_events_status_idx ON public.notification_events (status, occurred_at DESC);

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert own notification events" ON public.notification_events;
CREATE POLICY "insert own notification events"
  ON public.notification_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "read own notification events" ON public.notification_events;
CREATE POLICY "read own notification events"
  ON public.notification_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Aggregated view for the weekly fatigue review (no per-user rows).
CREATE OR REPLACE VIEW public.notification_daily_stats
WITH (security_invoker = true) AS
SELECT
  date_trunc('day', occurred_at)::date AS day,
  notification_type,
  phase_estimate,
  status,
  count(*) AS events
FROM public.notification_events
GROUP BY 1, 2, 3, 4;

-- Retention: call from a scheduled job (or by hand) to keep 180 days.
CREATE OR REPLACE FUNCTION public.prune_notification_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.notification_events WHERE occurred_at < now() - interval '180 days';
$$;
REVOKE ALL ON FUNCTION public.prune_notification_events() FROM PUBLIC, anon, authenticated;

-- Seed the content library with the copy the app ships with. Re-running never overwrites edits.
INSERT INTO public.app_content (key, data)
VALUES ('notification_library', $lib$
{
  "version": 1,
  "config": {
    "defaultHour": 9,
    "defaultMinute": 0,
    "eveningHour": 20,
    "eveningMinute": 0,
    "quietStartHour": 21,
    "quietEndHour": 8,
    "dailyCap": 2,
    "rotationDays": 5,
    "planDays": 7,
    "staleAfterDaysPastDue": 7,
    "neutralLockBody": "Tap to open today's guidance in CycleAlign."
  },
  "messages": [
    {
      "id": "safety_urgent",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "urgent",
      "topic": "safety",
      "cooldownDays": 3,
      "title": "A note about your check-in",
      "body": "You logged severe pain or very heavy bleeding. CycleAlign can't diagnose anything, but if it is severe, sudden, or you feel faint or unwell, please contact a healthcare professional or seek urgent care.",
      "cta": "Open today's guidance",
      "link": "today"
    },
    {
      "id": "setup_cycle",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "no_data",
      "topic": "setup",
      "cooldownDays": 3650,
      "title": "Set up your cycle",
      "lockTitle": "A quick update in CycleAlign",
      "body": "Add your last period date for guidance that fits you better, or keep using CycleAlign for general wellness tips.",
      "cta": "Open cycle setup",
      "link": "cycle_setup"
    },
    {
      "id": "cycle_stale",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "stale",
      "topic": "setup",
      "cooldownDays": 3,
      "title": "Let's update your cycle",
      "lockTitle": "A quick update in CycleAlign",
      "body": "Your cycle estimate may be out of date. Update your last period date for more relevant guidance, or keep using general wellness tips.",
      "cta": "Open cycle setup",
      "link": "cycle_setup"
    },
    {
      "id": "symptom_cramps",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "cramps",
      "topic": "self-care",
      "cooldownDays": 2,
      "title": "A little comfort today",
      "body": "You mentioned cramps. If it feels helpful, try a warm compress and gentle movement or rest, whichever feels comfortable for you.",
      "cta": "Open comfort tips",
      "link": "comfort_tips"
    },
    {
      "id": "mood_low",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "low_mood",
      "topic": "mood",
      "cooldownDays": 2,
      "title": "Check in with yourself",
      "body": "You logged feeling low. Would a short check-in or a few quiet minutes help right now?",
      "cta": "Open mood check-in",
      "link": "mood_checkin"
    },
    {
      "id": "symptom_cravings",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "cravings",
      "topic": "nutrition",
      "cooldownDays": 2,
      "title": "Plan a satisfying snack",
      "body": "You mentioned cravings. Consider a snack that feels satisfying to you, such as fruit with nuts or yoghurt, if those suit your preferences.",
      "cta": "Open snack ideas",
      "link": "snack_ideas"
    },
    {
      "id": "mood_positive",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "positive_mood",
      "phases": [
        "follicular",
        "ovulation"
      ],
      "topic": "work",
      "cooldownDays": 3,
      "title": "Build on what feels good",
      "body": "You logged a positive mood. If it suits you today, use that feeling to make progress on one thing that matters to you.",
      "cta": "Open daily planner",
      "link": "daily_planner"
    },
    {
      "id": "mood_missing",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "mood_missing",
      "topic": "mood",
      "cooldownDays": 3,
      "title": "How are you feeling?",
      "body": "A quick mood check-in can help CycleAlign make your guidance more relevant. Skip it if now isn't a good time.",
      "cta": "Open mood check-in",
      "link": "mood_checkin"
    },
    {
      "id": "menstrual_space",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "phase",
      "phases": [
        "menstrual"
      ],
      "topic": "self-care",
      "title": "Make space for yourself",
      "body": "You may be in your period phase. Choose a pace that feels manageable today, and take breaks when you need them.",
      "cta": "Open today's guidance",
      "link": "today"
    },
    {
      "id": "menstrual_food",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "phase",
      "phases": [
        "menstrual"
      ],
      "topic": "nutrition",
      "title": "Something warm and simple",
      "body": "Your app estimates you may be on your period. A warm, simple meal and enough water can be an easy way to look after yourself today.",
      "cta": "Open food ideas",
      "link": "nutrition_phase"
    },
    {
      "id": "menstrual_move",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "phase",
      "phases": [
        "menstrual"
      ],
      "topic": "movement",
      "title": "Move the way that feels right",
      "body": "During your estimated period days, gentle movement, stretching or rest are all fine choices. Go with what feels comfortable.",
      "cta": "Open today's guidance",
      "link": "today"
    },
    {
      "id": "menstrual_comfort",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "phase",
      "phases": [
        "menstrual"
      ],
      "topic": "self-care",
      "title": "A small comfort",
      "body": "If it suits you, a little extra comfort today, like an early night, a warm drink or a quiet moment, may help.",
      "cta": "Open today's guidance",
      "link": "today"
    },
    {
      "id": "follicular_win",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "phase",
      "phases": [
        "follicular"
      ],
      "topic": "work",
      "title": "Plan one small win",
      "body": "Your app estimates you may be in the follicular phase. Pick one task to focus on, and adjust your plan to how you actually feel.",
      "cta": "Open daily planner",
      "link": "daily_planner"
    },
    {
      "id": "follicular_food",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "phase",
      "phases": [
        "follicular"
      ],
      "topic": "nutrition",
      "title": "A colourful plate",
      "body": "Your app estimates you may be in the follicular phase. A plate with protein, fibre and some colour is an easy everyday choice, if it suits you.",
      "cta": "Open food ideas",
      "link": "nutrition_phase"
    },
    {
      "id": "follicular_move",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "phase",
      "phases": [
        "follicular"
      ],
      "topic": "movement",
      "title": "Try something you enjoy",
      "body": "If you feel up to it today, try a kind of movement you enjoy. Adjust it to how your body actually feels.",
      "cta": "Open today's guidance",
      "link": "today"
    },
    {
      "id": "follicular_notice",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "phase",
      "phases": [
        "follicular"
      ],
      "topic": "mood",
      "title": "Notice what's working",
      "body": "Take a moment to notice what is going well this week. A quick check-in helps your guidance fit you better.",
      "cta": "Open mood check-in",
      "link": "mood_checkin"
    },
    {
      "id": "ovulation_notice",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "phase",
      "phases": [
        "ovulation"
      ],
      "minConfidence": "ok",
      "topic": "mood",
      "title": "Notice how you feel",
      "body": "Your app estimates you may be near ovulation. Your experience can vary, so check in with your body rather than relying on the calendar alone.",
      "cta": "Open cycle overview",
      "link": "cycle_overview"
    },
    {
      "id": "ovulation_food",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "phase",
      "phases": [
        "ovulation"
      ],
      "minConfidence": "ok",
      "topic": "nutrition",
      "title": "Keep it steady",
      "body": "You may be in your estimated ovulatory window. Regular meals and water through the day are a simple way to look after yourself.",
      "cta": "Open food ideas",
      "link": "nutrition_phase"
    },
    {
      "id": "ovulation_plan",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "phase",
      "phases": [
        "ovulation"
      ],
      "minConfidence": "ok",
      "topic": "work",
      "title": "Make room for what matters",
      "body": "If it suits your day, set aside time for a conversation or task that matters to you, and plan around how you actually feel.",
      "cta": "Open daily planner",
      "link": "daily_planner"
    },
    {
      "id": "luteal_prepare",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "phase",
      "phases": [
        "luteal"
      ],
      "maxDaysToPeriod": 5,
      "topic": "self-care",
      "title": "Make tomorrow easier",
      "body": "Your next period may be approaching. If planning ahead helps, set aside an easy meal or make a little room in your schedule.",
      "cta": "Open preparation tips",
      "link": "prep_tips"
    },
    {
      "id": "luteal_flex",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "phase",
      "phases": [
        "luteal"
      ],
      "topic": "work",
      "title": "Keep your plan flexible",
      "body": "Your app estimates you may be in the luteal phase. A plan with a little buffer can make the week easier, only if that is useful for you.",
      "cta": "Open daily planner",
      "link": "daily_planner"
    },
    {
      "id": "luteal_food",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "phase",
      "phases": [
        "luteal"
      ],
      "topic": "nutrition",
      "title": "Regular, satisfying meals",
      "body": "Regular meals with some protein and whole grains can be an easy way to feel steady. See food ideas for your estimated phase.",
      "cta": "Open food ideas",
      "link": "nutrition_phase"
    },
    {
      "id": "luteal_downtime",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "phase",
      "phases": [
        "luteal"
      ],
      "topic": "self-care",
      "title": "Protect a little downtime",
      "body": "If your schedule allows, save a little time this evening for something restful.",
      "cta": "Open today's guidance",
      "link": "today"
    },
    {
      "id": "general_steady",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "general",
      "topic": "self-care",
      "title": "A moment for you",
      "body": "Take a few minutes for something that helps you feel steady today: water, a short walk, or a pause.",
      "cta": "Open today's guidance",
      "link": "today"
    },
    {
      "id": "general_one_thing",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "general",
      "topic": "work",
      "title": "One thing at a time",
      "body": "Pick the one task that matters most today and give it your best hour.",
      "cta": "Open daily planner",
      "link": "daily_planner"
    },
    {
      "id": "general_food",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "general",
      "topic": "nutrition",
      "title": "Easy, everyday nourishment",
      "body": "A regular meal with protein, fibre and water is a simple way to look after yourself today.",
      "cta": "Open food ideas",
      "link": "nutrition"
    },
    {
      "id": "general_track",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "general",
      "topic": "mood",
      "title": "Track what you notice",
      "body": "Logging how you feel helps CycleAlign learn your own patterns over time. It only takes a few seconds.",
      "cta": "Open mood check-in",
      "link": "mood_checkin"
    },
    {
      "id": "general_evening",
      "version": 1,
      "type": "daily_guidance",
      "trigger": "general",
      "topic": "self-care",
      "title": "A calmer evening",
      "body": "If you can, give yourself a slower evening tonight. Small routines can make rest easier.",
      "cta": "Open today's guidance",
      "link": "today"
    },
    {
      "id": "reminder_checkin",
      "version": 1,
      "type": "symptom_checkin",
      "trigger": "reminder",
      "topic": "mood",
      "title": "Quick evening check-in",
      "body": "How did today feel? Log your mood or any symptoms in a few seconds, or skip it tonight.",
      "cta": "Open mood check-in",
      "link": "mood_checkin"
    },
    {
      "id": "reminder_period_confirm",
      "version": 1,
      "type": "period_confirmation",
      "trigger": "reminder",
      "topic": "setup",
      "title": "Has your period started?",
      "lockTitle": "A quick check-in from CycleAlign",
      "body": "Your next period was estimated around now. If it has started, confirm the date so your estimates stay accurate. If not, there is nothing to do.",
      "cta": "Confirm the date",
      "link": "cycle_setup"
    }
  ]
}
$lib$::jsonb)
ON CONFLICT (key) DO NOTHING;
