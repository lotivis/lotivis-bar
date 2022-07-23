import * as d3 from "d3";

/** Returns the darker darker version of the passed color. */
function darker(color) {
  // return color.darker().darker();
  return color.darker();
}

// constants

export const colorSchemeCategory10 = d3.schemeCategory10;

export const colorSchemeTableau10 = d3.schemeTableau10;

export const colorSchemeLotivis10 = [
  "RoyalBlue",
  "MediumSeaGreen",
  "MediumPurple",
  "Violet",
  "Orange",
  "Tomato",
  "Turquoise",
  "LightGray",
  "Gray",
  "BurlyWood",
];

export const colorSchemeDefault = colorSchemeCategory10;

export const tintColor = colorSchemeDefault[0];

export const colorScale1 = colorScale("Yellow", "Orange", "Red", "Purple");

export const colorScale2 = colorScale(
  "White",
  colorSchemeDefault[2],
  colorSchemeDefault[0]
);

console.log(colorSchemeDefault[0]);

export function ColorsGenerator(c, d) {
  let colors = c || colorSchemeDefault,
    data = d || [],
    groupColors,
    labelColors,
    groupsToLabels,
    groups;

  function fallback() {
    return Array.isArray(colors) && colors.length ? colors[0] : "RoyalBlue";
  }

  function generator(index) {
    return colors[(+index || 0) % colors.length];
  }

  function calc() {
    groupColors = new Map();
    labelColors = new Map();
    groupsToLabels = d3.group(
      data,
      (d) => d.group || d.label,
      (d) => d.label
    );
    groups = Array.from(groupsToLabels.keys());

    groups.forEach((group) => {
      let labels = Array.from((groupsToLabels.get(group) || []).keys());
      let groupColor = colors[groups.indexOf(group) % colors.length];
      let c1 = d3.color(groupColor);
      let groupScale = colorScale(c1, darker(c1));

      groupColors.set(group, c1);

      labels.forEach((label, index) => {
        labelColors.set(label, groupScale(index / labels.length));
      });
    });

    return generator;
  }

  generator.data = function (_) {
    return arguments.length ? ((data = _), calc()) : data;
  };

  generator.colors = function (_) {
    return arguments.length ? ((colors = _), calc()) : colors;
  };

  generator.group = function (group) {
    return groupColors ? groupColors.get(group) || fallback() : fallback();
  };

  generator.label = function (label) {
    return labelColors ? labelColors.get(label) || fallback() : fallback();
  };

  return generator;
}

export function colorScale(...colors) {
  if (!colors.length) throw new Error("no colors");
  return d3
    .scaleLinear()
    .domain(colors.map((c, i) => i / (colors.length - 1)))
    .range(colors);
}
