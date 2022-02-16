const weekly = require("./weekly");
const { monthly } = require("./monthly");
const { scanner } = require("./scanner");
const { utils } = require("./utils/time_utils");

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
  ["sofastack", "sofa-tracer"],
  ["sofastack", "sofa-rpc-node"],
  ["sofastack", "sofa-rpc"],
  ["sofastack", "sofa-registry"],
  ["sofastack", "sofa-node"],
  ["sofastack", "sofa-lookout"],
  ["sofastack", "sofa-jraft"],
  ["sofastack", "sofa-jarslink"],
  ["sofastack", "sofa-hessian-node"],
  ["sofastack", "sofa-hessian"],
  ["sofastack", "sofa-dashboard"],
  ["sofastack", "sofa-boot"],
  ["sofastack", "sofa-bolt-python"],
  ["sofastack", "sofa-bolt-node"],
  ["sofastack", "sofa-bolt-cpp"],
  ["sofastack", "sofa-bolt"],
  ["sofastack", "sofa-ark"],
  ["sofastack", "sofa-acts"],
  ["mosn", "mosn"],
  ["mosn", "layotto"],
];

// 4. Let's start!
// Belows are startup code. You don't have to modify them
if (token == null || token.length < 40) {
  throw new Error("Please set your github token in src/index.js");
}
console.log("From: " + since);
console.log("To: " + to);

const args = process.argv.slice(2);
console.log("Mode: " + args[0]);
if (args[0] == "month") {
  monthly.generateReportForLastMonth(token, repos);
} else if (args[0] == "scan") {
  scanner.scan(token, repos, since, to);
} else {
  weekly.generateScoreReport(token, repos, since, to);
}
