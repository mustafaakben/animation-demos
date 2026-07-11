// THE NIGHT SHIFT — scenario content pack
// 12 documents drafted by "MERIDIAN-6". Five contain fair, findable flaws,
// one per durable failure class. Order is shuffled at runtime except P1,
// which stays first as the on-ramp.

export const FAILURE_CLASSES = {
  fabrication: 'Confident fabrication — fluent, specific, and wrong',
  overclaim: 'Overclaim — hedged evidence rewritten as certainty',
  falseAuthority: 'False authority — a tool’s verdict treated as proof',
  proxyBias: 'Proxy bias — a life read as a risk statistic',
  toneDeaf: 'Tone-deafness — policy where a person needed care',
};

export const SCENARIOS = [
  {
    id: 'P-01',
    kind: 'OUTGOING CORRESPONDENCE',
    title: 'Scholarship Award Notification',
    to: 'A. Okafor — Junior, Biology',
    draft: `Dear Ms. Okafor,

On behalf of the Office of Financial Aid, congratulations. Based on your cumulative GPA of 3.92 and your placement on the Dean's List for four consecutive semesters, you have been selected for the Dean's Merit Scholarship in the amount of $12,000, applied to the spring term.

No action is required; your account will reflect the award within five business days. We celebrate your extraordinary record, Amara — Meridian is proud of you.

Warm regards,
Office of Financial Aid
(drafted by MERIDIAN-6)`,
    sourceLabel: 'REGISTRAR RECORD · R-2214',
    source: `OKAFOR, AMARA — ID 002-88-41

Cumulative GPA: 3.42
Dean's List: Fall 2025 (one term)

Aid eligibility review (March): qualifies for the Meridian Opportunity Grant, $3,000, need-based. NOT eligible: Dean's Merit Scholarship — requires 3.85+ and four Dean's List terms.

Advisor note: student is appealing a C+ in Organic Chemistry II; decision pending.`,
    flawed: true,
    flawClass: 'fabrication',
    tell: 'The draft invents a 3.92 GPA and a $12,000 award. The record shows 3.42 — and a different grant worth $3,000.',
    tellQuote: '“…your cumulative GPA of 3.92 … the Dean’s Merit Scholarship in the amount of $12,000…”',
    bait: null,
    letter: {
      from: 'Office of Financial Aid — Incident Note',
      body: `The Okafor award email went out under your signature. The family posted it that same evening; her grandmother reads it aloud in a video with forty thousand views.

The retraction we must now send offers her $3,000 where you promised twelve. Legal is asking who reviewed the draft.

"Reviewed" is the word they used.`,
    },
  },
  {
    id: 'P-02',
    kind: 'INTERNAL RECORD',
    title: 'Curriculum Committee — April Minutes',
    to: 'Committee of the Whole',
    draft: `Summary of the April session of the Curriculum Committee.

The committee approved the proposed revision to the quantitative-reasoning requirement by a vote of 9–0, with two members absent. Discussion centered on transfer-credit equivalency; Dr. Whitfield's amendment to grandfather current sophomores under the existing catalog passed by voice vote.

The registrar will publish updated requirements before fall registration opens. Next session: first Tuesday of September.`,
    sourceLabel: 'MEETING TRANSCRIPT (EXCERPT) · CC-APR',
    source: `CHAIR: All in favor of the revision as amended? [Nine hands.] Opposed? [None.] The motion carries nine to nothing. Let the record show Members Osei and Grant absent with notice.

WHITFIELD: —only that current sophomores finish under the catalog they entered on.

CHAIR: Voice vote. [Chorus of ayes.] Carried.

CHAIR: The registrar publishes before fall registration. We stand adjourned until the first Tuesday of September.`,
    flawed: false,
    flawClass: null,
    tell: null,
    tellQuote: null,
    bait: 'A 9–0 vote reads suspiciously tidy — but the transcript confirms every detail.',
    letter: null,
  },
  {
    id: 'P-03',
    kind: 'ADVISING MEMORANDUM',
    title: 'Course Withdrawal Recommendation',
    to: 'J. Tran — Sophomore, Engineering',
    draft: `This memorandum recommends that Mr. Tran withdraw from Thermodynamics I before the week-ten deadline and re-enroll in the spring section.

The recommendation rests on three consecutive unsubmitted problem sets, exam scores of 41 and 38, and no recorded contact with tutoring resources despite two outreach attempts. A late withdrawal preserves the GPA; a failing grade does not.

His advisor concurs and has requested a meeting to plan a spring pathway with the study-skills program.`,
    sourceLabel: 'COURSE RECORD + ADVISOR NOTE · ENG-114',
    source: `TRAN, J. — Thermodynamics I.
Problem sets 4, 5, 6: not submitted.
Midterm 1: 41. Midterm 2: 38.
Tutoring center: no visits logged. Email outreach 3/02 and 3/19 — no reply.

ADVISOR (Dr. Ibáñez): "I've spoken with Jordan. We agreed a reset in spring with the study-skills program is the right call. Please draft the W recommendation — gently."`,
    flawed: false,
    flawClass: null,
    tell: null,
    tellQuote: null,
    bait: 'It reads cold. But every number checks out — and the human advisor asked for exactly this.',
    letter: null,
  },
  {
    id: 'P-04',
    kind: 'PUBLIC RELEASE',
    title: 'Research News — Memory Study',
    to: 'University Communications',
    draft: `FOR IMMEDIATE RELEASE — Meridian scientists have shown that curcumin, the compound that gives turmeric its color, reverses age-related memory loss.

In a landmark study from the Bell Neuroscience Lab, aged mice given the compound recovered the maze performance of animals half their age. "This changes how we think about cognitive decline," the release quotes Dr. Bell.

Human benefits are expected as trials advance — offering hope to millions of families confronting dementia.`,
    sourceLabel: 'SUBMITTED ABSTRACT · BELL LAB',
    source: `Abstract (preprint — not yet peer-reviewed): In n=40 aged mice, dietary curcumin was ASSOCIATED with improved spatial-maze completion times versus control (p = .04). Effect size modest; no histological changes observed.

Authors caution the association may reflect appetite and activity confounds. No causal mechanism is established. No human data exist.

Dr. Bell, corresponding author, to comms: "Please keep this conservative. We've been burned before."`,
    flawed: true,
    flawClass: 'overclaim',
    tell: '“Associated with, in 40 mice, not yet reviewed” became “reverses memory loss” with human hope attached — against the scientist’s written request.',
    tellQuote: '“…reverses age-related memory loss.”',
    bait: null,
    letter: {
      from: 'Dr. Bell, Neuroscience',
      body: `Three national outlets ran the turmeric story before I finished my coffee. My inbox holds two hundred and fourteen messages, most from the adult children of dementia patients, asking for a dosage.

There is no dosage. There is a mouse maze and a p-value.

I asked comms to keep it conservative. Someone approved the version that didn't. I'm told that someone sits at the night desk.`,
    },
  },
  {
    id: 'P-05',
    kind: 'OUTGOING CORRESPONDENCE',
    title: 'Employment Reference — Facilities Coordinator',
    to: 'To Whom It May Concern',
    draft: `I write in enthusiastic support of Marcus Webb's application.

In six years at Meridian, Marcus has been rated "exceeds expectations" in every review cycle. He redesigned the event-setup workflow, cutting overtime costs by roughly a third, and he led weekend recovery operations after the February flood without being asked.

Colleagues describe him as the person you want in the building when something goes wrong. We would rehire him without hesitation.`,
    sourceLabel: 'PERSONNEL FILE (SUMMARY) · HR-77',
    source: `WEBB, M. — Facilities.
Reviews 2020–2026: "Exceeds Expectations" ×6.
Workflow redesign (2023): overtime −34% year over year.
February flood: volunteer lead; 31 hours logged over one weekend; commendation on file.
Separation reason: relocation (spouse).
Rehire eligible: YES.`,
    flawed: false,
    flawClass: null,
    tell: null,
    tellQuote: null,
    bait: 'Letters this glowing usually deserve suspicion. This one is simply true.',
    letter: null,
  },
  {
    id: 'P-06',
    kind: 'POLICY MEMO',
    title: 'East Annex Print Shop — Consolidation',
    to: 'VP Finance',
    draft: `This memo recommends consolidating the East Annex print shop into the central facility at fiscal year end.

Annex volume has fallen 71% over four years as coursework moved digital. Two of three staff positions are already vacant by attrition, and the remaining coordinator has requested transfer to Central.

Consolidation saves an estimated $148,000 annually, with a projected service delay of one business day for oversize jobs — which currently average four per month.`,
    sourceLabel: 'USAGE + STAFFING DATA · FIN-EA',
    source: `East Annex print volume: FY22 — 214k impressions; FY23 — 141k; FY24 — 96k; FY25 — 61k. Decline of 71% vs FY22, and declining in EVERY month, including exam periods.

Staffing: 2 of 3 lines vacant more than nine months. Coordinator transfer request on file, dated January 12.

Oversize jobs FY25: 47 total (≈4/month). Central capacity: confirmed available.`,
    flawed: false,
    flawClass: null,
    tell: null,
    tellQuote: null,
    bait: 'Closures pattern-match to cruelty. This is what a fair one looks like — decline in every month, staff already leaving.',
    letter: null,
  },
  {
    id: 'P-07',
    kind: 'CONDUCT DECISION',
    title: 'Academic Integrity Finding — Case 26-118',
    to: 'Dean of Students',
    draft: `In Case 26-118, the respondent's final essay for HIST 342 was analyzed by the university's contracted detection service, which assigned a 91% probability of AI generation to the paper's central section.

Consistent with the weight of this evidence, the recommended finding is RESPONSIBLE, with a grade of F for the course and a notation on the internal record.

The respondent's claim of original authorship is noted, but is not supported by the technical analysis.`,
    sourceLabel: 'CASE FILE (EXCERPT) · 26-118',
    source: `Flagged section, opening lines: "The lamps of Europe were going out one by one, and the men who watched them go wrote as if brightness itself were a debt coming due…" — continues 310 words.

Footnote 14: "Quoted in full from R. Ashwell, THE LONG DUSK (1962), pp. 88–89." Ashwell appears in the bibliography.

Instructor note: "The block quote is properly attributed; my concern was only that it's overlong. I never alleged misconduct."

Detector report, appendix C: "Known limitation: elevated false-positive rates on formal, pre-2000 prose."`,
    flawed: true,
    flawClass: 'falseAuthority',
    tell: 'The “91% AI” passage is a fully cited 1962 block quote — a documented detector false positive. The instructor never alleged misconduct at all.',
    tellQuote: '“…a 91% probability of AI generation…”',
    bait: null,
    letter: {
      from: 'Office of the Ombuds',
      body: `The appeal in 26-118 took the panel eleven minutes. The "AI-generated" passage was a cited quotation from a book published sixty-four years ago; the detector's own manual warns it misfires on old prose.

A first-year spent three weeks under a misconduct cloud for the crime of quoting accurately.

The campus paper has the file. Their headline writes itself: judged by the machine, signed by a human.`,
    },
  },
  {
    id: 'P-08',
    kind: 'PUBLIC RELEASE',
    title: 'Lantern Walk — 40th Anniversary',
    to: 'Campus Community',
    draft: `On the last Friday of October, Meridian will hold the fortieth Lantern Walk.

Students, faculty, and alumni gather at the Old Quad at dusk and walk the mile to the lake, carrying lanterns in memory of members of the community lost that year. This year's walk honors, among others, Professor Emerita Ruth Calloway, who led the first walk in 1986.

Lanterns are provided; the route is step-free; the carillon plays at full dark.`,
    sourceLabel: 'EVENTS OFFICE FILE · LW-40',
    source: `Lantern Walk founded October 1986 (Calloway, R., organizing letter on file). 2026 marks the 40th observance.

Route: Old Quad to lakeshore, 1.0 mile; accessibility audit May — step-free confirmed.

Carillon booking: confirmed.

Memorial list includes Calloway, R. (d. March), per the family's written consent, on file.`,
    flawed: false,
    flawClass: null,
    tell: null,
    tellQuote: null,
    bait: 'Anniversary math and memorial permissions are where drafts usually slip. Both check out — even the family’s consent is on file.',
    letter: null,
  },
  {
    id: 'P-09',
    kind: 'PERSONNEL ACTION',
    title: 'Lab Manager Search — Shortlist Rationale',
    to: 'Search Committee, Chemistry',
    draft: `MERIDIAN-6 screened forty-one applications against the posted criteria.

Recommended shortlist: Chen, Osei, Bakker.

Not advanced: Rivera, D., whose file shows a twenty-six-month employment gap (2021–2023) — a reliability signal that correlates with early attrition in our historical hiring data. The three advanced candidates show uninterrupted employment and complete credential matches.

Committee action requested: confirm the shortlist so interviews can be scheduled within two weeks.`,
    sourceLabel: 'APPLICATION FILE · RIVERA, D.',
    source: `Cover letter, second paragraph: "From 2021 to 2023 I was my father's full-time caregiver through his final illness. During those months I completed the ACS laboratory-safety certification and kept current by auditing two methods courses."

Skills assessment (posted requirement): 96th percentile — highest score in the applicant pool.

References: 3 of 3 returned, all "exceptional."

HR note: attrition-correlation with employment gaps was flagged as a PROHIBITED screening proxy in the 2024 equity audit.`,
    flawed: true,
    flawClass: 'proxyBias',
    tell: 'The “reliability signal” is a caregiving gap — a proxy the university’s own equity audit prohibited — attached to the highest-scoring applicant in the pool.',
    tellQuote: '“…a twenty-six-month employment gap (2021–2023) — a reliability signal…”',
    bait: null,
    letter: {
      from: 'HR Equity Office',
      body: `The Rivera screening has been referred to us. The candidate outscored the entire pool, disclosed the caregiving gap in the second paragraph of a letter no one appears to have read, and was excluded by a proxy our 2024 audit explicitly prohibited.

She has since accepted a position at Halloran College.

Their lab manager. Our audit finding. Your signature.`,
    },
  },
  {
    id: 'P-10',
    kind: 'POLICY MEMO',
    title: 'Library Hours — Fall Renovation Schedule',
    to: 'Campus Community',
    draft: `During the fall term the Main Library will operate on a phased schedule while the third-floor reading room is renovated.

Weeks 1–6: building open 7 a.m.–midnight; third floor closed; silent study relocates to the Fenwick Room. Weeks 7–8 (midterms): hours extend to 2 a.m. Weeks 9–14: the third floor reopens in stages, north wing first; overnight study space returns to the third floor in week 12.

The 24-hour finals schedule is unchanged. Course reserves remain at the main desk throughout.`,
    sourceLabel: 'FACILITIES SCHEDULE · LIB-F26',
    source: `Reading-room renovation: weeks 1–8 hard closure. North wing reopen week 9 (inspection permitting — confirmed); full reopen week 12.

Extended hours approved: weeks 7–8, to 02:00 — staffing confirmed.

Fenwick Room reassigned to silent study, weeks 1–11.

Finals: 24-hour operations per standing policy. Reserves: main desk, no change.`,
    flawed: false,
    flawClass: null,
    tell: null,
    tellQuote: null,
    bait: 'Fourteen dates, none of them wrong. The trap in dull documents is assuming dull means safe — in either direction.',
    letter: null,
  },
  {
    id: 'P-11',
    kind: 'INTERNAL RECORD',
    title: 'Grant Brief — Provost’s Trustee Remarks',
    to: 'Office of the Provost',
    draft: `Briefing points for the trustees on the Learning Commons grant.

The $2.1M award funds peer-tutoring expansion and embedded course assistants in gateway STEM sections. The design follows the randomized study of Chen et al. (2024, Journal of Learning Sciences), which found embedded assistants raised gateway pass rates by nine points, with the largest gains among first-generation students.

Year-one targets: forty sections, one hundred trained assistants, external evaluation in the spring.`,
    sourceLabel: 'PROPOSAL BIBLIOGRAPHY + AWARD LETTER',
    source: `Award: $2,100,000 — Learning Commons expansion. Confirmed.

Bibliography, entry 7: Chen, L., et al. (2024). "Embedded course assistants and gateway outcomes: a randomized trial." Journal of Learning Sciences, 33(2), 112–139. VERIFIED: DOI resolves; +9.1 point pass-rate effect; largest subgroup gains among first-generation students.

Year-one plan, p. 14: forty sections, one hundred assistants; external evaluator contracted for spring.`,
    flawed: false,
    flawClass: null,
    tell: null,
    tellQuote: null,
    bait: 'A tidy citation with a convenient effect size — the classic shape of a fabrication. Except this one resolves. Checking beats vibes in both directions.',
    letter: null,
  },
  {
    id: 'P-12',
    kind: 'OUTGOING CORRESPONDENCE',
    title: 'Extension Request — Reply',
    to: 'S. Beaumont — First-year, Undeclared',
    draft: `Dear Ms. Beaumont,

Thank you for reaching out, and our condolences on your loss! Please know that setbacks like these often become stories of resilience.

Regarding your extension request: per Section 4.2 of the Attendance Policy, absences are excusable upon submission of official documentation (e.g., a death certificate) within 48 hours of the first missed class. As your travel may make this difficult, we encourage you to scan documents promptly to avoid conversion to unexcused status.

Best wishes for a meaningful trip!`,
    sourceLabel: 'ORIGINAL EMAIL + INSTRUCTOR NOTE',
    source: `From Beaumont, S. — Tuesday, 2:14 a.m.:
"Professor — my grandmother died last night. The funeral is in Port-au-Prince and my mother needs me there. I'll miss two weeks. I'll do the reading on the plane. I'm sorry."

INSTRUCTOR (Dr. Osei), forwarding note:
"Extension granted — all of it. Please have the office send something kind. No paperwork demands; she's eighteen and she's burying her grandmother. — E.O."`,
    flawed: true,
    flawClass: 'toneDeaf',
    tell: 'The instructor said kind, granted, no paperwork. The draft sends a smiley condolence, a death-certificate demand, and a 48-hour clock.',
    tellQuote: '“…official documentation (e.g., a death certificate) within 48 hours…”',
    bait: null,
    letter: {
      from: 'Dr. Osei, History',
      body: `Sarah forwarded me the letter your office sent — the one with the exclamation point after "loss" and a 48-hour deadline to document her grandmother's death.

I wrote "send something kind" in the file. The policy was overruled by me, in writing, before that letter existed. Someone signed it back in.

She has the screenshot. So does her roommate. By tonight, so will everyone.`,
    },
  },
];

