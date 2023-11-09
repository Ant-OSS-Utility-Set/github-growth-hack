const https = require('https');
const fs = require('fs');

const tempFilePath = '../configs/config.js';
const tempCloudFilePath = '../configs/configCloud.js';

const importAndCallbackJS = (filePath,callback) => {
    let config = require(filePath);
    callback(config);
};

const downloadAndImportJS =  (options,url, callback) => {

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
                fs.renameSync(tempCloudFilePath,tempFilePath)
                importAndCallbackJS(tempFilePath,callback)
            }else{
                console.error(`请求失败，状态码: ${res.statusCode}`);
                importAndCallbackJS(tempFilePath,callback)
            }
        });

        res.on("error",()=>{
            console.error('下载失败，使用以前的JS');
            importAndCallbackJS(tempFilePath,callback)
        })
    });
};

//下面是几个merge合并的工具函数


/**
 * 合并相同的owner
 * @param commonOwner
 * @param otherOwner
 */
function mergeOwners(commonOwner,otherOwner){
    let commonOwnerMap = new Map(Object.entries(commonOwner));
    for (const [key, value] of commonOwnerMap) {
        otherOwner.set(key, value);
    }
}
/**
 * 设置repo里面的good-first-issure的URL
 * @param commonRepos
 * @param otherRepos
 */
function mergeReposGoodFirstIssue(commonRepos, otherRepos) {
    commonRepos.forEach((item) =>{
        let ownerRepo = item[0]+"_"+item[1]
        //特殊URL赋值。如果有其他的在下面加
        if(otherRepos["good-first-issue-notifier"]===undefined){
            return;
        }
        let devUrlMap = otherRepos["good-first-issue-notifier"]["channels"][0]["urls"];
        if(devUrlMap[ownerRepo]!=null){
            item[2]["good-first-issue-notifier"]["channels"][0]["urls"]=devUrlMap[ownerRepo];
        }
    })

}
module.exports = {
    downloadAndImportJS: downloadAndImportJS,
    mergeOwners:mergeOwners,
    mergeReposGoodFirstIssue:mergeReposGoodFirstIssue
};