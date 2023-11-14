const https = require('https');
const fs = require('fs');

const configFilePath = '../configs/config.json';
const tempCloudFilePath = '../configs/configCloudTemp.json';

//这个是固定写死的。
const configPrivateFilePath = '../configs/config_private.json';
const configNames = ['liveness-check','good-first-issue-notifier','mergeRepo','dangerousIssuesConfig','dingTalkGroupConfig']
const importAndCallbackJS = (filePath,env,callback) => {

    try {
        //公共配置
        const dataPublic = fs.readFileSync(filePath,'utf8');
        //私有的配置
        const dataPrivate = fs.readFileSync(configPrivateFilePath,'utf8');
        // console.log("配置JSON文件："+dataPublic);
        const config = JSON.parse(dataPublic);
        const configPrivate = JSON.parse(dataPrivate);
        //这里先简单处理，把configprivate里面的东西赋值到config里面，然后兼容老代码
        mergePublicPrivate(configPrivate,config);
        config.repos = combineRepos(config,env)
        config.mergeRepo = combineMergeRepo(config.repos);
        //开发测试配置
        if(env==='dev'){
            config.dingTalkGroupConfig = config.generalConfig.dingTalkGroupConfig
            config.mysqlConfig = {}
        }else{
            config.dingTalkGroupConfig = config.orgRepoConfig.dingTalkGroupConfig
            config.mysqlConfig = config.generalConfig.mysqlConfig

        }
        callback(config);
    }catch (err){
        console.error('解析 JSON 失败', err);
    }

};

const downloadAndImportJS =  (options,url, env,callback) => {

    if(fs.existsSync(tempCloudFilePath)){
        fs.unlinkSync(tempCloudFilePath)
    }
    let file = fs.createWriteStream(tempCloudFilePath, {flags: 'a'});

    console.log("开始下载远程配置文件："+url)
    https.get(url,options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
            console.log("...")
        });
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('文件下载成功')
                file.write(data);
                file.end();
                file.close();
                fs.renameSync(tempCloudFilePath,configFilePath)
                importAndCallbackJS(configFilePath,env,callback)
            }else{
                console.error(`请求失败，使用以前的JS,状态码: ${res.statusCode}`);
                importAndCallbackJS(configFilePath,env,callback)
            }
        });

        res.on("error",()=>{
            console.error('下载失败，使用以前的JS');
            importAndCallbackJS(configFilePath,env,callback)
        })
    });
};

/**
 * 合并mergeRepo
 * @param repos
 * @returns {{}}
 */
function combineMergeRepo(repos){
    let mergeRepos = {} ;
    for (const repo of repos) {
        const meregerepo = repo[2].mergeRepo;
        if(meregerepo!=null){
            for (const key in meregerepo) {
                mergeRepos[key]=meregerepo[key]
            }
        }
    }

    //箭头函数赋值
    for (const mergeRepo in mergeRepos) {
        if(mergeRepo ==='sofastack/sofastack.tech'){
            mergeRepos['sofastack/sofastack.tech'] = sofastackTech;
        }
    }
    //箭头函数匿名赋值
   return mergeRepos;
}
//下面是几个merge合并的工具函数
//把通用配置解析到每个repo单独的里面：把owner --> repo -->config展开合并成 [owner,repo,{config}]
function combineRepos(config,env){
    //repos 数组，这个展平起来
    let reposForDispatch = [];
    const globalConfig = config['generalConfig'];
    const orgRepoConfig = config['orgRepoConfig'];


    //owner组织级别,2级层级
    for (const ownerName in orgRepoConfig) {
        //如果是配置不用循环。
        if(configNames.includes(ownerName)){
            continue
        }
        const ownerConfig =  orgRepoConfig[`${ownerName}`];
        // repo级别，3级层级
        for (const repoName in ownerConfig) {
            //如果是配置不用循环。
            if(configNames.includes(repoName)){
                continue
            }
            const repoConfig =  ownerConfig[`${repoName}`];

            //每个repo一个个性化的配置。
            const repoEntity = [ownerName,repoName,{}];
            for (const configName of configNames) {
                const config=priorityMerge(env,configName,globalConfig[configName], orgRepoConfig[configName],ownerConfig[configName], repoConfig[configName])
                //这个配置感觉还需要和前面的做下merge
                if(config!=null){
                    repoEntity[2][configName] = config;
                }
            }
            reposForDispatch.push(repoEntity);
        }
    }
    return reposForDispatch;
}

/**
 * 取出优先级最高的配置
 * @param env 环境检查
 * @param configName
 * @param gConfig
 * @param orgConfig
 * @param ownerConfig
 * @param repoConfig
 */
function priorityMerge(env,configName,gConfig,orgConfig,ownerConfig,repoConfig){
    let resultConfig;
    //如果是开发环境，直接返回全局配置。owners只是为了测试，在dev阶段排除掉
    if(env === 'dev' && gConfig!=null){
        resultConfig = gConfig;
        return resultConfig;
    }
    if(repoConfig != null){
        resultConfig = repoConfig;
    }else if(ownerConfig!=null){
        resultConfig = ownerConfig;
    } else if(orgConfig!=null){
        resultConfig = orgConfig;
    }else  {
        resultConfig =  gConfig;
    }

    return resultConfig;
}

/**
 * 把私有的合并到public里面，为了兼容以前的代码
 * @param configPrivate
 * @param configPublic
 */
function mergePublicPrivate(configPrivate, configPublic) {
    configPublic.generalConfig.graphToken = configPrivate.generalConfig.graphToken
    configPublic.generalConfig.mysqlConfig = configPrivate.generalConfig.mysqlConfig
    configPublic.generalConfig.dingTalkGroupConfig = configPrivate.generalConfig.dingTalkGroupConfig
    configPublic.generalConfig['good-first-issue-notifier'] = configPrivate.generalConfig['good-first-issue-notifier']
    //
    configPublic.orgRepoConfig.dingTalkGroupConfig = configPrivate.orgRepoConfig.dingTalkGroupConfig
    configPublic.orgRepoConfig['good-first-issue-notifier'] = configPrivate.orgRepoConfig['good-first-issue-notifier']

}

//mergeRepo的箭头函数，自定义赋值，先写死。
const  sofastackTech = async function (issue) {
    if (issue.pull_request == null || issue.user.login == "wangxingyu000") {
        return null;
    }
    let diffUrl = issue.pull_request.diff_url;
    //fetch
    let response = await fetch(diffUrl, {
        method: "GET",
    });
    let txt = await response.text();
    // extract the repo name from the document path
    // let path = txt.match(/^diff --git a\/(.*) b\/.*$/m)[1];
    let repoName = txt.match(
        /^diff --git a\/content\/[^/]+\/projects\/([^/]+)\/(.*) b\/.*$/m
    );
    if (repoName != null) {
        return repoName[1];
    }
    return null;
};
module.exports = {
    downloadAndImportJS: downloadAndImportJS,
    importAndCallbackJS:importAndCallbackJS
};