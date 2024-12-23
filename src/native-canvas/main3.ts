import dayjs, { Dayjs } from "dayjs";
import dayOfYear from "dayjs/plugin/dayOfYear";
import isLeapYear from "dayjs/plugin/isLeapYear";
dayjs.extend(dayOfYear);
dayjs.extend(isLeapYear);

let originalDay = dayjs();
let startDay = originalDay.subtract(6, "month");
startDay = startDay.subtract(startDay.date() - 1, "day");
let endDay = originalDay.add(17, "month");
endDay = endDay.subtract(endDay.date() - 1, "day");
console.log(
  originalDay.format("YYYY-MM-DD"),
  originalDay.month(),
  originalDay.date(),
  startDay.format("YYYY-MM-DD"),
  endDay.format("YYYY-MM-DD")
);
// dayjs().format();

/**
 * 绘制TL类
 */
export class TLApp {
  public canvas: HTMLCanvasElement;
  public ctx2d: CanvasRenderingContext2D | null;

  public width!: number;
  public height!: number;

  public minX: number;
  public maxX: number;
  public xLen: number;

  public minY: number;
  public maxY: number;
  public yLen: number;

  public offsetX: number = 0;
  public offsetY: number = 0;
  public onePxValueX: number = 1;
  public onePxValueY: number = 1;

  public xGridWidthPx!: number;
  public yGridHeightPx!: number;

  public getXAxisLabel!: (x: number) => string;
  public getYAxisLabel!: (y: number) => string;

  /** 每次缩放的量 */
  public xScaleSteps: number;
  public yScaleSteps: number;

  /** 坐标刻度字体大小 */
  public fontSize: number;

  /** 设备像素比，为了解决高清屏模糊问题 */
  public dpr: number = 1;

  public state: IState = {
    startPos: null,
    endPos: null,
  };
  /** 存放所有函数 */
  public lineList: Line[] = [];
  public rectList: Rect[] = [];

  /**
   * @param canvas canvas 画布元素
   * @param opts 绘制函数的一些可选参数，leftX 和 rightX 是需要配对传进来的
   */
  constructor(canvas: HTMLCanvasElement, opts: IConfig = {}) {
    this.canvas = canvas;
    this.ctx2d = canvas.getContext("2d");
    this.adaptDPR();

    // 因为一般 canvas 宽高都是几百，所以这里默认值就简单的 / 100，此外还要主要我们的坐标是 1:1 的，如果 x 和 y 表示的值不一样，则下面的 bottomY 和 topY 不能这样简单的赋值
    this.minX = opts.leftX || 0;
    this.maxX = opts.rightX || 100;
    this.xLen = this.maxX - this.minX;
    // 初始化时，y 的取值默认和 x 值一样，因为他们代表的值一样，不然 bottomY，topY 也要当做参数传进来
    this.minY = opts.bottomY || 0;
    this.maxY = opts.topY || 100;
    this.yLen = this.maxY - this.minY;

    this.xGridWidthPx = opts.xGridWidthPx || 100;
    this.yGridHeightPx = opts.yGridHeightPx || 100;

    this.offsetX = opts.offsetX || 0;
    this.offsetY = opts.offsetY || 0;

    this.xScaleSteps = opts.xScaleSteps || 1;
    this.yScaleSteps = opts.yScaleSteps || 0;

    this.fontSize = opts.fontSize || 10;

    this.canvas.addEventListener(
      "mousedown",
      this.handleMouseDown.bind(this),
      false
    );

    // 也可以把 mouseup 和 mousemove 这两个监听写在 mousedown 的回调中，因为
    canvas.addEventListener("mouseup", this.handleMouseUp.bind(this), false);

    canvas.addEventListener(
      "mousemove",
      this.handleMouseMove.bind(this),
      false
    );

    canvas.addEventListener(
      "mousewheel",
      this.handleMouseWheel.bind(this),
      false
    );
  }
  // 根据 dpr 把 canvas 的 width、height 属性都放大，css 大小不变
  // canvas 会自己把画布缩小到适应 css 的大小，于是放大和缩小的效果就抵消了，这样做的原因是为了解决高清屏的模糊问题
  adaptDPR() {
    const dpr = window.devicePixelRatio;
    const { width, height } = this.canvas;
    this.dpr = dpr;
    // 这里我们把初始的宽高记下来，用于后面的计算用，因为这里我们适配的高清屏只是自己偷偷放大，值还是要原来真实的值
    this.width = width;
    this.height = height;
    // 重新设置 canvas 自身宽高大小和 css 大小
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
    // 方法一：直接用 scale 放大，这样就不用每个 api 都放大了，但是你要知道我们是一直在 scale 这个状态下的，有时候你不小心重置了画布，这个东西就不生效了
    this.ctx2d?.scale(dpr, dpr);
    // 方法二：不要用 scale，而是放大每一个 api，也就是说接下来的绘制操作都需要乘以 dpr，这样一来就会很麻烦；
    // 所以我们需要把一些绘制的入口收敛统一成一些工具方法，也就是封装成一个个绘制函数，比如 drawLine、fillText、strokeRect 等方法
  }

