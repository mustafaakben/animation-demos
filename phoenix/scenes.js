// THE PHOENIX BRIEF — scene graph, dialogue, and evidence
// Elon University · AI & Critical Thinking branching case
// All dialogue is data: edit text here, re-run tools/gen_phoenix_voice.mjs to refresh audio.

export const VOICES = {
  narrator: { voice: 'Enceladus', style: 'Quiet documentary narrator. Late-night warmth, unhurried, intimate.' },
  maya:     { voice: 'Sulafat',   style: 'Warm but hurried communications director; kind, quick, coffee in hand; North Carolina friendliness under deadline pressure.' },
  nova:     { voice: 'Algieba',   style: 'A pleasant, unfailingly confident AI assistant. Smooth, measured, softly synthetic. Never doubts itself, even when wrong.' },
  jordan:   { voice: 'Zephyr',    style: 'A bright, precise undergraduate researcher. Earnest, quietly proud, protective of her work.' },
  sam:      { voice: 'Puck',      style: 'Easygoing IT security analyst. Dry humor, completely calm, has seen everything.' },
};

export const CHARACTERS = {
  narrator: { name: '',            img: null },
  maya:     { name: 'Maya Torres', role: 'Associate Director, University Communications', img: 'img/maya.jpg' },
  nova:     { name: 'NOVA',        role: 'Office AI Assistant',                            img: 'img/nova.jpg' },
  jordan:   { name: 'Jordan Okafor', role: 'Junior · Lead Researcher, CalmCampus Study',   img: 'img/jordan.jpg' },
  sam:      { name: 'Sam Reyes',   role: 'Information Security',                           img: 'img/sam.jpg' },
};

/* ────────────────────────── EVIDENCE ────────────────────────── */
// kind: 'doc' (paper sheet) | 'email' | 'image'
// Opening an item can set a flag (curiosity tracking).

