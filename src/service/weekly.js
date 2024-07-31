const { Octokit } = require("@octokit/core");
const { weeklyScoreDAO } = require("../dao/weekly_score");
const { utils } = require("../utils/time_utils");
const fetch = require("node-fetch");
const { countStarsAndForks } = require("../metrics/star_fork");
const { countNewContributors } = require("../metrics/contributor");
const moment = require("moment"); // require
const { configNames,getConfig } = require("../const.js");

const {
  listOpenIssues,
  filterOutDangerousIssues,
} = require("../metrics/issues");
const dangerousIssueDAO = require("../dao/dangerous_issue");

let octokit = null;

// 生成分数报告
 async function generateScoreReport(config, since, to) {
     const token = config.generalConfig.graphToken;
     // 初始化octokit
     octokit = new Octokit({
         auth: token,
     });
     // 开始计算分数
     // 打印出从since到now的时间段
     console.log(`From ${since} to Now:`);
     // 启动weeklyScoreDAO
     weeklyScoreDAO.start();
     // 启动dangerousIssueDAO
     // dangerousIssueDAO.start();
     const mergeRepoConfig = config.generalConfig['mergeRepo'];
     let repo2project = new Map();
     let resultPromiseArr = [];

     let resultArr = [];
     for (const owner in config.orgRepoConfig) {


         for (const repo in config.orgRepoConfig[owner]) {
             if (configNames.includes(repo)) {
                 continue
             }
             const nickName = getNickName(repo, config.orgRepoConfig[owner][repo]);
             const promiseIssue =  collectIssueData(owner, repo, since);
             const promiseStarFork =  countStarsAndForks(token, owner, repo, since);
             const promiseContributor = await countNewContributors(token, owner, repo, since);
             const promiseOpenIssues =  listOpenIssues(token, owner, repo);
             const resultPromise = Promise.all([promiseIssue, promiseStarFork, promiseContributor, promiseOpenIssues])
                 .then(function (results) {
                     const result = results[0];
                     result.new_stars = results[1].star;
                     result.new_forks = results[1].fork;
                     result.new_contributors = results[2].new_contributors;
                     result.openIssues = results[3];
                     result.nickName = nickName;
                     result.owner = owner;
                     result.repo = repo;
                     // 获取project的owner和repo，拼接成key
                     let key = result.owner + "/" + result.repo;
                     // 如果mergeRepo[key]为空，则将project放入repo2project中
                     if (mergeRepoConfig[key] == null) {
                         repo2project.set(key, result);
                     }
                     resultArr.push(result);
                 });

             resultPromiseArr.push(resultPromise);
         }
         //repo循环结束

     }
     //owner循环结束
      Promise.all(resultPromiseArr).then(async result => {
          await mergeRepoToOtherRepo(resultArr, mergeRepoConfig, repo2project);
          //插入数据库;发送钉钉
         insertDb(repo2project, since, to, config);
         // 提交weeklyScoreDAO
          weeklyScoreDAO.commit();
     })


 }


/**
 * 合并仓库
 * @param arr
 * @param mergeRepo
 * @param repo2project
 */
 function mergeRepoToOtherRepo(arr, mergeRepo,repo2project) {
  for (let i = 0; i < arr.length; i++) {
    let project = arr[i];
    let key = project.owner + "/" + project.repo;
    let mergeTarget = mergeRepo[key];
    if (mergeTarget == null) {
      continue;
    }
      console.log(`${key}仓库merge前的计算项:closeIssue:${repo2project.get(mergeTarget).closeIssue.size},closePr:${repo2project.get(mergeTarget).closePr.size},newIssue:${repo2project.get(mergeTarget).newIssue.size},newPr:${repo2project.get(mergeTarget).newPr.size}`)
      moveIssuesToOtherRepo(project.closeIssue, mergeRepo[key], repo2project, (project) => project.closeIssue);
     moveIssuesToOtherRepo(project.closePr, mergeRepo[key], repo2project, (project) => project.closePr);
     moveIssuesToOtherRepo(project.newPr, mergeRepo[key], repo2project, (project) => project.newPr);
     moveIssuesToOtherRepo(project.newIssue, mergeRepo[key], repo2project, (project) => project.newIssue);
      console.log(`${key}仓库merge后的计算项:closeIssue:${repo2project.get(mergeTarget).closeIssue.size},closePr:${repo2project.get(mergeTarget).closePr.size},newIssue:${repo2project.get(mergeTarget).newIssue.size},newPr:${repo2project.get(mergeTarget).newPr.size}`)

  }
}

