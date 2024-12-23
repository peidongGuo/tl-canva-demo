import { Renderer as CanvasRenderer } from "@antv/g-canvas";
import { CanvasEvent, Circle as CircleFn, Pattern } from "@antv/g";
import { Canvas, Rect, Circle, Line, Text, Path, HTML } from "@antv/react-g";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import "./main.css";
import Marker from "./components/Marker";
import Tooltip from "./components/Tooltip";
import XAxis from "./components/XAxis";
import YAxis, { YAxisMode } from "./components/YAxis";
import Sublines from "./components/Sublines";
import { type Point, type ILine, type IRect } from "./Models";
import { Intersect2lines, viewportToCanvasPosition } from "./utils";
import { Renderer as WebGLRenderer } from "@antv/g-webgl";

const renderer = new CanvasRenderer();
const webglRenderer = new WebGLRenderer({
  targets: ["webgl2"],
});

interface TimeLocationDiagramProps {
  workPointLines?: Array<ILine>;
  resumptionAreas?: Array<IRect>;
  conflictionPoints?: Array<Point>;
  canvasWidth: number;
  canvasHeight: number;
  xRangeValue: number;
  yRangeValue: number;
  outXOffset?: number;
  outYBottomOffset?: number;
  outYTopOffset?: number;
  xGridSize?: number;
  axisLineColor?: string;
  axisLineWidth?: number;
  xOffset?: number;
  yOffset?: number;
  onePxValueX?: number;
  onePxValueY?: number;
}

const MockData = generateMockData();
function generateMockData() {
  const mockData = [];
  for (let i = 0; i < 10000; i++) {
    mockData.push({
      id: "id" + (i + 1),
      name: "桥梁" + (i + 1),
      type: "桥梁",
      startTime: 50 + 5 * i * Math.random() * 10,
      startLocation: 100 + 5 * i * Math.random() * 10,
      endTime: 200 + 5 * i * Math.random() * 10,
      endLocation: 200 + 5 * i * Math.random() * 10,
      workTimeRecords: [
        {
          startTime: 21,
          endTime: 25,
          location: 420,
        },
        {
          startTime: 23,
          endTime: 27,
          location: 450,
        },
        {
          startTime: 30,
          endTime: 40,
          location: 500,
        },
      ],
    });
  }
  return mockData;
}

