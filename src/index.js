const { utils } = require("./utils/time_utils");
const { dispatch } = require("./dispatcher");

// Modify these configuration items as you like
// 1. Your github API token
// We use your token to invoke github graphql api to query some repo data and won't do any modification.
// see https://docs.github.com/en/graphql/guides/forming-calls-with-graphql#authenticating-with-graphql
const token = ``;

// 2. Time range.
// modify it as you like
// e.g.
// let since = `2021-06-12T00:32:13Z`;
// let since = utils.lastSunday();
// let since = `2021-10-09T00:32:13Z`;
let since = utils.sevenDaysBefore();
// let to = utils.thisFriday23_59_59();
let to = utils.today();

// 3. Which repositries do you care about?
// Parameters in the repos array are:
// [owner, repo]
let repos = [
  ["mosn", "mosn"],
  ["mosn", "layotto"],
];

// 4. (Optional) Send messages to dingtalk group
const dingTalkGroupConfig = {
  url: "",
  keyword: "",
  owners: new Map(),
};

dingTalkGroupConfig.owners.set("project name", "dingtalk uid");
dingTalkGroupConfig.owners.set("layotto", "193555");

// 5. Let's start!
// Belows are startup code. You don't have to modify them
dispatch(token, repos, since, to, dingTalkGroupConfig);
