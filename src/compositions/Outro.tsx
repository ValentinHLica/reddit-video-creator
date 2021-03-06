import React from "react";
import { Composition, getInputProps, registerRoot } from "remotion";

import { video } from "../config/video";

import Outro from "../components/Outro";

import "../styles/main.scss";

const OutroComposition: React.FC = () => {
  const { fps, height, width } = video;

  return (
    <Composition
      id="outro"
      component={Outro}
      fps={fps}
      width={width}
      height={height}
      durationInFrames={1}
    />
  );
};

registerRoot(OutroComposition);

// export default OutroComposition;
