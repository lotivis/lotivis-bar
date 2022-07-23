import * as d3 from "d3";
import { chart as baseChart, config } from "lotivis-chart";
import { colorSchemeDefault, ColorsGenerator } from "./colors.js";

export const legendLabelFormat = function (l, v, i) {
  return `${l} (${v})`;
};

export const legendGroupFormat = function (s, v, ls, i) {
  return `${s}`;
};

export const legendSectionFormat = function (s, v, ls, i) {
  return `${i + 1}) ${s} (Sum: ${v})`;
};

export function legend() {
  let attr = {
    // the id of the legend
    id: "legend-" + new Date().getTime(),

    // margin
    marginLeft: 0,
    marginTop: 10,
    marginRight: 0,
    marginBottom: 20,

    // whether the legend is enabled
    enabled: true,

    // the number formatter vor values displayed
    numberFormat: config.numberFormat,

    // the format of displaying a datasets label
    labelFormat: legendLabelFormat,

    // the format of displaying a datasets group
    groupFormat: legendGroupFormat,

    // the format of displaying a group
    sectionFormat: legendSectionFormat,

    // color scheme to use
    colorScheme: colorSchemeDefault,

    // (optional) title of the legend
    title: null, // (chart) => null

    // whether to display groups instead of labels
    groups: false, // (chart) => false

    // whether to create separate sections (by groups)
    sections: false, // (chart) => false

    // the data controller
    dataController: null,
  };

  var chart = baseChart(attr);

  /**
   * Toggles the filtered attr of the passed label.
   *
   * @param {Event} event The event of the checkbox
   * @param {String} label The label to be toggled
   * @private
   */
  function toggleLabel(event, label) {
    event.target.checked
      ? attr.dataController.removeFilter("labels", label, chart)
      : attr.dataController.addFilter("labels", label, chart);
  }

  /**
   * Toggles the filtered attr of the passed group.
   *
   * @param {Event} event The event of the checkbox
   * @param {String} group The group to be toggled
   * @private
   */
  function toggleGroup(event, group) {
    event.target.checked
      ? attr.dataController.removeFilter("groups", group, chart)
      : attr.dataController.addFilter("groups", group, chart);
  }

  /**
   * Returns the value for the "checked" attribute dependant on whether
   * given label is filtered by the data controller.
   *
   * @param {*} label The label to be checked
   * @returns {null | boolean}
   * @private
   */
  function labelChecked(label) {
    return attr.dataController.isFilter("labels", label) ? null : true;
  }

  /**
   * Returns the value for the "checked" attribute dependant on whether
   * given group is filtered by the data controller.
   *
   * @param {*} group The group to be checked
   * @returns {null | boolean}
   * @private
   */
  function groupChecked(group) {
    return attr.dataController.isFilter("groups", group) ? null : true;
  }

  function format(value) {
    return typeof attr.numberFormat === "function"
      ? attr.numberFormat(value)
      : value;
  }

  function labelText(label, index, dv) {
    return typeof attr.labelFormat !== "function"
      ? label
      : attr.labelFormat(label, format(dv.byLabel.get(label)), index);
  }

  function groupText(group, index, dv) {
    if (typeof attr.groupFormat !== "function") return group;
    var value = format(dv.byGroup.get(group)),
      labelsToValue = dv.byGroupLabel.get(group),
      labels = Array.from(labelsToValue ? labelsToValue.keys() : []);
    return attr.groupFormat(group, value, labels, index);
  }

  function disabled() {
    return unwrap(attr.enabled) ? null : true;
  }

  function isGroups() {
    return unwrap(attr.groups) === true;
  }

  function isSections() {
    return unwrap(attr.sections) === true;
  }

  function unwrap(value) {
    return typeof value === "function" ? value(chart) : value;
  }

  /**
   * Calculates the data view for the bar chart.
   *
   * @returns The generated data view
   * @public
   */
  chart.dataView = function () {
    var dc = attr.dataController;
    if (!dc) throw new Error("no data controller");

    var dv = {};
    dv.data = dc.data();
    dv.labels = dc.labels();
    dv.groups = dc.groups();
    dv.locations = dc.locations();
    dv.dates = dc.dates();

    dv.byLabel = d3.rollup(
      dc.data(),
      (v) => d3.sum(v, (d) => d.value),
      (d) => d.label
    );

    dv.byGroup = d3.rollup(
      dc.data(),
      (v) => d3.sum(v, (d) => d.value),
      (d) => d.group || d.label
    );

    dv.byGroupLabel = d3.rollup(
      dc.data(),
      (v) => d3.sum(v, (d) => d.value),
      (d) => d.group || d.label,
      (d) => d.label
    );

    return dv;
  };

  /**
   * Renders all components of the plot chart.
   *
   * @param {*} container The d3 container
   * @param {*} calc The calc objct of the chart
   * @param {*} dv The data view
   * @returns The chart itself
   *
   * @public
   */
  chart.render = function (container, calc, dv) {
    calc.colors = ColorsGenerator(attr.colorScheme).data(dv.data);
    calc.div = container
      .append("div")
      .classed("ltv-legend", true)
      .attr("id", attr.id)
      .style("margin-left", attr.marginLeft + "px")
      .style("margin-top", attr.marginTop + "px")
      .style("margin-right", attr.marginRight + "px")
      .style("margin-bottom", attr.marginBottom + "px");

    // if a title is given render div with title inside
    if (attr.title) {
      calc.titleDiv = calc.div
        .append("div")
        .classed("ltv-legend-title", true)
        .text(unwrap(attr.title));
    }

    var colorFn = isGroups() ? calc.colors.group : calc.colors.label,
      changeFn = isGroups() ? toggleGroup : toggleLabel,
      textFn = isGroups() ? groupText : labelText;

    calc.sections = calc.div
      .selectAll(".div")
      .data(isSections() ? dv.groups : [""]) // use single group when mode is not "groups"
      .enter()
      .div("ltv-legend-group")
      .style("color", (s) => calc.colors.group(s));

    // draw titles only in "sections" mode
    if (isSections()) {
      calc.titles = calc.sections.append("div").text((section, index) => {
        var labelsToValue = dv.byGroupLabel.get(section),
          value = format(dv.byGroup.get(section)),
          labels = Array.from(labelsToValue ? labelsToValue.keys() : []);
        return attr.sectionFormat(section, value, labels, index);
      });
    }

    var pillsData = isSections()
      ? (d) => (isGroups() ? [d] : dv.byGroupLabel.get(d))
      : isGroups()
      ? dv.groups
      : dv.labels;

    calc.pills = calc.sections
      .selectAll(".label")
      .data(pillsData)
      .enter()
      .append("label")
      .classed("ltv-legend-pill", true)
      .datum((d) => (isSections() && !isGroups() ? d[0] : d));

    calc.checkboxes = calc.pills
      .append("input")
      .classed("ltv-legend-checkbox", true)
      .attr("type", "checkbox")
      .attr("checked", isGroups() ? groupChecked : labelChecked)
      .attr("disabled", disabled())
      .on("change", (e, d) => changeFn(e, d));

    calc.spans = calc.pills
      .append("span")
      .classed("ltv-legend-pill-span", true)
      .style("background-color", colorFn)
      .text((d, i) => textFn(d, i, dv));

    if (attr.debug) console.log(this);

    return chart;
  };

  // return generated chart
  return chart;
}
