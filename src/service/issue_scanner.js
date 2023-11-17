const {
  listDangerousOpenIssues,
  listGoodFirstIssues, shouldReplyInXDays, mustReplyInXDays,
} = require("../metrics/issues");
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
  scanGoodFirstIssues: function (config, since, to) {
    // 过滤出 good first issue 的仓库
    let arr = [];

    for (const owner in config.orgRepoConfig) {
      for (const repo in config.orgRepoConfig[owner]) {
        if(configNames.includes(repo)){
          continue
        }
        const goodFirstIssueConfig = getConfig(config.orgRepoConfig[owner][repo]['good-first-issue-notifier'], config.orgRepoConfig[owner]['good-first-issue-notifier'], config.generalConfig['good-first-issue-notifier']);
        if(!goodFirstIssueConfig.enable){
          return;
        }
        // 扫描仓库中的 good first issue
        const res = listGoodFirstIssues(config.generalConfig.graphToken, owner, repo, since)
            .then(function (issues) {
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

              let text = `${repo} 新增了几个 good first issue, 欢迎感兴趣的朋友认领! \n\r`;

              let hasKnownIssues = false;
              if (issues.easy.length > 0) {
                text += "- Easy \n\r";
                text = appendGoodFirstIssues(text, issues.easy);
                hasKnownIssues = true;
              }
              if (issues.medium.length > 0) {
                text += "- Medium \n\r";
                text = appendGoodFirstIssues(text, issues.medium);
                hasKnownIssues = true;
              }
              if (issues.hard.length > 0) {
                text += "- Hard \n\r";
                text = appendGoodFirstIssues(text, issues.hard);
                hasKnownIssues = true;
              }
              if (issues.unknown.length > 0) {
                if (hasKnownIssues) {
                  text += "- 其他 \n\r";
                }
                text = appendGoodFirstIssues(text, issues.unknown);
              }

              if (!hasKnownIssues && issues.unknown.length == 0) {
                console.log("没有需要认领的issue")
                return;
              }

              // 发送消息,atUid就是@某个人
              goodFirstIssueConfig["channels"].forEach((ch) => {
                if (ch["type"] === "dingtalk") {
                  sender.sendMarkdown(ch.urls, text, ch.title, ch.atUid, ch.atAll);

                } else {
                  console.error(`channel ${ch["type"]} not supported!`);
                }
              });
            });
        arr.push(res)
      }//repo循环结束

    }
    Promise.all(arr).then((results) => {
      console.log("All scanned!");
    });
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
        const restProme = listDangerousOpenIssues(config.generalConfig.graphToken, owner, repo, to).then(resultsArray =>{

          if(livenessCheckConfig.enable){
            let noDangerous = !resultsArray.some(result=>result.isVeryDangerous);
            livenessCheck(owner,repo,resultsArray).then(isSuccess=>{
              if(noDangerous || isSuccess){
                //检查通过
                dangerousIssueDAO.insertLivenessCheck(owner,null);
              }else{
                //检查失败
                dangerousIssueDAO.insertLivenessCheck(owner,repo);
              }
            })
          }
          resultsArray = resultsArray.filter(res => res.duration < config.generalConfig.dangerousIssuesConfig.mustReplyInXDays)
          if(resultsArray.length>0){
             resultsArray.forEach((result) => {
              dangerousIssueDAO.insert(  result.duration, result.project, result.title,   result.url,  result.keyword );
            });
          }else{
            dangerousIssueDAO.insert(null,null,null,null,owner )
          }
       });
        listDangerPromise.push(restProme)
      }
      //按照owner进行发布

    }
    //owner循环结束
    listDangerPromise =  Promise.all(listDangerPromise);
    listDangerPromise.then(res =>{
      dangerousIssueDAO.commit();
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
