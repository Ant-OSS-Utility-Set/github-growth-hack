const fs = require("fs");
const { activeContributorsLastMonth } = require("../metrics/contributor");
const { configNames } = require("../const.js");

// 生成上一个月报告
function generateReportForLastMonth(config) {
  // write header
  write(`owner,project,active_contributors,month`);

  // 修复一个错误
  fixBug();
  // fetch data
  let arr = [];
  for (const owner in config.orgRepoConfig) {
    for (const repo in config.orgRepoConfig[owner]) {
      if(configNames.includes(repo)){
        continue
      }
      const res = activeContributorsLastMonth(owner, repo).then((res) => {
        // write
        append(`${res.owner},${res.repo},${res.activeContributors},${res.month}`);
        return res;
      });
      arr.push(res);
    }

  }
  return Promise.all(arr);
}

// 修复一个错误
function fixBug() {
  // fix an annoying bug
  // see https://stackoverflow.com/questions/58993308/getting-error-getaddrinfo-enotfound-while-performing-rest-api-call-in-node-js-u
  const dns = require("dns");

  dns.resolve(
    "contributor-overtime-api.apiseven.com",
    "ANY",
    (err, records) => {
      if (err) {
        console.log("Error: ", err);
      } else {
        // console.log(records);
      }
    }
  );
}

// 向报告文件中追加内容
function append(content) {
  try {
    fs.appendFileSync("./report-month.csv", content + "\n");
  } catch (err) {
    console.error(err);
  }
}

// 将内容写入报告文件
function write(content) {
  try {
    fs.writeFileSync("./report-month.csv", content + "\n");
  } catch (err) {
    console.error(err);
  }
}

module.exports.monthly = {
  generateReportForLastMonth: generateReportForLastMonth,
};