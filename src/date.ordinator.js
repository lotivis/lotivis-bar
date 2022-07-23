import * as d3 from "d3";

const formatGerman = "%d.%m.%Y";
const formatIso = "%Y-%m-%d";

export function DEFAULT_DATE_ORDINATOR(value) {
  return value;
}

export function DATE_TO_NUMBER_ORDINATOR(date) {
  return Number(date);
}

export function GERMAN_DATE_ORDINATOR(string) {
  return Number(d3.timeParse(formatGerman)(string));
}

export function ISO_DATE_ORDINATOR(string) {
  return Number(d3.timeParse(formatIso)(string));
}

export function WEEKDAY_ORDINATOR(weekday) {
  let lowercase = weekday.toLowerCase();
  switch (lowercase) {
    case "sunday":
    case "sun":
      return 0;
    case "monday":
    case "mon":
      return 1;
    case "tuesday":
    case "tue":
      return 2;
    case "wednesday":
    case "wed":
      return 3;
    case "thursday":
    case "thr":
      return 4;
    case "friday":
    case "fri":
      return 5;
    case "saturday":
    case "sat":
      return 6;
    default:
      return -1;
  }
}
