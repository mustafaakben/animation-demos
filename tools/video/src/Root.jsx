import { Composition } from 'remotion';
import { Intro } from './Intro.jsx';

export const Root = () => (
  <Composition
    id="PhoenixIntro"
    component={Intro}
    durationInFrames={780}
    fps={30}
    width={1280}
    height={720}
  />
);
