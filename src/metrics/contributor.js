const fs = require("fs");
const { utils } = require("../utils");
const https = require("https");
const fetch = require("node-fetch");
const moment = require("moment"); // require

// {
//   new_contributors: 0,
// }
async function countNewContributors(token, owner, repo, since) {
  // 1. generate url
  // https://contributor-overtime-api.apiseven.com/contributors?repo=mosn/layotto
  let url =
    "https://contributor-overtime-api.apiseven.com/contributors?repo=" +
    owner +
    "/" +
    repo;

  // fix an annoying bug
  // see https://stackoverflow.com/questions/58993308/getting-error-getaddrinfo-enotfound-while-performing-rest-api-call-in-node-js-u
  const dns = require("dns");

  dns.resolve(
    "contributor-overtime-api.apiseven.com",
    "ANY",
    (err, records) => {
      if (err) {
        console.log("Error: ", err);
      } else {
        // console.log(records);
      }
    }
  );

  // 2. get data
  return (
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      // 3. parse
      .then((res) => {
        return res.json();
      })
      .then((json) => parseData(json, since))
  );
}

function parseData(d, since) {
  // check error
  if (d.Code != 0) {
    throw new Error(d.ErrorMessage);
  }
  const result = {
    new_contributors: 0,
  };
  // you can check `data/api-schema/contributors/result.json` to see the result data structure
  let data = d.Contributors;
  const n = data.length;
  for (let i = n - 1; i >= 0; i--) {
    let d = data[i];
    if (moment(d.date).isBefore(since)) {
      break;
    }
    result.new_contributors += d.author_list.length;
  }
  return result;
}

// {
//   owner: owner,
//   repo: repo,
//   activeContributors: last.Num,
//   month: utils.formatUTC(last.Month),
// };
function activeContributorsLastMonth(owner, repo) {
  // 1. generate url
  // https://contributor-overtime-api.apiseven.com/monthly-contributor?repo=apache/apisix
  let url =
    "https://contributor-overtime-api.apiseven.com/monthly-contributor?repo=" +
    owner +
    "/" +
    repo;

  const dns = require("dns");

  dns.resolve(
    "contributor-overtime-api.apiseven.com",
    "ANY",
    (err, records) => {
      if (err) {
        console.log("Error: ", err);
      } else {
        // console.log(records);
      }
    }
  );

  // 2. get data
  return (
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      // 3. parse
      .then((res) => {
        return res.json();
      })
      .then((d) => {
        // check month_api_response.json to see the result data structure
        let data = d.Contributors;
        let last = data[data.length - 1];
        return {
          owner: owner,
          repo: repo,
          activeContributors: last.Num,
          month: utils.formatUTC(last.Month),
        };
      })
  );
}

module.exports = {
  countNewContributors,
  activeContributorsLastMonth,
};
