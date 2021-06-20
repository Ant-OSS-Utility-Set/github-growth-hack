const { Octokit } = require("@octokit/core");
const fs = require("fs");

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

  return (
    commentResp
      .catch(function (r) {
        console.log(r);
      })
      // 1.1. parse result
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
      // 2.1. request
      .then(function (result) {
        return octokit.request(
          `GET /repos/{owner}/{repo}/issues?since=${since}&state=all`,
          {
            owner: orgName,
            repo: repoName,
          }
        );
      })
      // 2.2. parse
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
        result.score = score;
        result.repoName = repoName;
        result.new_stars = new_stars;
        result.new_contributors = new_contributors;
        result.new_folks = new_folks;
        return result;
      })
  );
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
  return start;
}

function logStart(content) {
  console.log(content);
  // write files
  content = content.replace(/\t/g, ",");

  try {
    fs.writeFileSync("report.csv", content + "\n");
  } catch (err) {
    console.error(err);
  }
}

function logStartZh(content) {
  // write files
  // need to add BOM header,see
  // https://www.zhihu.com/question/21869078/answer/350728339
  try {
    fs.writeFileSync("report-zh.csv", "\uFEFF" + content + "\n", "utf8");
  } catch (err) {
    console.error(err);
  }
}

function log(content) {
  console.log(content);
  // write files
  content = content.replace(/\t/g, ",");

  try {
    fs.appendFileSync("report.csv", content + "\n");
    fs.appendFileSync("report-zh.csv", content + "\n");
  } catch (err) {
    console.error(err);
  }
}
async function start(repos, since) {
  console.log(`From ${since} to Now:`);
  logStart(
    `rank\tscore\tproject\tnew_stars\tnew_contributors\tnew_folks\tnew_pr\tclosed_pr\tnew_issues\tclosed_issues\tpr_comment\tissue_comment`
  );
  logStartZh(
    `排名,活跃度得分,项目,新增star,新增contributor,folk,new_pr,close_pr,new_issues,close_issues,pr_comment,issue_comment`
  );
  let arr = [];
  for (let i = 0; i < repos.length; i++) {
    arr[i] = await weeklyReporter(
      repos[i][0],
      repos[i][1],
      since,
      repos[i][2],
      repos[i][3],
      repos[i][4]
    );
  }
  // sort
  arr.sort((a, b) => {
    return b.score - a.score;
  });
  // log
  let prevScore = arr[0].score;
  let prevRank = 1;
  for (let i = 0; i < arr.length; i++) {
    let result = arr[i];
    let rank = i + 1;
    if (i > 0 && result.score == prevScore) {
      rank = prevRank;
    } else {
      prevScore = result.score;
      prevRank = rank;
    }
    log(
      `${rank}\t${result.score}\t${result.repoName}\t${result.new_stars}\t${result.new_contributors}\t${result.new_folks}\t${result.newPr.size}\t${result.closePr.size}\t${result.newIssue.size}\t${result.closeIssue.size}\t${result.prComment.size}\t${result.issueComment.size}`
    );
  }
}
exports.weelyReportFactory = weelyReportFactory;
