const weekly = require("./service/weekly");
const { monthly } = require("./service/monthly");
const { issueScanner } = require("./service/issue_scanner");
const { setDingTalkGroup } = require("./dao/dangerous_issue");
const { shouldReplyInXDays, mustReplyInXDays } = require("./metrics/issues");
const { setConfig } = require("./dao/mysql_conn");

// 定义一个函数dispatch，用于调度
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
  // token不能为空且长度不能小于40
  if (token == null || token.length < 40) {
    throw new Error("Please set your github token in src/index.js");
  }
  // set config
  // 危险Issues问题
  if (dangerousIssuesConfig != null) {
    // 应该回复天数
    shouldReplyInXDays(dangerousIssuesConfig.shouldReplyInXDays);
    // 必须回复天数
    mustReplyInXDays(dangerousIssuesConfig.mustReplyInXDays);
  }
  setConfig(mysqlConfig, () =>
    doDispatch(token, repos, mergeRepo, since, to, dingTalkGroupConfig)
  );
}

// 定义一个函数doDispatch，用于调度
function doDispatch(token, repos, mergeRepo, since, to, dingTalkGroupConfig) {
  // 获取命令行参数
  const args = process.argv.slice(2);

  if (args[0] == "month") {
    // 生成上月报告
    monthly.generateReportForLastMonth(token, repos, mergeRepo);
  } else if (args[0] == "scan") {
    // 设置钉钉群
    setDingTalkGroup(dingTalkGroupConfig.groups, dingTalkGroupConfig.owners, repos);
    // 扫描危险问题
    issueScanner.livenessCheck(token, repos, since, to);
  } else if (args[0] == "good-first-issue") {
    // 扫描好的问题
    issueScanner.scanGoodFirstIssues(token, repos, since, to);
  } else {
    // 生成报告
    weekly.generateScoreReport(token, repos, mergeRepo, since, to);
  }
}

module.exports = {
  dispatch: dispatch,
};