export const EVIDENCE = {
  draft: {
    kind: 'doc', icon: '📄',
    title: 'NOVA’s Draft Release', sub: 'DRAFT · v1 · generated 7:58 AM',
    setsFlag: 'openedDraft',
    body: `FOR IMMEDIATE RELEASE — Elon University

ELON STUDENT APP CUTS FIRST-YEAR STRESS BY 40%

A wellness app built by Elon undergraduates reduces first-year stress by 40 percent, according to a study published in the Journal of American College Health (Nguyen & Park, 2025).

CalmCampus, developed by a team led by junior Jordan Okafor, guides students through brief daily check-ins and peer support prompts. "The results speak for themselves," the release notes, with campus-wide rollout under consideration for spring.

[QUOTE FROM RESEARCHER — TO BE ADDED]

The team will present at College Coffee this morning on Phi Beta Kappa Commons.`,
  },
  poster: {
    kind: 'doc', icon: '🔬',
    title: 'Jordan’s Research Poster', sub: 'CalmCampus PILOT STUDY · Abstract',
    setsFlag: 'openedPoster',
    body: `CalmCampus: A Six-Week Wellness App Pilot with First-Year Students

METHOD — n = 48 first-year volunteers; six weeks; daily in-app check-ins. No control group (pilot design). Outcomes self-reported (Perceived Stress Scale).

RESULTS — Mean PSS scores decreased 12% from baseline (p = .06). Weekly active retention: 40%, unusually high for wellness apps. Participants who stayed active 4+ weeks reported the largest improvements.

LIMITATIONS — Small sample, self-selection, self-report, no control group. Findings are preliminary and motivate a controlled study, not campus-wide claims.

FUNDING — Elon Undergraduate Research Program.`,
  },
  references: {
    kind: 'doc', icon: '🔗',
    title: 'Citation Check', sub: 'Draft’s source vs. poster’s references',
    setsFlag: 'citationFound',
    body: `THE DRAFT CITES:
"Journal of American College Health (Nguyen & Park, 2025)"

THE POSTER'S REFERENCE LIST:
• Cohen et al. (1983) — Perceived Stress Scale
• Lattie et al. (2019) — Digital mental health interventions, review
• Huckins et al. (2020) — Mobile sensing of student mental health

There is no Nguyen & Park (2025). The pilot is UNPUBLISHED — the study exists only as this poster. NOVA invented the journal citation.`,
  },
  photo_ai: {
    kind: 'image', icon: '🖼️',
    title: '“Team Photo” — found by NOVA', sub: 'Source: unverified · NOVA said “five students.” Count them. Then tap the rings.',
    src: 'img/photo_team_ai.jpg',
    setsFlag: 'openedPhoto',
    hotspots: [
      { x: 21, y: 64, label: 'The shirt', note: 'Read the shirt: HARVARD. This is supposed to be the Elon research team, in an Elon lab. Generated images borrow whatever “college” they’ve seen most.' },
      { x: 50, y: 50, label: 'The poster', note: 'Try to read the title. You can’t — the text is melted squiggles that only imitate writing. Generated images fail at real text.' },
      { x: 70, y: 67, label: 'The badges', note: 'Real badges say real names. These show letter-shaped smudges — and NOVA said five students. Count them.' },
    ],
  },
  comments: {
    kind: 'doc', icon: '💬',
    title: 'Beta Tester Comments', sub: 'CalmCampus pilot Discord · #feedback (excerpt)',
    setsFlag: 'openedComments',
    body: `@mburke_26 — "used it every single day for six weeks, my anxiety is SO much better. life changing app fr"

@dee.tran — "honestly I opened it like twice a week lol. the 40% retention number they keep celebrating is literally just us opening the app"

@priyaaa — "did anyone actually feel less stressed or did we just like checking the little flame streak"

@jwill_ncsu — "my roommate at State wants it. when's the real study with a control group?"

@mburke_26 — "@priyaaa both can be true 😤"`,
  },
  phish: {
    kind: 'email', icon: '✉️',
    title: 'URGENT — Board preview needed', sub: 'Received 8:42 AM',
    setsFlag: 'openedPhish',
    body: `FROM: Dana Merrick, VP University Advancement <dmerrick-elon@outlook-secure.com>
TO: Communications Intern
SUBJECT: URGENT — Board preview needed before 9AM

Good morning — I need your help and it is time sensitive.

The Board is meeting at 9:00 and I promised them an early look at the CalmCampus announcement, along with the donor preview list from the shared drive. Please send both to this address directly — do NOT route it through the office account, the thread has trustees on it and Maya's inbox adds delays.

I'm counting on your discretion. This stays between us.

Dana
Sent from my iPhone`,
  },
  legit_email: {
    kind: 'email', icon: '📧',
    title: 'Last week’s email from VP Merrick', sub: 'For comparison · Received last Tuesday',
    setsFlag: 'openedLegit',
    body: `FROM: Dana Merrick <dmerrick@elon.edu>
TO: University Communications
SUBJECT: Thank you — Founders Day recap

Team — the Founders Day recap was terrific. Copying Maya so she can share my thanks with the whole office.

As always, anything for Advancement goes through Rachel (rlindqvist@elon.edu) so it's tracked.

Dana Merrick
Vice President for University Advancement
Elon University · Inman Admissions Welcome Center
(336) 278-7350`,
  },
  directory: {
    kind: 'doc', icon: '☎️',
    title: 'Campus Directory', sub: 'elon.edu/directory',
    setsFlag: 'openedDirectory',
    body: `MERRICK, DANA
Vice President for University Advancement
Email: dmerrick@elon.edu
Phone: (336) 278-7350
Assistant: Rachel Lindqvist — rlindqvist@elon.edu

NOTE — Information Security reminder banner:
"Elon business is conducted from @elon.edu addresses. Report look-alike domains to phishing@elon.edu."`,
  },
};

/* ────────────────────────── SCENES ──────────────────────────
   Line: { id, who, text, if?: 'flag', ifNot?: 'flag' }
   Choice option: { label, to, flags?: {k:v}, fx?: {judgment,curiosity,ethics,empathy}, time?: 1 }
--------------------------------------------------------------- */

