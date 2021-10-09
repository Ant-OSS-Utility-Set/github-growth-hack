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
// let since = utils.lastSunday();
let since = utils.sevenDaysBefore();
// let to = utils.thisFriday23_59_59();
let to = utils.today();

// 3. Which repositries do you care about?
// Parameters in the repos array are:
// owner, repo, new_stars, new_contributors, new_forks
// Currently the 'new_stars','new_contributors' and 'new_forks' have to be manually counted and put into the code.
let repos = [
  ["mosn","mosn",13,0,1],
  // ["sofastack","sofa-jraft",6,0,0],
  // ["sofastack","sofa-rpc",5,0,0],
  // ["sofastack","sofa-boot",3,0,0],
  // ["mosn","layotto",2,1,1],
  // ["sofastack","sofa-ark",1,0,0],
  // ["sofastack","sofa-bolt",1,0,1],
  // ["sofastack","sofa-hessian",0,0,0],
  // ["sofastack","sofa-bolt-node",0,0,0],
  // ["sofastack","sofa-acts",0,0,0],
  // ["sofastack","sofa-dashboard",0,0,0],
  // ["sofastack","sofa-registry",0,0,0],
  // ["sofastack","sofa-bolt-cpp",0,0,0],
  // ["sofastack","sofa-jarslink",0,0,0],
  // ["sofastack","sofa-tracer",0,0,-1],
  // ["sofastack","sofa-node",0,0,0],
  // ["sofastack","sofa-hessian-node",0,0,0],
  // ["sofastack","sofa-rpc-node",0,0,1],
  // ["sofastack","sofa-bolt-python",0,0,0],
  // ["sofastack","sofa-lookout",0,0,0],
];

console.log(since)
console.log(to)

// Let's start
let start = weelyReportFactory(token);
start(repos, since, to);
