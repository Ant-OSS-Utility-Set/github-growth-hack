const weekly = require("./service/weekly");
const { monthly } = require("./service/monthly");
const { issueScanner } = require("./service/issue_scanner");
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
  // check config
  if (token == null || token.length < 40) {
    throw new Error("Please set your github token in src/index.js");
  }
  // set config
  if (dangerousIssuesConfig != null) {
    shouldReplyInXDays(dangerousIssuesConfig.shouldReplyInXDays);
    mustReplyInXDays(dangerousIssuesConfig.mustReplyInXDays);
  }
  setConfig(mysqlConfig, () =>
    doDispatch(token, repos, mergeRepo, since, to, dingTalkGroupConfig)
  );
}

function doDispatch(token, repos, mergeRepo, since, to, dingTalkGroupConfig) {

  console.log("From: " + since);
  console.log("To: " + to);

  const args = process.argv.slice(2);
  console.log("Mode: " + args[0]);

  if (args[0] == "month") {
    monthly.generateReportForLastMonth(token, repos, mergeRepo);
  } else if (args[0] == "scan") {
    setDingTalkGroup(dingTalkGroupConfig.groups, dingTalkGroupConfig.owners,repos);
    issueScanner.livenessCheck(token, repos, since, to);
  } else if (args[0] == "good-first-issue") {
    issueScanner.scanGoodFirstIssues(token, repos, since, to);
  } else {
    weekly.generateScoreReport(token, repos, mergeRepo, since, to);
  }
}

module.exports = {
  dispatch: dispatch,
};
