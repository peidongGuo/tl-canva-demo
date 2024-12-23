export class Point {
  public x: number;
  public y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export interface ILine {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  text?: IText;
  stroke?: string;
  lineWidth?: number;
  isDash?: boolean;
}

export interface IRect {
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  stroke?: string;
  lineWidth?: number;
}

export interface IText {
  x: number;
  y: number;
  content: string;
  stroke?: string;
  lineWidth?: number;
}

export interface ILabel {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  text: string;
  stroke?: string;
  lineWidth?: number;
  isDash?: boolean;
}

interface TLBaseConfig {
  width: number;
  height: number;
  bgColor: string;
  mainContentColor: string;

  xAxisLineColor: string;
  xAxisLineWidth: number;
  xAxisLabelColor: string;
  xAxisLabelFontSize: number;

  yAxisLineColor: string;
  yAxisLineWidth: number;
  yAxisLabelColor: string;
  yAxisLabelFontSize: number;

  outXLeftOffset: number;
  outXRightOffset: number;
  outYTopOffset: number;
  outYBottomOffset: number;
}

const TLDefaultConfig = {};

const TLWhiteConfig = {};

const TLBlueConfig = {};
