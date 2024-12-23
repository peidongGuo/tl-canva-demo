import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Stage, Layer, Rect, Text, Circle, Line } from "react-konva";
const image = new Image();
image.src =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAIkSURBVDiNfdJdT88BGMbx73X/5mE2htmMcZpEmFkrRaFZ5YBozUvzEhRbFPJwQg6QllNESJqHlqe0PPzuy8H/X7MZL+D+7Lvdl3ac80mSWgerVDJKQa9MX0KjzIJhQqJDMJCmtYA3aT4RNAiuBaaT4LHMogsaqsdnA+5brJGosblu6A5xpxRbBRtkHqQ5EYIBTKfNU5UsJjQGnP8DWS1Rgxg2dAeMZLAFsTGCe5GmVTAg0WEzIbOQSdMSopJRm9UktZhraU4HjKTZQrIpMNNAm2BAwXGLZ1Ewn1QQRK/MKGKlRZ3gasKZECMWm0Pii2EKaJO4JHOckslI5oEmiT5Er82YYIVFXSRDCWcEdwNxwDD/J+KgnYLJhK9LiERPUUUQuwMGqyUMS+x38s3ilc0RwWWb9oCXKb5gDgr6S9FjM2YoEPWGwbDokLkewT7DgsQLw9EqckwwlfDZ0Czol+lxMu6kKMyesBk3dAI3wuxLsyiYNByVuEyl6LXho6FZQb+C0w7GDREka6lkVRCxt0y+yzyvlgwqaJWZxswZmiUuyHQnPApgewTrgIdOuoAbRUE94ofMc5tjmCEFrSQzmDmbFsHFEKcigttlsi3MemDU0IW5mabe8NNmwqogDg4jZghml5H/bPymYbfELydPbdpDDBkORclbzKxFS/xr48uI2CWRhifV114pg5YI3mE+BFBLyfBfG19C4BZip4wJHi8j0Bzw/jex/EBW9BtMywAAAABJRU5ErkJggg==";
const App = () => {
  const [xOffset, setXOffset] = useState(0);

  let count = 1;
  let interval;
  function handleDragMove(e) {
    console.log(e);
    interval = setInterval(() => {
      if (count > 1000) {
        interval && clearInterval(interval);
      }
      setXOffset(xOffset + 1);
      count++;
    }, 100);
  }

  return (
    <Stage
      onClick={handleDragMove}
      width={window.innerWidth}
      height={window.innerHeight}
    >
      <Layer>
        <Text text="Some text on canvas" fontSize={15} />
        <Rect
          x={20 + xOffset}
          y={50}
          width={100}
          height={100}
          // fill="red"
          // shadowBlur={10}
          fillPatternImage={image}
        />
        <Circle x={200 + xOffset} y={100} radius={50} fill="green" />
        <Line
          x={20 + xOffset}
          y={200}
          points={[0, 0, 100, 0, 100, 100]}
          tension={0.5}
          closed
          // stroke="black"
          fillPatternImage={image}
          fillPatternRepeat="repeat"
          // fillLinearGradientStartPoint={{ x: -50, y: -50 }}
          // fillLinearGradientEndPoint={{ x: 50, y: 50 }}
          // fillLinearGradientColorStops={[0, "red", 1, "yellow"]}
        />
      </Layer>
    </Stage>
  );
};

const container = document.getElementById("app");
const root = createRoot(container!);
root.render(<App />);
