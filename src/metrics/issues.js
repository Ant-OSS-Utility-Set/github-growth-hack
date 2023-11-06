const fetch = require("node-fetch");
const moment = require("moment"); // require

// 设置回复在X天内的天数，默认值5天
let shouldReplyInXDays = 5;
// 设置必须回复在X天内的天数。默认值30天
let mustReplyInXDays = 30;
// async函数listOpenIssues，用于获取指定仓库的open issues
// 参数：token：GitHub的token；owner：仓库所有者；repo：仓库名
// 返回：仓库的open issues列表
async function listOpenIssues(token, owner, repo) {
  // result
  // 定义查询语句
  let query = `query listOpenIssues($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      issues(states: [OPEN], last: 100) {
        nodes {
          id
          repository{
            name
          }
          title
          url
          authorAssociation
          author {
            login
          }
          createdAt
          labels(last: 30) {
            edges {
              node {
                # id
                name
              }
            }
          }
          comments(last: 30) {
            nodes {
              author {
                login
              }
              authorAssociation
            }
          }
        }
        totalCount
      }
      # issue(number:384) {
      #   id
      #   author{
      #     login
      #   }
      # }
    }
  }  
  `;

  // 发起请求
  return fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "bearer " + token,
    },
    body: JSON.stringify({
      query: query,
      variables: {
        owner: owner,
        name: repo,
      },
    }),
  })
    .then((res) => {
      // 返回响应的json数据
      return res.json();
    })
    .then((d) => {
      // 返回仓库的open issues列表
      return d.data.repository.issues;
    });
}

