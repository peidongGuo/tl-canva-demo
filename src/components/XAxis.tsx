import { Renderer as CanvasRenderer } from "@antv/g-canvas";
import { Circle as CircleFn, Pattern } from "@antv/g";
import { Canvas, Rect, Circle, Line, Text, Path, HTML } from "@antv/react-g";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ILine, IText } from "../Models";

interface XAxisProps {
  canvasWidth: number;
  canvasHeight: number;
  xGridSize?: number;
  xOffset?: number;
  outXOffset?: number;
  outYBottomOffset?: number;
  outYTopOffset?: number;
  onePxValueX?: number;
  xRangeValue: number;
  axisLineColor?: string;
  axisLineWidth?: number;
}

export function transformDKValueToXValue(dkValue: string) {
  const dkValueArr = dkValue.split("DK")[1].split("-");
  return Number(dkValueArr[0]) * 1000 + Number(dkValueArr[1]);
}

export function transformXValueToDKValue(xValue: number) {
  return "DK" + Math.floor(xValue / 1000) + "-" + (xValue % 1000);
}

function XAxis(props: XAxisProps) {
  const [xAxisLines, setXAxisLines] = useState<Array<ILine>>([]);
  const [xTopTexts, setXTopTexts] = useState<Array<IText>>([]);

  function generateXAxisLines(
    gridSize: number = 50,
    outXOffset: number = 50,
    outYBottomOffset: number = 20,
    outYTopOffset: number = 20,
    canvasWidth: number,
    canvasHeight: number,
    xOffset: number = 20,
    onePxValueX: number = 1,
    xRangeValue: number,
    stroke: string = "#000",
    lineWidth: number = 1
  ) {
    // 方案一：只画在显示区的线，先判断第一条线的偏移量，然后循环递增 gridSize，直到达到 xRangeValue值或 canvasWidth
    const xAxisLines: Array<ILine> = [];
    let tmpFirstGridXOffset = xOffset % gridSize;
    let tmpOffsetXGridCount = Math.ceil(xOffset / gridSize);
    tmpFirstGridXOffset = tmpFirstGridXOffset
      ? gridSize - tmpFirstGridXOffset
      : 0;
    // TODO: 这个 for 循环的判断条件，需要优化
    for (
      let i = 0;
      (tmpFirstGridXOffset + i * gridSize) * onePxValueX < xRangeValue ||
      (i * gridSize < canvasWidth &&
        (tmpFirstGridXOffset + i * gridSize) * onePxValueX >= xRangeValue);
      i++
    ) {
      const x = tmpFirstGridXOffset + i * gridSize + outXOffset;
      let xValue = Math.floor(
        (i + tmpOffsetXGridCount) * gridSize * onePxValueX
      );
      let xLabel = "DK" + Math.floor(xValue / 1000) + "-" + (xValue % 1000);
      xAxisLines.push({
        x1: x,
        x2: x,
        y1: canvasHeight - outYBottomOffset,
        y2: 0,
        text: {
          x: x - (xLabel.length * 6) / 2,
          y: canvasHeight - outYBottomOffset + 8 + 4,
          content: xLabel,
        },
        stroke: stroke,
        lineWidth: lineWidth,
      });
    }
    // 方案二：把 xRangeValue 之间的线都画出来  TODO，理论来说更简单，只需要更好地控制偏移量和缩放量

    return xAxisLines;
  }

  function generateWorkPointDKRanges(
    onePxValueX: number = 1,
    outXOffset: number = 50,
    xOffset: number = 0,
    xRangeValue: number
  ) {
    // 做法：
    // step1. 将整体范围画一整条线；直接在 render 里画出来，不再返回；
    // let oneTotalLine: ILine = {
    //   x1: outXOffset,
    //   x2: xRangeValue,
    //   y1: 10,
    //   y2: 10,
    //   stroke: "#000",
    //   lineWidth: 1,
    // };
    // step2. 获取 text，有两类：一、某一 workPoint 的 DK 起始值；二、某一 workPoint 的 名字（加上，判断它是不是关键节点）；
    const WorkPointDKRangesData = [
      {
        dkStart: 0,
        dkEnd: 300,
        name: "仙山大桥",
        isKeyPoint: true,
      },
      {
        dkStart: 400,
        dkEnd: 600,
        name: "仙山大桥2",
        isKeyPoint: true,
      },
    ];

    let texts: Array<IText> = [];
    WorkPointDKRangesData.forEach((item) => {
      const startDKValue = transformXValueToDKValue(item.dkStart);
      const endDKValue = transformXValueToDKValue(item.dkEnd);
      texts.push({
        content: startDKValue,
        x:
          item.dkStart / onePxValueX -
          (startDKValue.length * 6) / 2 +
          outXOffset -
          xOffset,
        y: 10 + 3,
      });
      texts.push({
        content: item.name,
        x:
          (item.dkStart + item.dkEnd) / 2 / onePxValueX -
          (item.name.length * 8) / 2 +
          outXOffset -
          xOffset,
        y: 10 + 3,
      });
      texts.push({
        content: endDKValue,
        x:
          item.dkEnd / onePxValueX -
          (endDKValue.length * 6) / 2 +
          outXOffset -
          xOffset,
        y: 10 + 3,
      });
    });
    return texts;
  }

  useEffect(() => {
    const {
      xGridSize,
      xOffset,
      outXOffset,
      outYBottomOffset,
      outYTopOffset,
      canvasHeight,
      canvasWidth,
      onePxValueX,
      xRangeValue,
      axisLineColor,
      axisLineWidth,
    } = props;
    setXAxisLines(
      generateXAxisLines(
        xGridSize,
        outXOffset,
        outYBottomOffset,
        outYTopOffset,
        canvasWidth,
        canvasHeight,
        xOffset,
        onePxValueX,
        xRangeValue,
        axisLineColor,
        axisLineWidth
      )
    );
    setXTopTexts(
      generateWorkPointDKRanges(onePxValueX, outXOffset, xOffset, xRangeValue)
    );
  }, [props]);

  useEffect(() => {
    console.log("xAxisLines", transformDKValueToXValue("DK0-300"));
    console.log("xAxisLines", transformDKValueToXValue("DK5-300"));
    console.log("xAxisLines", transformXValueToDKValue(300));
    console.log("xAxisLines", transformXValueToDKValue(2300));
  });

  return (
    <>
      <Rect
        x={0}
        y={0}
        width={props.canvasWidth}
        height={20}
        fill={"#fff"}
        zIndex={5}
      />
      <Rect
        x={0}
        y={0}
        width={props.outXOffset || 0}
        height={20}
        fill={"#fff"}
        zIndex={7}
      />
      <Rect
        x={0}
        y={props.canvasHeight - 20}
        width={props.outXOffset || 0}
        height={20}
        fill={"#fff"}
        zIndex={5}
      />

      <Rect
        x={0}
        y={props.canvasHeight - 20}
        width={props.canvasWidth}
        height={20}
        fill={"#fff"}
        zIndex={5}
      />

      <Line
        key={`x-axis-top`}
        x1={props.outXOffset || 0}
        x2={props.xRangeValue}
        y1={10}
        y2={10}
        stroke={"#000"}
        lineWidth={1}
        zIndex={5}
      />

      {xTopTexts.map((text, index) => {
        return (
          <>
            <Rect
              x={text.x - 5}
              y={text.y - 4}
              width={text.content.length * 8 + 10}
              height={10 + 4}
              fill={"#fff"}
              zIndex={6}
            />
            {/* <Text
              key={`x-axis-top-text-${index}`}
              x={text.x}
              y={text.y}
              // wordWrapWidth={text.content.length * 8 + 10}
              // textAlign="right"
              text={text.content}
              fontSize={8}
              zIndex={6}
            /> */}
          </>
        );
      })}

      {xAxisLines.map((line, index) => {
        return (
          <>
            <Line
              key={`x-line-${index}`}
              x1={line.x1}
              x2={line.x2}
              y1={line.y1}
              y2={line.y2}
              stroke={line.stroke}
              lineWidth={line.lineWidth}
            />
            {/* <Text
              key={`x-label-${index}`}
              x={line.text!.x}
              y={line.text!.y}
              text={line.text!.content}
              fontSize={8}
              zIndex={5}
            /> */}
          </>
        );
      })}
    </>
  );
}

export default XAxis;