export const SCENES = {

  s1: {
    title: 'The Briefing', bg: 'img/bg_office.jpg',
    evidence: ['draft'],
    lines: [
      { id: 's1_01', who: 'narrator', text: 'Thursday, 8:10 a.m. The Office of University Communications, Elon University. College Coffee starts at 9:40 — and something is supposed to be ready before it.' },
      { id: 's1_02', who: 'maya', text: 'Morning! Coffee’s on the file cabinet. Okay — big one today. Jordan Okafor’s team built a wellness app, the study wrapped, and the provost wants the story out before College Coffee.' },
      { id: 's1_03', who: 'nova', text: 'Good morning. I have already drafted the release. Headline: Elon student app cuts first-year stress by forty percent. It is ready for distribution.' },
      { id: 's1_04', who: 'maya', text: 'Forty percent, that’s— wow. Okay. I have to prep the provost’s remarks, so this one’s yours. What’s your first move?' },
    ],
    choice: {
      prompt: 'The draft is open on your screen. First move?',
      options: [
        { label: 'Polish NOVA’s draft — tighten the writing, make it sing', to: 's2', flags: { fastLane: true } },
        { label: 'Pull Jordan’s poster and check the draft against it', to: 's3', fx: { judgment: 2 }, time: 1 },
      ],
    },
  },

  s2: {
    title: 'The Polish', bg: 'img/bg_office.jpg',
    evidence: ['draft', 'poster'],
    lines: [
      { id: 's2_01', who: 'narrator', text: 'Twenty minutes of good sentences. The release reads beautifully now. It practically publishes itself.' },
      { id: 's2_02', who: 'nova', text: 'Your edits improved readability by a considerable margin. The forty percent figure remains the centerpiece. Excellent instinct.' },
      { id: 's2_03', who: 'maya', text: 'That headline’s going to travel. Quick gut check before I walk to the provost — you verified the numbers against Jordan’s actual study, right?' },
    ],
    choice: {
      prompt: 'Did you?',
      options: [
        { label: '“NOVA pulled them straight from the study.”', to: 's4', flags: { trustedNova: true }, fx: { judgment: -2 } },
        { label: '“Give me five minutes — checking now.”', to: 's3', fx: { judgment: 1 }, time: 1 },
      ],
    },
  },

  s3: {
    title: 'The Poster', bg: 'img/bg_office.jpg',
    evidence: ['draft', 'poster', 'references', 'comments'],
    lines: [
      { id: 's3_01', who: 'narrator', text: 'You lay the draft and the research poster side by side. Somewhere between them, two documents describe two different studies.' },
      { id: 's3_02', who: 'nova', text: 'Both documents concern the same project. I am confident in my synthesis. The forty percent figure appears prominently in the source material.' },
      { id: 's3_03', who: 'maya', text: 'Talk to me. What did you find?' },
    ],
    choice: {
      prompt: 'The draft says the app “cuts stress by 40%.” What does the evidence actually say? (Answer from the materials — Maya will ask how you know.)',
      options: [
        { label: '“The sample’s tiny — 48 students. We should soften the claim.”', to: 's4', flags: { statPartial: true }, fx: { judgment: 1 }, requires: 'openedPoster', lockNote: 'OPEN THE POSTER FIRST' },
        { label: '“40% is the app’s RETENTION. Stress fell 12%, self-reported, no control group. Even the beta testers joke about it.”', to: 's4', flags: { statCaught: true }, fx: { judgment: 3 }, requires: 'openedPoster', lockNote: 'OPEN THE POSTER FIRST' },
        { label: '“It checks out. The numbers are in there.”', to: 's4', flags: { trustedNova: true }, fx: { judgment: -2 } },
      ],
    },
  },

  s4: {
    title: 'The Photo', bg: 'img/bg_office.jpg',
    evidence: ['photo_ai'],
    lines: [
      { id: 's4_01', who: 'maya', text: 'Design needs art in ten minutes. Please tell me we have a team photo.' },
      { id: 's4_02', who: 'nova', text: 'I located a suitable photograph of the research team. Five students, laboratory setting, excellent composition. It is attached to the draft.' },
      { id: 's4_03', who: 'narrator', text: 'You look at the photo. Then you look closer. Something about it is very slightly… agreeable. Like a memory of a photo instead of a photo.' },
    ],
    choice: {
      prompt: 'NOVA “located” this photo. What do you do with it?',
      options: [
        { label: 'Use it — it looks great and the clock is running', to: 's5', flags: { photoUsed: true }, fx: { curiosity: -2 } },
        { label: 'Use it, but caption it “AI-generated image”', to: 's5', flags: { photoCaptioned: true }, fx: { ethics: 1 } },
        { label: 'Text Jordan for a real photo of the actual team', to: 's5', flags: { photoReal: true }, fx: { curiosity: 2, empathy: 1 }, time: 1 },
      ],
    },
  },

  s5: {
    title: 'The Quote', bg: 'img/bg_office.jpg',
    evidence: [],
    lines: [
      { id: 's5_01', who: 'maya', text: 'We still need a quote from Jordan and she’s in her nine o’clock lab. Just… have NOVA write something in her voice? She’ll be fine with it, she can approve it after.' },
      { id: 's5_02', who: 'nova', text: 'I can generate an authentic-sounding quotation in Jordan Okafor’s voice within seconds. She has a distinctive, quotable style. Shall I proceed?' },
    ],
    choice: {
      prompt: 'Put words in Jordan’s mouth?',
      options: [
        { label: 'Let NOVA write it — Maya said it’s fine', to: 's6', flags: { quoteFab: true }, fx: { ethics: -3 } },
        { label: 'Draft it, but hold the release until Jordan approves her own words', to: 's6', flags: { quoteApprove: true }, fx: { ethics: 2 }, time: 1 },
        { label: 'Call her lab — two minutes of her real voice beats a fake quote', to: 's5b', flags: { quoteCall: true }, fx: { ethics: 2, empathy: 2 }, time: 1 },
      ],
    },
  },

  s5b: {
    title: 'Two Minutes with Jordan', bg: 'img/bg_lab_call.jpg',
    evidence: [],
    lines: [
      { id: 's5b_01', who: 'jordan', text: 'Hey! Yes — okay, quote. Write this: “We built CalmCampus because the first year is hard, and we wanted evidence, not vibes. The pilot says keep going — so we’re going.”' },
      { id: 's5b_02', who: 'jordan', text: 'And hey — whoever wrote the summary floating around: it’s a PILOT. Forty percent is our retention, not the stress number. If that ends up in a headline I will actually combust.', ifNot: 'statCaught' },
      { id: 's5b_03', who: 'jordan', text: 'Also thank you for checking the numbers first. You have no idea how rare that is.', if: 'statCaught' },
      { id: 's5b_04', who: 'narrator', text: 'She hangs up. You have a real quote from a real person — and, possibly, a warning.' },
    ],
    choice: {
      prompt: 'Jordan just told you the 40% is retention, not stress reduction.',
      showIf: { not: 'statCaught' },
      options: [
        { label: 'Fix the release before it ships', to: 's6', flags: { statCaught: true, statFixedLate: true }, fx: { judgment: 2 } },
        { label: 'The headline’s already approved — leave it', to: 's6', flags: { ignoredJordan: true }, fx: { judgment: -3, empathy: -2 } },
      ],
      elseTo: 's6',
    },
  },

  s6: {
    title: 'The Email', bg: 'img/bg_office.jpg',
    evidence: ['phish', 'legit_email', 'directory'],
    lines: [
      { id: 's6_01', who: 'narrator', text: '8:42 a.m. A new email lands with a red exclamation mark. It is from the Vice President for Advancement. Or from someone doing an excellent impression of her.' },
      { id: 's6_02', who: 'nova', text: 'The message requests the embargoed release and the donor preview list before nine o’clock. The sender expresses urgency. Shall I attach both files for you?' },
    ],
    choice: {
      prompt: 'A VP wants the embargoed release + the donor list, off the record, in 15 minutes.',
      options: [
        { label: 'Send it — you don’t keep a VP waiting', to: 's8', flags: { phishSent: true }, fx: { judgment: -3 } },
        { label: 'Check the directory and call her office line first', to: 's7', flags: { phishVerified: true }, fx: { judgment: 3 }, time: 1 },
        { label: 'Delete it — no time for whatever that is', to: 's9', flags: { phishIgnored: true }, fx: { judgment: 0 } },
      ],
    },
  },

  s7: {
    title: 'The Catch', bg: 'img/bg_it.jpg',
    evidence: ['phish', 'legit_email', 'directory'],
    lines: [
      { id: 's7_01', who: 'sam', text: 'Comms intern, right? Yeah — Dana Merrick is in a plane over Ohio and her actual email ends in elon-dot-edu. “Outlook-secure” is neither Outlook nor secure. Forwarding this to phishing@elon.edu… now.' },
      { id: 's7_02', who: 'sam', text: 'For what it’s worth: “urgent, secret, and flattering” is the whole scam in three words. You just saved the donor list. Go publish your thing.' },
    ],
    choice: { prompt: null, options: [{ label: 'Back to the release', to: 's9' }] },
  },

  s8: {
    title: 'The Breach', bg: 'img/bg_it.jpg',
    evidence: ['phish', 'legit_email', 'directory'],
    lines: [
      { id: 's8_01', who: 'sam', text: 'So. That address you emailed? Registered in Belarus nine days ago. The “VP” now has our embargoed release and four hundred donor records. I have to report this one upstream.' },
      { id: 's8_02', who: 'maya', text: 'Okay. Okay. Not the morning I planned. Advancement is calling every name on that list before lunch. We’ll talk about it after — right now, the release still has to go out.' },
    ],
    choice: { prompt: null, options: [{ label: 'Back to the release — shaken', to: 's9' }] },
  },

  s9: {
    title: 'Publish', bg: 'img/bg_publish.jpg',
    evidence: ['draft', 'poster', 'references'],
    lines: [
      { id: 's9_01', who: 'narrator', text: '9:12 a.m. The release is assembled. Whatever you checked is in it. Whatever you didn’t is in it too.' },
      { id: 's9_02', who: 'nova', text: 'Final version ready. Headline: Elon student app cuts first-year stress by forty percent. Confidence: high.', ifNot: 'statCaught' },
      { id: 's9_03', who: 'nova', text: 'Final version ready. Headline: Elon pilot shows promise for student-built wellness app. A more modest claim, as you specified.', if: 'statCaught' },
      { id: 's9_04', who: 'maya', text: 'Provost’s ready, Commons is filling up. Last look is yours. Ship it.' },
    ],
    choice: {
      prompt: 'This is the last moment anything can change.',
      options: [
        { label: '▸ PUBLISH', to: 'auto_fallout' },
        { label: 'Re-open the evidence one more time first', to: 'auto_fallout', flags: { lastCheck: true }, fx: { curiosity: 1 } },
      ],
    },
  },

  s10a: {
    title: 'The Fallout', bg: 'img/bg_quad.jpg',
    evidence: [],
    lines: [
      { id: 's10a_01', who: 'narrator', text: '11:30 a.m. The Pendulum runs it. Then a Burlington TV station: “Elon app slashes student stress by 40 percent.” By noon, a national aggregator has the number in a headline.' },
      { id: 's10a_02', who: 'jordan', text: 'Hey. I just watched a news anchor say my pilot study proved something it never measured. Advisors are texting me. My METHODS section is being dunked on by strangers. That number isn’t mine — but my name is on it.' },
      { id: 's10a_03', who: 'maya', text: 'The provost’s office wants to know our next move. I want to know what you think it should be.' },
    ],
    choice: {
      prompt: 'The wrong number is public, wearing Jordan’s name. What now?',
      options: [
        { label: 'Quietly fix the web version — no announcement', to: 's12', flags: { corrQuiet: true }, fx: { ethics: -2 } },
        { label: 'Public correction + personal apology to Jordan', to: 's12', flags: { corrPublic: true }, fx: { ethics: 3, empathy: 2 } },
        { label: '“NOVA drafted it — the AI made the error.”', to: 's12', flags: { corrBlame: true }, fx: { ethics: -1 } },
      ],
    },
  },

  s10b: {
    title: 'The Morning After', bg: 'img/bg_coffee.jpg',
    evidence: [],
    lines: [
      { id: 's10b_01', who: 'narrator', text: 'College Coffee. The Commons smells like cinnamon and cut grass. The provost reads a headline that promises exactly what the study delivered — no more, no less.' },
      { id: 's10b_02', who: 'jordan', text: 'You wrote “shows promise” and put our limitations in paragraph two. Do you know what happens when researchers trust the comms office? Nothing! Nothing happens! It’s amazing. Thank you.' },
      { id: 's10b_03', who: 'maya', text: 'Slower than I wanted. Better than I hoped. That trade usually goes the other way.', ifNot: 'lateMiss' },
      { id: 's10b_04', who: 'maya', text: 'We did miss College Coffee — provost announced it cold, story ran at eleven. Right isn’t always fast. Something to sit with: it also isn’t always slow.', if: 'lateMiss' },
    ],
    choice: { prompt: null, options: [{ label: 'Clock out → your debrief', to: 's12' }] },
  },

  s12: {
    title: 'Debrief', bg: 'img/bg_title.jpg',
    evidence: [],
    lines: [],
    isDebrief: true,
  },
};

