# Github Growth Hack

A tool to help you do growth hacking for your open source projects.

## 要解决的问题

- 推动：如何推动项目 owner 投入技术人日到开源
- 提效：如何自动化一些琐事，节约一些技术人日？
- 规划：应该让有限的技术人日做哪些事，以便（尽量）最大化收益？

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
| 1 | 5 天没人回复的 issue |
| 2 | 30 天没人回复的 issue |
| 3 | 有用户在群里贴出来 issue 、寻求解答 |
| 4 | 有用户在群里贴出来 issue 、寻求解答，但催促 owner 后仍未回复。 |

基于上述抽象，本工具提供了治理舆情 issue 的解决方案

##### 2.4.1. 舆情 issue 扫描、报警

定期找出长时间未回复的 issue，在大群中报警，通知项目维护者。

 <img src="https://user-images.githubusercontent.com/26001097/156523399-c044b214-c454-46dd-a71f-77bde5b73121.png" width = "40%" height = "40%" alt="welcome" align=center />

![](https://user-images.githubusercontent.com/26001097/156515698-ebaf02ab-5ffe-4fb9-9201-a76e44274d3a.png)

##### 2.4.2. 小群预报警

在大群报警之前，可以提前 1 天在小群友情提醒，更加人性化。

![image](https://user-images.githubusercontent.com/26001097/157793252-e07aec12-df0d-4128-b790-0d31f1bd31a3.png)

### TODO

- 文档治理
- 自然选择计划：对于长期缺少维护、不处理舆情的项目，机器人定期给出项目归档建议，let it die.
- 社区任务(help wanted issues)推广
- 分析瓶颈指标，给出建议
  比如平均回复时间太长;
  比如非 Member 提的 issue 较少，说明用户少，或者用户提问不在 github ;
- 快速搭建一套 github workflow

## 使用文档

见[英文文档](README.md#usage) ，暂未翻译。

## 活跃度指标说明

![](https://user-images.githubusercontent.com/26001097/148624794-129025ba-6e05-4cef-a738-b9ee1dd90e88.png)
详见[活跃度指标设计 v2](https://github.com/seeflood/github-weekly-statistics/issues/2)
