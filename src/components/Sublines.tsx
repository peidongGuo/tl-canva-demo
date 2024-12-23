import { Renderer as CanvasRenderer } from "@antv/g-canvas";
import { Circle as CircleFn, Pattern } from "@antv/g";
import { Canvas, Rect, Circle, Line, Text, Path, HTML } from "@antv/react-g";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ILine, Point } from "../Models";

interface SublinesProps {
  point: Point;
  canvasWidth: number;
  canvasHeight: number;
  outYOffset?: number;
}

function Sublines(props: SublinesProps) {
  const [subLines, setSubLines] = useState<Array<ILine>>([]);

  useEffect(() => {
    const { x, y } = props.point;
    const { canvasWidth, canvasHeight, outYOffset = 20 } = props;
    //  更新辅助线数据,当前鼠标在 canvas 场景中的坐标点（从左上角算）
    if (x === 0 && y === 0) {
      setSubLines([]);
      return;
    }
    let subLines = [];
    subLines.push({
      x1: 50,
      x2: x,
      y1: y,
      y2: y,
      stroke: "#000",
      lineWidth: 1,
    });
    subLines.push({
      x1: x,
      x2: x,
      y1: y,
      y2: canvasHeight - outYOffset,
      stroke: "#000",
      lineWidth: 1,
    });
    console.log(subLines, "subline");

    setSubLines(subLines);
  }, []);
  return (
    <>
      {subLines.map((line, index) => {
        return <Line lineDash={5} key={`sub-line-${index}`} {...line} />;
      })}
    </>
  );
}

export default Sublines;