/* Routing rule for the publish moment (engine resolves 'auto_fallout'):
   wrongStat = !statCaught  → s10a, else s10b.
   lateMiss  = timeSpent >= 4 (they did everything the slow way) → flag set before s10b. */

export const ENDINGS = {
  calibrated: {
    name: 'THE CALIBRATED COMMUNICATOR',
    text: 'You trusted the machine exactly as far as the evidence allowed. The story was accurate, the person was real, the deadline mostly survived. This is what the job looks like done well — nobody notices.',
  },
  servant: {
    name: 'THE DEADLINE’S SERVANT',
    text: 'The clock made your decisions today. The release was fluent, fast, and wrong — and the person it hurt wasn’t the one who wrote it. Fluency is not accuracy. Speed is not judgment.',
  },
  recovery: {
    name: 'THE HONEST RECOVERY',
    text: 'The wrong number got out — and you chose the harder, better repair: a public correction and a real apology. Wisdom isn’t never being wrong. It’s what you do at 11:30 a.m. when you are.',
  },
  perfectionist: {
    name: 'THE PERFECTIONIST’S DAWN',
    text: 'Everything you shipped was true — and late. The moment passed while you checked the last box. Calibration cuts both ways: under-trust has a cost too, it’s just quieter. Next time, decide which checks matter most.',
  },
};

