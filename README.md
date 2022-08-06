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

![](grafana.png)

除了活跃度，还有舆情 issue 大盘

![](https://user-images.githubusercontent.com/26001097/157366957-6fb03357-97e0-47b3-80e5-e8b8c88ad96e.png)

大盘数据可以生成 excel，可以推送到 IM 群。

 <img src="excel.png" width = "50%" height = "50%" alt="welcome" align=center />

![](https://user-images.githubusercontent.com/26001097/156523792-34acd5ac-577e-4981-b026-3f26361e46db.png)

### 2. 答疑治理

![image](https://user-images.githubusercontent.com/26001097/158101918-4073f091-90e0-4e92-ae70-b6d9dead0676.png)

#### 2.1. 将 IM 群的提问引流到 issue 区

- IM 入群提示, 建议提问时先发 issue

 <img src="https://user-images.githubusercontent.com/26001097/157403838-3d789e25-e9cc-4fdf-9606-59894feaa0e6.png" width = "40%" height = "40%" alt="welcome" align=center />

- 用户艾特机器人，可以查看使用帮助

#### 2.2. 推动 owner 回复 issue

- 带着 issue 艾特机器人，机器人开始帮忙催 owner 回 issue

- 定时催促，直到回复了 issue

- 如果长时间不回复，舆情风险上升，机器人会在别的群里也催促 owner

#### 2.3. issue assigned 群聊提醒

issue 被 assign 后，在 IM 群中提醒当事人。
![image](https://user-images.githubusercontent.com/26001097/157380722-b9dac88a-b8cb-48ef-bccf-5536db319264.png)

#### 2.4. 舆情 issue 治理

我们定义舆情 issue 有不同等级：
| level | 标准 |
| -- | -- |
| 1 | 有用户在群里贴出来 issue 、寻求解答 |
| 2 | 有用户在群里贴出来 issue 、寻求解答，但催促 owner 后仍未回复。 |
| 3 | 5 天没人回复的 issue |
| 4 | 30 天没人回复的 issue |

基于上述抽象，本工具提供了治理舆情 issue 的解决方案

##### 2.4.1. 舆情 issue 扫描、报警

定期找出长时间未回复的 issue，在大群中报警，通知项目维护者。

 <img src="https://user-images.githubusercontent.com/26001097/156523399-c044b214-c454-46dd-a71f-77bde5b73121.png" width = "40%" height = "40%" alt="welcome" align=center />

![](https://user-images.githubusercontent.com/26001097/156515698-ebaf02ab-5ffe-4fb9-9201-a76e44274d3a.png)

##### 2.4.2. 小群预报警

在大群报警之前，可以提前 1 天在小群友情提醒，更加人性化。

![image](https://user-images.githubusercontent.com/26001097/157793252-e07aec12-df0d-4128-b790-0d31f1bd31a3.png)

### 3. 活跃度检查: liveness check

机器人会定期对所有开源项目进行“活跃度检查”，如果项目长期缺少维护、不处理舆情 issue，会被自动判定为“腐烂级”项目。

判定规则：

- 项目连续 4 周活跃度达不到 20

- 项目存在 30 天以上未回复的 issue

达到上述两个条件就定性为“腐烂级”项目，机器人会建议限期整改，否则归档。

整改期可以每隔 xx 天投诉升级、抄送主管。整改期过后如果仍未解决，将启动垃圾回收流程，对项目进行归档。

### 4. 项目管理机器人
推动别人太麻烦了，交给机器人去做吧！

- 开周会前，自动询问当事人进展
- 写周报前，自动询问当事人进展

![image](https://user-images.githubusercontent.com/26001097/183242835-dc46c836-6f3c-48b3-9d80-ade6ebf40492.png)


- [ ] 集成进 github issues, 自动追踪已 assign 的 issue

## 使用文档

见[英文文档](README-en.md#usage) ，暂未翻译。

## 活跃度指标说明

 <img src="https://user-images.githubusercontent.com/26001097/158004228-3bf9b244-f64f-4017-9827-6edbd981b66d.png" width = "200%" height = "200%" alt="score" align=center />

<!-- Score = C_{issue-comment} + 2*C_{open-issue}\\
\ \ \ \ \ \ +3*C_{open-pr}+4*C_{review-comment} \\
\ \ \ \ \ \ + 2*C_{pr-merged}+ C_{watch} \\
\ \ \ \ \ \ + 2*C_{fork} + 5 *C_{new-contributors}\\
\ \ \ \ \ \ - 5* C_{issues-without-comment-for-5-days}\\
\ \ \ \ \ \ - 7* C_{issues-without-comment-for-30-days}\\ -->

详见[活跃度指标设计 v2](https://github.com/seeflood/github-weekly-statistics/issues/2)


## Roadmap

### P0
- 周报机器人
  - [ ] 现在的周报只有活跃度数字，没有文字描述项目进展。可以自动生成周报/双周报/月报，描述关键进展

- 完善答疑治理功能

  - [ ] 帮群友催 owner 回 issue
  - [ ] 帮提问的群友搜索文档和 issue 区
  - [ ] 尝试回答群友的问题，如果解答不了则建议发 issue/艾特项目维护者/不说话。
  - [ ] 在提问的 issue 下面回复，帮忙搜索文档和 issue 区

- 让已有功能更自动化
  - [ ] 通过 github workflow 执行定时任务，定时扫描
  - [ ] 让用户 fork 项目后改下配置就能用
  - [ ] 统计月活跃贡献者(MAC)自动入库
  - [ ] 自动生成周报图片、群发
  - [ ] 自动生成月报图片、群发
  - [ ] 一条命令部署
  - [ ] grafana 配置更新，增强功能

### P1

#### 声明对项目的预期

- 支持在配置文件中声明项目分级、对它的活跃度期望、是否需要运营推广

#### 控制器模式

根据对项目的预期，由控制器监控状态，当状态不符合预期时进行干预。类似于 k8s 的控制器模式

##### 项目促活

- [ ] 根据配置，监控项目的月活跃度，如果符合预期则什么都不做；如果不符合预期，则给出专家建议，比如建议回复或者关闭这几个 issue ，回复之后下周活跃度上升、月活就能上升。
      可以每周一发布，激励本周工作。
  - [ ] 对每件事建模，耗时 v, 带来价值 w; 问题变成：给定有限 V, 求最优解 W, 动态规划问题。

- [ ] 事前预测、预防: 如果预测到本周结束后可能达不到预期状态，系统应该在周中就进行 push, 推荐接下来 2 天做哪些事

##### 运营机器人

- 社区任务(help wanted issues)推广
  - [ ] 推荐社区任务
        比如每周五推荐一些社区任务，或者艾特机器人、机器人推荐一些社区任务
  - [ ] 自动把社区任务包装成运营文案
  - [ ] 自动把文案群发到微信群、钉钉群
- 任务推广后 A/B 测试，通过数据证明效果

比如机器人 1 通过策略 1 推广，人类通过策略 2 推广，两者推广的任务集合不一样，并且推广时间不一样（比如轮流，单周由机器人推广，双周由人做推广）
每个月进行推广数据对比，找出优势策略

- 像 vtuber 一样有虚拟形象
- IM 气氛组，对话、欢迎、活跃气氛
  需要调研，因为机器人可能说错话、有政治不正确风险，可能只适合熟人小群

#### 引流数据分析

定期分析 [仓库 uv 和 star 率](https://github.com/seeflood/github-growth-hack/issues/2#issuecomment-1013903441) ，从而分析运营活动的引流效果；

#### Readiness check

对项目进行健康检查，判断是否达到“适合运营宣传”的标准

#### 文档治理

### P2

- 帮助新项目快速搭建一套 github workflow
  - [ ] workflow for 文档治理
  - [ ] workflow for golang 
  - [ ] workflow for java
  - [ ] workflow for chores

- 帮助新项目快速搭建一套 make 脚本，方便本地开发
  - [ ] make 模板

- 专家建议：自动分析瓶颈指标，给出建议

  比如平均回复时间太长;
  比如非 Member 提的 issue 较少，说明用户少，或者用户提问不在 github ;

~~- 互联网舆情监控~~

- 代码敏感信息扫描

避免提交的代码中有敏感信息，即时阻止提交

- 法律合规扫描

扫描依赖代码的许可证，是否有侵犯知识产权风险
