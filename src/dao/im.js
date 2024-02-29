
const {dingtalk} = require("./dingtalk");
const {otherim} = require("./otherim");
// https://open.dingtalk.com/document/group/custom-robot-access
const imDao = {

  // 发送markdown消息
  sendMarkdown: function (groupUrls, content, title, atUid, isAtAll) {
    // 遍历groupUrls数组
    for (let group of groupUrls) {
      // 1.validate
      // 判断groupUrls数组是否为空
      if (group == null || group.length == 0) {
        console.log("DingTalk groupUrls is empty");
        continue;
      }
      let uidArr = [];
      if (atUid != null) {
        uidArr = atUid;
      }
      
      if(group['type']==='dingtalk'){
        return dingtalk.sendMarkdown(group,content,atUid,uidArr);
      }else{
        ///// 其他IM接入示例
       return  otherim.sendMarkdown(group,content,atUid,uidArr);
      }

    }
  },
  /**
   * 这里的owner等于owner好像
   * @param content
   * @param atUid
   * @param isAtAll
   * @param isNegative
   * @param topicType
   * @param dingTalkGroupConfig
   */
  send: async function (content, atUid, isAtAll, isNegative, topicType,dingTalkGroupConfig) {
    const topicTypeLiveness = "liveness";
    const topicTypeIssue = "issue";
    const groups = dingTalkGroupConfig["groups"]

    for (let group of groups) {

      // 1.validate
      // 检查url是否为空
      if (group['url'] == null || group['url'].length === 0) {
        console.log("DingTalk url is empty");
        continue;
      }

      // check owner in content
      // 检查content中是否有group.owner，没有则替换this.owner
      let newContent = content;

      // append text
      // 添加链接文本
      if (topicType === topicTypeIssue) {
        if (isNegative) {
          newContent += nullToEmpty(group['issueWarningText']);
        } else {
          //没有issue，不会发消息，这个实际没有用到
          newContent += nullToEmpty(group['issueCongratulationText']);
        }
      } else if (topicType === topicTypeLiveness) {
        if (isNegative) {
          newContent += nullToEmpty(group['livenessWarningText']);
        } else {
          newContent += nullToEmpty(group['livenessCongratulationText']);
        }
      }
      let uidArr = [];
      if (atUid != null) {
        uidArr = atUid;
      }
      if(group['type'] === 'dingtalk'){
        return dingtalk.send(group,content,atUid,uidArr);
      }else{
        //
      }

    }
  },

  sendImage: async function (imageUrl, atUid, isAtAll, isNegative, topicType,owner,option) {
    const groups = option["groups"]
    for (let group of groups) {
      // 1.validate
      if (group.url == null || group.url.length == 0) {
        console.log("send image:DingTalk url is empty");
        continue;
      }

      // check owner in content
      let nickName = owner;
      if (group['nickName'] != null) {
        nickName = group['nickName'];
      }
      if(group['type'] === 'dingtalk'){
        return dingtalk.sendMarkdown(group,nickName,imageUrl,atUid,isAtAll);
      }else{
        //
      }
    }
  }
};

  function nullToEmpty(str) {
    // 如果str为null，则返回空字符串
    if (str == null) {
      return "";
    }
    // 否则返回str
    return str;
  }


module.exports = {
  getImDao() {
    return imDao;
  }
};