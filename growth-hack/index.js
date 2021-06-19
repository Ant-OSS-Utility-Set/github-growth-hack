const { weelyReportFactory } = require("./weelyReportFactory");

// Modify these parameters as you like
const token = `Your Token Here`;
let weeklyReporter = weelyReportFactory(token);
// since 7 days before
let since = `2021-06-12T00:32:13Z`;
// weeklyReporter(owner, repo, since, new_stars, new_contributors, new_folks);
weeklyReporter("mosn", "mosn", since, 13, 0, 1);
weeklyReporter("sofastack", "sofa-jraft", since, 5, 1, 3);
weeklyReporter("sofastack", "sofa-rpc", since, 5, 0, 4);
weeklyReporter("sofastack", "sofa-tracer", since, 4, 0, 0);
weeklyReporter("sofastack", "sofa-ark", since, 3, 0, 0);
weeklyReporter("sofastack", "sofa-bolt", since, 2, 0, 3);
weeklyReporter("sofastack", "sofa-rpc-node", since, 2, 1, 0);
weeklyReporter("sofastack", "sofa-acts", since, 1, 0, 0);
weeklyReporter("sofastack", "sofa-registry", since, 1, 0, 0);
weeklyReporter("sofastack", "sofa-boot", since, 1, 0, 1);
weeklyReporter("sofastack", "sofa-lookout", since, 1, 0, 0);
weeklyReporter("sofastack", "sofa-bolt-node", since, 1, 0, 0);
weeklyReporter("sofastack", "sofa-dashboard", since, 0, 0, 0);
weeklyReporter("sofastack", "sofa-bolt-cpp", since, 0, 0, 0);
weeklyReporter("sofastack", "sofa-jarslink", since, 0, 0, 3);
weeklyReporter("sofastack", "sofa-node", since, 0, 0, 0);
weeklyReporter("sofastack", "sofa-hessian-node", since, 0, 1, 0);
weeklyReporter("sofastack", "sofa-bolt-python", since, 0, 0, 0);
weeklyReporter("sofastack", "sofa-hessian", since, 0, 0, 2);