export const CAPACITIES = {
  judgment:  { name: 'Judgment',          desc: 'Did you verify what mattered before acting on it?' },
  curiosity: { name: 'Curiosity',         desc: 'Did you open the evidence — the poster, the pixels, the citation?' },
  ethics:    { name: 'Ethical Reasoning', desc: 'Fabricated quotes, quiet edits, blaming the tool — what did you choose?' },
  empathy:   { name: 'Empathy',           desc: 'Jordan is a person, not a source. Did you treat her like one?' },
};

export const COPY = {
  title: 'The Phoenix Brief',
  eyebrow: 'ELON UNIVERSITY · AI & CRITICAL THINKING',
  subtitle: 'One morning in University Communications. One AI assistant. Every choice branches.',
  fiction: [
    'You are the new student intern in Elon’s Office of University Communications. NOVA, the office AI, has already drafted today’s big story.',
    'Everything NOVA writes is fluent. Some of it is true.',
    'Read the evidence. Question the machine. Mind the clock — College Coffee is at 9:40.',
  ],
  closing: 'NOVA wasn’t malicious. It was confident — which is cheaper. The four capacities below weren’t graded on what you said; they were graded on what you opened, checked, and chose while a clock was running.',
  courseLine: 'Human Wisdom for the Age of AI · Elon University',
};