  handleMouseDown(e: MouseEvent) {
    const canvasPos: Point = this.viewportToCanvasPosition(e);
    this.state.startPos = canvasPos;
  }

  handleMouseMove(e: MouseEvent) {
    const canvasPos: Point = this.viewportToCanvasPosition(e);

    // 如果没有按下鼠标，只是移动，那么就只画辅助线
    console.log(this.state.startPos);

    if (!this.state.startPos) {
      this.showModal(canvasPos);
      this.drawSubLine(canvasPos);
      return;
    }

    // 如果按下鼠标，那么就进入拖拽状态，并且画辅助线，还要画出选中的区域
    document.body.style.cursor = "move";
    this.state.endPos = canvasPos;

    const {
      state: { startPos, endPos },
    } = this;
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;

    if (this.moveScene(dx, dy)) {
      this.state.startPos = canvasPos;
    }
  }

  moveScene(dx: number, dy: number) {
    let tempOffsetX = this.offsetX - dx;
    let tempOffsetXValue = tempOffsetX * this.onePxValueX;
    let tempOffsetY = this.offsetY + dy;
    let tempOffsetYValue = tempOffsetY * this.onePxValueY;
    let isDrawX = true,
      isDrawY = true;
    if (
      tempOffsetXValue < this.xLen &&
      (tempOffsetX + this.width) * this.onePxValueX <= this.xLen + 60 &&
      tempOffsetXValue > 0
    ) {
      this.offsetX = tempOffsetX;
      this.lineList.forEach((line) => {
        line.x1 += dx;
        line.x2 += dx;
      });
      this.rectList.forEach((rect) => {
        rect.x1 += dx;
        // rect.x2 += dx;
      });
    } else {
      isDrawX = false;
    }
    if (
      tempOffsetYValue < this.yLen &&
      (tempOffsetY + this.height) * this.onePxValueY <= this.yLen + 50 &&
      tempOffsetYValue > 0
    ) {
      this.offsetY = tempOffsetY;
      this.lineList.forEach((line) => {
        line.y1 += dy;
        line.y2 += dy;
      });
      this.rectList.forEach((rect) => {
        rect.y1 += dy;
        // rect.y2 += dy;
      });
    } else {
      isDrawY = false;
    }
    if (!isDrawX && !isDrawY) {
      return false;
    }
    this.draw();
    return true;
  }

  handleMouseUp(e: MouseEvent) {
    this.state.startPos = null;
    this.state.endPos = null;
    document.body.style.cursor = "auto";
  }

