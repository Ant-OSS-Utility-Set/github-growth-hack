const fetch = require("node-fetch");
const moment = require("moment"); // require

// 异步函数，用于获取 fork 和 star 数据
async function countStarsAndForks(token, owner, repo, since) {
  // 初始化结果
  const result = {
    star: 0,
    fork: 0,
  };
  // 是否有上一页
  let hasPreviousPage = true;
  // 上一页的起始游标
  let previousStartCursor = null;
  // 循环获取数据
  do {
    // 获取当前页的数据
    let page = await fetchPage(token, owner, repo, previousStartCursor, since);
    // 更新结果
    result.star += page.star;
    result.fork += page.fork;
    // 是否有上一页
    hasPreviousPage = page.hasPreviousPage;
    // 更新上一页的起始游标
    previousStartCursor = page.previousStartCursor;
  } while (hasPreviousPage);
  // 返回结果
  return result;
}

// 获取每一页的 fork 和 star 数据
async function fetchPage(token, owner, repo, previousStartCursor, since) {
  // 查询语句
  let query = `query getForkAndStar($owner: String!, $name: String!, $previousStartCursor: String) {
    repository(owner: $owner, name: $name) {
      forks(last: 40, before: $previousStartCursor) {
        pageInfo {
          startCursor
          hasPreviousPage
        }
        nodes {
          createdAt
        }
      }
      stargazers(last: 30, before: $previousStartCursor) {
        pageInfo {
          startCursor
          hasPreviousPage
        }
        edges {
          starredAt
        }
      }
    }
  }`;

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
        previousStartCursor: previousStartCursor,
      },
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((json) => parseData(json, since));
}

// 解析数据
function parseData(json, since) {
  // 1. check error
  // 检查错误
  if (json.error != null) {
    throw new Error(json.error);
  }
  // 初始化结果
  const result = {
    star: 0,
    fork: 0,
    hasPreviousPage: false,
    previousStartCursor: json.data.repository.stargazers.pageInfo.startCursor,
  };
  // 2. parse star data
  // 解析 star 数据
  let edges = json.data.repository.stargazers.edges;
  let n = edges.length;
  // 更新结果
  result.hasPreviousPage =
    json.data.repository.stargazers.pageInfo.hasPreviousPage;
  // loop counting
  // 遍历计算
  for (let i = n - 1; i >= 0; i--) {
    let e = edges[i];
    if (moment(e.starredAt).isBefore(since)) {
      result.hasPreviousPage = false;
      break;
    }
    result.star++;
    // console.log(e.starredAt);
  }
  // 3. parse fork data
  // 解析 fork 数据
  edges = json.data.repository.forks.nodes;
  n = edges.length;
  let forkHasPreviousPage = json.data.repository.forks.pageInfo.hasPreviousPage;

  for (let i = n - 1; i >= 0; i--) {
    let e = edges[i];
    if (moment(e.createdAt).isBefore(since)) {
      forkHasPreviousPage = false;
      break;
    }
    result.fork++;
  }
  if (forkHasPreviousPage) {
    result.hasPreviousPage = true;
  }

  // 返回结果
  return result;
}

module.exports = {
  countStarsAndForks: countStarsAndForks,
};