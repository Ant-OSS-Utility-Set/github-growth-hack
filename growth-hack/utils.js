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

function lastSaturday00_00_00() {
  return moment().startOf("isoWeek").hour(0).minute(0).second(0).subtract(2, "days").toISOString(true);
}

function lastSunday() {
  return moment().startOf("isoWeek").subtract(1, "days").toISOString(true);
}

function sevenDaysBefore() {
  return moment().subtract(7, "days").toISOString(true);
}

// get now with format 'YYYY-MM-DD HH:mm:ss'
function nowWithReadableFormat() {
  return moment().format("YYYY-MM-DD HH:mm:ss");
}

// convert to 'YYYY-MM-DD HH:mm:ss'
function formatWithReadableFormat(since) {
  return moment(since).format("YYYY-MM-DD HH:mm:ss");
}
function thisSunday() {
  return moment().day(0).toISOString(true);
}
function thisMonday() {
  return moment().day(1).toISOString(true);
}
function thisTuesday() {
  return moment().day(2).toISOString(true);
}
function thisFriday() {
  return moment().day(5).toISOString(true);
}
function thisFriday23_59_59() {
  return moment().day(5).hour(23).minute(59).second(59).toISOString(true);
}

function thisSaturday() {
  return moment().day(6).toISOString(true);
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
  nowWithReadableFormat: nowWithReadableFormat,
  formatWithReadableFormat: formatWithReadableFormat,
  thisSunday: thisSunday,
  thisMonday: thisMonday,
  thisTuesday: thisTuesday,
  thisFriday: thisFriday,
  thisSaturday: thisSaturday,
  thisFriday23_59_59:thisFriday23_59_59,
  lastSaturday00_00_00:lastSaturday00_00_00,
};
