const weekly = require("./weekly");
const { monthly } = require("./monthly");
const { scanner } = require("./scanner");
const { setDingTalkGroup } = require("./dao/dangerous_issue");

function dispatch(token, repos, since, to, dingTalkGroupConfig) {
  if (token == null || token.length < 40) {
    throw new Error("Please set your github token in src/index.js");
  }
  console.log("From: " + since);
  console.log("To: " + to);

  const args = process.argv.slice(2);
  console.log("Mode: " + args[0]);
  if (args[0] == "month") {
    monthly.generateReportForLastMonth(token, repos);
  } else if (args[0] == "scan") {
    setDingTalkGroup(
      dingTalkGroupConfig.url,
      dingTalkGroupConfig.keyword,
      dingTalkGroupConfig.owners
    );
    scanner.scan(token, repos, since, to);
  } else {
    weekly.generateScoreReport(token, repos, since, to);
  }
}

module.exports = {
  dispatch: dispatch,
};
