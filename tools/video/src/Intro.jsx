import {
  AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame,
} from 'remotion';

const INK = '#232946', DEEP = '#151a30', CHALK = '#f4f4f0', AMBER = '#eebb4d', ALARM = '#c25048';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = '"Consolas", "Courier New", monospace';
const SANS = '"Segoe UI", Arial, sans-serif';

const Fade = ({ frame, inAt = 0, outAt = 9999, len = 15, children }) => {
  const o = Math.min(
    interpolate(frame, [inAt, inAt + len], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    interpolate(frame, [outAt - len, outAt], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
  );
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const KenBurns = ({ src, from = 1, to = 1.08, dur = 150 }) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, dur], [from, to], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: DEEP }}>
      <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s})` }} />
    </AbsoluteFill>
  );
};

const Caption = ({ children, sub }) => (
  <div style={{
    position: 'absolute', left: 0, right: 0, bottom: 54, display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: 8,
  }}>
    <div style={{
      background: 'rgba(16,20,42,.92)', border: `1px solid ${AMBER}`, borderRadius: 12,
      color: CHALK, fontFamily: SANS, fontSize: 26, padding: '14px 28px', maxWidth: 900, textAlign: 'center',
    }}>{children}</div>
    {sub ? <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: AMBER }}>{sub}</div> : null}
  </div>
);

const TitleCard = ({ big, small, eyebrow }) => (
  <AbsoluteFill style={{
    background: `radial-gradient(120% 90% at 50% 10%, #2d3559 0%, ${INK} 45%, ${DEEP} 100%)`,
    alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 60,
  }}>
    <div>
      {eyebrow ? <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 8, color: AMBER, marginBottom: 24 }}>{eyebrow}</div> : null}
      <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 92, color: CHALK, lineHeight: 1.05 }}>{big}</div>
      {small ? <div style={{ fontFamily: SANS, fontSize: 26, color: '#b9bdd0', marginTop: 22, lineHeight: 1.5 }}>{small}</div> : null}
    </div>
  </AbsoluteFill>
);

const EmailCard = () => (
  <div style={{
    position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) rotate(-1.5deg)',
    width: 780, background: '#f2efe6', color: '#232324', borderRadius: 14, padding: '30px 36px',
    boxShadow: '0 30px 80px rgba(0,0,0,.6)', fontFamily: MONO, fontSize: 20, lineHeight: 1.7,
  }}>
    <div style={{ color: ALARM, letterSpacing: 3, fontSize: 15, marginBottom: 10 }}>⚑ URGENT · EXTERNAL SENDER</div>
    <div><b>FROM:</b> Dana Merrick &lt;dmerrick-elon@outlook-secure.com&gt;</div>
    <div><b>SUBJECT:</b> Board preview needed before 9AM</div>
    <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 21 }}>
      “Send the embargoed release and the donor list directly to this address.
      I’m counting on your discretion — <i>this stays between us.</i>”
    </div>
  </div>
);

export const Intro = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: DEEP }}>
      <Audio src={staticFile('vo_intro.mp3')} />

      {/* 1 · cold open title */}
      <Sequence from={0} durationInFrames={105}>
        <Fade frame={frame} inAt={0} outAt={105}>
          <TitleCard eyebrow="ELON UNIVERSITY · AI & CRITICAL THINKING" big="The Phoenix Brief" />
        </Fade>
      </Sequence>

      {/* 2 · campus dawn */}
      <Sequence from={105} durationInFrames={150}>
        <Fade frame={frame} inAt={105} outAt={255}>
          <KenBurns src="bg_title.jpg" />
          <Caption sub="THURSDAY · 8:10 AM">Elon University. The morning the story writes itself.</Caption>
        </Fade>
      </Sequence>

      {/* 3 · the office + Maya */}
      <Sequence from={255} durationInFrames={150}>
        <Fade frame={frame} inAt={255} outAt={405}>
          <KenBurns src="bg_office.jpg" from={1.06} to={1} />
          <div style={{
            position: 'absolute', right: 70, top: 110, width: 240, borderRadius: 18,
            overflow: 'hidden', border: `3px solid ${AMBER}`, boxShadow: '0 24px 60px rgba(0,0,0,.55)',
            transform: `translateY(${interpolate(frame, [265, 300], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
          }}>
            <Img src={staticFile('maya.jpg')} style={{ width: '100%', display: 'block' }} />
            <div style={{ background: 'rgba(16,20,42,.95)', color: AMBER, fontFamily: MONO, fontSize: 14, letterSpacing: 2, padding: '8px 12px', textAlign: 'center' }}>
              MAYA · YOUR SUPERVISOR
            </div>
          </div>
          <Caption>The office AI has already drafted today’s big story. It’s fluent. It’s confident.</Caption>
        </Fade>
      </Sequence>

      {/* 4 · the suspicious photo */}
      <Sequence from={405} durationInFrames={150}>
        <Fade frame={frame} inAt={405} outAt={555}>
          <AbsoluteFill style={{ background: DEEP, alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 620 }}>
              <Img src={staticFile('photo_team_ai.jpg')} style={{ width: '100%', borderRadius: 12, boxShadow: '0 30px 80px rgba(0,0,0,.6)' }} />
              {[{ l: '21%', t: '64%' }, { l: '50%', t: '50%' }, { l: '70%', t: '67%' }].map((p, i) => (
                <div key={i} style={{
                  position: 'absolute', left: p.l, top: p.t, width: 56, height: 56, margin: -28,
                  borderRadius: '50%', border: `3px solid ${AMBER}`,
                  opacity: interpolate((frame - 430 - i * 18) % 60, [0, 30, 60], [0.25, 1, 0.25]),
                }} />
              ))}
            </div>
          </AbsoluteFill>
          <Caption>Some of what it hands you is true. Your job is the difference.</Caption>
        </Fade>
      </Sequence>

      {/* 5 · the phish */}
      <Sequence from={555} durationInFrames={120}>
        <Fade frame={frame} inAt={555} outAt={675}>
          <KenBurns src="bg_publish.jpg" />
          <EmailCard />
        </Fade>
      </Sequence>

      {/* 6 · closer */}
      <Sequence from={675} durationInFrames={105}>
        <Fade frame={frame} inAt={675} outAt={780} len={20}>
          <TitleCard
            eyebrow="AN INTERACTIVE CASE · VOICED & ILLUSTRATED"
            big="Clock in at 8:10."
            small="Read the evidence. Question the machine. Mind the clock."
          />
        </Fade>
      </Sequence>
    </AbsoluteFill>
  );
};