// async函数，用于调用GitHub API，获取好的第一个问题
async function listGoodFirstIssues(token, owner, repo, createdSince) {
  // 打印出调用GitHub API的信息
  console.log(
    "Invoking github API to fetch good first issues. owner: " +
      owner +
      " repo:" +
      repo +
      " createdSince:" +
      createdSince
  );

  // query statement for graphql API
  // 查询语句，用于graphql API
  let query = `query listGoodFirstIssues($owner: String!, $name: String!,$updatedSince: DateTime!) {
    repository(owner: $owner, name: $name) {
      issues(
        states: [OPEN]
        labels: ["good first issue"]
        filterBy: {assignee: null, since: $updatedSince}
        last: 100
      ) {
        nodes {
          id
          repository {
            name
          }
          title
          url
          authorAssociation
          author {
            login
          }
          createdAt
          labels(last: 30) {
            edges {
              node {
                name
              }
            }
          }
          comments(last: 30) {
            nodes {
              author {
                login
              }
              authorAssociation
            }
          }
        }
        totalCount
      }
    }
  }
  `;

  // 返回调用GitHub API的结果
  return fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "bearer " + token,
    },
    body: JSON.stringify({
      query: query,
      variables: {
        owner: owner,
        name: repo,
        updatedSince: createdSince,
      },
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((d) => {
      return d.data.repository.issues;
    })
    .then((issues) => filterIssuesByCreatedSince(issues, createdSince))
    .then((issues) => groupByDifficulty(issues));
}

// 遍历issues数组，根据标签名将问题分别放入不同的数组中
function groupByDifficulty(issues) {
  const result = {
    easy: [],
    medium: [],
    hard: [],
    unknown: [],
  };
  issues.forEach((issue) => {
    for (const idx in issue.labels) {
      const labelName = issue.labels[idx];
      
      // 遍历每一个问题，根据标签名将其放入不同的数组中
      if (labelName == "easy") {
        result["easy"].push(issue);
        return;
      } else if (labelName == "medium") {
        result["medium"].push(issue);
        return;
      } else if (labelName == "hard") {
        result["hard"].push(issue);
        return;
      }
    }
    // 如果问题没有标签，则将其放入unknown数组中
    result["unknown"].push(issue);
  });
  return result;
}

// 函数用于过滤根据创建时间
function filterIssuesByCreatedSince(issues, createdSince) {
  // 打印出过滤之前的问题数量
  console.log("Before filter: " + issues.nodes.length + " issues");
  const result = [];
  // filter out issues
  // 遍历过滤问题
  issues.nodes.forEach((issue) => {
    // Ignore community issues. We only care about the good first issues submitted by our member or owner
    // 判断是否是社区issue，如果不是社区issue直接返回
    let isCommunityIssue = isCommunityIssue_graphql(issue);
    if (isCommunityIssue) {
      return;
    }
    // 判读问题是否有作者，如果没有作者直接返回
    if (issue.author == null) {
      // console.log(issue);
      return;
    }
    // 判断创建时间是否早于7天，如果是则直接返回
    // check created date
    let createDay = moment(issue.createdAt, "YYYY-MM-DDTHH:mm:ssZ");
    if (moment(createdSince).isAfter(createDay)) {
      return;
    }
    // 将过滤后的结果添加到result中
    result.push({
      project: issue.repository.name,
      title: issue.title,
      url: issue.url,
      labels: issue.labels.edges.map((e) => e.node.name),
    });
  });
  // 返回过滤后的结果
  return result;
}
const k = 30;
const baseline = moment().subtract(k,'days')

// 异步函数，用于列出危险
async function listDangerousOpenIssues(token, owner, repo, to) {
  // 调用listOpenIssues函数，获取所有
  return listOpenIssues(token, owner, repo).then((issues) =>
    // 调用filterOutDangerousIssues函数，过滤出危险
    filterOutDangerousIssues(issues, to)
  );
}

// 过滤出危险的
function filterOutDangerousIssues(issues, to) {
  const result = [];
  // filter out those dangerous issues
  // 遍历所有issues
  issues.nodes.forEach((issue) => {
    // we care only about community issues
    // 判断是否是社区issue，如果不是社区issue直接返回
    let care = isCommunityIssue_graphql(issue);
    // 如果不是社区issue，则直接返回
    if (!care) {
      return;
    }

    // 判读问题是否有作者，如果没有作者直接返回
    if (issue.author == null) {
      return;
    }

    // 判断是否有成员回复了该信息，否则直接返回 
    if (someMemberHasReplied_graphql(issue)) {
      return;
    }

    // 判断该issue是否在白名单中，如果是则直接返回
    if (inWhiteList(issue)) {
      return;
    }

    // 判断是否有特点标签，如果有则直接返回
    if (withSpecialLabels(issue)) {
      return;
    }

    // 判断issue是否早于30天创建，如果是则直接返回
    // check baseline
    let createDay = moment(issue.createdAt, "YYYY-MM-DDTHH:mm:ssZ");
    if (baseline != null && baseline.isAfter(createDay)) {
      return;
    }
    // check duration
    let duration = moment(to).diff(createDay, "day");
    issue.duration = duration;
    // 判断问题是否在X天内创建
    if (duration < shouldReplyInXDays) {
      return;
    }
    // 判断问题是否在X天内没有回复
    // this is a dangerous issue !
    issue.veryDangerous = false;
    if (duration >= mustReplyInXDays) {
      issue.veryDangerous = true;
    }
    result.push({
      duration: issue.duration,
      project: issue.repository.name,
      title: issue.title,
      url: issue.url,
      isVeryDangerous: issue.veryDangerous,
      keyword: issue.url.split('/')[3],
    });
  });
  console.log('过滤后的问题',result)
  
  return result;
}

// 判断问题是否在白名单中
function inWhiteList(issue) {
  return false;
}

function withSpecialLabels(issue) {
  let found = false;
  // 遍历issue的labels.edges，检查是否有"help wanted"，"good first issue"，"WIP"，"wip"中的一个
  issue.labels.edges.forEach((labelNode) => {
    if (
      labelNode.node.name == "help wanted" ||
      labelNode.node.name == "good first issue" ||
      labelNode.node.name == "WIP" ||
      labelNode.node.name == "wip"
    ) {
      found = true;
    }
  });
  // 返回是否找到
  return found;
}

function isCommunityIssue_graphql(issue) {
  // 判断issue的authorAssociation是否不是MEMBER和OWNER
  return (
    issue.authorAssociation != "MEMBER" && issue.authorAssociation != "OWNER"
  );
}

function someMemberHasReplied_graphql(issue) {
  // 遍历issue的comments.nodes
  for (let comment of issue.comments.nodes) {
    // 如果comment的作者和issue的作者相同，则跳过
    if (comment.author.login == issue.author.login) {
      continue;
    }
    // 如果comment的作者和issue的作者关系是MEMBER、OWNER、CONTRIBUTOR，则返回true
    if (
      comment.authorAssociation == "MEMBER" ||
      comment.authorAssociation == "OWNER" ||
      comment.authorAssociation == "CONTRIBUTOR"
    ) {
      return true;
    }
  }
  // 否则返回false
  return false;
}

module.exports = {
  // 列出OpenIssues
  listOpenIssues: listOpenIssues,
  // 列出好的第一个Issues
  listGoodFirstIssues: listGoodFirstIssues,
  // 列出危险的OpenIssues
  listDangerousOpenIssues: listDangerousOpenIssues,
  // 过滤出危险的Issues
  filterOutDangerousIssues: filterOutDangerousIssues,
  // 设置在X天回复
  shouldReplyInXDays(days) {
    if (days != null && days > 0) {
      shouldReplyInXDays = days;
    }
  },
  // 设置必须回复X天
  mustReplyInXDays(days) {
    if (days != null && days > 0) {
      mustReplyInXDays = days;
    }
  },
};