  handleMouseWheel(e: Event) {
    e.preventDefault();
    const event: WheelEvent = e as WheelEvent;
    const canvasPos: Point = this.viewportToCanvasPosition(event);
    const { deltaY } = event;
    let {
      minX: leftX,
      maxX: rightX,
      minY: bottomY,
      maxY: topY,
      onePxValueX,
      onePxValueY,
      xScaleSteps,
      yScaleSteps,
    } = this;

    // 图幅范围：最大1公里（每格50m）~最小100公里（每格5km）
    if (deltaY > 0) {
      // 缩小
      onePxValueX += 1;
      // yScale = 1 + yScaleSteps;
    } else {
      // 放大
      onePxValueX -= 1;
      // yScale = 1 - yScaleSteps;
    }

    if (onePxValueX <= 0 || onePxValueX > 100) {
      return;
    } else {
      this.onePxValueX = onePxValueX;
      this.xScaleSteps = onePxValueX;
      this.draw();
    }

    return;

    // if (this.isInvalidVal(xScale, true) || this.isInvalidVal(yScale, false))
    //   return;
    // const { x, y } = this.canvasPosToLineVal(canvasPos);
    // // 注意缩放和拖拽不一样，left 的左右两边一边是加一边是减
    // const tempLeftX = x - (x - leftX) * xScale;
    // const tempbottomY = y - (y - bottomY) * yScale;
    // if (tempLeftX < 0 || tempbottomY < 0) return;

    // this.minX = x - (x - leftX) * xScale;
    // this.maxX = x + (rightX - x) * xScale;
    // this.minY = y - (y - bottomY) * yScale;
    // this.maxY = y + (topY - y) * yScale;
    // this.xLen = this.maxX - this.minX;
    // this.yLen = this.maxY - this.minY;
    // this.draw();
  }

  viewportToCanvasPosition(e: MouseEvent): Point {
    const { clientX, clientY } = e;
    const { top, left } = this.canvas.getBoundingClientRect();
    const x = clientX - top;
    const y = clientY - left;
    return new Point(x, y);
  }

  canvasPosToLineVal(canvasPos: Point): Point {
    const { width, height, minX: leftX, minY: bottomY, xLen, yLen } = this;
    const x = leftX + (canvasPos.x / width) * xLen;
    const y = bottomY + (canvasPos.y / height) * yLen;
    return new Point(x, y);
  }

  lineValToCanvasPos(lineVal: Point): Point {
    const { width, height, minX: leftX, minY: bottomY, xLen, yLen } = this;
    const x = ((lineVal.x - leftX) / xLen) * width;
    const y = ((lineVal.y - bottomY) / yLen) * height;
    return new Point(x, height - y);
  }

  /** TODO 缩放过大过小都没啥意义，所以设置下边界值 */
  isInvalidVal(ratio: number, isX: boolean): boolean {
    const { xLen, yLen } = this;
    if (isX) {
      if (ratio > 1) return true;
      if (ratio < 1) return true;
    } else {
      if (ratio > 1) return true;
      if (ratio < 1) return true;
    }
    // 上面的判断为什么不直接 （xLen > MAX_DELTA || yLen > MAX_DELTA || xLen < MIN_DELTA || yLen < MIN_DELTA）这样判断呢？
    // 因为如果这样判断你会发现缩放到最大和最小的时候，再继续操作都是无效的。
    return false;
  }

  /** 重新绘制 */
  draw() {
    this.clearCanvas();
    this.drawGrid();
    this.drawLines();
    this.drawRects();
  }

