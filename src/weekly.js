const { Octokit } = require("@octokit/core");
const { weeklyScoreDAO } = require("./dao/weekly_score");
const { utils } = require("./utils/time_utils");
const fetch = require("node-fetch");
const { countStarsAndForks } = require("./metrics/star_fork");
const { countNewContributors } = require("./metrics/contributor");
const moment = require("moment"); // require
const { listOpenIssues } = require("./metrics/issues");
const dangerousIssueDAO = require("./dao/dangerous_issue");

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
  weeklyScoreDAO.start();
  dangerousIssueDAO.start();
  // 2. collect data and calculate score.
  let arr = [];
  for (let i = 0; i < repos.length; i++) {
    const owner = repos[i][0];
    const repo = repos[i][1];
    // fetch data
    const promiseIssue = collectIssueData(owner, repo, since);
    const promiseStarFork = countStarsAndForks(token, owner, repo, since);
    const promiseContributor = countNewContributors(token, owner, repo, since);
    const promiseOpenIssues = listOpenIssues(token, owner, repo);

    // merge data
    arr[i] = Promise.all([
      promiseIssue,
      promiseStarFork,
      promiseContributor,
      promiseOpenIssues,
    ])
      .then(function (results) {
        const result = results[0];
        result.new_stars = results[1].star;
        result.new_forks = results[1].fork;
        result.new_contributors = results[2].new_contributors;
        result.openIssues = results[3];
        return result;
      })
      // calculate scores
      // .then(calculateScore);
      // .then(calculateScore_v2_add(result));
      .then(function (result) {
        return calculateScore_v2_sub(result, to);
      });
  }
  // await
  arr = await Promise.all(arr);
  // 3. sort
  arr.sort((a, b) => {
    return b.score - a.score;
  });

  // 4. write weekly score data
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
    // 4.3. insert
    weeklyScoreDAO.insert(
      rank,
      result.score,
      result.repoName,
      result.new_stars,
      result.new_contributors,
      result.new_forks,
      result.newPr.size,
      result.closePr.size,
      result.newIssue.size,
      result.closeIssue.size,
      result.prComment.size,
      result.issueComment.size,
      sinceReadable,
      toReadable,
      now
    );
  }
  // 5. commit
  // weekly score
  weeklyScoreDAO.commit();
  // dangerous issues list
  dangerousIssueDAO.commit();
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
  // console.log(result.closeIssue);
  // console.log(result.closePr);
  result.score = score;
  return result;
}

function calculateScore_v2_add(result) {
  result = calculateScore(result);

  // count closed issues with dynamic factor
  const deadline = 30;
  const k = 10;
  result.closeIssue.forEach((e) => {
    // we care only about community issues
    // TODO make sure some member has replied to the issue
    let care = isCommunityIssue(e) && someMemberHasReplied(e);
    if (!care) {
      return;
    }
    let duration = moment(e.closed_at, "YYYY-MM-DDTHH:mm:ssZ").diff(
      moment(e.created_at, "YYYY-MM-DDTHH:mm:ssZ"),
      "day"
    );
    // console.log("duration:" + duration);
    if (duration < deadline) {
      result.score += (k * (deadline - duration)) / deadline;
    }
  });
  // TODO count closed pr with dynamic factor?
  return result;
}

function calculateScore_v2_sub(result, to) {
  result = calculateScore(result);

  // for open issues
  const baseline = moment("2022-01-01", "YYYY-MM-DD");
  const k5 = 5;
  const k30 = 7;
  // datastructure:
  // see data/api-schema/issue/listOpenIssues/result.json
  result.openIssues.nodes.forEach((issue) => {
    // we care only about community issues
    let care = isCommunityIssue_graphql(issue);
    if (!care) {
      return;
    }
    if (issue.author == null) {
      // console.log(issue);
      return;
    }
    if (someMemberHasReplied_graphql(issue)) {
      return;
    }
    let createDay = moment(issue.createdAt, "YYYY-MM-DDTHH:mm:ssZ");
    if (baseline != null && baseline.isAfter(createDay)) {
      return;
    }
    let duration = moment(to).diff(createDay, "day");
    issue.duration = duration;
    if (duration < 5) {
      return;
    }
    // log these dangerous issues !
    dangerousIssueDAO.insert(
      issue.duration,
      issue.repository.name,
      issue.title,
      issue.url
    );
    // substract score
    if (duration >= 30) {
      result.score -= k30;
    } else if (duration >= 5) {
      result.score -= k5;
    }
  });
  return result;
}

function isCommunityIssue(issue) {
  return (
    issue.author_association != "MEMBER" && issue.author_association != "OWNER"
  );
}

function isCommunityIssue_graphql(issue) {
  return (
    issue.authorAssociation != "MEMBER" && issue.authorAssociation != "OWNER"
  );
}

function someMemberHasReplied_graphql(issue) {
  for (let comment of issue.comments.nodes) {
    if (comment.author.login == issue.author.login) {
      continue;
    }
    if (
      comment.authorAssociation == "MEMBER" ||
      comment.authorAssociation == "OWNER"
    ) {
      return true;
    }
  }
  return false;
}

function someMemberHasReplied(issue) {
  if (issue.comments == 0) {
    return false;
  }
  // TODO
  // let url = issue.timeline_url.replace("https: //", "https://");
  // https://api.github.com/repos/mosn/layotto/issues/214/timeline
  return true;
}

function collectIssueData(orgName, repoName, since) {
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
              // closed pr
              // only count those merged.
              if (d.pull_request.merged_at == null) {
                continue;
              }
              result.closePr.add(d);
              if (d.created_at >= since) {
                result.newPr.add(d.number);
              }
            } else {
              // closed issue
              result.closeIssue.add(d);
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

module.exports = {
  generateScoreReport: generateScoreReport,
};
