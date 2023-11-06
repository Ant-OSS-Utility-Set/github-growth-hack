const moment = require("moment"); // require

// 获取上周一
function lastMonday() {
  return moment().startOf("isoWeek").subtract(7, "days").toISOString(true);
}

// 获取上周二
function lastTuesday() {
  return moment().startOf("isoWeek").subtract(6, "days").toISOString(true);
}

// 获取上周三
function lastWensday() {
  return moment().startOf("isoWeek").subtract(5, "days").toISOString(true);
}

// 获取上周四
function lastThursday() {
  return moment().startOf("isoWeek").subtract(4, "days").toISOString(true);
}

// 获取上周五
function lastFriday() {
  return moment().startOf("isoWeek").subtract(3, "days").toISOString(true);
}

// 获取上周六
function lastSaturday() {
  return moment().startOf("isoWeek").subtract(2, "days").toISOString(true);
}

// 获取上周日00:00:00
function lastSaturday00_00_00() {
  return moment()
    .startOf("isoWeek")
    .hour(0)
    .minute(0)
    .second(0)
    .subtract(2, "days")
    .toISOString(true);
}

// 获取上周日
function lastSunday() {
  return moment().startOf("isoWeek").subtract(1, "days").toISOString(true);
}

// 获取7天前
function sevenDaysBefore() {
  return moment().subtract(7, "days").toISOString(true);
}

// 获取今天
function today() {
  return moment().toISOString(true);
}

// 获取指定格式的日期
function toISOS (data){
  return moment(data).toISOString(true)
}
// 获取当前时间，并以可读的格式返回
function nowWithReadableFormat() {
  return moment().format("YYYY-MM-DD HH:mm:ss");
}

// 将日期格式化为YYYY-MM-DD HH:mm:ss
function formatWithReadableFormat(date) {
  return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

// 将日期格式化为YYYY-MM-DD HH:mm:ss
function formatUTC(date) {
  return moment.utc(date).format("YYYY-MM-DD HH:mm:ss");
}

// 获取本周周日
function thisSunday() {
  return moment().day(0).toISOString(true);
}
// 获取本周周一
function thisMonday() {
  return moment().day(1).toISOString(true);
}
// 获取本周周二
function thisTuesday() {
  return moment().day(2).toISOString(true);
}
// 获取本周周五
function thisFriday() {
  return moment().day(5).toISOString(true);
}
// 获取本周周五的23:59:59
function thisFriday23_59_59() {
  return moment().day(5).hour(23).minute(59).second(59).toISOString(true);
}
// 获取本周周六
function thisSaturday() {
  return moment().day(6).toISOString(true);
}

// 导出utils
exports.utils = {
  lastMonday: lastMonday,
  lastTuesday: lastTuesday,
  lastWensday: lastWensday,
  lastThursday: lastThursday,
  lastFriday: lastFriday,
  lastSaturday: lastSaturday,
  lastSunday: lastSunday,
  sevenDaysBefore: sevenDaysBefore,
  today: today,
  nowWithReadableFormat: nowWithReadableFormat,
  formatWithReadableFormat: formatWithReadableFormat,
  formatUTC: formatUTC,
  thisSunday: thisSunday,
  thisMonday: thisMonday,
  thisTuesday: thisTuesday,
  thisFriday: thisFriday,
  thisSaturday: thisSaturday,
  thisFriday23_59_59: thisFriday23_59_59,
  lastSaturday00_00_00: lastSaturday00_00_00,
  toISOS:toISOS,
};