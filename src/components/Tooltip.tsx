import { Renderer as CanvasRenderer } from "@antv/g-canvas";
import { Circle as CircleFn, Pattern } from "@antv/g";
import { Canvas, Rect, Circle, Line, Text, Path, HTML } from "@antv/react-g";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

interface TooltipProps {
  x: number;
  y: number;
  width: number;
  height: number;
  arrowHeight?: number;
  arrowOffset?: number;
  radius?: number;
  fillColor?: string;
  text: string;
  fontSize?: number;
  fontColor?: string;
}
function Tooltip({
  x,
  y,
  width,
  height,
  arrowHeight = 5,
  arrowOffset = 0,
  radius = 5,
  fillColor = "red",
  text,
  fontSize = 10,
  fontColor = "#fff",
}: TooltipProps) {
  width = text.length * fontSize + 20;
  height = fontSize + 10;
  const path = `M ${x},${y} 
    L ${x - arrowHeight},${y - arrowHeight} 
    H ${x - (width / 2 - radius + arrowOffset)} 
    Q ${x - width / 2 - arrowOffset},${y - arrowHeight} ${
    x - width / 2 - arrowOffset
  },${y - (arrowHeight + radius)} 
    a${y - (height + arrowHeight - radius)} 
    Q ${x - width / 2 - arrowOffset},${y - (height + arrowHeight)} ${
    x - (width / 2 - radius) - arrowOffset
  },${y - (height + arrowHeight)} 
    H ${x + (width - radius * 2) / 2 - arrowOffset} 
    Q ${x + width / 2 - arrowOffset},${y - (height + arrowHeight)} ${
    x + width / 2
  },${y - (height - radius + arrowHeight)}  
    V ${y - (radius + arrowHeight)} 
    Q ${x + width / 2 - arrowOffset},${y - arrowHeight} ${
    x + (width - radius * 2) / 2
  },${y - arrowHeight}
    H ${x + arrowHeight} 
    z`;
  console.log("path", path);
  return (
    <>
      <Path fill={"red"} path={path} />
      {/* <Text
        x={x}
        y={y - arrowHeight - height + fontSize + 2}
        // wordWrapWidth={width}
        // lineHeight={height / 2}
        text={text}
        textAlign="center"
        fill={fontColor}
        fontSize={fontSize}
      ></Text> */}
      {/* <Circle
                // ref={circleRef}
                key={"confliction-point" + index}
                class="scale-in-center"
                cx={point.x}
                cy={point.y}
                r={5}
                stroke="red"
                fill={"red"}
                onClick={(e: any) => {
                  console.log("circle click", e);
                }}
                onMousemove={(e: any) => {
                  console.log("circle mousemove", e);
                  chgSubLines(e.canvas);
                }}
                onMouseout={(e: any) => {
                  chgSubLines({ x: 0, y: 0 });
                }}
              /> */}
      {/* <Text ref={circleRef} x={200} y={200} text="hello" fontSize={10} /> */}
      {/* <Path
          fill={"red"}
          path="M 200,200 L 185,185 H 121 Q 116,185 116,180 V 115 Q 116,110+121,110 
H 261 Q 266,110 266,115 V 180 Q 266,185 261,185 H 215 z"
        /> */}
    </>
  );
}

export default Tooltip;
