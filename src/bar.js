import * as d3 from "d3";
import { chart as baseChart, tooltip, config } from "lotivis-chart";
import { colorSchemeDefault, ColorsGenerator } from "lotivis-colors";
import { legend } from "lotivis-legend";
import { DEFAULT_DATE_ORDINATOR } from "./date.ordinator.js";

function transX(x) {
  return "translate(" + x + ",0)";
}

function transY(y) {
  return "translate(0," + y + ")";
}

function safeId(id) {
  return id
    .split(` `)
    .join(`-`)
    .split(`/`)
    .join(`-`)
    .split(`.`)
    .join(`-`)
    .split(`:`)
    .join(`-`);
}

/**
 * Reusable Bar Chart API class that renders ae
 * simple and configurable bar chart.
 *
 * @requires d3
 *
 * @example
 * var chart = lotivis
 *    .bar()
 *    .selector(".css-selector")
 *    .dataController(dc)
 *    .run();
 *
 */
export function bar() {
  let attr = {
    // a unique id for this chart
    id: "bar-" + new Date().getTime(),

    // default selector
    selector: "#ltv-bar-chart",

    // the charts title
    title: "BarChart",

    // top margin of title
    titleMarginTop: 20,

    // the width of the chart's svg
    width: 1000,

    // the height of the chart's svg
    height: 600,

    // left margin
    marginLeft: config.defaultMargin,

    // top margin
    marginTop: config.defaultMargin,

    // right margin
    marginRight: config.defaultMargin,

    // bottom margin
    marginBottom: config.defaultMargin,

    // corner radius of bars
    radius: config.barRadius,

    // whether the chart is enabled.
    enabled: true,

    // whether to draw labels
    labels: false,

    // rotation (in degrees) of the labels above the bars
    labelRotation: -70,

    // the legend object
    legend: legend(),

    // whether to draw the x-grid (dates)
    xAxis: false,

    // whether to draw the y-grid (values)
    yAxis: true,

    // amount of ticks for the y-axis
    ticks: 10,

    // whether to display a tooltip.
    tooltip: true,

    // the bar charts style
    style: "groups",

    // the bar chart color scheme
    colorScheme: colorSchemeDefault,

    // the background color of the chart
    backgroundColor: config.chartsBackgroundColor,

    // the axis color of the chart
    axisColor: config.chartsAxisColor,

    // the axis with
    axisStrokeWidth: config.chartsAxisStrokeWidth,

    // transformes a given date t a numeric value.
    dateAccess: DEFAULT_DATE_ORDINATOR,

    // the number format
    numberFormat: config.numberFormat,

    // displayed dates
    dates: null,

    // the data controller
    dataController: null,
  };

  // create new underlying chart with specified attributes
  let chart = baseChart(attr);

  function elementId(type, date) {
    return `ltv-bar-chart-${type}-${safeId("" + date)}`;
  }

  function resetDateFilters(calc) {
    if (!attr.enabled) return;
    attr.dataController.clearFilters(chart, "dates");
    calc.svg.selectAll(`.ltv-bar-chart-selection-rect`).attr(`opacity`, 0);
    calc.svg.selectAll(".ltv-bar-chart-dates-area").attr(`opacity`, 1);
  }

  function createScales(calc, dv) {
    // preferre dates from attr if specified. fallback to dates of data view
    let dates = Array.isArray(attr.dates) ? attr.dates : dv.dates;

    // Sort date according to access function
    dates = dates.sort((a, b) => attr.dateAccess(a) - attr.dateAccess(b));

    let padding = 0.1;

    calc.xChartScale = d3
      .scaleBand()
      .domain(dates)
      .rangeRound([attr.marginLeft, calc.graphRight])
      .paddingInner(padding);

    calc.xChartScalePadding = d3
      .scaleBand()
      .domain(dates)
      .rangeRound([attr.marginLeft, calc.graphRight])
      .paddingInner(padding);

    calc.xGroup = d3
      .scaleBand()
      .domain(dv.groups)
      .rangeRound([0, calc.xChartScale.bandwidth()])
      .padding(0.05);

    calc.yChart = d3
      .scaleLinear()
      .domain([0, dv.maxTotal])
      .nice()
      .rangeRound([attr.height - attr.marginBottom, attr.marginTop]);
  }

  function renderSVG(container, calc) {
    calc.svg = container
      .append("svg")
      .attr("class", "ltv-chart-svg ltv-bar-chart-svg")
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("viewBox", `0 0 ${attr.width} ${attr.height}`);
  }

  function renderBackground(calc) {
    calc.svg
      .append("rect")
      .attr("class", "ltv-bar-chart-background")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", attr.width)
      .attr("height", attr.height)
      .attr("fill", attr.backgroundColor)
      .on("click", () => resetDateFilters(calc));
  }

  function renderTitle(calc, dv) {
    calc.title = calc.svg
      .append("text")
      .attr("class", "ltv-title")
      .attr("text-anchor", "middle")
      .attr("x", calc.graphWidth / 2)
      .attr("y", attr.titleMarginTop)
      .text(attr.title);
  }

  function renderAxis(calc, dv) {
    // left axis
    calc.axisLeft = calc.svg
      .append("g")
      .call(d3.axisLeft(calc.yChart).ticks(attr.ticks))
      .attr("transform", transX(attr.marginLeft))
      .attr("class", "ltv-bar-chart-axis-label");

    // bottom axis
    calc.axisBottom = calc.svg
      .append("g")
      .call(d3.axisBottom(calc.xChartScale))
      .attr("transform", transY(attr.height - attr.marginBottom))
      .attr("class", "ltv-bar-chart-axis-label");
  }

  function renderGrid(calc) {
    // values
    if (attr.yAxis && Number.isInteger(attr.ticks)) {
      let yAxisGrid = d3
        .axisLeft(calc.yChart)
        .tickSize(-calc.graphWidth)
        .tickFormat("")
        .ticks(attr.ticks);

      calc.svg
        .append("g")
        .attr("class", "ltv-bar-chart-grid ltv-bar-chart-grid-x")
        .attr("color", attr.axisColor)
        .attr("stroke-width", attr.axisStrokeWidth)
        .attr("transform", transX(attr.marginLeft))
        .call(yAxisGrid);
    }

    // dates
    if (attr.xAxis) {
      let xAxisGrid = d3
        .axisBottom(calc.xChartScale)
        .tickSize(-calc.graphHeight)
        .tickFormat("");

      calc.svg
        .append("g")
        .attr("class", "ltv-bar-chart-grid ltv-bar-chart-grid-y")
        .attr("color", attr.axisColor)
        .attr("stroke-width", attr.axisStrokeWidth)
        .attr("transform", transY(calc.graphBottom))
        .call(xAxisGrid);
    }
  }

  function renderSelectionBars(calc, dv) {
    calc.selection = calc.svg
      .append("g")
      .selectAll("rect")
      .data(dv.dates)
      .enter()
      .append("rect")
      .attr("id", (d) => elementId("selection-rect", d))
      .attr("class", "ltv-bar-chart-selection-rect")
      .attr("x", (d) => calc.xChartScale(d))
      .attr("y", attr.marginTop)
      .attr("width", calc.xChartScale.bandwidth())
      .attr("height", calc.graphHeight)
      .attr("pointer-events", "none")
      .attr("opacity", 0);
  }

  function renderHoverBars(calc, dv) {
    calc.selection = calc.svg
      .append("g")
      .selectAll("rect")
      .data(dv.dates)
      .enter()
      .append("rect")
      .attr("id", (d) => elementId("hover-bar", d))
      .attr("class", "ltv-bar-chart-hover-bar")
      .attr("x", (d) => calc.xChartScale(d))
      .attr("y", attr.marginTop)
      .attr("width", calc.xChartScale.bandwidth())
      .attr("height", calc.graphHeight)
      .attr("opacity", 0)
      .on("mouseenter", mouseEnter)
      .on("mouseout", mouseOut)
      .on("mousedrag", mouseDrag)
      .on("click", click)
      .raise();

    function mouseEnter(event, date) {
      // make hover bar visible
      d3.select(this).attr("opacity", config.selectionOpacity);

      // position tooltip
      let tooltipSize = calc.tip.size(),
        domRect = calc.svg.node().getBoundingClientRect(),
        factor = domRect.width / attr.width,
        offset = [domRect.x + window.scrollX, domRect.y + window.scrollY],
        top = getTop(factor, offset[1], tooltipSize, calc),
        left = calc.xChartScalePadding(date);

      // differ tooltip position on bar position
      left =
        left > attr.width / 2
          ? getXLeft(date, factor, offset, tooltipSize, calc)
          : getXRight(date, factor, offset, calc);

      calc.tip
        .html(getHTMLForDate(date, dv, calc))
        .top(`${top}px`)
        .left(`${left}px`)
        .show();
    }

    function mouseOut(event, date) {
      // make hover bar invisible
      d3.select(this).attr("opacity", 0);

      calc.tip.hide();
    }

    function mouseDrag(event, date) {
      // check for mouse down
      if (event.buttons === 1) onMouseClick(event, date);
    }

    function click(event, date) {
      if (!attr.enabled) return;
      var dc = attr.dataController;
      dc.toggleFilter("dates", date, chart);

      calc.svg
        .selectAll(`.ltv-bar-chart-selection-rect`)
        .attr(`opacity`, (d) => (dc.isFilter("dates", d) ? 0.05 : 0));

      calc.svg
        .selectAll(".ltv-bar-chart-dates-area")
        .attr(`opacity`, (d) => (dc.isFilter("dates", d[0]) ? 0.16 : 1));
    }
  }

  function renderCombined(calc, dv) {
    calc.svg
      .append("g")
      .selectAll("g")
      .data(dv.byDateGroup)
      .enter()
      .append("g")
      .attr("transform", (d) => transX(calc.xChartScale(d[0]))) // x for date
      .attr("class", "ltv-bar-chart-dates-area")
      .selectAll("rect")
      .data((d) => d[1]) // map to by group
      .enter()
      .append("rect")
      .attr("class", "ltv-bar-chart-bar")
      .attr("fill", (d) => calc.colors.group(d[0]))
      .attr("x", (d) => calc.xGroup(d[0]))
      .attr("y", (d) => calc.yChart(d[1]))
      .attr("width", calc.xGroup.bandwidth())
      .attr("height", (d) => calc.graphBottom - calc.yChart(d[1]))
      .attr("pointer-events", "none")
      .attr("rx", attr.radius)
      .attr("ry", attr.radius)
      .raise();
  }

  /**
   * Renders the bars in "grouped" style.
   *
   * @param {*} calc The calc object
   * @param {*} dv The data view
   */
  function renderGrouped(calc, dv) {
    calc.svg
      .append("g")
      .selectAll("g")
      .data(dv.byDatesGroupSeries)
      .enter()
      .append("g")
      .attr("transform", (d) => transX(calc.xChartScale(d[0]))) // translate to x of date
      .attr("class", "ltv-bar-chart-dates-area")
      .selectAll("rect")
      .data((d) => d[1]) // map to by group
      .enter()
      .append("g")
      .attr("transform", (d) => transX(calc.xGroup(d[0])))
      .selectAll("rect")
      .data((d) => d[1]) // map to series
      .enter()
      .append("rect")
      .attr("class", "ltv-bar-chart-bar")
      .attr("fill", (d) => calc.colors.label(d[2]))
      .attr("width", calc.xGroup.bandwidth())
      .attr("height", (d) =>
        !d[1] ? 0 : calc.yChart(d[0]) - calc.yChart(d[1])
      )
      .attr("y", (d) => calc.yChart(d[1]))
      .attr("pointer-events", "none")
      .attr("rx", attr.radius)
      .attr("ry", attr.radius)
      .raise();
  }

  function renderLabels(calc, dv) {
    calc.labels = calc.svg
      .append("g")
      .selectAll("g")
      .data(dv.dates)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${calc.xChartScale(d)},0)`) // translate to x of date
      .selectAll(".text")
      .data((date) => dv.byDateGroup.get(date) || [])
      .enter()
      .append("text")
      .attr("class", "ltv-bar-chart-label")
      .attr("transform", (d) => {
        let group = d[0],
          value = d[1],
          width = calc.xGroup.bandwidth() / 2,
          x = (calc.xGroup(group) || 0) + width,
          y = calc.yChart(value) - 5,
          deg = attr.labelRotation || -60;
        return `translate(${x},${y})rotate(${deg})`;
      })
      .text((d) => (d[1] === 0 ? "" : attr.numberFormat(d[1])))
      .raise();
  }

  /**
   *
   * @param {*} factor
   * @param {*} yOffset
   * @param {*} tooltipSize
   * @param {*} calc
   * @returns
   */
  function getTop(factor, yOffset, tooltipSize, calc) {
    return (
      attr.marginTop * factor +
      (calc.graphHeight * factor - tooltipSize[1]) / 2 +
      (yOffset - 10)
    );
  }

  /**
   *
   * @param {*} date
   * @param {*} factor
   * @param {*} offset
   * @param {*} tooltipSize
   * @param {*} calc
   * @returns
   */
  function getXLeft(date, factor, offset, tooltipSize, calc) {
    return (
      calc.xChartScale(date) * factor +
      offset[0] -
      tooltipSize[0] -
      22 -
      config.tooltipOffset
    );
  }

  /**
   *
   * @param {*} date
   * @param {*} factor
   * @param {*} offset
   * @param {*} calc
   * @returns
   */
  function getXRight(date, factor, offset, calc) {
    return (
      (calc.xChartScale(date) + calc.xChartScale.bandwidth()) * factor +
      offset[0] +
      config.tooltipOffset
    );
  }

  /**
   *
   * @param {*} date
   * @param {*} dv
   * @param {*} calc
   * @returns
   */
  function getHTMLForDate(date, dv, calc) {
    let filtered = dv.byDateLabel.get(date);
    if (!filtered) return "No Data";

    let title = `${date}`;
    let sum = 0;
    let dataHTML = Array.from(filtered.keys())
      .map(function (label) {
        let value = filtered.get(label);
        if (!value) return undefined;
        let color = calc.colors.label(label);
        let divHTML = `<div style="background: ${color};color: ${color}; display: inline;">__</div>`;
        let valueFormatted = attr.numberFormat(value);
        sum += value;
        return `${divHTML} ${label}: <b>${valueFormatted}</b>`;
      })
      .filter((d) => d)
      .join("<br>");

    let sumFormatted = attr.numberFormat(sum);
    return `<b>${title}</b><br>${dataHTML}<br><br>Sum: <b>${sumFormatted}</b>`;
  }

  /**
   * Calculates the data view for the bar chart.
   * @returns
   */
  chart.dataView = function () {
    let dc = attr.dataController;
    if (!dc) throw new Error("no data controller");

    let dv = {};

    dv.data = dc.data();
    dv.snapshot = dc.snapshot();
    dv.dates = dv.data.dates;
    dv.groups = dv.snapshot.groups;
    dv.labels = dv.snapshot.labels;
    dv.enabledGroups = dv.snapshot.groups;

    dv.byDateGroupOriginal = d3.rollup(
      dv.data,
      (v) => d3.sum(v, (d) => d.value),
      (d) => d.date,
      (d) => d.group || d.label
    );

    dv.maxTotal = d3.max(dv.byDateGroupOriginal, (d) =>
      d3.max(d[1], (d) => d[1])
    );

    dv.byDateLabel = d3.rollup(
      dv.snapshot,
      (v) => d3.sum(v, (d) => d.value),
      (d) => d.date,
      (d) => d.label
    );

    dv.byDateGroup = d3.rollup(
      dv.snapshot,
      (v) => d3.sum(v, (d) => d.value),
      (d) => d.date,
      (d) => d.group || d.label
    );

    dv.byDateGroupLabel = d3.rollup(
      dv.snapshot,
      (v) => d3.sum(v, (d) => d.value),
      (d) => d.date,
      (d) => d.group || d.label,
      (d) => d.label
    );

    dv.byDatesGroupSeries = new d3.InternMap();
    dv.dates.forEach((date) => {
      let byGroupLabel = dv.byDateGroupLabel.get(date);
      if (!byGroupLabel) return;
      dv.byDatesGroupSeries.set(date, new d3.InternMap());

      dv.groups.forEach((group) => {
        let byLabel = byGroupLabel.get(group);
        if (!byLabel) return;
        let value = 0;
        let series = Array.from(byLabel)
          .reverse()
          .map((item) => [value, (value += item[1]), item[0]]);
        dv.byDatesGroupSeries.get(date).set(group, series);
      });
    });

    dv.max = d3.max(dv.byDateGroup, (d) => d3.max(d[1], (d) => d[1]));

    return dv;
  };

  /**
   *
   * @param {*} container
   * @param {*} attr
   * @param {*} calc
   * @param {*} dv
   */
  chart.render = function (container, calc, dv) {
    calc.graphWidth = attr.width - attr.marginLeft - attr.marginRight;
    calc.graphHeight = attr.height - attr.marginTop - attr.marginBottom;
    calc.graphBottom = attr.height - attr.marginBottom;
    calc.graphRight = attr.width - attr.marginRight;
    calc.colors = ColorsGenerator(attr.colorScheme).data(dv.data);

    createScales(calc, dv);

    renderSVG(container, calc);
    renderBackground(calc, dv);
    renderAxis(calc, dv);
    renderGrid(calc, dv);
    renderSelectionBars(calc, dv);
    renderHoverBars(calc, dv);

    if (attr.style === "combine") {
      renderCombined(calc, dv);
    } else {
      renderGrouped(calc, dv);
    }

    if (attr.title) {
      renderTitle(calc, dv);
    }

    if (attr.labels) {
      renderLabels(calc, dv);
    }

    if (attr.tooltip) {
      calc.tip = tooltip().container(container).run();
      calc.tip.div().classed("ltv-bar-chart-tooltip", true);
    }

    if (attr.legend) {
      let dc = attr.dataController;
      let dv = attr.legend.dataController(dc).dataView();
      let calc = {};
      attr.legend
        .marginLeft(attr.marginLeft)
        .marginRight(attr.marginRight)
        .colorScheme(attr.colorScheme);
      attr.legend.skipFilterUpdate = () => true;
      attr.legend.render(container, calc, dv);
    }
  };

  // return generated chart
  return chart;
}
