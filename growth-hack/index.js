const { weelyReportFactory } = require("./weelyReportFactory");
const { utils } = require("./utils");

// Modify these parameters as you like
// 1. (Optional) Your github API token
// It's not required unless your repositries are private
const token = ``;

// 2. Since when?
// modify it as you like
// e.g.
// let since = `2021-06-12T00:32:13Z`;
let since = utils.lastSaturday();

// 3. Which repositries do you care about?
// Parameters in the repos array are:
// owner, repo, new_stars, new_contributors, new_forks
// Currently the 'new_stars','new_contributors' and 'new_forks' have to be manually counted and put into the code.
let repos = [
  ["mosn", "layotto", 154, 4, 22],
  // ["mosn", "mosn", 25, 0, 4],
  // ["sofastack", "sofa-jraft", 10, 1, 3],
  // ["sofastack", "sofa-boot", 7, 0, 2],
  // ["sofastack", "sofa-bolt", 7, 0, 2],
  // ["sofastack", "sofa-rpc", 6, 0, 2],
  // ["sofastack", "sofa-tracer", 3, 0, 1],
  // ["sofastack", "sofa-jarslink", 2, 0, 0],
  // ["sofastack", "sofa-rpc-node", 2, 0, 0],
  // ["sofastack", "sofa-ark", 2, 0, 0],
  // ["sofastack", "sofa-lookout", 1, 0, 0],
  // ["sofastack", "sofa-registry", 1, 0, 3],
  // ["sofastack", "sofa-bolt-cpp", 0, 0, 0],
  // ["sofastack", "sofa-node", 0, 0, 0],
  // ["sofastack", "sofa-hessian-node", 0, 0, 0],
  // ["sofastack", "sofa-bolt-python", 0, 0, 0],
  // ["sofastack", "sofa-hessian", 0, 0, 0],
  // ["sofastack", "sofa-bolt-node", 0, 0, 0],
  // ["sofastack", "sofa-acts", 0, 0, 0],
  // ["sofastack", "sofa-dashboard", 0, 0, 0],
];

let start = weelyReportFactory(token);
start(repos, since);
