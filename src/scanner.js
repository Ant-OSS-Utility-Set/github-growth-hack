const { listDangerousOpenIssues } = require("./metrics/issues");
const dangerousIssueDAO = require("./dao/dangerous_issue");
const { weeklyScoreDAO } = require("./dao/weekly_score");

const scanner = {
  scan: function (token, repos, since, to) {
    // 1. start
    dangerousIssueDAO.start();
    // 2. collect data
    let arr = [];
    for (let i = 0; i < repos.length; i++) {
      const owner = repos[i][0];
      const repo = repos[i][1];
      // fetch data
      arr[i] = listDangerousOpenIssues(token, owner, repo, to)
        // write
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
          // TODO: trigger liveness check
          const weeksMatter = 4;
          const livenessBaseline = 20;
          return weeklyScoreDAO
            .list(health.owner, health.repo, weeksMatter)
            .then(function (data) {
              if (data.rows == null || data.rows.length == 0) {
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
                // warning
                let content = `${health.repo} 健康检查 (liveness check) 失败!\n
                该项目满足以下条件，被归类为“腐烂级”项目：\n
                - 存在大于30天未回复的 issue \n
                - 连续4周活跃度小于20\n
                请在一周内整改，否则将启动垃圾回收程序，对项目自动归档！\n`;
                return dangerousIssueDAO
                  .getDingTalkDao()
                  .send(content, null, false, health.repo, false, true);
              }
            });
        });
    }
    // 3. commit
    Promise.all(arr).then((results) => {
      dangerousIssueDAO.commit();
      weeklyScoreDAO.commit();
    });
  },
};

module.exports = {
  scanner: scanner,
};