  drawGrid() {
    let {
      width,
      height,
      xLen,
      yLen,
      xGridWidthPx,
      yGridHeightPx,
      offsetX,
      offsetY,
      ctx2d,
    } = this;
    // width = 50;
    height -= 20;
    ctx2d?.save();

    // 最左边的竖线下标
    // 从左到右绘制竖线
    let tmpFirstGridXOffset = offsetX % xGridWidthPx;
    let tmpOffsetXGridCount = Math.ceil(offsetX / xGridWidthPx);
    tmpFirstGridXOffset = tmpFirstGridXOffset
      ? xGridWidthPx - tmpFirstGridXOffset
      : 0;

    for (
      let i = 0;
      (tmpFirstGridXOffset + i * xGridWidthPx) * this.onePxValueX < xLen ||
      (i * xGridWidthPx < width &&
        (tmpFirstGridXOffset + i * xGridWidthPx) * this.onePxValueX >= xLen);
      i++
    ) {
      const x = tmpFirstGridXOffset + i * xGridWidthPx;

      const color = i ? "#ddd" : "#ddd";
      this.drawLine(x + 50, 0, x + 50, height, color);
      let xValue = this.formatNum(
        (i + tmpOffsetXGridCount) * xGridWidthPx * this.onePxValueX,
        0
      );
      let xLabel = "DK" + Math.floor(xValue / 1000) + "-" + (xValue % 1000);
      this.fillText(xLabel, x + 50, height, 8, TextAlign.Center);
    }

    if (offsetY === 0) {
      let y = height;
      const color = "#ddd";
      this.drawLine(0 + 50, y - 20, width, y - 20, color);
      let tmpDay = startDay.format("MM");
      this.strokeRect(
        0 + 30,
        y - 20 - startDay.daysInMonth(),
        20,
        startDay.daysInMonth()
      );
      this.fillText(
        tmpDay,
        0 + 50 - 5,
        y - 20 - (startDay.daysInMonth() - this.fontSize),
        this.fontSize,
        TextAlign.Right
      );
    }
    let currDay = startDay.add(offsetY, "day");
    yGridHeightPx = currDay.daysInMonth() - currDay.date();
    let summary = offsetY + yGridHeightPx;
    let summaryPx = 0;

    for (let i = 0; summaryPx <= height && summary < yLen; i++) {
      summaryPx += yGridHeightPx;
      let y = height - summaryPx;
      const color = i ? "#ddd" : "#ddd";
      this.drawLine(0 + 50, y, width, y, color);
      currDay = currDay.add(1, "month");
      let tmpDay = currDay.subtract(currDay.date() - 1, "day").format("MM");
      this.strokeRect(
        0 + 30,
        y - 20 - currDay.daysInMonth(),
        20,
        currDay.daysInMonth()
      );
      this.fillText(
        tmpDay,
        0 + 50 - 5,
        y - 20 - (currDay.daysInMonth() - this.fontSize),
        this.fontSize,
        TextAlign.Right
      );

      yGridHeightPx = currDay.daysInMonth();
      summary += yGridHeightPx;
    }

    // 画年份文字
    let currDay2 = startDay.add(offsetY, "day");
    let yearDaycount = currDay2.isLeapYear() ? 366 : 365;
    let yearCurrDaycount = currDay2.dayOfYear();
    let yearGridHeightPx = yearDaycount - yearCurrDaycount;
    let yearSummary = offsetY + yearGridHeightPx;
    let yearSummaryPx = 0;
    for (let i = 0; yearSummary < 366 * 2; i++) {
      console.log(currDay2.format("YYYY"));
      yearSummaryPx += yearGridHeightPx;
      let y = height - yearSummaryPx;
      const color = i ? "#ddd" : "#ddd";
      this.drawLine(0, y - 20, 30, y - 20, color);
      let tmpDay = currDay2.format("YYYY");
      let textY = y - 20 + (366 - this.fontSize) / 2;
      // if (textY > this.height) textY = this.height / 2;
      console.log(textY);

      this.fillText(tmpDay, 2, textY, this.fontSize, TextAlign.Left);

      currDay2 = currDay2.add(1, "year");
      yearGridHeightPx = currDay2.isLeapYear() ? 366 : 365;
      yearSummary += yearGridHeightPx;
    }

    ctx2d?.restore();
  }

  showModal(canvasPos: Point) {
    this.lineList.forEach((line) => {
      // if (
      //   isPointInRect(
      //     canvasPos,
      //     // TODO?
      //     new Rect(line.x1, line.y1, line.x2 - line.x1, 5)
      //   )
      // ) {
      //   console.log(line, canvasPos);
      //   alert("点击了线");
      // }
      if (isPointInLine(canvasPos, line)) {
        console.log("触发了线的Hover!", line, canvasPos);
        // alert();
      }
    });
  }

  /** 绘制辅助线 */
  drawSubLine(canvasPos: Point) {
    const ctx2d: CanvasRenderingContext2D | null = this.ctx2d;
    if (!ctx2d) return;
    const { width, height } = this;
    const { x, y } = canvasPos;
    let subLineVisible = true;
    if (x <= 0 || x >= width || y <= 0 || y >= height) subLineVisible = false;
    if (!subLineVisible) return;

    this.draw();

    ctx2d.save();
    this.drawLine(x, 0, x, height - 20, "#999", true);
    this.drawLine(0 + 50, y, width, y, "#999", true);

    ctx2d.restore();
    const centerRectLen: number = 8;
    this.strokeRect(
      x - centerRectLen / 2,
      y - centerRectLen / 2,
      centerRectLen,
      centerRectLen
    );
    let dayCount = this.height - y - 39 + this.offsetY;
    // let day = startDay.add(dayCount, "day");
    let xValue = (x - 50 + this.offsetX) * this.onePxValueX;
    let labelText = {
      x: "DK" + Math.floor(xValue / 1000) + "-" + (xValue % 1000),
      y: startDay.add(dayCount, "day").format("YYYY-MM-DD"),
    };
    this.fillText(JSON.stringify(labelText), x + 10, y, this.fontSize);
    const actualPos = this.canvasPosToLineVal(canvasPos);
    // 绘制鼠标坐标点
    // this.fillText(`[${actualPos.x}, ${-actualPos.y}]`, x, y);
    // this.handleCrosspoint(actualPos.x);
  }

