const { Octokit } = require("@octokit/core");

let octokit = null;

function weeklyReporter(
  orgName,
  repoName,
  since,
  new_stars,
  new_contributors,
  new_folks
) {
  let result = {
    issueComment: new Set(),
    prComment: new Set(),
    newIssue: new Set(),
    newPr: new Set(),
    closeIssue: new Set(),
    closePr: new Set(),
    unknown: new Set(),
  };
  //  1. comment
  const commentResp = octokit.request(
    `GET /repos/{owner}/{repo}/issues/comments?since=${since}`,
    {
      owner: orgName,
      repo: repoName,
    }
  );

  commentResp
    // 1.1. parse result
    .catch(function (r) {
      console.log(r);
    })
    .then(function (r) {
      let len = r.data.length;
      for (let i = 0; i < len; i++) {
        let d = r.data[i];
        if (d.user.type == "Bot") {
          continue;
        }
        if (d.html_url.indexOf("pull") < 0) {
          result.issueComment.add(d);
        } else {
          result.prComment.add(d);
        }
      }
      return result;
    })
    // 2. new/closed issues and pr
    .then(function (result) {
      const response = octokit.request(
        `GET /repos/{owner}/{repo}/issues?since=${since}&state=all`,
        {
          owner: orgName,
          repo: repoName,
        }
      );
      response
        .then(function (r) {
          let len = r.data.length;
          for (let i = 0; i < len; i++) {
            let d = r.data[i];
            // check close
            if (d.closed_at != null) {
              if (isPr(d)) {
                // close pr
                result.closePr.add(d.number);
                if (d.created_at >= since) {
                  result.newPr.add(d.number);
                }
              } else {
                // close issues
                result.closeIssue.add(d.number);
                if (d.created_at >= since) {
                  result.newIssue.add(d.number);
                }
              }
              continue;
            }

            if (d.created_at < since) {
              result.unknown.add(d.number);
              continue;
            }
            if (isPr(d)) {
              result.newPr.add(d.number);
            } else {
              result.newIssue.add(d.number);
            }
          }
          // console.log(`total unknown:` + result.unknown.size);
          // console.log(`total newPr:` + result.newPr.size);
          // console.log(`total closePr:` + result.closePr.size);
          // console.log(`total newIssue:` + result.newIssue.size);
          // console.log(`total closeIssue:` + result.closeIssue.size);
          return result;
        })
        // 3. calculate scores
        .then(function (result) {
          let score =
            result.issueComment.size +
            2 * result.newIssue.size +
            3 * result.newPr.size +
            4 * result.prComment.size +
            2 * result.closePr.size +
            new_stars +
            2 * new_folks +
            5 * new_contributors;
          console.log(
            `${score}\t${repoName}\t${new_stars}\t${new_contributors}\t${new_folks}\t${result.newPr.size}\t${result.closePr.size}\t${result.newIssue.size}\t${result.closeIssue.size}\t${result.prComment.size}\t${result.issueComment.size}`
          );
        });
    });
}
function isPr(d) {
  if (d.pull_request != null) {
    return true;
  }
  return false;
}

function weelyReportFactory(token) {
  octokit = new Octokit({
    auth: token,
  });
  console.log(
    `score\tproject\tnew_stars\tnew_contributors\tnew_folks\tnew_pr\tclosed_pr\tnew_issues\tclosed_issues\tpr_comment\tissue_comment`
  );
  return weeklyReporter;
}
exports.weelyReportFactory = weelyReportFactory;
