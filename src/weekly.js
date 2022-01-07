const { Octokit } = require("@octokit/core");
const { logger } = require("./logger");
const { utils } = require("./utils");
const fetch = require("node-fetch");
const { countStarsAndForks } = require("./metrics/star_fork");
const { countNewContributors } = require("./metrics/contributor");

let octokit = null;

function generateScoreReport(token, repos, since, to) {
  octokit = new Octokit({
    auth: token,
  });
  start(token, repos, since, to);
}

async function start(token, repos, since, to) {
  // 1. log Title
  console.log(`From ${since} to Now:`);
  logger.logStart(
    `rank\tscore\tproject\tnew_stars\tnew_contributors\tnew_forks\tnew_pr\tclosed_pr\tnew_issues\tclosed_issues\tpr_comment\tissue_comment\tdate_from\tdate_to\trecord_date`
  );
  logger.logStartZh(
    `排名,活跃度得分,项目,新增star,新增contributor,fork,new_pr,close_pr,new_issues,close_issues,pr_comment,issue_comment,date_from,date_to,record_date`
  );
  // 2. collect data and calculate score.
  let arr = [];
  for (let i = 0; i < repos.length; i++) {
    const owner = repos[i][0];
    const repo = repos[i][1];
    // fetch data
    const promiseIssue = collectWeeklyData(owner, repo, since);
    const promiseStarFork = countStarsAndForks(token, owner, repo, since);
    const promiseContributor = countNewContributors(token, owner, repo, since);
    // merge data
    arr[i] = Promise.all([promiseIssue, promiseStarFork, promiseContributor])
      .then(function (results) {
        const result = results[0];
        result.new_stars = results[1].star;
        result.new_forks = results[1].fork;
        result.new_contributors = results[2].new_contributors;
        return result;
      })
      // calculate scores
      .then(calculateScore);
  }
  // await
  arr = await Promise.all(arr);
  // 3. sort
  arr.sort((a, b) => {
    return b.score - a.score;
  });

  // 4. log data
  // 4.1. format
  var sinceReadable = utils.formatWithReadableFormat(since);
  var toReadable = utils.formatWithReadableFormat(to);
  var now = utils.nowWithReadableFormat();
  // 4.2. calculate rank
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
    // 4.3. do logging
    logger.log(
      `${rank}\t${result.score}\t${result.repoName}\t${result.new_stars}\t${result.new_contributors}\t${result.new_forks}\t${result.newPr.size}\t${result.closePr.size}\t${result.newIssue.size}\t${result.closeIssue.size}\t${result.prComment.size}\t${result.issueComment.size}\t${sinceReadable}\t${toReadable}\t${now}`
    );
  }
}

function calculateScore(result) {
  // console.log(result);
  let score =
    result.issueComment.size +
    2 * result.newIssue.size +
    3 * result.newPr.size +
    4 * result.prComment.size +
    2 * result.closePr.size +
    result.new_stars +
    2 * result.new_forks +
    5 * result.new_contributors;
  result.score = score;
  return result;
}

function collectWeeklyData(orgName, repoName, since) {
  let result = {
    repoName: repoName,
    issueComment: new Set(),
    prComment: new Set(),
    newIssue: new Set(),
    newPr: new Set(),
    closeIssue: new Set(),
    closePr: new Set(),
    unknown: new Set(),
  };
  //  1. fetch comment
  // see https://docs.github.com/en/rest/reference/issues#comments
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
          // no bot
          if (d.user.type == "Bot") {
            continue;
          }
          // issue comment
          if (d.html_url.indexOf("pull") < 0) {
            result.issueComment.add(d);
          } else {
            // pr comment
            result.prComment.add(d);
          }
        }
        return result;
      })
      // 2. fetch new/closed issues and pr
      // see https://docs.github.com/en/rest/reference/issues#list-repository-issues
      // 2.1. request
      .then(function (r) {
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
          // no bot
          if (d.user != null && d.user.type == "Bot") {
            continue;
          }
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
          // too old
          if (d.created_at < since) {
            result.unknown.add(d.number);
            continue;
          }
          // new pr or issues
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
  );
}
function isPr(d) {
  if (d.pull_request != null) {
    return true;
  }
  return false;
}

exports.weekly = {
  generateScoreReport: generateScoreReport,
};
