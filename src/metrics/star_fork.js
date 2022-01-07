const fetch = require("node-fetch");
const moment = require("moment"); // require

// {
//   star: 0,
//   fork: 0,
// }
async function countStarsAndForks(token, owner, repo, since) {
  // result schema
  const result = {
    star: 0,
    fork: 0,
  };
  // loop fetching
  let hasPreviousPage = true;
  let previousStartCursor = null;
  do {
    let page = await fetchPage(token, owner, repo, previousStartCursor, since);
    result.star += page.star;
    result.fork += page.fork;
    hasPreviousPage = page.hasPreviousPage;
    previousStartCursor = page.previousStartCursor;
  } while (hasPreviousPage);
  return result;
}

async function fetchPage(token, owner, repo, previousStartCursor, since) {
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

function parseData(json, since) {
  // 1. check error
  if (json.error != null) {
    throw new Error(json.error);
  }
  const result = {
    star: 0,
    fork: 0,
    hasPreviousPage: false,
    previousStartCursor: json.data.repository.stargazers.pageInfo.startCursor,
  };
  // 2. parse star data
  let edges = json.data.repository.stargazers.edges;
  let n = edges.length;
  result.hasPreviousPage =
    json.data.repository.stargazers.pageInfo.hasPreviousPage;
  // loop counting
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

  return result;
}

module.exports = {
  countStarsAndForks: countStarsAndForks,
};
