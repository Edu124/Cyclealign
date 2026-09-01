// Sends an email to the CycleAlign team whenever someone submits a new
// "Talk with an Expert" request. Called fire-and-forget from the client
// right after the request row is inserted — a failure here must never
// block or fail the user's actual submission.
// Deploy: supabase functions deploy notify-expert-request
// Secrets: supabase secrets set RESEND_API_KEY=re_...

import { createClient } from 'jsr:@supabase/supabase-js@2';

const NOTIFY_TO = 'hellocyclealign@gmail.com';
// Resend's shared sending address — works with no domain verification.
// Swap for a verified CycleAlign address later if you want a branded "from".
const FROM = 'CycleAlign <onboarding@resend.dev>';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) return json({ error: 'Email not configured' }, 500);

  // Verify the caller is a signed-in user — this endpoint only ever needs to
  // be called right after that user's own request was inserted.
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const jwt = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(jwt);
  if (!user) return json({ error: 'Not signed in' }, 401);

  const { name, email, concern } = await req.json();
  const concernText = String(concern ?? '').slice(0, 2000);
  if (!concernText.trim()) return json({ error: 'Empty concern' }, 400);

  const escaped = concernText
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [NOTIFY_TO],
      reply_to: typeof email === 'string' && email.trim() ? email.trim() : undefined,
      subject: `New Talk with an Expert request${name ? ` — ${name}` : ''}`,
      html: `
        <p><strong>New "Talk with an Expert" submission</strong></p>
        <p><strong>Name:</strong> ${name ? name : '(not given)'}<br/>
        <strong>Reply-to email:</strong> ${email ? email : '(not given)'}<br/>
        <strong>Account email:</strong> ${user.email ?? '(unknown)'}</p>
        <p><strong>Concern:</strong></p>
        <p>${escaped.replace(/\n/g, '<br/>')}</p>
        <p style="color:#888;font-size:12px;">Review and respond from the app's admin screen.</p>
      `,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('Resend error:', detail);
    return json({ error: 'Email send failed' }, 502);
  }

  return json({ ok: true });
});
