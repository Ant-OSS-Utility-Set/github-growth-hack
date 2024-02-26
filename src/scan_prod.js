const { utils } = require("./utils/time_utils");
const { dispatch } = require("./dispatcher");
//一个config配置文件，用户私有仓库配置，我们手动复制到放在服务器上面
const config = require("../configs/config.json");
const { configNames } = require("./const.js");
const moment = require("moment/moment");


// 2. Time range.
// let since = utils.sevenDaysBefore();
let since =    moment().subtract(16, "days").toISOString(true);
let to = utils.today()

    //需要改的配置
const env = "prod";

devForTest(env,config);
dispatch(config,since, to);


function devForTest(env,config) {
    if(env==='dev'){
        const dev = require("../configs/config-dev.json");
        // config.generalConfig.mysqlConfig= {}
        config.generalConfig.dingTalkGroupConfig=dev.dingTalkGroupConfig
        config.generalConfig['good-first-issue-notifier']=dev['good-first-issue-notifier']
        for (const owner in config.orgRepoConfig) {
            if(configNames.includes(owner)){
                continue
            }
            config.orgRepoConfig[owner].dingTalkGroupConfig=dev.dingTalkGroupConfig
            config.orgRepoConfig[owner]['good-first-issue-notifier']=dev['good-first-issue-notifier']
            for (const repo in config.orgRepoConfig[owner]) {
                if(configNames.includes(repo)){
                    continue
                }
                config.orgRepoConfig[owner][repo].dingTalkGroupConfig=dev.dingTalkGroupConfig
                config.orgRepoConfig[owner][repo]['good-first-issue-notifier']=dev['good-first-issue-notifier']
            }
        }

    }
}


