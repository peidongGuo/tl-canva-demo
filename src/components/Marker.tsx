import { Renderer as CanvasRenderer } from "@antv/g-canvas";
import { Circle as CircleFn, Pattern } from "@antv/g";
import { Canvas, Rect, Circle, Line, Text, Path, HTML } from "@antv/react-g";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

interface MarkerProps {
  x: number;
  y: number;
  r: number;
  stroke: string;
  fill: string;
  strokeWidth: number;
  outXOffset: number;
  outYTopOffset: number;
  outYBottomOffset: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Marker 组件
 * 方案一：用 canvas 的画图方式来实现；优点：不用 html 节点，可以控制显示层级，可以和 tooltip 合成一个节点；缺点：不好控制动画，效率低下，动画不流畅；后续 ref 能拿到的话，可以实现它的动画；
 * 方案二：用 html 的节点来实现； 优点：实现快，动画流畅；缺点：不好控制显示层级，只能在 canvas 的层级上面，后续数量太多(测试过，大概是300左右)的话，可能会卡；
 * 方案三：marker 不要闪动，最好！
 * @param param
 * @returns
 */
function Marker({
  x,
  y,
  r,
  stroke,
  fill,
  strokeWidth,
  outXOffset,
  outYTopOffset,
  outYBottomOffset,
  canvasWidth,
  canvasHeight,
}: MarkerProps) {
  // const [strokeWidth2, setStrokeWidth2] = useState(strokeWidth);
  // function chgStrokeWidth() {
  //   if (strokeWidth2 < strokeWidth) {
  //     setStrokeWidth2(strokeWidth2 + 1);
  //   } else {
  //     setStrokeWidth2(0);
  //   }
  //   requestAnimationFrame(chgStrokeWidth);
  // }

  // useEffect(() => {
  //   chgStrokeWidth();
  // }, []);
  return (
    <>
      {x > outXOffset &&
        y > outYTopOffset &&
        x < canvasWidth - 2 * r &&
        y < canvasHeight - outYBottomOffset - 2 * r && (
          <HTML
            x={x - 20 / 2}
            y={y - 20 / 2}
            innerHTML={
              '<div class="bg-marker"><svg fill="#FED928" stroke="#FED928" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"></path></svg></div>'
            }
            zIndex={2}
          ></HTML>
        )}
      {/* <Circle
          zIndex={1}
          // ref={circleRef}
          cx={x}
          cy={y}
          r={r}
          stroke={stroke}
          strokeWidth={strokeWidth2}
          fill={fill}
          onClick={(e: any) => {
            console.log("circle click", e);
          }}
          onMousemove={(e: any) => {
            console.log("circle mousemove", e);
            // chgSubLines(e.canvas);
          }}
          onMouseout={(e: any) => {
            // chgSubLines({ x: 0, y: 0 });
          }}
        />
        <Path
          path={`M ${x - r / 2 - 4 + 3.75},${
            y - r / 2 - 4 + 13.5
          } l ${10.5}${-11.25}L${x - r / 2 - 4 + 12} ${
            y - r / 2 - 4 + 10.5
          }h${8.25}L${x - r / 2 - 4 + 9.75},${y - r / 2 - 4 + 21.75} ${
            x - r / 2 - 4 + 12
          },${y - r / 2 - 4 + 13.5}H${x - r / 2 - 4 + 3.75}z`}
          // path={"M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"}
          fill="#FED928"
          p-id="1505"
        ></Path> */}
    </>
  );
}
export default Marker;
