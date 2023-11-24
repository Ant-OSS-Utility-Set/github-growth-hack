# 钉钉机器人项目接入配置教程及介绍

## 1.为什么要接入钉钉机器人

- 了解开源项目的活跃状态
- 方便处理长期闲置的issue
- 了解其他开源项目的状态

# 2.如何接入钉钉机器人

## 在configs/config.json文件中添加自己的项目

配置格式说明：config文件配置说明.md
配置完成后，请提交 PR 到 master 进行合并


## 进群接收项目通知消息
- 扫描二维码进群：

<img src="https://gw.alicdn.com/imgextra/i1/O1CN012KW7sR1tRnI8Dt1UZ_!!6000000005899-2-tps-850-722.png" width = "50%" height = "50%" alt="welcome" align=center />

- 通过链接加入群：https://qr.dingtalk.com/action/joingroup?code=v1,k1,J9w5dcHP7iVA99FhF/2TWsQy/GGNKL/YpPfMB6KolwM=&_dt_no_comment=1&origin=11


### 1. issue通知示例
<img src="https://gw.alicdn.com/imgextra/i1/O1CN01fjClZg21nKqco7C6x_!!6000000007029-0-tps-1624-492.jpg" width = "50%" height = "50%" alt="welcome" align=center />

判定规则（可以在配置文件里面进行更改）：
- 5-30天的未回复issue
- 为了防止未回复issue太多导致刷屏，限制每个项目最多只有3个issue

### 2. 活跃度通知示例
<img src="https://gw.alicdn.com/imgextra/i2/O1CN01UHqQCy1PxuXuBdpib_!!6000000001908-0-tps-1554-722.jpg" width = "50%" height = "50%" alt="welcome" align=center />

机器人会定期对所有开源项目进行“活跃度检查”，如果项目长期缺少维护、不处理舆情 issue，会被自动判定为“腐烂级”项目。

判定规则：

- 项目连续 4 周活跃度达不到 20

- 项目存在 30 天以上未回复的 issue

活跃度指标说明

 <img src="https://user-images.githubusercontent.com/26001097/158004228-3bf9b244-f64f-4017-9827-6edbd981b66d.png" width = "200%" height = "200%" alt="score" align=center />

<!-- Score = C_{issue-comment} + 2*C_{open-issue}\\
\ \ \ \ \ \ +3*C_{open-pr}+4*C_{review-comment} \\
\ \ \ \ \ \ + 2*C_{pr-merged}+ C_{watch} \\
\ \ \ \ \ \ + 2*C_{fork} + 5 *C_{new-contributors}\\
\ \ \ \ \ \ - 5* C_{issues-without-comment-for-5-days}\\
\ \ \ \ \ \ - 7* C_{issues-without-comment-for-30-days}\\ -->

详见[活跃度指标设计 v2](https://github.com/seeflood/github-growth-hack/issues/2)

### 3. 开源项目大盘

为每个项目计算活跃度，排序，生成大盘。

 <img src="grafana.png" width = "50%" height = "50%" alt="welcome" align=center />



### 4. 运营机器人

自动推广 good first issue，吸引贡献者

<img src="https://user-images.githubusercontent.com/26001097/199180613-f5fea5ba-70a8-4b99-984d-912aad487ff0.png" width = "50%" height = "50%" alt="welcome" align=center />

详见 https://github.com/mosn/layotto/issues/800

如果开启该功能，good first issue 必须满足一定的label 规范、命名规范, 详见 https://mosn.io/layotto/#/zh/development/label-spec


# 项目统计接入配置教程及介绍

## 1.接入项目统计好处

- 可以更直观的查看项目各项数据增长减少情况
- 可以查看是否有长期未恢复的issues
- 可以监控常用指标的日增长并发送钉钉告警

## 2.如何接入项目统计

- 可以根据项目进行配置，如果还需要对数据进行采集直接在对应的类型下添加项目owner即可，默认走全局的阈值配置，可以根据项目不同来单独配置波动阈值

## 3.项目统计效果

1、star数增长趋势

![](https://gw.alicdn.com/imgextra/i2/O1CN01nHumTd1lhoDMKlt8E_!!6000000004851-2-tps-1370-548.png)

2、contributor数增长趋势

![](https://gw.alicdn.com/imgextra/i2/O1CN01D07Rso1c6PKYxpFsQ_!!6000000003551-2-tps-1346-522.png)

3、pv uv 增长趋势

![](https://gw.alicdn.com/imgextra/i4/O1CN01MsOuMJ1nzmznlvQuw_!!6000000005161-2-tps-1350-554.png)

4、clone uniqueClone增长趋势

![](https://gw.alicdn.com/imgextra/i1/O1CN01PdrkFk1bBcDQga6c3_!!6000000003427-2-tps-1362-534.png)

5、阈值告警

![](https://gw.alicdn.com/imgextra/i3/O1CN01aXGNJo1XgWTwwww7Y_!!6000000002953-0-tps-1386-322.jpg)