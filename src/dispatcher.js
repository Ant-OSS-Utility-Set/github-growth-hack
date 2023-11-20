const weekly = require("./service/weekly");
const { monthly } = require("./service/monthly");
const { issueScanner } = require("./service/issue_scanner");
const { setConfig, getConn} = require("./dao/mysql_conn");

const configNames = ['liveness-check','good-first-issue-notifier','mergeRepo','dangerousIssuesConfig','dingTalkGroupConfig']

// 定义一个函数dispatch，用于调度
function  dispatch(config,since,to)
{

  const args = process.argv.slice(2);
  if (args[0] === "month") {
    // 生成月度CSV文件
    monthly.generateReportForLastMonth(config);
    return;
  }
  setConfig(config.generalConfig.mysqlConfig, async () => {
    // 获取命令行参数
    if (args[0] === "scan") {
      // 扫描issue，发送issue\liveliness钉钉消息
       issueScanner.scanCheck(config, since, to);
    } else if (args[0] === "good-first-issue") {
      // 扫描需要认领的issue，发送good-first-issue钉钉消息
       issueScanner.scanGoodFirstIssues(config, since, to);
    } else {
      // 生成周CSV文件，插入MySQL数据库，发送issue钉钉消息
       weekly.generateScoreReport(config, since, to);
    }
  })
}


module.exports = {
  dispatch: dispatch,
};