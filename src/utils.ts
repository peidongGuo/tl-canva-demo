import { ILine, Point } from "./Models";

export function Intersect2lines(l1: ILine, l2: ILine) {
  if (
    Math.min(l1.x1, l1.x2) > Math.max(l2.x1, l2.x2) ||
    Math.max(l1.x1, l1.x2) < Math.min(l2.x1, l2.x2) ||
    Math.min(l1.y1, l1.y2) > Math.max(l2.y1, l2.y2) ||
    Math.max(l1.y1, l1.y2) < Math.min(l2.y1, l2.y2)
  ) {
    return null;
  }
  var p1 = { x: l1.x1, y: l1.y1 },
    p2 = { x: l1.x2, y: l1.y2 },
    p3 = { x: l2.x1, y: l2.y1 },
    p4 = { x: l2.x2, y: l2.y2 };
  var denominator =
    (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  var ua =
    ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) /
    denominator;
  var ub =
    ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) /
    denominator;
  var x = p1.x + ua * (p2.x - p1.x);
  var y = p1.y + ua * (p2.y - p1.y);
  if (
    ua > 0 &&
    ub > 0 &&
    ((x > Math.min(l1.x1, l1.x2) &&
      x < Math.max(l1.x1, l1.x2) &&
      y > Math.min(l1.y1, l1.y2) &&
      y < Math.max(l1.y1, l1.y2)) ||
      (x > Math.min(l2.x1, l2.x2) &&
        x < Math.max(l2.x1, l2.x2) &&
        y > Math.min(l2.y1, l2.y2) &&
        y < Math.max(l2.y1, l2.y2)))
  ) {
    return { x: x, y: y };
  }
  return null;
}

export function getLineAngle(line: ILine) {
  var diff_x = line.x2 - line.x1,
    diff_y = line.y2 - line.y1;
  //返回角度,不是弧度
  return (360 * Math.atan(diff_y / diff_x)) / (2 * Math.PI);
}

// 判断点是否在直线上 TODO 需要优化成 点在某块区域内
export function isPointInLine(point: Point, line: ILine) {
  if (
    point.x < Math.min(line.x1, line.x2) ||
    point.x > Math.max(line.x1, line.x2)
  ) {
    return false;
  }
  if (
    point.y < Math.min(line.y1, line.y2) ||
    point.y > Math.max(line.y1, line.y2)
  ) {
    return false;
  }
  let k1 = ((point.y - line.y1) / (point.x - line.x1)).toFixed(3);
  let k2 = ((line.y2 - line.y1) / (line.x2 - line.x1)).toFixed(3);
  let error = Math.abs(Number(k2) - Number(k1));
  if (error - 0.1 <= Number.EPSILON) {
    return true;
  }
  return false;
}

export function viewportToCanvasPosition(e: MouseEvent): Point {
  const { clientX, clientY } = e;
  const { top, left } = document
    .getElementById("tl-container")!
    .getBoundingClientRect();
  const x = clientX - top;
  const y = clientY - left;
  return new Point(x, y);
}

export function getQuarterOfDay(dayCount: number, isLeapYear: boolean) {
  if (isLeapYear) {
    // 91 91 92 92
    if (dayCount <= 91) {
      return 1;
    } else if (dayCount <= 182) {
      return 2;
    } else if (dayCount <= 274) {
      return 3;
    } else {
      return 4;
    }
  } else {
    // 90 91 92 92
    if (dayCount <= 90) {
      return 1;
    } else if (dayCount <= 181) {
      return 2;
    } else if (dayCount <= 273) {
      return 3;
    } else {
      return 4;
    }
  }
}

export function getDayCountBeforeQuarter(quarter: number, isLeapYear: boolean) {
  let summary = 0;
  for (let i = 0; i < quarter; i++) {
    summary += QuarterDays[i];
  }
  if (isLeapYear && quarter > 1) {
    summary += 1;
  }
  return summary;
}

export const QuarterTexts = ["Q1", "Q2", "Q3", "Q4"];
export const QuarterDays = [90, 91, 92, 92];
// 判断点是否在直线上 TODO 需要优化成 点在某块区域内
// function isPointInRect(point: Point, rect: Rect) {
//   const { x1, y1, w, h } = rect;
//   if (point.x < Math.min(x1, x1 + w) || point.x > Math.max(x1, x1 + w)) {
//     return false;
//   }
//   if (point.y < Math.min(y1, y1 + h) || point.y > Math.max(y1, y1 + h)) {
//     return false;
//   }
//   return true;
// }
