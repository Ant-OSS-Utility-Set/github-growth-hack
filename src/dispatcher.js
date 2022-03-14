const weekly = require("./weekly");
const { monthly } = require("./monthly");
const { scanner } = require("./scanner");
const { setDingTalkGroup } = require("./dao/dangerous_issue");
const { shouldReplyInXDays, mustReplyInXDays } = require("./metrics/issues");
const { setConfig } = require("./dao/mysql_conn");

function dispatch(
  token,
  repos,
  mergeRepo,
  since,
  to,
  mysqlConfig,
  dangerousIssuesConfig,
  dingTalkGroupConfig
) {
  if (token == null || token.length < 40) {
    throw new Error("Please set your github token in src/index.js");
  }
  if (dangerousIssuesConfig != null) {
    shouldReplyInXDays(dangerousIssuesConfig.shouldReplyInXDays);
    mustReplyInXDays(dangerousIssuesConfig.mustReplyInXDays);
  }
  setConfig(mysqlConfig);
  
  console.log("From: " + since);
  console.log("To: " + to);

  const args = process.argv.slice(2);
  console.log("Mode: " + args[0]);
  if (args[0] == "month") {
    monthly.generateReportForLastMonth(token, repos, mergeRepo);
  } else if (args[0] == "scan") {
    setDingTalkGroup(dingTalkGroupConfig.groups, dingTalkGroupConfig.owners);
    scanner.scan(token, repos, since, to);
  } else {
    weekly.generateScoreReport(token, repos, mergeRepo, since, to);
  }
}

module.exports = {
  dispatch: dispatch,
};
