const { weelyReportFactory } = require("./weelyReportFactory");

// Modify these parameters as you like
const token = `Your Token Here`;
// since 7 days before
let since = `2021-06-12T00:32:13Z`;
// Parameters in the repos array:
// owner, repo, since, new_stars, new_contributors, new_folks
// Currently the 'new_stars','new_contributors' and 'new_folks' have to be manually counted and put into the code.
let repos = [
  ["mosn", "mosn", since, 13, 0, 1],
  ["sofastack", "sofa-jraft", since, 5, 1, 3],
  ["sofastack", "sofa-rpc", since, 5, 0, 4],
  ["sofastack", "sofa-tracer", since, 4, 0, 0],
  ["sofastack", "sofa-ark", since, 3, 0, 0],
  ["sofastack", "sofa-bolt", since, 2, 0, 3],
  ["sofastack", "sofa-rpc-node", since, 2, 1, 0],
  ["sofastack", "sofa-acts", since, 1, 0, 0],
  ["sofastack", "sofa-registry", since, 1, 0, 0],
  ["sofastack", "sofa-boot", since, 1, 0, 1],
  ["sofastack", "sofa-lookout", since, 1, 0, 0],
  ["sofastack", "sofa-bolt-node", since, 1, 0, 0],
  ["sofastack", "sofa-dashboard", since, 0, 0, 0],
  ["sofastack", "sofa-bolt-cpp", since, 0, 0, 0],
  ["sofastack", "sofa-jarslink", since, 0, 0, 3],
  ["sofastack", "sofa-node", since, 0, 0, 0],
  ["sofastack", "sofa-hessian-node", since, 0, 1, 0],
  ["sofastack", "sofa-bolt-python", since, 0, 0, 0],
  ["sofastack", "sofa-hessian", since, 0, 0, 2],
];

let start = weelyReportFactory(token);
start(repos);
