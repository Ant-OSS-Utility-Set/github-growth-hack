const { weeklyReportFactory } = require("./weeklyReportFactory");
const { month } = require("./month");
const { utils } = require("./utils");

// Modify these configuration items as you like
// 1. (Optional) Your github API token
// It's not required unless your repositries are private
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
// owner, repo, new_stars, new_contributors, new_forks
// Currently the 'new_stars','new_contributors' and 'new_forks' have to be manually counted and put into the code.
let repos = [
  // ["sofastack", "sofa-tracer", 1, 0, 0],
  // ["sofastack", "sofa-rpc-node", 0, 0, 1],
  // ["sofastack", "sofa-rpc", 6, 0, 4],
  // ["sofastack", "sofa-registry", 1, 1, 1],
  // ["sofastack", "sofa-node", 0, 0, 0],
  // ["sofastack", "sofa-lookout", 0, 0, 0],
  // ["sofastack", "sofa-jraft", 12, 1, 2],
  // ["sofastack", "sofa-jarslink", -1, 0, 1],
  // ["sofastack", "sofa-hessian-node", 0, 0, 0],
  // ["sofastack", "sofa-hessian", 0, 0, 0],
  // ["sofastack", "sofa-dashboard", 0, 0, 1],
  // ["sofastack", "sofa-boot", 5, 0, 1],
  // ["sofastack", "sofa-bolt-python", 0, 0, 0],
  // ["sofastack", "sofa-bolt-node", 0, 0, 0],
  // ["sofastack", "sofa-bolt-cpp", 0, 0, 0],
  // ["sofastack", "sofa-bolt", 0, 0, 1],
  // ["sofastack", "sofa-ark", 3, 0, 2],
  // ["sofastack", "sofa-acts", 0, 0, 0],
  ["mosn", "mosn", 23, 1, 5],
  ["mosn", "layotto", 18, 2, 3],
];

console.log("Since: " + since);
console.log("To: " + to);

// Let's start
const args = process.argv.slice(2);
console.log("Mode: " + args[0]);
if (args[0] == "month") {
  month.generateReportForLastMonth(token, repos);
} else {
  let start = weeklyReportFactory(token);
  start(repos, since, to);
}
