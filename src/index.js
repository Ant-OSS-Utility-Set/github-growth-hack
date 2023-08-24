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
// [owner, repo , options(optional) ]
let repos = [
  ["mosn", "mosn", { "liveness-check": { enable: true } }],
  [
    "mosn",
    "layotto",
    {
      "good-first-issue-notifier": {
        channels: [
          {
            type: "dingtalk",
            urls: [
              // IM group bot url
              "",
            ],
            title: "XXXX",
            atUid: [],
            atAll: true,
          },
        ],
      },
    },
    { "liveness-check": { enable: true } }
  ],
  [
    "layotto",
    "java-sdk",
    {
      nickname: "layotto-java-sdk",
    },
    { "liveness-check": { enable: false } }
  ],
  ["sofastack", "sofa-tracer", { "liveness-check": { enable: false } }],
  ["sofastack", "sofa-rpc-node", { "liveness-check": { enable: false } }],
  ["sofastack", "sofa-rpc", { "liveness-check": { enable: false } }],
  ["sofastack", "sofa-registry", { "liveness-check": { enable: false } }],
  ["sofastack", "sofa-jraft", { "liveness-check": { enable: false } }],
  ["sofastack", "sofa-node", { "liveness-check": { enable: false } }],
  ["sofastack", "sofa-lookout", { "liveness-check": { enable: false } }],
  ["sofastack", "sofa-hessian-node", { "liveness-check": { enable: false } }],
  ["sofastack", "sofa-hessian", { "liveness-check": { enable: true } }],
  ["sofastack", "sofa-dashboard", { "liveness-check": { enable: false } }],
  ["sofastack", "sofa-boot", { "liveness-check": { enable: true } }],
  ["sofastack", "sofa-bolt-python", { "liveness-check": { enable: false } }],
  ["sofastack", "sofa-bolt-node", { "liveness-check": { enable: false } }],
  ["sofastack", "sofa-bolt-cpp", { "liveness-check": { enable: false } }],
  ["sofastack", "sofa-bolt", { "liveness-check": { enable: false } }],
  ["sofastack", "sofa-ark", { "liveness-check": { enable: true } }],
  ["sofastack", "sofa-acts", { "liveness-check": { enable: false } }],
  ["sofastack", "sofa-jarslink", { "liveness-check": { enable: false } }],
  ["CeresDB", "ceresdb", { "liveness-check": { enable: false } }],
  ["CeresDB", "ceresmeta", { "liveness-check": { enable: false } }],
  ["CeresDB", "ceresdb-java-client", { "liveness-check": { enable: false } }],
  ["CeresDB", "ceresdbproto", { "liveness-check": { enable: false } }],
  ["opensumi", "core", { "liveness-check": { enable: false } }],
  [
    "TRaaSStack",
    "auto-unit-test-case-generator",
    { "liveness-check": { enable: false } },
  ],
];

// (Optional) Merge different repos into one report
// e.g.
let mergeRepo = {
  "layotto/java-sdk": (issue) => "mosn/layotto",
};

// (Optional) Write the reports into Mysql
let mysqlConfig = {
  host: "",
  user: "",
  password: "",
  database: "",
};

// 4. (Optional) Modify dangerous issues related configs
const dangerousIssuesConfig = {
  // shouldReplyInXDays: 4,
  // default
  // shouldReplyInXDays: 5,
  // mustReplyInXDays: 30,
};

// 5. (Optional) Send messages to dingtalk group
const dingTalkGroupConfig = {
  groups: [
    {
      // your dingtalk bot url with token as a url parameter
      url: "",
      // your dingtalk bot keyword
      keyword: "SOFAStack",
      issueWarningText: "\n测试:辛苦尽快看下哈，预计在周五下午进行大群报警\n",
      // which project this dingtalk bot care about
      topicProjects: "*",
    },
  ],
  owners: new Map(),
};

dingTalkGroupConfig.owners.set("project name", ["dingtalk uid"]);
dingTalkGroupConfig.owners.set("layotto", ["193555"]);

// 5. Let's start!
// Belows are startup code. You don't have to modify them
dispatch(
  token,
  repos,
  mergeRepo,
  since,
  to,
  mysqlConfig,
  dangerousIssuesConfig,
  dingTalkGroupConfig
);
