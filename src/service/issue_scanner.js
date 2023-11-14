const {
  listDangerousOpenIssues,
  listGoodFirstIssues, shouldReplyInXDays, mustReplyInXDays,
} = require("../metrics/issues");
const dangerousIssueDAO = require("../dao/dangerous_issue");
const { weeklyScoreDAO } = require("../dao/weekly_score");
const sender = require("../dao/dingtalk");

const issueScanner = {
  scanGoodFirstIssues: function (token, repos, since, to) {
    // 过滤出 good first issue 的仓库
    let filteredRepos = [];
    let idx = 0;
    for (let i = 0; i < repos.length; i++) {
      let options = repos[i][2];
      if (
        options != null &&
        options["good-first-issue-notifier"] != null &&
        options["good-first-issue-notifier"]["channels"] != null &&
        options["good-first-issue-notifier"]["channels"].length > 0
      ) {
        filteredRepos[idx] = repos[i];
        idx++;
      }
    }
    if (filteredRepos.length === 0) {
      return;
    }
    let arr = [];
    for (let i = 0; i < filteredRepos.length; i++) {
      const owner = filteredRepos[i][0];
      const repo = filteredRepos[i][1];
      const options = filteredRepos[i][2];

      // 扫描仓库中的 good first issue
      arr[i] = listGoodFirstIssues(token, owner, repo, since)
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
          options["good-first-issue-notifier"]["channels"].forEach((ch) => {
            if (ch["type"] === "dingtalk") {
              sender.sendMarkdown(ch.urls, text, ch.title, ch.atUid, ch.atAll);
            } else {
              console.error(`channel ${ch["type"]} not supported!`);
            }
          });
        });
    }
    Promise.all(arr).then((results) => {
      console.log("All scanned!");
    });
  },

  livenessCheck: function (token, repos, since, to,globalDingTalkGroupConfig) {
    // 开始进行不活跃检查
    dangerousIssueDAO.start();
    let filteredRepos = [];
    let idx = 0;
    // 过滤掉不活跃检查被禁用的项目
    for (let i = 0; i < repos.length; i++) {
      if (
        repos[i][2] != null &&
        repos[i][2]["liveness-check"] != null &&
        repos[i][2]["liveness-check"]["enable"] == false
      ) {
        continue;
      }
      filteredRepos[idx] = repos[i];
      idx++;
    }
    let arr = [];
    let allPassLivenessCheck = true;
    // 检查每一个项目
    for (let i = 0; i < filteredRepos.length; i++) {
      const owner = filteredRepos[i][0];
      const repo = filteredRepos[i][1];
      const option = filteredRepos[i][2];
      //单独设置每个repo的属性
      let dangerousIssuesConfig = option['dangerousIssuesConfig']
      // 危险Issues问题
      if (dangerousIssuesConfig != null) {
        // 应该回复天数
        shouldReplyInXDays(dangerousIssuesConfig.shouldReplyInXDays);
        // 必须回复天数
        mustReplyInXDays(dangerousIssuesConfig.mustReplyInXDays);
      }

      // 获取每一个项目的不活跃检查结果,插入“存储里面CSV、临时数组等”
      arr[i] = listDangerousOpenIssues(token, owner, repo, to)
        .then(function (resultsArray) {
          let health = {
            owner: owner,
            repo: repo,
            option:option,
            dangerousOpenIssues: resultsArray,
            isVeryDangerous: false,
          };
          if (resultsArray.length === 0) {
            return health;
          }
          // 插入不活跃检查结果
          resultsArray.forEach((result) => {
            dangerousIssueDAO.insert(
              result.duration,
              result.project,
              result.title,
              result.url,
              result.keyword,
              option
            );
            if (result.isVeryDangerous) {
              health.isVeryDangerous = true;
            }
          });
          return health;
        })
          //如不是不健康的，再次获取周检查分数,发生dangerous基本的警告
        .then(function (health) {
          if (!health.isVeryDangerous) {
            return health;
          }
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
              return;
            }
            let success = false;
            // 检查项目活跃度是否满足要求
            for (let i = 0; i < weeksMatter; i++) {
              if (data.rows[i] >= livenessBaseline) {
                success = true;
              }
            }
            //检查活跃度liveness失败，直接发钉钉通知
            if (!success) {
              allPassLivenessCheck = false;
              let content =
                `${health.repo} 健康检查 (liveness check) 失败!\n` +
                `该项目满足以下条件，被归类为“腐烂级”项目：\n` +
                `- 存在大于30天未回复的 issue \n` +
                `- 连续4周活跃度小于20\n` +
                `请在一周内整改，否则将启动垃圾回收程序，对项目自动归档！\n`;
              return dangerousIssueDAO.getDingTalkDao().send(content, null, false, health.repo, false, "liveness",option);
            }
          });
        });
    }
    // 等待所有项目检查完毕
    Promise.all(arr).then((results) => {
      if (allPassLivenessCheck) {
        let content =
          `活跃度检查 (liveness check)结果：所有项目通过了活跃度检查!\n` +
          `\n` +
          `注：liveness check会检查每个项目的健康情况，如果满足下列条件会被归类为“腐烂级”项目：\n` +
          `- 存在大于30天未回复的 issue \n` +
          `- 连续4周活跃度小于20\n`;
        dangerousIssueDAO.getDingTalkDao().send(content, null, false, "*", false, "liveness",null,{"dingTalkGroupConfig":globalDingTalkGroupConfig});
      }
      // 提交不活跃检查结果
      dangerousIssueDAO.commit();
      // 提交活跃度检查结果，插入数据库或者CSV文件
      weeklyScoreDAO.commit();
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
