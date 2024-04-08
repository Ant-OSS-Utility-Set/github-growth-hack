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

## 配置详细说明
 ``` 
"generalConfig": {
    "graphToken": "不需要改",
    "mysqlConfig": { "不需要改" },
    "liveness-check": {
      "enable": true --是否开启活跃度检查，默认开启
    },
    --危险issue的满足条件：满足条件的issue会触发钉钉issue告警
    "dangerousIssuesConfig": {
      "shouldReplyInXDays": 5,  -- 5天后还没有处理的issue
      "mustReplyInXDays": 30,  --  issue 开启时间到现在必须是30天内的
      "maxIssueNums": 3     --一个项目最多显示多少条，防止太多issue刷屏
    },
     --  项目合并，注意：这个配置只能在generalConfig层级进行配置，如果有需要，直接在这里面加即可。
    "mergeRepo": {
      "layotto/java-sdk": "mosn/layotto"   -- 要合并的项目==>  合并到的项目
    },
   --  good-first-issue 配置，鼓励用户认领issue
    "good-first-issue-notifier": {
      "enable": true, --是否开启
      "channels": [  --发送渠道，
        {
          "type": "dingtalk", -- 渠道类型，目前只有钉钉
          "urls": [
            "https://oapi.dingtalk.com/robot/send?access_token=xxxxx"  -- 钉钉机器人URL（配置钉钉机器人详见：- [如何在钉钉群里添加“项目管理机器人”](pm_bot.md)）
          ],
          "title": "goodFirstIssue认领", --钉钉机器人标题，
          "atUid": [],  --@用户钉钉ID
          "atAll": true -- 是否@所有人
        }
      ]
    },
    -- 危险issue（issue）和活跃度检查（liveness）的钉钉发送配置
    "dingTalkGroupConfig": {
      "groups": [ -- 可以发送多个钉钉机器人
        {
          "url": "https://oapi.dingtalk.com/robot/send?access_token=xxxxx", --机器人URL
          "topicProjects": "*",  -- 那些项目可以用此机器人，默认*,全部项目可用。一般不需要改
          "topicTypesOnly": [   -- 此钉钉机器人用于哪些目的。危险issue（issue）和活跃度检查（liveness）
            "liveness","issue"
          ],
          "nickName": "Antvis",  --在钉钉上显示的社区名称，一般不需要配置改，默认GitHub上的owner
          "issueWarningText": "辛苦尽快看下哈", -- 危险issue告警信息
          "livenessWarningText": "\n",    -- 活跃度检查告警信息
          "livenessCongratulationText": "\n"  -- 活跃度检查通过告警信息
        }
      ],
      -- 钉钉告警可以发送到哪些人
      "owners": {
           -- 按项目进行划分，
          "owner1/repo1：项目的名称，owner+repo拼接" : "钉钉uid"   
       }
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
       "repo1":{  }  --repo里面沿用owner的通用配置
     },
     "owner3":{
     "repo1":{}  --这是最简单的写法，全部沿用通用配置
     
     }
 
 
  }
}
 ``` 