  handleCrosspoint(x: number) {
    const pointList: Point[] = this.checkCrosspoint(x);
    pointList.forEach((point) => {
      const { x, y } = this.lineValToCanvasPos(point);
      this.fillCircle(x, y, 4, "red");
      this.fillText(
        `[${this.formatNum(point.x, 1)}, ${this.formatNum(point.y, 1)}]`,
        x,
        y,
        this.fontSize
      );
    });
  }
  drawLines() {
    const bgList = [
      "./blue-line.png",
      "./yellow-line.png",
      "./pink-line.png",
      "./green-line.png",
      "./purple-bg.png",
      "./orange-bg.png",
      "./pink-bg.png",
      "./gray-bg.png",
      "./brown-bg.png",
      "./black-bg.png",
    ];
    let i = 0;
    this.lineList.forEach((line) => {
      console.log(this.onePxValueX);
      var img = new Image();
      // img.src = "./blue-bg.png";
      // let index = Math.floor((Math.random() * 10) % 3);
      console.log(i++ % 3);

      img.src = bgList[i++ % 3];
      img.onload = () => {
        // 创建图案
        var ptrn =
          this.ctx2d!.createPattern(img, "repeat-y") || "rbga(0,0,255,0.2)";
        let strokeStyle = ptrn;
        this.drawLine(
          50 + (line.x1 - 50) / this.onePxValueX,
          line.y1,
          50 + (line.x2 - 50) / this.onePxValueX,
          line.y2,
          strokeStyle,
          line.isDashLine,
          line.width
        );
      };

      const { x1, y1, x2, y2 } = line;
      this.ctx2d!.fillStyle = "red";
      this.ctx2d!.fillRect(
        x1 + (x2 - x1) / 2 - 15,
        y1 + (y2 - y1) / 2 - 10,
        30,
        20
      );
      // this.ctx2d!.rotate(getLineAngle(line));
      // this.ctx2d!.rotate(0);
      this.ctx2d!.fillStyle = "#fff";
      this.fillText("测试", x1 + (x2 - x1) / 2 - 9, y1 + (y2 - y1) / 2, 10);
    });
    // requestAnimationFrame(() => {
    for (let i = 0; i < this.lineList.length; i++) {
      var l = this.lineList[i];
      for (var j = i + 1; j < this.lineList.length; j++) {
        var l1 = this.lineList[j];
        let tmpPoint = Intersect2lines(l, l1);
        if (tmpPoint) {
          this.markIntersectionPointOf2lines(tmpPoint);
        }
      }
    }
    // });
  }

