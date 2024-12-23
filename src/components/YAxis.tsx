import { Renderer as CanvasRenderer } from "@antv/g-canvas";
import { Circle as CircleFn, Pattern } from "@antv/g";
import { Canvas, Rect, Circle, Line, Text, Path, HTML } from "@antv/react-g";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import dayOfYear from "dayjs/plugin/dayOfYear";
import isLeapYear from "dayjs/plugin/isLeapYear";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);
import { ILine } from "../Models";
import {
  QuarterDays,
  QuarterTexts,
  getDayCountBeforeQuarter,
  getQuarterOfDay,
} from "../utils";
dayjs.extend(dayOfYear);
dayjs.extend(isLeapYear);

interface YAxisProps {
  canvasWidth: number;
  canvasHeight: number;
  yOffset?: number;
  outXOffset?: number;
  outYBottomOffset?: number;
  outYTopOffset?: number;
  onePxValueY?: number;
  yRangeValue: number;
  axisLineColor?: string;
  axisLineWidth?: number;
  startDay: string;
  endDay: string;
  mode: YAxisMode;
}
export enum YAxisMode {
  HALF_YEAR = "halfYear",
  QUARTER = "quarter",
  MONTH = "month",
}
export function getYAxisMode(startDay: string, endDay: string) {
  let startDayObj = dayjs(startDay);
  let endDayObj = dayjs(endDay);
  let diffYear = Math.abs(
    dayjs.duration(endDayObj.diff(startDayObj)).asYears()
  );

  if (diffYear > 5) {
    return YAxisMode.HALF_YEAR;
  } else if (diffYear > 2 && diffYear <= 5) {
    return YAxisMode.QUARTER;
  } else {
    return YAxisMode.MONTH;
  }
}

