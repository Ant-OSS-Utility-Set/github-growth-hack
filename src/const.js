
//这个是固定写死的。
const configNames = ['liveness-check','good-first-issue-notifier','mergeRepo','dangerousIssuesConfig','dingTalkGroupConfig']

/**
 * 按照优先级获取配置
 * @param repoConfig
 * @param ownerConfig
 * @param gConfig
 * @returns {*}
 */
function getConfig(repoConfig,ownerConfig,gConfig){
    if(repoConfig!=null){
        return repoConfig;
    }
    if(ownerConfig!=null){
        return ownerConfig;
    }
    return gConfig;
}


//
// const downloadAndImportJS =  (options,url, env,callback) => {
//
//     if(fs.existsSync(tempCloudFilePath)){
//         fs.unlinkSync(tempCloudFilePath)
//     }
//     let file = fs.createWriteStream(tempCloudFilePath, {flags: 'a'});
//
//     console.log("开始下载远程配置文件："+url)
//     https.get(url,options, (res) => {
//         let data = '';
//         res.on('data', (chunk) => {
//             data += chunk;
//             console.log("...")
//         });
//         res.on('end', () => {
//             if (res.statusCode === 200) {
//                 console.log('文件下载成功')
//                 file.write(data);
//                 file.end();
//                 file.close();
//                 fs.renameSync(tempCloudFilePath,configFilePath)
//                 importAndCallbackJS(configFilePath,env,callback)
//             }else{
//                 console.error(`请求失败，使用以前的JS,状态码: ${res.statusCode}`);
//                 importAndCallbackJS(configFilePath,env,callback)
//             }
//         });
//
//         res.on("error",()=>{
//             console.error('下载失败，使用以前的JS');
//             importAndCallbackJS(configFilePath,env,callback)
//         })
//     });
// };
//
//
//
// //mergeRepo的箭头函数，自定义赋值，先写死。
// const  sofastackTech = async function (issue) {
//     if (issue.pull_request == null || issue.user.login == "wangxingyu000") {
//         return null;
//     }
//     let diffUrl = issue.pull_request.diff_url;
//     //fetch
//     let response = await fetch(diffUrl, {
//         method: "GET",
//     });
//     let txt = await response.text();
//     // extract the repo name from the document path
//     // let path = txt.match(/^diff --git a\/(.*) b\/.*$/m)[1];
//     let repoName = txt.match(
//         /^diff --git a\/content\/[^/]+\/projects\/([^/]+)\/(.*) b\/.*$/m
//     );
//     if (repoName != null) {
//         return repoName[1];
//     }
//     return null;
// };
module.exports = {
    configNames:configNames,
    getConfig:getConfig

};
