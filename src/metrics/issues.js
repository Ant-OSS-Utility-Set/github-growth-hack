const fetch = require("node-fetch");
const moment = require("moment"); // require

let shouldReplyInXDays = 5;
let mustReplyInXDays = 30;

async function listOpenIssues(token, owner, repo) {
  // result
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
      return res.json();
    })
    .then((d) => {
      return d.data.repository.issues;
    });
}

async function listGoodFirstIssues(token, owner, repo, createdSince) {
  console.log(
    "Invoking github API to fetch good first issues. owner: " +
      owner +
      " repo:" +
      repo +
      " createdSince:" +
      createdSince
  );

  // query statement for graphql API
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
    result["unknown"].push(issue);
  });
  return result;
}

function filterIssuesByCreatedSince(issues, createdSince) {
  console.log("Before filter: " + issues.nodes.length + " issues");
  const result = [];
  // filter out issues
  issues.nodes.forEach((issue) => {
    // Ignore community issues. We only care about the good first issues submitted by our member or owner
    let isCommunityIssue = isCommunityIssue_graphql(issue);
    if (isCommunityIssue) {
      return;
    }
    if (issue.author == null) {
      // console.log(issue);
      return;
    }
    // check created date
    let createDay = moment(issue.createdAt, "YYYY-MM-DDTHH:mm:ssZ");
    if (moment(createdSince).isAfter(createDay)) {
      return;
    }
    result.push({
      project: issue.repository.name,
      title: issue.title,
      url: issue.url,
      labels: issue.labels.edges.map((e) => e.node.name),
    });
  });
  console.log("After filter: " + result.length + " issues");
  return result;
}

const baseline = moment("2022-01-01", "YYYY-MM-DD");

async function listDangerousOpenIssues(token, owner, repo, to) {
  return listOpenIssues(token, owner, repo).then((issues) =>
    filterOutDangerousIssues(issues, to)
  );
}

function filterOutDangerousIssues(issues, to) {
  const result = [];
  // filter out those dangerous issues
  issues.nodes.forEach((issue) => {
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
    if (inWhiteList(issue)) {
      return;
    }
    if (withSpecialLabels(issue)) {
      // console.log("ignore issue with special labels:" + issue.url);
      return;
    }
    // check baseline
    let createDay = moment(issue.createdAt, "YYYY-MM-DDTHH:mm:ssZ");
    if (baseline != null && baseline.isAfter(createDay)) {
      return;
    }
    // check duration
    let duration = moment(to).diff(createDay, "day");
    issue.duration = duration;
    if (duration < shouldReplyInXDays) {
      return;
    }
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
    });
  });
  return result;
}

function inWhiteList(issue) {
  return false;
}

function withSpecialLabels(issue) {
  let found = false;
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
  return found;
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

module.exports = {
  listOpenIssues: listOpenIssues,
  listGoodFirstIssues: listGoodFirstIssues,
  listDangerousOpenIssues: listDangerousOpenIssues,
  filterOutDangerousIssues: filterOutDangerousIssues,
  shouldReplyInXDays(days) {
    if (days != null && days > 0) {
      shouldReplyInXDays = days;
    }
  },
  mustReplyInXDays(days) {
    if (days != null && days > 0) {
      mustReplyInXDays = days;
    }
  },
};
