# Github Growth Hack 配置文件configs/config.json配置说明.

## JSON文件机构和优先级

- 文件层级如下
``` 
    -general级别：{
       "全局的通用配置"
     }
    -org级别：
        -owner1：{
           "此owner里面的配置" 
         }
           -repo1：{
            "此repo里面的配置"
             }
        -owner2
           repo1
 ``` 
- generalConfig general级别，是全局的配置，一般不要动
- orgRepoConfig 是根据组织层级划分的：
    - 在owner级别（org级别）可以配置一个组织通用的配置，
    - 在repo级别（项目级别）配置每个项目独特的配置。
- 优先级：repo级别 > owner级别  > general级别
- 用户可以新增一个owner或者在owner里面新增一个repo，generalConfig里面有通用的配置，如果都沿用通用的配置，则只需要写个空{}就可以了。
  如果有特殊的配置，只需要把generalConfig里面的配置拿来即可，一般来说用户仅仅需要配置：
  good-first-issue-notifier 、dingTalkGroupConfig 即可
- 下面是配置项的说明：
   -   liveness-check:是否开启活跃度检查，默认开启（enable=true）
   -   shouldReplyInXDays: 几天后还没有处理的issue
   -   mustReplyInXDays：issue 开启时间到现在必须是几天内的
   -   maxIssueNums：一个项目最多显示多少条，防止太多issue刷屏
   -   mergeRepo：项目合并，注意：这个配置只能在generalConfig层级进行配置，如果有需要，直接在这里面加即可。
   -   good-first-issue-notifier： good-first-issue 配置，鼓励用户认领issue
   -   dingTalkGroupConfig：危险issue（issue）和活跃度检查（liveness）的钉钉发送配置

## 配置详细说明
 ``` json
"generalConfig": {
    "graphToken": "不需要改",
    "mysqlConfig": { "不需要改" }, /* aaa */
    "liveness-check": {
      "enable": true 
    },
    "dangerousIssuesConfig": {
      "shouldReplyInXDays": 5,  
      "mustReplyInXDays": 30,  
      "maxIssueNums": 3     
    },
    "mergeRepo": {
      "layotto/java-sdk": "mosn/layotto"   
    },
    "good-first-issue-notifier": {
      "enable": true, 
      "channels": [  
        {
          "type": "IM类型", 
          "urls": [
            "IM机器人url" 
          ],
          "title": "goodFirstIssue认领",
          "atUid": [],  
          "atAll": true
        }
      ]
    },
    "dingTalkGroupConfig": {
      "groups": [
        {
          "url": "机器人URL", 
          "topicProjects": "那些项目可以用此机器人，默认*,全部项目可用。一般不需要改",  
          "topicTypesOnly": [  
            "liveness","issue"
          ],
          "nickName": "在IM上显示的社区名称，一般不需要配置改，默认GitHub上的owner", 
          "issueWarningText": "危险issue告警信息",
          "livenessWarningText": "活跃度检查告警信息",    
          "livenessCongratulationText": "活跃度检查通过告警信息"  
        }
      ]
    }
},
{
 "orgRepoConfig":{
    "owner1":{
       "单独owner配置，配置项参考generalConfig",
       "repo1":{
              "单独repo配置，配置项参考generalConfig",
       }
     },
    "owner2":{
       "单独owner配置，配置项参考generalConfig",
       "repo1":{  }  
     },
     "owner3":{
     "repo1":{} 
     
     }
 
 
  }
}
 ``` 
