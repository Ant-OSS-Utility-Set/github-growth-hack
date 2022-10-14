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

大盘数据可以生成 excel：

 <img src="https://user-images.githubusercontent.com/26001097/183243770-fb9a9805-f9e3-4750-b551-c29a46385248.png" width = "50%" height = "50%" alt="welcome" align=center />

也可以推送到 IM 群：

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
 <img src="https://user-images.githubusercontent.com/26001097/183243558-d4c59600-e232-40ae-8fae-a48f22263437.png" width = "50%" height = "50%" alt="welcome" align=center />

机器人会定期对所有开源项目进行“活跃度检查”，如果项目长期缺少维护、不处理舆情 issue，会被自动判定为“腐烂级”项目。

判定规则：

- 项目连续 4 周活跃度达不到 20

- 项目存在 30 天以上未回复的 issue

达到上述两个条件就定性为“腐烂级”项目，机器人会建议限期整改，否则归档。

整改期可以每隔 xx 天投诉升级、抄送主管。整改期过后如果仍未解决，将启动垃圾回收流程，对项目进行归档。

### 4. Readiness check
### 5. 项目管理机器人
推动别人太麻烦了，交给机器人去做吧！

- 开周会前，自动询问当事人进展
- 写周报前，自动询问当事人进展

 <img src="https://user-images.githubusercontent.com/26001097/183242835-dc46c836-6f3c-48b3-9d80-ade6ebf40492.png" width = "50%" height = "50%" alt="welcome" align=center />

- 每周组织社区会议

 <img src="https://user-images.githubusercontent.com/26001097/183243067-3d8ee469-b565-4b64-83b0-6e5dcb97b2f2.png" width = "50%" height = "50%" alt="welcome" align=center />

 <img src="https://user-images.githubusercontent.com/26001097/183243113-ffc68e99-554b-420f-a7b5-82dbb795083a.png" width = "50%" height = "50%" alt="welcome" align=center />


- [ ] 集成进 github issues, 自动追踪已 assign 的高优先级 issue, 在 issue 下询问进度或者在 IM 内询问进度。

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
[roadmap.md](roadmap.md)