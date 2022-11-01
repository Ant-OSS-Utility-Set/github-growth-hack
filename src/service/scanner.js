const { listDangerousOpenIssues } = require("../metrics/issues");
const dangerousIssueDAO = require("../dao/dangerous_issue");
const { weeklyScoreDAO } = require("../dao/weekly_score");

const scanner = {
  scanGoodFirstIssues: function (token, repos, since, to) {},
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
            dangerousIssueDAO.insert(
              result.duration,
              result.project,
              result.title,
              result.url
            );
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
              // console.log(data.rows[i]);
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

module.exports = {
  scanner: scanner,
};