  drawRects() {
    const ctx2d: CanvasRenderingContext2D | null = this.ctx2d;
    this.rectList.forEach((rect: Rect) => {
      ctx2d?.save();
      ctx2d!.strokeStyle = "green";
      this.strokeRect(
        50 + (rect.x1 - 50) / this.onePxValueX,
        rect.y1,
        rect.w / this.onePxValueX,
        rect.h
      );
      var img = new Image();
      img.src = "./bg.png";
      img.onload = () => {
        // 创建图案
        var ptrn = ctx2d!.createPattern(img, "repeat") || "rbga(0,0,255,0.2)";
        ctx2d!.fillStyle = ptrn;
        ctx2d!.fillRect(
          50 + (rect.x1 - 50) / this.onePxValueX,
          rect.y1,
          rect.w / this.onePxValueX,
          rect.h
        );
        ctx2d?.restore();
      };
    });
    // requestAnimationFrame(() => {
    for (let i = 0; i < this.rectList.length; i++) {
      var rect = this.rectList[i];
      let tmpLine4 = new Line(
        50 + (rect.x1 - 50) / this.onePxValueX,
        rect.y1,
        50 + (rect.x1 + rect.w - 50) / this.onePxValueX,
        rect.y1
      );
      let tmpLine3 = new Line(
        50 + (rect.x1 + rect.w - 50) / this.onePxValueX,
        rect.y1,
        50 + (rect.x1 + rect.w - 50) / this.onePxValueX,
        rect.y1 + rect.h
      );
      let tmpLine2 = new Line(
        50 + (rect.x1 + rect.w - 50) / this.onePxValueX,
        rect.y1 + rect.h,
        50 + (rect.x1 - 50) / this.onePxValueX,
        rect.y1 + rect.h
      );
      let tmpLine1 = new Line(
        50 + (rect.x1 - 50) / this.onePxValueX,
        rect.y1 + rect.h,
        50 + (rect.x1 - 50) / this.onePxValueX,
        rect.y1
      );
      for (let j = 0; j < this.lineList.length; j++) {
        let tmpLine = this.lineList[j];
        let line = new Line(
          50 + (tmpLine.x1 - 50) / this.onePxValueX,
          tmpLine.y1,
          50 + (tmpLine.x2 - 50) / this.onePxValueX,
          tmpLine.y2
        );
        let tmpPoint1 = Intersect2lines(tmpLine1, line);
        if (tmpPoint1) {
          this.markIntersectionPointOf2lines(tmpPoint1);
          continue;
        }
        let tmpPoint2 = Intersect2lines(tmpLine2, line);
        if (tmpPoint2) {
          this.markIntersectionPointOf2lines(tmpPoint2);
          continue;
        }

        let tmpPoint3 = Intersect2lines(tmpLine3, line);
        if (tmpPoint3) {
          this.markIntersectionPointOf2lines(tmpPoint3);
          continue;
        }
        let tmpPoint4 = Intersect2lines(tmpLine4, line);
        if (tmpPoint4) {
          this.markIntersectionPointOf2lines(tmpPoint4);
          continue;
        }
      }
    }
    // });
  }

  drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeStyle: string | CanvasGradient | CanvasPattern = "#000",
    isDashLine: boolean = false,
    width: number = 1
  ) {
    const { ctx2d } = this;
    if (!ctx2d) return;
    ctx2d?.save();
    ctx2d.strokeStyle = strokeStyle;
    if (isDashLine) ctx2d.setLineDash([6, 6]);
    if (width) ctx2d.lineWidth = width;
    ctx2d.beginPath();
    ctx2d.moveTo(x1, y1);
    ctx2d.lineTo(x2, y2);
    ctx2d.stroke();
    ctx2d.closePath();
    ctx2d.restore();
  }
  fillText(
    text: string,
    x: number,
    y: number,
    fontSize: number = 10,
    textAlign: TextAlign = TextAlign.Left
  ) {
    const { ctx2d } = this;
    if (!ctx2d) return;
    ctx2d.save();
    ctx2d.font = `${fontSize}px sans-serif`;
    if (textAlign === TextAlign.Center) {
      const w = ctx2d.measureText(text).width;
      x = x - w / 2;
    } else if (textAlign === TextAlign.Middle) {
      // 其实这样计算高度并不能很好的垂直居中，但是这不打紧
      y = y + fontSize / 2;
    } else if (textAlign === TextAlign.Right) {
      const w = ctx2d.measureText(text).width;
      x = x - w;
      y = y + fontSize / 2;
    }
    ctx2d.fillStyle = "#000";
    ctx2d.fillText(text, x, y);
    ctx2d.restore();
  }
  fillCircle(
    x: number,
    y: number,
    radius: number,
    fillStyle: string | CanvasGradient | CanvasPattern = "#000"
  ) {
    const { ctx2d } = this;
    if (!ctx2d) return;
    ctx2d.save();
    ctx2d.fillStyle = fillStyle;
    ctx2d.beginPath();
    ctx2d.arc(x, y, radius, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.restore();
  }
  strokeRect(x: number, y: number, w: number, h: number) {
    const { ctx2d } = this;
    if (!ctx2d) return;
    ctx2d.strokeRect(x, y, w, h);
  }
  clearCanvas(
    x: number = 0,
    y: number = 0,
    w: number = this.width,
    h: number = this.height
  ) {
    const { ctx2d } = this;
    if (!ctx2d) return;
    ctx2d.clearRect(x, y, w, h);
  }

  addLine(line: Line) {
    this.lineList.push(line);
  }

  addRect(rect: Rect) {
    this.rectList.push(rect);
  }

  checkCrosspoint(x: number) {
    return [];
    // const { minX: leftX, maxX: rightX, minY: bottomY, maxY: topY } = this;
    // const rs: Point[] = [];
    // this.lineList.forEach((line) => {
    //   const y = line(x);
    //   if (leftX <= x && x <= rightX && y >= bottomY && y <= topY) {
    //     rs.push(new Point(x, y));
    //   }
    // });
    // return rs;
  }

  /**
   * 保留 fixedCount 位小数，整数不补零
   * @param num
   * @param fixedCount
   * @returns
   */
  formatNum(num: number, fixedCount: number): number {
    return parseFloat(num.toFixed(fixedCount));
  }

  /**
   * 绘制提示框tooltips
   * @param text 文字内容
   * @param fontsize 字体大小
   * @param fontcolor 字体颜色
   * @param bgcolor 背景颜色
   * todo 框子高度默认为36，后面还可以拓展，做换行处理
   */
  drawTooltip(
    x: number,
    y: number,
    text: string,
    fontsize: number,
    fontcolor: string,
    bgcolor: string
  ) {
    x -= 37;
    y -= 44;
    const { ctx2d } = this;
    if (!ctx2d) return;
    ctx2d.save();
    ctx2d.font = fontsize + "px Arial";
    ctx2d.textBaseline = "middle";
    var width = ctx2d.measureText(text).width;
    var boundWidth = width + 32;
    //画框子
    fillRoundRect(ctx2d, x, y, boundWidth, 30, 5, bgcolor); //rgba(0,0,0,0.7)

    ctx2d.fillStyle = fontcolor;
    var sw = boundWidth / 2.0 - width / 2.0; //计算字体居中的开始位置

    // ctx2d.fillText(text, sw, fontsize + 2);
    ctx2d.fillText(text, x + sw, y + fontsize + 2);
    ctx2d.restore();
    // requestAnimationFrame(() =>
    //   this.drawTooltip(x, y, text, fontsize, fontcolor, bgcolor)
    // );
    this.drawBall(x + boundWidth / 2, y + 45, 10, "#ff0002");
    this.drawBall(x + boundWidth / 2, y + 45, 7, "orange");
    this.drawBall(x + boundWidth / 2, y + 45, 3, "yellow");
  }

  drawBall(x: number, y: number, r: number, color: string) {
    const { ctx2d } = this;
    if (!ctx2d) return;
    ctx2d.save();
    drawBalls(ctx2d, x, y, r, color);
  }

  markIntersectionPointOf2lines(p: Point) {
    const { ctx2d } = this;
    if (!ctx2d) return;
    // if (p.x > 0 && p.x < this.width && p.y > 0 && p.y < this.height) return;
    ctx2d.beginPath();
    ctx2d.arc(p.x, p.y, 6, 0, 2 * Math.PI);
    ctx2d.fill();
    ctx2d.closePath();
    // requestAnimationFrame(() =>
    this.drawTooltip(p.x, p.y, "冲突点", 14, "#000", "#ff0000");
    // );
  }
}

enum TextAlign {
  Left = "left",
  Right = "right",
  Center = "center",
  Middle = "middle",
}
interface IState {
  startPos: Point | null;
  endPos: Point | null;
}

/** 绘制函数的一些配置项 */
interface IConfig {
  /** 最左边的 x 值，如果给了，右边最好也要给 */
  leftX?: number;
  /** 最右边的 x 值，如果给了，坐边最好也要给 */
  rightX?: number;
  xRange?: number;

  bottomY?: number;
  topY?: number;
  yRange?: number;

  xGridWidthPx?: number;
  yGridHeightPx?: number;

  offsetY?: number;
  offsetX?: number;

  xGridCount?: number;
  yGridCount?: number;

  xScaleSteps?: number;
  yScaleSteps?: number;
  fontSize?: number;
  animateDuration?: number;
}

