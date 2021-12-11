const fs = require("fs");
const { utils } = require("./utils");
const https = require("https");

function generateReportForLastMonth(token, repos) {
  let result = [];
  // write header
  write(`owner,project,active_contributors,month`);

  repos.forEach((repo, i) => {
    // 1. generate url
    // https://contributor-overtime-api.apiseven.com/monthly-contributor?repo=apache/apisix
    let url = "/monthly-contributor?repo=" + repo[0] + "/" + repo[1];

    // 2. get data
    const options = {
      hostname: "contributor-overtime-api.apiseven.com",
      port: 443,
      path: url,
      method: "GET",
    };

    const req = https.request(options, (res) => {
      console.log(`statusCode: ${res.statusCode}`);

      // 3a. parse result data on success
      res.on("data", (d) => {
        d = JSON.parse(d);
        // check month_api_response.json to see the result data structure
        let data = d.Contributors;
        let last = data[data.length - 1];
        result[i] = {
          owner: repo[0],
          repo: repo[1],
          activeContributors: last.Num,
          month: utils.formatUTC(last.Month),
        };
        // 4. write
        append(
          `${result[i].owner},${result[i].repo},${result[i].activeContributors},${result[i].month}`
        );
        // process.stdout.write(d);
      });
    });

    // 3b. error handling
    req.on("error", (error) => {
      console.error(error);
    });

    req.end();
  });
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

module.exports.month = {
  generateReportForLastMonth: generateReportForLastMonth,
};
