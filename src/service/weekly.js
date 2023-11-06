const { Octokit } = require("@octokit/core");
const { weeklyScoreDAO } = require("../dao/weekly_score");
const { utils } = require("../utils/time_utils");
const fetch = require("node-fetch");
const { countStarsAndForks } = require("../metrics/star_fork");
const { countNewContributors } = require("../metrics/contributor");
const moment = require("moment"); // require
const {
  listOpenIssues,
  filterOutDangerousIssues,
} = require("../metrics/issues");
const dangerousIssueDAO = require("../dao/dangerous_issue");

let octokit = null;

// 生成分数报告
function generateScoreReport(token, repos, mergeRepo, since, to) {
  // 初始化octokit
  octokit = new Octokit({
    auth: token,
  });
  // 开始计算分数
  start(token, repos, mergeRepo, since, to);
}

// async函数start，用于收集数据，参数分别为token，repos，mergeRepo，since，to
async function start(token, repos, mergeRepo, since, to) {
  // 打印出从since到now的时间段
  console.log(`From ${since} to Now:`);
  // 启动weeklyScoreDAO
  weeklyScoreDAO.start();
  // 启动dangerousIssueDAO
  dangerousIssueDAO.start();

  // 创建一个空数组arr
  let arr = [];
  // 遍历repos数组
  for (let i = 0; i < repos.length; i++) {
    // 获取repos数组中的owner和repo
    const owner = repos[i][0];
    const repo = repos[i][1];

    // 获取repos数组中的nickName
    let nickName = repo;
    // 如果repos数组中的第三个元素不为空，且第三个元素的nickname不为空，则获取nickName
    if (repos[i][2] != null && repos[i][2]["nickname"] != null) {
      nickName = repos[i][2]["nickname"];
    }
    // 调用collectIssueData函数，获取issue数据
    const promiseIssue = collectIssueData(owner, repo, since);
    // 调用countStarsAndForks函数，获取star和fork数据
    const promiseStarFork = countStarsAndForks(token, owner, repo, since);
    // 调用countNewContributors函数，获取新贡献者数据
    const promiseContributor = countNewContributors(token, owner, repo, since);
    // 调用listOpenIssues函数，获取openIssues数据
    const promiseOpenIssues = listOpenIssues(token, owner, repo);

    // 将promiseIssue，promiseStarFork，promiseContributor，promiseOpenIssues放入arr数组中
    arr[i] = Promise.all([
      promiseIssue,
      promiseStarFork,
      promiseContributor,
      promiseOpenIssues,
    ]).then(function (results) {
      // 获取results数组中的第一个元素
      const result = results[0];
      // 获取results数组中的第二个元素，赋值给result的new_stars
      result.new_stars = results[1].star;
      // 获取results数组中的第三个元素，赋值给result的new_forks
      result.new_forks = results[1].fork;
      // 获取results数组中的第四个元素，赋值给result的new_contributors
      result.new_contributors = results[2].new_contributors;
      // 获取results数组中的第五个元素，赋值给result的openIssues
      result.openIssues = results[3];
      // 获取repos数组中的第一个元素，赋值给result的nickName
      result.nickName = nickName;
      // 获取repos数组中的第一个元素，赋值给result的owner
      result.owner = owner;
      // 获取repos数组中的第一个元素，赋值给result的repo
      result.repo = repo;
      // 返回result
      return result;
    });
  }
  // 等待arr数组中的每一个元素执行完毕
  arr = await Promise.all(arr);
  // 创建一个Map，用于存储repo2project
  repo2project = new Map();
  // 遍历arr数组
  arr.forEach((project) => {
    // 获取project的owner和repo，拼接成key
    let key = project.owner + "/" + project.repo;
    // 如果mergeRepo[key]为空，则将project放入repo2project中
    if (mergeRepo[key] == null) {
      repo2project.set(key, project);
    }
  });
  // 遍历arr数组
  for (let i = 0; i < arr.length; i++) {
    // 获取arr数组中的每一个元素
    let project = arr[i];
    // 获取project的owner和repo，拼接成key
    let key = project.owner + "/" + project.repo;
    // 如果mergeRepo[key]为空，则跳过
    if (mergeRepo[key] == null) {
      continue;
    }
    // 打印出key，表示需要合并
    console.log(key + " should be merged");
    // 调用moveIssuesToOtherRepo函数，将project中的closeIssue移动到mergeRepo[key]中
    await moveIssuesToOtherRepo(
      project.closeIssue,
      mergeRepo[key],
      repo2project,
      (project) => project.closeIssue
    );

    // 调用moveIssuesToOtherRepo函数，将project中的closePr移动到mergeRepo[key]中
    await moveIssuesToOtherRepo(
      project.closePr,
      mergeRepo[key],
      repo2project,
      (project) => project.closePr
    );

    // 调用moveIssuesToOtherRepo函数，将project中的newPr移动到mergeRepo[key]中
    await moveIssuesToOtherRepo(
      project.newPr,
      mergeRepo[key],
      repo2project,
      (project) => project.newPr
    );

    // 调用moveIssuesToOtherRepo函数，将project中的newIssue移动到mergeRepo[key]中
    await moveIssuesToOtherRepo(
      project.newIssue,
      mergeRepo[key],
      repo2project,
      (project) => project.newIssue
    );
  }
  // 创建一个空数组arr
  arr = [];
  // 遍历repo2project
  let i = 0;
  // 调用calculateScore_v2_sub函数，计算score，将计算结果放入arr数组中
  repo2project.forEach((v, k) => (arr[i++] = calculateScore_v2_sub(v, to)));
  // 对arr数组进行排序，按照score降序排列
  arr.sort((a, b) => {
    return b.score - a.score;
  });

  // 获取since的格式化时间
  var sinceReadable = utils.formatWithReadableFormat(since);
  // 获取to的格式化时间
  var toReadable = utils.formatWithReadableFormat(to);
  // 获取当前时间
  var now = utils.nowWithReadableFormat();
  // 获取arr数组中的第一个元素的score
  let prevScore = arr[0]?.score;
  // 获取arr数组中的第一个元素的rank
  let prevRank = 1;
  // 遍历arr数组
  for (let i = 0; i < arr.length; i++) {
    // 获取arr数组中的每一个元素
    let result = arr[i];
    // 获取arr数组中的每一个元素的rank
    let rank = i + 1;
    // 如果i大于0，且arr数组中的每一个元素的score等于prevScore，则将arr数组中的每一个元素的rank赋值给rank
    if (i > 0 && result.score == prevScore) {
      rank = prevRank;
    } else {
      // 否则，将arr数组中的每一个元素的score赋值给prevScore，将arr数组中的每一个元素的rank赋值给prevRank
      prevScore = result.score;
      prevRank = rank;
    }
    // 调用weeklyScoreDAO的insert函数，将计算结果插入到数据库中
    weeklyScoreDAO.insert(
      rank,
      result.score,
      result.owner,
      result.nickName,
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
  // 提交weeklyScoreDAO
  weeklyScoreDAO.commit();
  // 提交dangerousIssueDAO
  dangerousIssueDAO.commit();
}

// 异步函数，用于将issues移动到其他仓库
async function moveIssuesToOtherRepo(
  // issuesToCheck：需要检查的issues
  issuesToCheck,
  // mergeFunc：合并函数
  mergeFunc,
  // repo2project：仓库到项目映射
  repo2project,
  // getDestination：获取目标
  getDestination
) {
  // 遍历issuesToCheck
  for (let issue of issuesToCheck) {
    let targetKey;
    try {
      // 调用mergeFunc函数，获取targetKey
      targetKey = await mergeFunc(issue);
    } catch (error) {
      // 捕获错误，并打印错误信息
      console.error("mergeFunc error: " + error);
      return;
    }
    // 打印出issue的html_url和targetKey
    console.log(issue.html_url + " should be merged into " + targetKey);
    // 如果targetKey为null或者repo2project.get(targetKey)为null，则跳过
    if (targetKey == null || repo2project.get(targetKey) == null) {
      continue;
    }
    // 调用getDestination函数，将issue添加到targetKey
    getDestination(repo2project.get(targetKey)).add(issue);
  }
}

// 计算分数
function calculateScore(result) {
  // console.log(result);
  let score =
    // 计算issue评论数量
    result.issueComment.size +
    // 计算新issue数量
    2 * result.newIssue.size +
    // 计算新pr数量
    3 * result.newPr.size +
    // 计算pr评论数量
    4 * result.prComment.size +
    // 计算关闭pr数量
    2 * result.closePr.size +
    // 计算新star数量
    result.new_stars +
    // 计算新fork数量
    2 * result.new_forks +
    // 计算新贡献者数量
    5 * result.new_contributors;
  // console.log(result.closeIssue);
  // console.log(result.closePr);
  result.score = score;
  return result;
}

// 计算v2版本的分数
function calculateScore_v2_add(result) {
  // 计算分数
  result = calculateScore(result);

  // 设置截止日期
  const deadline = 30;
  // 设置系数
  const k = 10;
  // 遍历关闭的issue
  result.closeIssue.forEach((e) => {
    // 判断是否是社区问题且已经有人回复
    let care = isCommunityIssue(e) && someMemberHasReplied(e);
    // 如果没有，则直接返回
    if (!care) {
      return;
    }
    // 计算关闭到创建的时间差
    let duration = moment(e.closed_at, "YYYY-MM-DDTHH:mm:ssZ").diff(
      moment(e.created_at, "YYYY-MM-DDTHH:mm:ssZ"),
      "day"
    );
    // 如果小于截止日期，则将系数加入分数
    if (duration < deadline) {
      result.score += (k * (deadline - duration)) / deadline;
    }
  });
  // 返回结果
  return result;
}

// 计算分数函数，用于计算分数
function calculateScore_v2_sub(result, to) {
  // 计算分数
  result = calculateScore(result);

  // 计算分数的系数
  const k1 = 5;
  const k2 = 7;
  // 过滤出有危险问题的列表
  filterOutDangerousIssues(result.openIssues, to).forEach((issue) => {
      // 插入到数据库中
      dangerousIssueDAO.insert(
        issue.duration,
        issue.project,
        issue.title,
        issue.url
      ); 
    // 如果是非常危险的问题，分数减去k2
    if (issue.isVeryDangerous) {
      result.score -= k2;
    // 否则，分数减去k1
    } else {
      result.score -= k1;
    }
  });
  // 返回计算后的分数
  return result;
}

// 判断issue是否为社区问题
function isCommunityIssue(issue) {
  return (
    issue.author_association != "MEMBER" && issue.author_association != "OWNER"
  );
}

// 判断issue是否有回复
function someMemberHasReplied(issue) {
  // 如果issue没有评论，则返回false
  if (issue.comments == 0) {
    return false;
  }
  // TODO
  // let url = issue.timeline_url.replace("https: //", "https://");
  // https://api.github.com/repos/mosn/layotto/issues/214/timeline
  return true;
}

// 函数collectIssueData用于收集GitHub上指定仓库的Issue和PR数据
function collectIssueData(orgName, repoName, since) {
  // 初始化一个结果对象
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
  // 获取指定仓库的Issue评论
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
      .then(function (r) {
        let len = r.data.length;
        for (let i = 0; i < len; i++) {
          let d = r.data[i];
          // 过滤掉Bot的评论
          if (d.user.type == "Bot") {
            continue;
          }
          // 如果是Issue，则添加到issueComment中
          if (d.html_url.indexOf("pull") < 0) {
            result.issueComment.add(d);
          } else {
            result.prComment.add(d);
          }
        }
        return result;
      })
      // see https://docs.github.com/en/rest/reference/issues#list-repository-issues
      // 获取指定仓库的Issue
      .then(function (r) {
        return octokit.request(
          `GET /repos/{owner}/{repo}/issues?since=${since}&state=all`,
          {
            owner: orgName,
            repo: repoName,
          }
        );
      })
      .then(function (r) {
        let len = r.data.length;
        for (let i = 0; i < len; i++) {
          let d = r.data[i];
          // 过滤掉Bot的Issue
          if (d.user != null && d.user.type == "Bot") {
            continue;
          }
          // 如果Issue已关闭，则添加到closeIssue中
          if (d.closed_at != null) {
            // 如果是PR，则判断是否已合并，若未合并则跳过
            if (isPr(d)) {
              if (d.pull_request.merged_at == null) {
                continue;
              }
              result.closePr.add(d);
              // 如果Issue创建时间大于since，则添加到newPr中
              if (d.created_at >= since) {
                result.newPr.add(d.number);
              }
            } else {
              result.closeIssue.add(d);
              // 如果Issue创建时间大于since，则添加到newIssue中
              if (d.created_at >= since) {
                result.newIssue.add(d.number);
              }
            }
            continue;
          }
          // 如果Issue创建时间小于since，则添加到unknown中
          if (d.created_at < since) {
            result.unknown.add(d.number);
            continue;
          }
          // 如果是PR，则添加到newPr中
          if (isPr(d)) {
            result.newPr.add(d.number);
          } else {
            // 如果是Issue，则添加到newIssue中
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
// 判断是否有pull_request属性
function isPr(d) {
  if (d.pull_request != null) {
    return true;
  }
  return false;
}

module.exports = {
  generateScoreReport: generateScoreReport,
};