/**
 * 插入数据库
 * @param repo2project
 * @param since
 * @param to
 * @param config
 */
function insertDb(repo2project,since,to,config){
  let arr = [];
  // 遍历repo2project
  let i = 0;
  // 调用calculateScore_v2_sub函数，计算score，将计算结果放入arr数组中
  repo2project.forEach((v, k) => (arr[i++] = calculateScore_v2_sub(config,v, to)));
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
    if (i > 0 && result.score === prevScore) {
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
}
/**
 * 遍历repos，获取结果数据
 * @param token
 * @param repos
 * @param since
 * @returns {Promise<Awaited<unknown>[]>}
 */
async function processRepos(token, repos, since) {
  let arr = [];
  for (let i = 0; i < repos.length; i++) {
  }
  arr =  Promise.all(arr);
  return arr;
}

function getNickName(repo, repoOption) {
  let nickName = repo;
  if (repoOption != null && repoOption["nickname"] != null) {
    nickName = repoOption["nickname"];
  }
  return nickName;
}


//--------------------------------下面的都是工具函数，不涉及到主要业务逻辑。||||||||||||||||||||||||||||||
//----------------------------------------------------------------------------||
// 异步函数，用于将issues移动到其他仓库
 function moveIssuesToOtherRepo(
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
      if(typeof mergeFunc === 'string'){
        targetKey =  mergeFunc;
      }else if(typeof mergeFunc === 'function'){
        // 调用mergeFunc函数，获取targetKey
        targetKey =  mergeFunc(issue);
      }else{
        console.log("mergeFunction 不是标准格式")
        return;
      }
    } catch (error) {
      // 捕获错误，并打印错误信息
      console.error("mergeFunc error: " + error);
      return;
    }
    // 打印出issue的html_url和targetKey
    // console.log(issue.html_url + " should be merged into " + targetKey);
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
  result.score = result.issueComment.size +
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
  // console.log(result.repoName+"计算过程：2* newIssue("+result.newIssue.size+");3*newPr("+result.newPr.size+");4*prComment("+result.prComment.size+");2*closePr("+
  //     result.closePr.size+");1*newStars("+result.new_stars+");2*newFork("+ result.new_forks+");5*newContributors("+result.new_contributors+")")
  return result;
}


// 计算分数函数，用于计算分数
function calculateScore_v2_sub(config,result, to) {
  // 计算分数
  //   console.log(result.repoName+"计算内容："+JSON.stringify(result))
  result = calculateScore(result);
  let prevScore = result.score;
  let dangerousIssueUrlList = new Array();

  // 计算分数的系数
  const k1 = 5;
  const k2 = 7;
  // 过滤出有危险问题的列表
  let dangerousIssues = filterOutDangerousIssues(result.openIssues, to,result.owner,result.repo);
  dangerousIssues.forEach((issue) => {
    // 如果是非常危险的问题，分数减去k2
    if (issue.isVeryDangerous) {
      result.score -= k2;
      // 否则，分数减去k1
    } else {
      result.score -= k1;
    }
      dangerousIssueUrlList.push(issue.url);
  });
  console.log(result.repoName+"最初分数："+prevScore+";危险issue数量(每个减去5或者7分)："+dangerousIssues.length+"个；综合得分："+result.score+";危险ISSUE列表："+JSON.stringify(dangerousIssueUrlList));

  // 返回计算后的分数
  return result;
}

// 判断issue是否为社区问题
function isCommunityIssue(issue) {
  return (
    issue.author_association != "MEMBER" && issue.author_association != "OWNER"
  );
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

