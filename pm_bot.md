# 如何在钉钉群里添加“项目管理机器人”
推动别人太麻烦了，交给机器人去做吧！

“项目管理机器人”可以定时在群里发消息，使用场景包括:
- 开周会前，自动询问当事人进展
- 写周报前，自动询问当事人进展
<img src="https://user-images.githubusercontent.com/26001097/183242835-dc46c836-6f3c-48b3-9d80-ade6ebf40492.png" width = "50%" height = "50%" alt="welcome" align=center />

下面介绍配置方法

## 0. 前置条件
本地安装好了 git 和 nodejs

## 1. 在钉钉群里添加机器人
在钉钉群里，群设置 -> 智能群助手
![image](https://user-images.githubusercontent.com/26001097/195796895-66a120fa-0c79-49d1-9e31-a3c37dd5b9d6.png)
![image](https://user-images.githubusercontent.com/26001097/195797033-4cdf54ec-5493-4c8b-a4ac-58b9cf47d605.png)

选这个机器人:
![image](https://user-images.githubusercontent.com/26001097/195797128-523d247d-8e8a-40a4-a449-d3ce8b5787cc.png)

一路按提示操作，创建成功后，把 webhook 地址记录下来:
![image](https://user-images.githubusercontent.com/26001097/195797803-6ab06383-9966-43fd-a1f6-112e81e4afe3.png)

这个新加的机器人不会说话，只是对外暴露了一个接口。下面我们要下载项目，去定时调这个接口。

## 2. 下载项目
```shell
git clone https://github.com/layotto/github-growth-hack.git
```

进项目目录下:

```shell
npm install
```


修改配置文件 `src/notify.js`，具体看注释 :

![image](https://user-images.githubusercontent.com/26001097/195803061-14786769-244e-41b9-8ebb-0682213f5689.png)

## 3. 发一条消息测试一下
在项目目录下敲命令:
```shell
npm run notify
```

如果一切正常，钉钉机器人会说话


## 4. 配置定时任务
```shell
crontab -e
```

配 crontab 表达式，比如:

（记得把这下面例子里的项目路径改成你的项目路径）
```
# Wednesday morning 10:30
30 10 * * 3  cd /Users/qunli/projects/github-weekly-statistics && npm run notify

# Friday 15:33
33 15 * * 5  cd /Users/qunli/projects/github-weekly-statistics && npm run notify
```

或者这样写:
```
# Friday 15:33
33 15 * * 5  node /Users/qunli/projects/github-weekly-statistics/src/notify.js
```

写完之后保存退出。

到此，定时发消息的机器人就配置好了。