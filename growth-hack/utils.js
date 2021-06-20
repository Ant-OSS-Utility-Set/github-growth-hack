const moment = require("moment"); // require

function lastMonday() {
  return moment().startOf("isoWeek").subtract(7, "days").toISOString(true);
}

function lastTuesday() {
  return moment().startOf("isoWeek").subtract(6, "days").toISOString(true);
}

function lastWensday() {
  return moment().startOf("isoWeek").subtract(5, "days").toISOString(true);
}

function lastThursday() {
  return moment().startOf("isoWeek").subtract(4, "days").toISOString(true);
}

function lastFriday() {
  return moment().startOf("isoWeek").subtract(3, "days").toISOString(true);
}

function lastSaturday() {
  return moment().startOf("isoWeek").subtract(2, "days").toISOString(true);
}

function lastSunday() {
  return moment().startOf("isoWeek").subtract(1, "days").toISOString(true);
}

function sevenDaysBefore() {
  return moment().subtract(7, "days").toISOString(true);
}

exports.utils = {
  lastMonday: lastMonday,
  lastTuesday: lastTuesday,
  lastWensday: lastWensday,
  lastThursday: lastThursday,
  lastFriday: lastFriday,
  lastSaturday: lastSaturday,
  lastSunday: lastSunday,
  sevenDaysBefore: sevenDaysBefore,
};
