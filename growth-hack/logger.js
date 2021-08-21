const fs = require("fs");

function logStart(content) {
  console.log(content);
  // write files
  content = content.replace(/\t/g, ",");

  try {
    fs.writeFileSync("report.csv", content + "\n");
  } catch (err) {
    console.error(err);
  }
}

function logStartZh(content) {
  // write files
  // need to add BOM header,see
  // https://www.zhihu.com/question/21869078/answer/350728339
  try {
    fs.writeFileSync("report-zh.csv", "\uFEFF" + content + "\n", "utf8");
  } catch (err) {
    console.error(err);
  }
}

function log(content) {
  console.log(content);
  // write files
  content = content.replace(/\t/g, ",");

  try {
    fs.appendFileSync("report.csv", content + "\n");
    fs.appendFileSync("report-zh.csv", content + "\n");
  } catch (err) {
    console.error(err);
  }
}

exports.logger = {
  logStart: logStart,
  logStartZh: logStartZh,
  log: log,
};
