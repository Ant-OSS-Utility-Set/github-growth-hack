const { listDangerousOpenIssues } = require("./metrics/issues");
const dangerousIssueDAO = require("./dao/dangerous_issue");

const scanner = {
  scan: function (token, repos, since, to) {
    // 1. start
    dangerousIssueDAO.start();
    // 2. collect data and calculate score.
    let arr = [];
    for (let i = 0; i < repos.length; i++) {
      const owner = repos[i][0];
      const repo = repos[i][1];
      // fetch data
      arr[i] = listDangerousOpenIssues(token, owner, repo, to)
        // write
        .then(function (resultsArray) {
          if (resultsArray.length == 0) {
            return;
          }
          resultsArray.forEach((result) => {
            dangerousIssueDAO.insert(
              result.duration,
              result.project,
              result.title,
              result.url
            );
          });
        });
    }
    // 3. commit
    Promise.all(arr).then((results) => {
      dangerousIssueDAO.commit();
    });
  },
};

module.exports = {
  scanner: scanner,
};
