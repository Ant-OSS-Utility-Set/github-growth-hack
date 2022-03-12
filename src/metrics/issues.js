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
      console.log("ignore issue with special labels:" + issue.url);
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
      labelNode.node.name == "good first issue"
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