export class Point {
  public x: number;
  public y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export class Size {
  public w: number;
  public h: number;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
  }
}

export class Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeStyle: string | CanvasGradient | CanvasPattern =
    "#" + Math.random().toString(16).slice(2, 8);
  isDashLine: boolean = false;
  width: number = 5;
  constructor(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeStyle?: string | CanvasGradient | CanvasPattern,
    isDashLine?: boolean,
    width?: number
  ) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    if (width) this.width = width;
    if (strokeStyle) this.strokeStyle = strokeStyle;
    if (isDashLine) this.isDashLine = isDashLine;
  }
}

export class Rect {
  x1: number;
  y1: number;
  w: number;
  h: number;
  strokeStyle: string | CanvasGradient | CanvasPattern =
    "#" + Math.random().toString(16).slice(2, 8);
  isDashLine: boolean = false;
  width: number = 1;
  constructor(
    x1: number,
    y1: number,
    w: number,
    h: number,
    strokeStyle?: string | CanvasGradient | CanvasPattern,
    isDashLine?: boolean,
    width?: number
  ) {
    this.x1 = x1;
    this.y1 = y1;
    this.w = w;
    this.h = h;
    if (width) this.width = width;
    if (strokeStyle) this.strokeStyle = strokeStyle;
    if (isDashLine) this.isDashLine = isDashLine;
  }
}

function fillRoundRect(
  cxt: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  /*optional*/ fillColor: string
) {
  //圆的直径必然要小于矩形的宽高
  if (2 * radius > width || 2 * radius > height) {
    return false;
  }

  cxt.save();
  cxt.translate(x, y);
  //绘制圆角矩形的各个边
  drawRoundRectPath(cxt, width, height, radius);
  cxt.fillStyle = fillColor || "#000"; //若是给定了值就用给定的值否则给予默认值
  cxt.fill();
  cxt.restore();
}

function drawRoundRectPath(
  cxt: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number
) {
  cxt.beginPath();
  //从右下角顺时针绘制，弧度从0到1/2PI
  cxt.arc(width - radius, height - radius, radius, 0, Math.PI / 2);

  //矩形下边线

  //绘制提示框那个尖尖角，强吧
  cxt.lineTo(width / 2.0 + 4, height);
  cxt.lineTo(width / 2.0, height + 6);
  cxt.lineTo(width / 2.0 - 4, height);

  cxt.lineTo(radius, height);

  //左下角圆弧，弧度从1/2PI到PI
  cxt.arc(radius, height - radius, radius, Math.PI / 2, Math.PI);

  //矩形左边线
  cxt.lineTo(0, radius);

  //左上角圆弧，弧度从PI到3/2PI
  cxt.arc(radius, radius, radius, Math.PI, (Math.PI * 3) / 2);

  //上边线
  cxt.lineTo(width - radius, 0);

  //右上角圆弧
  cxt.arc(width - radius, radius, radius, (Math.PI * 3) / 2, Math.PI * 2);

  //右边线
  cxt.lineTo(width, height - radius);
  cxt.closePath();
}

function drawBalls(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
  // if (radius > 100) {
  //   radius = 5;
  //   ctx.clearRect(0, 0, 500, 500);
  //   ctx.restore();
  // } else {
  //   radius += 5;
  // }
  // requestAnimationFrame(() => drawBalls(ctx, x, y, radius, color));
}

function Intersect2lines(l1: Line, l2: Line) {
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

function getLineAngle(line: Line) {
  var diff_x = line.x2 - line.x1,
    diff_y = line.y2 - line.y1;
  //返回角度,不是弧度
  return (360 * Math.atan(diff_y / diff_x)) / (2 * Math.PI);
}

// 判断点是否在直线上 TODO 需要优化成 点在某块区域内
function isPointInLine(point: Point, line: Line) {
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

// 判断点是否在直线上 TODO 需要优化成 点在某块区域内
function isPointInRect(point: Point, rect: Rect) {
  const { x1, y1, w, h } = rect;
  if (point.x < Math.min(x1, x1 + w) || point.x > Math.max(x1, x1 + w)) {
    return false;
  }
  if (point.y < Math.min(y1, y1 + h) || point.y > Math.max(y1, y1 + h)) {
    return false;
  }
  return true;
}
