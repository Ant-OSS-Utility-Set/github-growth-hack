const {
  listDangerousOpenIssues,
  listGoodFirstIssues} = require("../metrics/issues");
const dangerousIssueDAO = require("../dao/dangerous_issue");
const { weeklyScoreDAO } = require("../dao/weekly_score");
const sender = require("../dao/dingtalk");
const { configNames,getConfig } = require("../const.js");

/**
 * 活跃度检查,true通过，false未通过
 * @param owner
 * @param repo
 * @param resultsArray
 */
async function livenessCheck(owner, repo, resultsArray) {
  // 插入不活跃检查结果
  let health = {
    owner: owner,
    repo: repo,
    dangerousOpenIssues: resultsArray,
    isVeryDangerous: false,
  };

  const weeksMatter = 4;
  const livenessBaseline = 20;
  // 获取项目周活跃度
  let scores = weeklyScoreDAO.list(
      health.owner,
      health.repo,
      weeksMatter
  );
  return scores.then(function (data) {
    if (data == null || data.rows == null || data.rows.length === 0) {
      return true;
    }
    let success = false;
    // 检查项目活跃度是否满足要求
    for (let i = 0; i < weeksMatter; i++) {
      if (data.rows[i] >= livenessBaseline) {
        success = true;
      }
    }
    return success;
  });
}

