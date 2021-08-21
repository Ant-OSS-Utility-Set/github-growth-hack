const { weelyReportFactory } = require("./weelyReportFactory");
const { utils } = require("./utils");

// Modify these parameters as you like
// 1. (Optional) Your github API token
// It's not required unless your repositries are private
const token = ``;

// 2. Time range.
// modify it as you like
// e.g.
// let since = `2021-06-12T00:32:13Z`;
let since = utils.lastSaturday();
let to = utils.thisFriday23_59_59();

// 3. Which repositries do you care about?
// Parameters in the repos array are:
// owner, repo, new_stars, new_contributors, new_forks
// Currently the 'new_stars','new_contributors' and 'new_forks' have to be manually counted and put into the code.
let repos = [
  ["sofastack","sofa-jraft",23,1,9],
  ["mosn","layotto",18,3,7],
  ["mosn","mosn",17,2,5],
];

// console.log(since);
// console.log(to);

let start = weelyReportFactory(token);
start(repos, since, to);