function YAxis(props: YAxisProps) {
  const [yAxisLines, setYAxisLines] = useState<Array<ILine>>([]);

  /**
   * 生成Y轴线数据:全局模式-5 年以上-刻度按半年 181/182 184，最少 10 个刻度，1 个 px 代表 6 天
   * @param canvasWidth
   * @param canvasHeight
   * @param outXOffset
   * @param outYBottomOffset
   * @param outYTopOffset
   * @param yOffset
   * @param onePxValueY
   * @param yRangeValue
   * @param stroke
   * @param lineWidth
   * @returns
   */
  function generateGlobalHalfYearYAxisLines(
    canvasWidth: number,
    canvasHeight: number,
    outXOffset: number = 50,
    outYBottomOffset: number = 20,
    outYTopOffset: number = 20,
    yOffset: number = 0,
    onePxValueY: number = 6,
    yRangeValue: number,
    stroke: string = "#000",
    lineWidth: number = 1,
    originalStartDay: string,
    orininalEndDay: string
  ) {
    const yAxisLines: Array<ILine> = [
      {
        x1: outXOffset,
        x2: canvasWidth,
        y1: canvasHeight - outYBottomOffset + yOffset,
        y2: canvasHeight - outYBottomOffset + yOffset,
        stroke: stroke,
        lineWidth: lineWidth,
      },
    ];

    /** 全局模式-5 年以上-刻度按半年 181/182 184，最少 10 个刻度，1 个 px 代表 6 天 */
    let originalStartDayObj = dayjs(originalStartDay);
    let originalEndDayObj = dayjs(orininalEndDay);
    let diffMonths = Math.abs(
      dayjs.duration(originalEndDayObj.diff(originalStartDayObj)).asMonths()
    );
    let halfYearLength = Math.ceil(
      (diffMonths + originalStartDayObj.month() + 1) / 6
    );
    let yearLength = Math.ceil(
      (diffMonths + originalStartDayObj.month() + 1) / 12
    );
    console.log(halfYearLength, "length");

    let startDay = originalStartDayObj.subtract(
      originalStartDayObj.month() % 6,
      "month"
    );
    startDay = startDay.subtract(startDay.date() - 1, "day");
    console.log(
      "mode",
      originalStartDayObj.format("YYYY-MM-DD"),
      originalStartDayObj.month(),
      originalStartDayObj.date(),
      startDay.format("YYYY-MM-DD")
    );

    let currDay = startDay;
    let yGridSize = 0;
    let summaryPx = 0;
    for (let i = 0; i < halfYearLength; i++) {
      let isLeapYear = currDay.isLeapYear();
      let dayOfYear = currDay.dayOfYear();
      let isFirstHalfYear = dayOfYear <= (isLeapYear ? 182 : 181);
      let tmpDay = isFirstHalfYear ? "上" : "下";
      yGridSize = isFirstHalfYear ? (isLeapYear ? 182 : 181) : 184;
      summaryPx += yGridSize;
      let y =
        canvasHeight - outYBottomOffset - summaryPx / onePxValueY + yOffset;
      console.log(
        "mode",
        dayOfYear,
        isFirstHalfYear,
        tmpDay,
        yGridSize,
        summaryPx,
        y
      );

      yAxisLines.push({
        x1: outXOffset,
        x2: canvasWidth,
        y1: y,
        y2: y,
        text: {
          x: outXOffset - 20,
          y: y + yGridSize / 2 / onePxValueY + (10 - 2) / 2,
          content: tmpDay,
        },
        stroke: stroke,
        lineWidth: lineWidth,
      });
      currDay = currDay.add(6, "month");
    }

    // 画年份文字
    let currDay2 = startDay;
    let yearGridSize = 0;
    let yearSummaryPx = 0;
    for (let i = 0; i < yearLength; i++) {
      let isLeapYear = currDay2.isLeapYear();
      let dayOfYear = currDay2.dayOfYear();
      let isFirstHalfYear = dayOfYear <= (isLeapYear ? 182 : 181);
      let yearDaycount = currDay2.isLeapYear() ? 366 : 365;
      yearGridSize = yearDaycount;
      if (i === 0 && !isFirstHalfYear) {
        yearGridSize -= isLeapYear ? 182 : 181;
      }
      yearSummaryPx += yearGridSize;
      let y =
        canvasHeight -
        outYBottomOffset -
        yearSummaryPx / onePxValueY +
        yOffset +
        1;
      let tmpDay = currDay2.format("YYYY");
      yAxisLines.push({
        x1: 0,
        x2: 30,
        y1: y,
        y2: y,
        text: {
          x: -3,
          y: y + yearGridSize / 2 / onePxValueY + (10 - 2) / 2,
          content: tmpDay,
        },
        stroke: stroke,
        lineWidth: lineWidth,
      });
      currDay2 = currDay2.add(1, "year");
    }
    return yAxisLines;
  }

  /**
   * 生成Y轴线数据:全局模式-2~5 年，刻度按季度 90/91 91 92 92，最多 20 个刻度，1 个 px 代表 3 天
   * @param canvasWidth
   * @param canvasHeight
   * @param outXOffset
   * @param outYBottomOffset
   * @param outYTopOffset
   * @param yOffset
   * @param onePxValueY
   * @param yRangeValue
   * @param stroke
   * @param lineWidth
   * @returns
   */
  function generateGlobalQuarterYAxisLines(
    canvasWidth: number,
    canvasHeight: number,
    outXOffset: number = 50,
    outYBottomOffset: number = 20,
    outYTopOffset: number = 20,
    yOffset: number = 0,
    onePxValueY: number = 3,
    yRangeValue: number,
    stroke: string = "#000",
    lineWidth: number = 1,
    originalStartDay: string,
    orininalEndDay: string
  ) {
    const yAxisLines: Array<ILine> = [
      {
        x1: outXOffset,
        x2: canvasWidth,
        y1: canvasHeight - outYBottomOffset + yOffset,
        y2: canvasHeight - outYBottomOffset + yOffset,
        stroke: stroke,
        lineWidth: lineWidth,
      },
    ];

    let originalStartDayObj = dayjs(originalStartDay);
    let originalEndDayObj = dayjs(orininalEndDay);
    let diffMonths = Math.abs(
      Math.floor(
        dayjs.duration(originalEndDayObj.diff(originalStartDayObj)).asMonths()
      )
    );
    let quarterLength = Math.ceil(
      (diffMonths + originalStartDayObj.month() + 1) / 3
    );
    let yearLength = Math.ceil(
      (diffMonths + originalStartDayObj.month() + 1) / 12
    );
    console.log(
      diffMonths + originalStartDayObj.month() + 1,
      quarterLength,
      "mode",
      "length"
    );

    let startDay = originalStartDayObj.subtract(
      originalStartDayObj.month() % 3,
      "month"
    );
    startDay = startDay.subtract(startDay.date() - 1, "day");
    console.log(
      "mode",
      originalStartDayObj.format("YYYY-MM-DD"),
      originalStartDayObj.month(),
      originalStartDayObj.date(),
      startDay.format("YYYY-MM-DD")
    );

    let currDay = startDay;
    let yGridSize = 0;
    let summaryPx = 0;
    for (let i = 0; i < quarterLength; i++) {
      let isLeapYear = currDay.isLeapYear();
      let dayOfYear = currDay.dayOfYear();
      let quarter = getQuarterOfDay(dayOfYear, isLeapYear);
      let tmpDay = QuarterTexts[quarter - 1];
      yGridSize =
        QuarterDays[quarter - 1] + (quarter === 1 && isLeapYear ? 1 : 0);
      summaryPx += yGridSize;
      let y =
        canvasHeight - outYBottomOffset - summaryPx / onePxValueY + yOffset;
      console.log("mode", dayOfYear, quarter, tmpDay, yGridSize, summaryPx, y);
      yAxisLines.push({
        x1: outXOffset,
        x2: canvasWidth,
        y1: y,
        y2: y,
        text: {
          x: outXOffset - 20,
          y: y + yGridSize / 2 / onePxValueY + (10 - 2) / 2,
          content: tmpDay,
        },
        stroke: stroke,
        lineWidth: lineWidth,
      });
      currDay = currDay.add(3, "month");
    }

    // 画年份文字
    let currDay2 = startDay;
    let yearGridSize = 0;
    let yearSummaryPx = 0;
    for (let i = 0; i < yearLength; i++) {
      let isLeapYear = currDay2.isLeapYear();
      let dayOfYear = currDay2.dayOfYear();
      console.log(dayOfYear, "mode", "dayOfYear");
      let yearDaycount = currDay2.isLeapYear() ? 366 : 365;
      let quarter = getQuarterOfDay(dayOfYear, isLeapYear);
      yearGridSize =
        yearDaycount -
        (i === 0 ? getDayCountBeforeQuarter(quarter - 1, isLeapYear) : 0);

      yearSummaryPx += yearGridSize;
      let y =
        canvasHeight - outYBottomOffset - yearSummaryPx / onePxValueY + yOffset;
      let tmpDay = currDay2.format("YYYY");
      yAxisLines.push({
        x1: 0,
        x2: 30,
        y1: y,
        y2: y,
        text: {
          x: -3,
          y: y + yearGridSize / 2 / onePxValueY + (10 - 2) / 2,
          content: tmpDay,
        },
        stroke: stroke,
        lineWidth: lineWidth,
      });
      currDay2 = currDay2.add(1, "year");
    }
    return yAxisLines;
  }

  /**
   * 生成Y轴线数据
   * @param canvasWidth
   * @param canvasHeight
   * @param outXOffset
   * @param outYBottomOffset
   * @param outYTopOffset
   * @param yOffset
   * @param onePxValueY
   * @param yRangeValue
   * @param stroke
   * @param lineWidth
   * @returns
   */
  function generateMonthYAxisLines(
    canvasWidth: number,
    canvasHeight: number,
    outXOffset: number = 50,
    outYBottomOffset: number = 20,
    outYTopOffset: number = 20,
    yOffset: number = 0,
    onePxValueY: number = 1,
    yRangeValue: number,
    stroke: string = "#000",
    lineWidth: number = 1,
    originalStartDay: string,
    orininalEndDay: string
  ) {
    const yAxisLines: Array<ILine> = [
      {
        x1: outXOffset,
        x2: canvasWidth,
        y1: canvasHeight - outYBottomOffset + yOffset,
        y2: canvasHeight - outYBottomOffset + yOffset,
        stroke: stroke,
        lineWidth: lineWidth,
      },
    ];

    /** 当前时间模式-刻度按月固定，以当前月为基准，往下 6 月，往上 17 月 */
    let originalStartDayObj = dayjs(originalStartDay);
    let startDay = originalStartDayObj.subtract(0, "month");
    // 将开始时间调整到月初
    startDay = startDay.subtract(startDay.date() - 1, "day");
    let endDay = dayjs(orininalEndDay);
    // 将结束时间调整到月初
    endDay = endDay.subtract(endDay.date() - 1, "day");

    let currDay = startDay;
    let yGridSize = 0;
    let summaryPx = 0;
    // 画月份，24 根据月份需求来进行重新计算 currDay< endDay(endDay.add(1, 'month')))
    for (let i = 0; i < 24; i++) {
      yGridSize = currDay.daysInMonth();
      summaryPx += yGridSize;
      let y =
        canvasHeight - outYBottomOffset - summaryPx / onePxValueY + yOffset;
      let tmpDay = currDay.format("MM");
      yAxisLines.push({
        x1: outXOffset,
        x2: canvasWidth,
        y1: y,
        y2: y,
        text: {
          x: outXOffset - 20,
          y: y + yGridSize / 2 / onePxValueY + (10 - 2) / 2,
          content: tmpDay,
        },
        stroke: stroke,
        lineWidth: lineWidth,
      });
      currDay = currDay.add(1, "month");
    }

    // 画年份文字
    let currDay2 = startDay;
    let yearGridSize = 0;
    let yearSummaryPx = 0;
    for (let i = 0; i < 3; i++) {
      let yearDaycount = currDay2.isLeapYear() ? 366 : 365;
      yearGridSize = yearDaycount - (i === 0 ? currDay2.dayOfYear() : 0);
      yearSummaryPx += yearGridSize;
      let y =
        canvasHeight -
        outYBottomOffset -
        yearSummaryPx / onePxValueY +
        yOffset -
        1;
      let tmpDay = currDay2.format("YYYY");
      yAxisLines.push({
        x1: 0,
        x2: 30,
        y1: y,
        y2: y,
        text: {
          x: -3,
          y: y + yearGridSize / 2 / onePxValueY + (10 - 2) / 2,
          content: tmpDay,
        },
        stroke: stroke,
        lineWidth: lineWidth,
      });
      currDay2 = currDay2.add(1, "year");
    }
    return yAxisLines;
  }

  useEffect(() => {
    let {
      canvasWidth,
      canvasHeight,
      outXOffset,
      outYBottomOffset,
      outYTopOffset,
      yOffset,
      onePxValueY,
      yRangeValue,
      axisLineColor,
      axisLineWidth,
      startDay,
      endDay,
      mode,
    } = props;

    let fn = null;
    switch (mode) {
      case YAxisMode.HALF_YEAR:
        onePxValueY = 6;
        fn = generateGlobalHalfYearYAxisLines;
        break;
      case YAxisMode.QUARTER:
        onePxValueY = 3;
        fn = generateGlobalQuarterYAxisLines;
        break;
      case YAxisMode.MONTH:
        onePxValueY = 1;
        fn = generateMonthYAxisLines;
        break;
    }
    console.log("mode", mode, fn);
    const YAxisLines = fn(
      canvasWidth,
      canvasHeight,
      outXOffset,
      outYBottomOffset,
      outYTopOffset,
      yOffset,
      onePxValueY,
      yRangeValue,
      axisLineColor,
      axisLineWidth,
      startDay,
      endDay
    );
    setYAxisLines(YAxisLines);
  }, [props]);
  useEffect(() => {
    console.log(getYAxisMode("2023-01-01", "2028-01-01"), "mode");
  });
  return (
    <>
      <Rect
        x={0}
        y={0}
        width={50}
        height={props.canvasHeight}
        fill={"#fff"}
        zIndex={4}
      />
      <Line
        x1={30}
        x2={30}
        y1={props.canvasHeight - (props.outYBottomOffset as any)}
        y2={props.outYTopOffset as any}
        stroke={props.axisLineColor}
        lineWidth={props.axisLineWidth}
        zIndex={4}
      />

      <Line
        x1={50}
        x2={50}
        y1={props.canvasHeight - (props.outYBottomOffset as any)}
        y2={props.outYTopOffset as any}
        stroke={props.axisLineColor}
        lineWidth={props.axisLineWidth}
        zIndex={4}
      />

      <Line
        x1={0}
        x2={50}
        y1={props.canvasHeight - (props.outYBottomOffset as any)}
        y2={props.canvasHeight - (props.outYBottomOffset as any)}
        stroke={props.axisLineColor}
        lineWidth={props.axisLineWidth}
        zIndex={4}
      />
      {yAxisLines.map((line, index) => {
        console.log(line);
        return (
          <>
            <Line
              key={`y-line-${index}`}
              x1={line.x1 - 20}
              x2={line.x1 === 0 ? 30 : line.x2 - 20}
              y1={line.y1}
              y2={line.y2}
              stroke={line.stroke}
              lineWidth={line.lineWidth}
              zIndex={4}
            />
            {/* <Text
              key={`y-line-label-${index}`}
              x={(line.text?.x as any) + 4}
              y={line.text?.y}
              fontSize={10}
              text={line.text?.content as any}
              zIndex={4}
            /> */}
          </>
        );
      })}
    </>
  );
}

export default YAxis;