const issueScanner = {
  // 扫描仓库中的 good first issue
  // The data structure looks like:
  // {
  //   easy: [],
  //   medium: [
  //     {
  //       project: 'layotto',
  //       title: 'Develop a new component for sms API; 为"短信 API" 开发新的组件',
  //       url: 'https://github.com/mosn/layotto/issues/830',
  //       labels: [Array]
  //     }
  //   ],
  //   hard: [
  //     {
  //       project: 'layotto',
  //       title: 'generate a cli tool for Layotto;  生成 Layotto 命令行工具',
  //       url: 'https://github.com/mosn/layotto/issues/826',
  //       labels: [Array]
  //     }
  //   ],
  //   unknown: []
  // }

  scanGoodFirstIssues: async function (config, since, to) {
    /**
     * 组合发送信息
     * @param issues
     * @param repo
     * @returns {string|null}
     */
    function concatText(issues, repo) {
      let text = `${repo}项目新增了几个 good first issue, 欢迎感兴趣的朋友认领! \n\r`;
      let issueCategories = {
        easy: { title: "- Easy \n\r", issues: issues.easy },
        medium: { title: "- Medium \n\r", issues: issues.medium },
        hard: { title: "- Hard \n\r", issues: issues.hard },
        unknown: { title: "- 其他 \n\r", issues: issues.unknown }
      };

      let hasKnownIssues = false;
      for (let category in issueCategories) {
        if (issueCategories[category].issues.length > 0) {
          text += issueCategories[category].title;
          text = appendGoodFirstIssues(text, issueCategories[category].issues);
          hasKnownIssues = true;
        }
      }
      if (!hasKnownIssues) {
        console.log("没有需要认领的issue");
        return null;
      }
      return text;
    }

    for (const owner in config.orgRepoConfig) {
      let arr = [];
      let ownerText =null
      for (const repo in config.orgRepoConfig[owner]) {
        if(configNames.includes(repo)){
          continue
        }
        let repoGoodConfig = config.orgRepoConfig[owner][repo]['good-first-issue-notifier'];
        const goodFirstIssueConfig = getConfig(repoGoodConfig, config.orgRepoConfig[owner]['good-first-issue-notifier'], config.generalConfig['good-first-issue-notifier']);
        if(!goodFirstIssueConfig.enable){
          return;
        }
        const res = listGoodFirstIssues(config.generalConfig.graphToken, owner, repo, since)
            .then(async function (issues) {
              const repoText = concatText(issues,repo);
              if(repoText == null){
                return;
              }
              //单项目发送
              if(repoGoodConfig!=null){
                // 发送repo消息,atUid就是@某个人
                repoGoodConfig["channels"].forEach((ch) => {
                  if (ch["type"] === "dingtalk") {
                    sender.sendMarkdown(ch.urls, repoText, ch.title, ch.atUid, ch.atAll);
                  } else {
                    console.error(`channel ${ch["type"]} not supported!`);
                  }
                });
              }else{
                //社区组合发送
                ownerText += repoText;
              }
              //埋点数据
              dangerousIssueDAO.getMysqlDao().sendAlarmMysql({scanFrom: since, scanTo: to, owner: owner, repo: repo, issueNum: 1, alarmContent: text, alarmStatus: 'success', alarmType: 'good-first-issue', alarmChannel: 'dingding'});
            });
        arr.push(res)
      }//repo循环结束
      const ownerGoodFirstIssueConfig = getConfig(null, config.orgRepoConfig[owner]['good-first-issue-notifier'], config.generalConfig['good-first-issue-notifier']);
      await Promise.all(arr).then((results) => {
        if(ownerText == null){
          return
        }
        ownerText = `${owner}社区goodFirstIssue认领：` + ownerText
        // 发送repo消息,atUid就是@某个人
        ownerGoodFirstIssueConfig["channels"].forEach((ch) => {
          if (ch["type"] === "dingtalk") {
            sender.sendMarkdown(ch.urls, ownerText, ch.title, ch.atUid, ch.atAll);
          } else {
            console.error(`channel ${ch["type"]} not supported!`);
          }
        });
      });
    }// owner循环结束
    console.log("All scanned!");
    dangerousIssueDAO.getMysqlDao().commitMysql();
  },

  scanCheck:  function (config,since, to) {

    // 开始进行不活跃检查
    dangerousIssueDAO.start();
    let listDangerPromise = [];

    // 过滤掉不活跃检查被禁用的项目
    for (const owner in config.orgRepoConfig) {
      for (const repo in config.orgRepoConfig[owner]) {
        if(configNames.includes(repo)){
          continue
        }
        const repoConfig = config.orgRepoConfig[owner][repo]
        const livenessCheckConfig = getConfig(repoConfig['liveness-check'], config.orgRepoConfig[owner]['liveness-check'], config.generalConfig['liveness-check']);
        const restProme = listDangerousOpenIssues(config.generalConfig.graphToken, owner, repo, to).then(async resultsArray => {

          if (livenessCheckConfig.enable) {
            let noDangerous = !resultsArray.some(result => result.isVeryDangerous);
            await livenessCheck(owner, repo, resultsArray).then(isSuccess => {
              let status = noDangerous || isSuccess
              if (status) {
                //检查通过
                dangerousIssueDAO.insertLivenessCheck(owner, null);
              } else {
                //检查失败
                dangerousIssueDAO.insertLivenessCheck(owner, repo);
              }
              //触发报警数据埋点
              dangerousIssueDAO.getMysqlDao().sendAlarmMysql({
                scanFrom: since,
                scanTo: to,
                owner: owner,
                repo: repo,
                issueNum: 0,
                alarmContent: "",
                alarmStatus: status ? 'success' : "fail",
                alarmType: 'liveness',
                alarmChannel: 'dingding'
              })
            })
          }
          resultsArray = resultsArray.filter(res => res.duration != null && res.duration < config.generalConfig.dangerousIssuesConfig.mustReplyInXDays)
          if (resultsArray.length > 0) {
            resultsArray.forEach((result) => {
              dangerousIssueDAO.insert(result.duration, result.project, result.title, result.url, result.keyword);
            });
          } else {
            dangerousIssueDAO.insert(null, null, null, null, owner)
          }
          //触发报警数据埋点
          dangerousIssueDAO.getMysqlDao().sendAlarmMysql({
            scanFrom: since,
            scanTo: to,
            owner: owner,
            repo: repo,
            issueNum: resultsArray.length,
            alarmContent: "",
            alarmStatus: resultsArray.length === 0 ? 'success' : "fail",
            alarmType: 'issue',
            alarmChannel: 'dingding'
          })
        });
        listDangerPromise.push(restProme)
      }
      //按照owner进行发布

    }
    //owner循环结束
    listDangerPromise =  Promise.all(listDangerPromise);
    listDangerPromise.then(res =>{
      dangerousIssueDAO.commit();
      dangerousIssueDAO.getMysqlDao().commitMysql();
    });
  },
};

// 遍历issues数组，将每一项的title属性按照";"分割，取出第一项，并去除前后空格，拼接到text字符串后面，最后返回text
function appendGoodFirstIssues(text, issues) {
  issues.forEach((issue) => {
    let titles = issue.title.split(";");
    let title = titles[0];
    if (titles[1] != null) {
      title = titles[1];
    }
    title = title.trim();
    text = text + `${title}: ${issue.url} \n\r`;
  });
  return text;
}

module.exports = {
  issueScanner: issueScanner,
};
