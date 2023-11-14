const fs = require("fs");
const { activeContributorsLastMonth } = require("../metrics/contributor");

// 生成上一个月报告
function generateReportForLastMonth(token, repos) {
  // write header
  write(`owner,project,active_contributors,month`);

  // 修复一个错误
  fixBug();
  // fetch data
  let arr = [];
  for (let i = 0; i < repos.length; i++) {
    let repo = repos[i];
    arr[i] = activeContributorsLastMonth(repo[0], repo[1]).then((res) => {
      // write
      append(`${res.owner},${res.repo},${res.activeContributors},${res.month}`);
      return res;
    });
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
    fs.appendFileSync("report-month.csv", content + "\n");
  } catch (err) {
    console.error(err);
  }
}

// 将内容写入报告文件
function write(content) {
  try {
    fs.writeFileSync("report-month.csv", content + "\n");
  } catch (err) {
    console.error(err);
  }
}

module.exports.monthly = {
  generateReportForLastMonth: generateReportForLastMonth,
};