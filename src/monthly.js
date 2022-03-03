const fs = require("fs");
const { activeContributorsLastMonth } = require("./metrics/contributor");

function generateReportForLastMonth(token, repos, mergeRepo) {
  // write header
  write(`owner,project,active_contributors,month`);

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

function append(content) {
  try {
    fs.appendFileSync("report-month.csv", content + "\n");
  } catch (err) {
    console.error(err);
  }
}

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
