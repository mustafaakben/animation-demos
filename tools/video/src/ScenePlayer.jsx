// ScenePlayer — one parameterized composition that plays a scene's dialogue as video.
// Driven entirely by a manifest `video` entry: KenBurns base + per-line shots
// (narrator → caption over art, nova → typed-monitor chat, others → talking card).
import {
  AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame,
} from 'remotion';
import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadKarla } from '@remotion/google-fonts/Karla';
import { loadFont as loadMono } from '@remotion/google-fonts/IBMPlexMono';

const { fontFamily: SERIF } = loadFraunces();
const { fontFamily: SANS } = loadKarla();
const { fontFamily: MONO } = loadMono();

const INK = '#232946', DEEP = '#151a30', CHALK = '#f4f4f0', AMBER = '#eebb4d';
const BLUE = '#6a9bcc', ALARM = '#c25048';

const WHO_COLOR = { maya: AMBER, nova: AMBER, jordan: '#9fd0c6', sam: '#9db9e0', narrator: '#c9cde0' };

/* caption font scales down as the line grows */
const capSize = len => (len <= 90 ? 30 : len <= 150 ? 26 : len <= 220 ? 22 : 19);

const KenBurns = ({ src, dur }) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, dur], [1.02, 1.1], { extrapolateRight: 'clamp' });
  const x = interpolate(frame, [0, dur], [0, -2], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: DEEP, overflow: 'hidden' }}>
      <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s}) translateX(${x}%)` }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(10,13,28,.35) 0%, rgba(10,13,28,0) 28%, rgba(10,13,28,.12) 55%, rgba(10,13,28,.9) 100%)' }} />
    </AbsoluteFill>
  );
};

const NamePlate = ({ name, role, who }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <span style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 3, color: WHO_COLOR[who] || AMBER }}>{name}</span>
    {role ? <span style={{ fontFamily: SANS, fontSize: 13, color: '#9ba1c0', marginTop: 2 }}>{role}</span> : null}
  </div>
);

const Waveform = ({ color }) => {
  const frame = useCurrentFrame();
  const bars = 22;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 26 }}>
      {Array.from({ length: bars }, (_, i) => {
        const h = 4 + 20 * Math.abs(Math.sin(frame * 0.28 + i * 0.6)) * (0.5 + 0.5 * Math.sin(i));
        return <span key={i} style={{ width: 3, height: h, background: color, borderRadius: 2, opacity: 0.85 }} />;
      })}
    </div>
  );
};

/* lower-third talking card for maya / jordan / sam */
const TalkingCard = ({ seg }) => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, 12], [40, 0], { extrapolateRight: 'clamp' });
  const op = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const size = capSize(seg.text.length);
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', padding: '0 64px 54px' }}>
      <div style={{ width: '100%', maxWidth: 1040, background: 'rgba(16,20,42,.93)', border: `1px solid #3c4468`,
        borderRadius: 20, padding: '22px 26px', transform: `translateY(${rise}px)`, opacity: op, boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
          {seg.portrait ? <Img src={staticFile(seg.portrait)} style={{ width: 68, height: 68, borderRadius: 14, objectFit: 'cover', border: `2px solid ${AMBER}` }} /> : null}
          <NamePlate name={seg.name} role={seg.role} who={seg.who} />
          <div style={{ flex: 1 }} />
          <Waveform color={WHO_COLOR[seg.who] || AMBER} />
        </div>
        <div style={{ fontFamily: SANS, fontSize: size, lineHeight: 1.5, color: CHALK }}>{seg.text}</div>
      </div>
    </AbsoluteFill>
  );
};

/* narrator: centered italic caption over the art, no card */
const NarratorCaption = ({ seg }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' });
  const size = capSize(seg.text.length);
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', padding: '0 90px 70px' }}>
      <div style={{ maxWidth: 960, textAlign: 'center', opacity: op }}>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: size + 2, lineHeight: 1.5, color: '#e7e9f2', textShadow: '0 2px 20px rgba(0,0,0,.8)' }}>{seg.text}</div>
      </div>
    </AbsoluteFill>
  );
};

/* NOVA: an illustrated monitor where the message types itself out */
const ChatShot = ({ seg }) => {
  const frame = useCurrentFrame();
  const reveal = Math.floor(interpolate(frame, [6, seg.audioFrames * 0.85], [0, seg.text.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const shown = seg.text.slice(0, reveal);
  const caretOn = Math.floor(frame / 15) % 2 === 0;
  const rise = interpolate(frame, [0, 14], [24, 0], { extrapolateRight: 'clamp' });
  const op = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const size = seg.text.length > 180 ? 24 : 28;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '70px 90px 130px' }}>
      <div style={{ width: '100%', maxWidth: 900, transform: `translateY(${rise}px)`, opacity: op }}>
        {/* monitor bezel */}
        <div style={{ background: '#0c1024', border: '3px solid #2b3357', borderRadius: 16, padding: 22, boxShadow: '0 30px 80px rgba(0,0,0,.55), 0 0 60px rgba(238,187,77,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #ffe6a8, #eebb4d 60%, #b98a2f)', boxShadow: '0 0 18px rgba(238,187,77,.6)' }} />
            <span style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 3, color: AMBER }}>NOVA</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 2, color: '#5b6a8c' }}>ASSISTANT</span>
          </div>
          {/* assistant bubble */}
          <div style={{ background: 'rgba(238,187,77,.1)', border: '1px solid rgba(238,187,77,.35)', borderRadius: 14, padding: '18px 20px', minHeight: 120 }}>
            <span style={{ fontFamily: SANS, fontSize: size, lineHeight: 1.5, color: CHALK }}>{shown}</span>
            <span style={{ display: 'inline-block', width: 11, height: size, marginLeft: 2, background: caretOn ? AMBER : 'transparent', verticalAlign: 'text-bottom' }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ScenePlayer = ({ video }) => (
  <AbsoluteFill style={{ background: DEEP }}>
    <KenBurns src={video.bg} dur={video.durationInFrames} />
    {video.segments.map(seg => (
      <Sequence key={seg.lineId} from={seg.from} durationInFrames={seg.durationInFrames}>
        <Audio src={staticFile(seg.lineId + '.mp3')} />
        {seg.shot === 'chat' ? <ChatShot seg={seg} />
          : seg.shot === 'talkingCard' ? <TalkingCard seg={seg} />
            : <NarratorCaption seg={seg} />}
      </Sequence>
    ))}
  </AbsoluteFill>
);
