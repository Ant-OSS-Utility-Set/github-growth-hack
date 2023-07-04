const {
  listDangerousOpenIssues,
  listGoodFirstIssues,
} = require("../metrics/issues");
const dangerousIssueDAO = require("../dao/dangerous_issue");
const { weeklyScoreDAO } = require("../dao/weekly_score");
const sender = require("../dao/dingtalk");

const issueScanner = {
  scanGoodFirstIssues: function (token, repos, since, to) {
    let filteredRepos = [];
    let idx = 0;
    // 1. filter repos
    for (let i = 0; i < repos.length; i++) {
      // check options
      let options = repos[i][2];
      if (
        options != null &&
        options["good-first-issue-notifier"] != null &&
        options["good-first-issue-notifier"]["channels"] != null &&
        options["good-first-issue-notifier"]["channels"].length > 0
      ) {
        // add this repo to the `filteredRepos`
        filteredRepos[idx] = repos[i];
        idx++;
      }
    }
    if (filteredRepos.length == 0) {
      return;
    }
    // 2. fetch good first issues
    let arr = [];
    for (let i = 0; i < filteredRepos.length; i++) {
      const owner = filteredRepos[i][0];
      const repo = filteredRepos[i][1];
      const options = filteredRepos[i][2];

      // fetch data
      arr[i] = listGoodFirstIssues(token, owner, repo, since)
        // 3. send to IM group
        .then(function (issues) {
          // console.log(issues);

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

          // 3.1. Generate promotion text
          let text = `${repo} 新增了几个 good first issue, 欢迎感兴趣的朋友认领! \n\r`;

          let hasKnownIssues = false;
          // easy
          if (issues.easy.length > 0) {
            text += "- Easy \n\r";
            text = appendGoodFirstIssues(text, issues.easy);
            hasKnownIssues = true;
          }
          // medium
          if (issues.medium.length > 0) {
            text += "- Medium \n\r";
            text = appendGoodFirstIssues(text, issues.medium);
            hasKnownIssues = true;
          }
          // hard
          if (issues.hard.length > 0) {
            text += "- Hard \n\r";
            text = appendGoodFirstIssues(text, issues.hard);
            hasKnownIssues = true;
          }
          // unknown
          if (issues.unknown.length > 0) {
            if (hasKnownIssues) {
              text += "- 其他 \n\r";
            }
            text = appendGoodFirstIssues(text, issues.unknown);
          }

          // 3.2. don't send message if there's no issue
          if (!hasKnownIssues && issues.unknown.length == 0) {
            return;
          }

          // 3.3. send to IM groups
          options["good-first-issue-notifier"]["channels"].forEach((ch) => {
            if (ch["type"] == "dingtalk") {
              sender.sendMarkdown(ch.urls, text, ch.title, ch.atUid, ch.atAll);
            } else {
              console.error(`channel ${ch["type"]} not supported!`);
            }
          });
        });
    }
    // 4. finish
    Promise.all(arr).then((results) => {
      console.log("All scanned!");
    });
  },

  livenessCheck: function (token, repos, since, to) {
    // 1. start
    dangerousIssueDAO.start();
    let filteredRepos = [];
    let idx = 0;
    // 2. filter repos
    for (let i = 0; i < repos.length; i++) {
      // check config
      // if there is no need to check this repo, ignore it.
      if (
        repos[i][2] != null &&
        repos[i][2]["liveness-check"] != null &&
        repos[i][2]["liveness-check"]["enable"] == false
      ) {
        continue;
      }
      // else, add this repo to the `filteredRepos`
      filteredRepos[idx] = repos[i];
      idx++;
    }
    // 3. collect data
    let arr = [];
    let allPassLivenessCheck = true;
    for (let i = 0; i < filteredRepos.length; i++) {
      const owner = filteredRepos[i][0];
      const repo = filteredRepos[i][1];

      // fetch data
      arr[i] = listDangerousOpenIssues(token, owner, repo, to)
        // write dangerous issues
        .then(function (resultsArray) {
          let health = {
            owner: owner,
            repo: repo,
            dangerousOpenIssues: resultsArray,
            isVeryDangerous: false,
          };
          if (resultsArray.length == 0) {
            return health;
          }
          resultsArray.forEach((result) => {
            if(Number(result.duration) <= 30){
              dangerousIssueDAO.insert(
                result.duration,
                result.project,
                result.title,
                result.url
              );
            }
            if (result.isVeryDangerous) {
              health.isVeryDangerous = true;
            }
          });
          return health;
        })
        .then(function (health) {
          // trigger liveness check
          if (!health.isVeryDangerous) {
            return health;
          }
          const weeksMatter = 4;
          const livenessBaseline = 20;
          // query scores in history
          let scores = weeklyScoreDAO.list(
            health.owner,
            health.repo,
            weeksMatter
          );
          return scores.then(function (data) {
            if (data == null || data.rows == null || data.rows.length == 0) {
              return;
            }
            let success = false;
            for (let i = 0; i < weeksMatter; i++) {
              console.log(data.rows[i]);
              if (data.rows[i] >= livenessBaseline) {
                success = true;
              }
            }
            if (!success) {
              allPassLivenessCheck = false;
              // warning
              let content =
                `${health.repo} 健康检查 (liveness check) 失败!\n` +
                `该项目满足以下条件，被归类为“腐烂级”项目：\n` +
                `- 存在大于30天未回复的 issue \n` +
                `- 连续4周活跃度小于20\n` +
                `请在一周内整改，否则将启动垃圾回收程序，对项目自动归档！\n`;
              return dangerousIssueDAO
                .getDingTalkDao()
                .send(content, null, false, health.repo, false, "liveness");
            }
          });
        });
    }
    // 4. commit
    Promise.all(arr).then((results) => {
      if (allPassLivenessCheck) {
        // congratulations!
        let content =
          `活跃度检查 (liveness check)结果：所有项目通过了活跃度检查!\n` +
          `\n` +
          `注：liveness check会检查每个项目的健康情况，如果满足下列条件会被归类为“腐烂级”项目：\n` +
          `- 存在大于30天未回复的 issue \n` +
          `- 连续4周活跃度小于20\n`;
        dangerousIssueDAO
          .getDingTalkDao()
          .send(content, null, false, "*", false, "liveness");
      }
      dangerousIssueDAO.commit();
      weeklyScoreDAO.commit();
    });
  },
};

function appendGoodFirstIssues(text, issues) {
  issues.forEach((issue) => {
    // Try to get chinese title
    let titles = issue.title.split(";");
    let title = titles[0];
    if (titles[1] != null) {
      title = titles[1];
    }
    title = title.trim();

    // append text
    text = text + `${title}: ${issue.url} \n\r`;
  });
  return text;
}

module.exports = {
  issueScanner: issueScanner,
};
