# Github Growth Hack

[English document](README-en.md)

A framework to help you do growth hacking for your open source projects.

## 要解决的问题

- 推动：如何推动项目维护者持续投入"技术人日"?
- 提效：如何自动化一些琐事，节约一些"技术人日"？
- 规划：给定有限的"技术人日"资源，应该做哪些事，以便（尽量）最大化收益？
- 风险管理：企业做开源的一个诉求是“别出事”、别带来负面影响（比如负面舆情，比如伤害品牌形象）。能否即时发现可能“出事”的风险事项？

## 功能

### 1. 开源项目大盘

为每个项目计算活跃度，排序，生成大盘。

 <img src="grafana.png" width = "50%" height = "50%" alt="welcome" align=center />


大盘数据可以生成 excel：

 <img src="https://user-images.githubusercontent.com/26001097/183243770-fb9a9805-f9e3-4750-b551-c29a46385248.png" width = "50%" height = "50%" alt="welcome" align=center />

### 2. 舆情 issue 扫描、报警

定期找出长时间未回复的issue在大群中报警，通知项目维护者。

<img src="https://gw.alicdn.com/imgextra/i1/O1CN01fjClZg21nKqco7C6x_!!6000000007029-0-tps-1624-492.jpg" width = "50%" height = "50%" alt="welcome" align=center />

判定规则（可以在配置文件里面进行更改）：

- 5-30天的未回复issue
- 为了防止未回复issue太多导致刷屏，限制每个项目最多只有3个issue


### 3. 活跃度检查: liveness check
<img src="https://user-images.githubusercontent.com/26001097/183243558-d4c59600-e232-40ae-8fae-a48f22263437.png" width = "50%" height = "50%" alt="welcome" align=center />

机器人会定期对所有开源项目进行“活跃度检查”，如果项目长期缺少维护、不处理舆情 issue，会被自动判定为“腐烂级”项目。

判定规则：

- 项目连续 4 周活跃度达不到 20

- 项目存在 30 天以上未回复的 issue

达到上述两个条件就定性为“腐烂级”项目，机器人会建议限期整改，否则归档。

整改期可以每隔 xx 天投诉升级、抄送主管。整改期过后如果仍未解决，将启动垃圾回收流程，对项目进行归档。


### 4. 运营机器人

自动推广 good first issue，吸引贡献者

<img src="https://user-images.githubusercontent.com/26001097/199180613-f5fea5ba-70a8-4b99-984d-912aad487ff0.png" width = "50%" height = "50%" alt="welcome" align=center />

详见 https://github.com/mosn/layotto/issues/800

如果开启该功能，good first issue 必须满足一定的label 规范、命名规范, 详见 https://mosn.io/layotto/#/zh/development/label-spec
## 使用文档

- [如何在钉钉群里添加“项目管理机器人”](pm_bot.md)

其他功能的用法见[英文文档](README-en.md#usage) ，暂未翻译。

## 活跃度指标说明

 <img src="https://user-images.githubusercontent.com/26001097/158004228-3bf9b244-f64f-4017-9827-6edbd981b66d.png" width = "200%" height = "200%" alt="score" align=center />

<!-- Score = C_{issue-comment} + 2*C_{open-issue}\\
\ \ \ \ \ \ +3*C_{open-pr}+4*C_{review-comment} \\
\ \ \ \ \ \ + 2*C_{pr-merged}+ C_{watch} \\
\ \ \ \ \ \ + 2*C_{fork} + 5 *C_{new-contributors}\\
\ \ \ \ \ \ - 5* C_{issues-without-comment-for-5-days}\\
\ \ \ \ \ \ - 7* C_{issues-without-comment-for-30-days}\\ -->

详见[活跃度指标设计 v2](https://github.com/seeflood/github-growth-hack/issues/2)


## Roadmap
见 issue 区