const TimeLocationDiagram = (props: TimeLocationDiagramProps) => {
  const [workPointLines, setWorkPointLines] = useState(MockData);
  const [resumptionAreas, setResumptionAreas] = useState([]);
  const [conflictionPoints, setConflictionPoints] = useState<Array<Point>>([]);
  const [subLinesPoint, setSubLinesPoint] = useState<Point>({ x: 0, y: 0 });
  const [canvasWidth, setCanvasWidth] = useState(props.canvasWidth);
  const [canvasHeight, setCanvasHeight] = useState(props.canvasHeight);
  const [xRangeValue, setXRangeValue] = useState(props.xRangeValue);
  const [yRangeValue, setYRangeValue] = useState(props.yRangeValue);
  const [outXOffset, setOutXOffset] = useState(props.outXOffset || 50);
  const [outYBottomOffset, setOutYBottomOffset] = useState(
    props.outYBottomOffset || 20
  );
  const [outYTopOffset, setOutYTopOffset] = useState(props.outYTopOffset || 0);
  const [xGridSize, setXGridSize] = useState(props.xGridSize || 50);
  const [axisLineColor, setAxisLineColor] = useState(
    props.axisLineColor || "#ddd"
  );
  const [axisLineWidth, setAxisLineWidth] = useState(props.axisLineWidth || 1);
  const [xOffset, setXOffset] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [onePxValueX, setOnePxValueX] = useState(1);
  const [onePxValueY, setOnePxValueY] = useState(1);
  const canvasRef = useRef<any>(null);
  // const [startPos, setStartPos] = useState<Point>();
  // startPos.current = { x: 1, y: 2 };
  let startPos = useRef<Point>();
  let endPos = useRef<Point>();

  function handleMouseDown(e: MouseEvent) {
    const canvasPos: Point = viewportToCanvasPosition(e);
    startPos.current = canvasPos;
  }

  function handleMouseMove(e: MouseEvent) {
    const canvasPos: Point = viewportToCanvasPosition(e);

    // 如果没有按下鼠标，只是移动，那么就只画辅助线
    if (!startPos.current) {
      // this.showModal(canvasPos);
      // this.drawSubLine(canvasPos);
      return;
    }

    // 如果按下鼠标，那么就进入拖拽状态，并且画辅助线，还要画出选中的区域
    document.getElementById("tl-container")!.style.cursor = "move";
    endPos.current = canvasPos;

    const dx = endPos.current.x - startPos.current!.x;
    const dy = endPos.current.y - startPos.current!.y;

    if (moveScene(dx, dy)) {
      startPos.current = { x: canvasPos.x, y: canvasPos.y };
    }
  }

  function moveScene(dx: number, dy: number) {
    canvasRef.current.getCamera().pan(-dx, -dy);
    // let tempOffsetX = xOffset - dx;
    // let tempOffsetXValue = tempOffsetX * onePxValueX;
    // let tempOffsetY = yOffset + dy;
    // let tempOffsetYValue = tempOffsetY * onePxValueY;
    // // let isDrawX = false,
    // //   isDrawY = false;
    // // if (
    // //   tempOffsetXValue < xRangeValue &&
    // //   (tempOffsetX + canvasWidth) * onePxValueX <= xRangeValue + 60 &&
    // //   tempOffsetX > 0
    // // ) {
    // //   console.log("moveScene", tempOffsetX, tempOffsetXValue, xRangeValue);
    // //   isDrawX = true;
    // // }
    // // if (
    // //   tempOffsetYValue < yRangeValue &&
    // //   (tempOffsetY + canvasHeight) * onePxValueY <= yRangeValue + 50 &&
    // //   tempOffsetY > 0
    // // ) {
    // //   console.log("moveScene", tempOffsetY, tempOffsetYValue, yRangeValue);
    // //   isDrawY = true;
    // // }
    // // if (!isDrawX && !isDrawY) {
    // //   return false;
    // // }
    // // TODO: 这个 if 的判断条件，需要优化
    // if (tempOffsetX > 0) {
    //   setXOffset(tempOffsetX);
    // }
    // // TODO: 这个 if 的判断条件，需要优化
    // if (tempOffsetY > 0) {
    //   setYOffset(tempOffsetY);
    // }
    return true;
  }

  function handleMouseUp(e: MouseEvent) {
    startPos.current = null as any;
    endPos.current = null as any;
    document.getElementById("tl-container")!.style.cursor = "auto";
  }

  function handleMouseWheel(e: Event) {
    e.preventDefault();
    const event: WheelEvent = e as WheelEvent;
    const canvasPos: Point = viewportToCanvasPosition(event);
    const { deltaY } = event;

    let onePxValueXChg = onePxValueX;
    // 图幅范围：最大1公里（每格50m）~最小100公里（每格5km）
    if (deltaY > 0) {
      // 缩小
      onePxValueXChg += 1;
    } else {
      // 放大
      onePxValueXChg -= 1;
    }

    if (onePxValueXChg <= 0 || onePxValueXChg > 100) {
      return;
    } else {
      setOnePxValueX(onePxValueXChg);
    }
    return;
  }

  // 接受更改辅助线的坐标点事件
  function chgSubLines(canvasPos: Point) {
    setSubLinesPoint(canvasPos);
  }

  // useEffect(() => {
  //   let conflictionPoints: Point[] = [];
  //   for (let i = 0; i < workPointLines.length; i++) {
  //     const { startLocation, startTime, endLocation, endTime } =
  //       workPointLines[i];
  //     const line1: ILine = {
  //       x1: startLocation,
  //       y1: startTime,
  //       x2: endLocation,
  //       y2: endTime,
  //     };
  //     for (let j = i + 1; j < workPointLines.length; j++) {
  //       const { startLocation, startTime, endLocation, endTime } =
  //         workPointLines[j];
  //       const line2: ILine = {
  //         x1: startLocation,
  //         y1: startTime,
  //         x2: endLocation,
  //         y2: endTime,
  //       };
  //       let conflictionPoint = Intersect2lines(line1, line2);
  //       if (conflictionPoint) {
  //         conflictionPoints.push(conflictionPoint);
  //       }
  //     }
  //   }
  //   console.log(conflictionPoints, "conflictionPoints");
  //   setConflictionPoints(conflictionPoints);
  // }, [workPointLines]);

  useEffect(() => {
    canvasRef.current.addEventListener(CanvasEvent.AFTER_RENDER, () => {
      canvasRef.current.getStats(); // { total: 0, rendered: 0 }
    });
    // console.log("canvasRef", canvasRef, canvasRef.current);
    // if (circleRef.current) {
    //   (circleRef.current as any).animate(
    //     [
    //       {
    //         transform: "scale(0)", // 起始关键帧
    //       },
    //       {
    //         transform: "scale(1)", // 结束关键帧
    //       },
    //     ],
    //     {
    //       duration: 5000, // 持续时间
    //       easing: "cubic-bezier(0.250, 0.460, 0.450, 0.940)", // 缓动函数
    //       fill: "both", // 动画处于非运行状态时，该图形的展示效果
    //     }
    //   );
    // }

    setTimeout(() => {
      // const circle = new CircleFn({
      //   style: {
      //     cx: 100,
      //     cy: 100,
      //     r: 100,
      //     fill: "red",
      //   },
      // });
      // console.log("circle", circle);
      // canvasRef.current.document.documentElement.appendChild(circle);
      // console.log(
      //   canvasRef.current.document.documentElement.childNodes,
      //   "canvasRef.current.childNodes"
      // );
      // canvasRef.current.getCamera().pan(200, 200).dolly(-20).rotate(0, 0, 30);
      // const scaleInCenter = circle.animate(
      //   [
      //     {
      //       transform: "scale(0)", // 起始关键帧
      //     },
      //     {
      //       transform: "scale(1)", // 结束关键帧
      //     },
      //   ],
      //   {
      //     duration: 5000, // 持续时间
      //     easing: "cubic-bezier(0.250, 0.460, 0.450, 0.940)", // 缓动函数
      //     fill: "both", // 动画处于非运行状态时，该图形的展示效果
      //   }
      // );
    }, 20000);
  }, []);

  return (
    <div
      id="tl-container"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        margin: 50,
      }}
      // onClick={console.log}
      onMouseDown={(e) => handleMouseDown(e as any)}
      onMouseUp={(e) => handleMouseUp(e as any)}
      onMouseMove={(e) => handleMouseMove(e as any)}
      onMouseOut={(e) => handleMouseUp(e as any)}
      onWheel={(e) => handleMouseWheel(e as any)}
    >
      <Canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{
          border: "1px solid #000",
          width: canvasWidth,
          height: canvasHeight,
        }}
        renderer={renderer}
        dpr={window.devicePixelRatio}
      >
        <XAxis
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          xRangeValue={xRangeValue}
          onePxValueX={onePxValueX}
          xGridSize={xGridSize}
          xOffset={xOffset}
          outXOffset={outXOffset}
          outYBottomOffset={outYBottomOffset}
          outYTopOffset={outYTopOffset}
          axisLineColor={axisLineColor}
          axisLineWidth={axisLineWidth}
        />

        <YAxis
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          outXOffset={outXOffset}
          outYBottomOffset={outYBottomOffset}
          outYTopOffset={outYTopOffset}
          yRangeValue={yRangeValue}
          yOffset={yOffset}
          onePxValueY={onePxValueY}
          axisLineColor={axisLineColor}
          axisLineWidth={axisLineWidth}
          startDay="2021-05-11"
          endDay="2027-01-11"
          mode={YAxisMode.HALF_YEAR}
        />

        {workPointLines.map((workPointLine) => {
          return (
            <Line
              key={"workpoint" + workPointLine.id}
              x1={
                outXOffset +
                (workPointLine.startLocation - outXOffset) / onePxValueX -
                xOffset
              }
              x2={
                outXOffset +
                (workPointLine.endLocation - outXOffset) / onePxValueX -
                xOffset
              }
              y1={workPointLine.startTime + yOffset}
              y2={workPointLine.endTime + yOffset}
              stroke="#000"
              // stroke={{
              //   image: "./blue-line.png",
              //   repetition: "repeat",
              //   transform: "rotate(0deg)",
              // }}
              // fill={{
              //   image: "./blue-line.png",
              //   repetition: "repeat",
              //   transform: "rotate(0deg)",
              // }}
              // strokeWidth={10}
              lineWidth={6}
              // onMouseenter={(e) => {
              //   chgSubLines(e);
              // }}
            />
          );
        })}

        {/* {conflictionPoints.map((point, index) => {
          return (
            <>
              <Tooltip
                x={outXOffset + (point.x - outXOffset) / onePxValueX - xOffset}
                y={point.y - 8 + yOffset}
                width={100}
                height={50}
                arrowHeight={5}
                text="冲突点"
                fontSize={12}
              />
              <Marker
                x={outXOffset + (point.x - outXOffset) / onePxValueX - xOffset}
                y={point.y + yOffset}
                r={16}
                stroke={"orange"}
                fill={"red"}
                strokeWidth={3}
                canvasHeight={canvasHeight}
                canvasWidth={canvasWidth}
                outXOffset={outXOffset}
                outYBottomOffset={outYBottomOffset}
                outYTopOffset={outYTopOffset}
              />
            </>
          );
        })} */}

        {
          <>
            <Tooltip
              x={outXOffset + (300 - outXOffset) / onePxValueX - xOffset}
              y={30 - 8 + yOffset}
              width={100}
              height={50}
              arrowHeight={5}
              text="冲突点"
              fontSize={12}
            />
            <Marker
              x={outXOffset + (300 - outXOffset) / onePxValueX - xOffset}
              y={30 + yOffset}
              r={16}
              stroke={"orange"}
              fill={"red"}
              strokeWidth={3}
              canvasHeight={canvasHeight}
              canvasWidth={canvasWidth}
              outXOffset={outXOffset}
              outYBottomOffset={outYBottomOffset}
              outYTopOffset={outYTopOffset}
            />

            <Rect
              x={outXOffset + (300 - outXOffset) / onePxValueX - xOffset}
              y={30 + yOffset}
              width={100 / onePxValueX}
              height={200}
              stroke={"red"}
              // fill={{
              //   image: "./green-line.png",
              //   repetition: "repeat",
              //   transform: "rotate(0deg)",
              // }}
            />
          </>
        }

        <Sublines
          point={subLinesPoint}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          outYOffset={outYBottomOffset}
        />
      </Canvas>
    </div>
  );
};

ReactDOM.render(
  <TimeLocationDiagram
    canvasHeight={320}
    canvasWidth={650}
    xRangeValue={1000}
    yRangeValue={730}
  />,
  document.getElementById("app")
);

export default TimeLocationDiagram;
