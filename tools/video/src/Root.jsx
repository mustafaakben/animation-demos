import { Composition } from 'remotion';
import { Intro } from './Intro.jsx';
import { ScenePlayer } from './ScenePlayer.jsx';
import manifest from './manifest.json';

export const Root = () => (
  <>
    <Composition
      id="PhoenixIntro"
      component={Intro}
      durationInFrames={780}
      fps={30}
      width={1280}
      height={720}
    />
    {manifest.videos.map(v => (
      <Composition
        key={v.file}
        id={`Scene-${v.sceneId}${v.variant ? '-' + v.variant : ''}`}
        component={ScenePlayer}
        durationInFrames={v.durationInFrames}
        fps={manifest.fps}
        width={1280}
        height={720}
        defaultProps={{ video: v }}
      />
    ))}
  </>
);
