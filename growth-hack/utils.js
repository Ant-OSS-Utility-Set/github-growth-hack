const moment = require("moment"); // require

function lastSunday() {
  return moment().startOf("isoWeek").subtract(1, "days").toISOString(true);
}

function lastSaturday() {
  return moment().startOf("isoWeek").subtract(2, "days").toISOString(true);
}

function lastFriday() {
  return moment().startOf("isoWeek").subtract(3, "days").toISOString(true);
}

exports.utils = {
  lastSaturday: lastSaturday,
  lastFriday: lastFriday,
  lastSunday: lastSunday,
};