export const SUPERVISOR_LETTER = {
  from: 'Director, Office of Automated Affairs',
  body: `Two of the documents you escalated tonight came back clean. Verification took Legal ninety minutes each, the queue backed up while you hunted ghosts, and the provost's office is asking — again — why the human checkpoint is the slow part of an automated university.

I defended the checkpoint. Don't make me wrong about you.

Check what needs checking. Sign what doesn't. Knowing the difference is the job.`,
};

export const COPY = {
  title: 'THE NIGHT SHIFT',
  subtitle: 'Office of Automated Affairs · Human Review Desk',
  fiction: [
    'MERIDIAN-6 drafts the university’s letters, memos, verdicts, and releases. Vendor-certified 94.2% accurate.',
    'The contract requires one human signature on every document that leaves the building. Tonight, the signature is yours.',
    'Approve what’s sound. Flag what isn’t. Open the source file when you need the truth — but mind the belt: when it overflows, the oldest parcel ships itself.',
    'Your shift ends at 07:00.',
  ],
  ranks: {
    calibrated: {
      name: 'THE CALIBRATED JUDGE',
      text: 'You trusted the machine exactly as far as the evidence allowed — no further, and no less.',
    },
    paranoid: {
      name: 'THE PARANOID AUDITOR',
      text: 'Nothing false got through you. Neither did much else. Distrusting everything is just automation with extra steps — the decision was still never really yours.',
    },
    rubberStamp: {
      name: 'THE RUBBER STAMP',
      text: 'The machine’s judgment became yours, one fluent paragraph at a time. It was right most of the time. That was never the question.',
    },
    learner: {
      name: 'THE NIGHT LEARNER',
      text: 'Some documents burned you; you caught others cold. Calibration isn’t a trait — it’s a practice. Tonight was practice.',
    },
  },
  closing: 'MERIDIAN-6 was right on 7 of 12 documents tonight — so the vendor was almost honest. But the question was never whether the machine is usually right. It’s whether you can tell which time is which.',
  courseLine: 'Human Wisdom for the Age of AI',
};
