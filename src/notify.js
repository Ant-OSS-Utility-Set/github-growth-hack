const sender = require("./dao/im");

sender.getImDao().sendMarkdown(
  [
    // The webhook url of your dingtalk bot. For example:
    "https://oapi.dingtalk.com/robot/send?access_token=111111",
  ],

  // Here's what you want your bot to say.
  // uid1 and uid2 is the users' id you want to @
  "@uid1 @uid2 Hi, 关于应用集成 Layotto，进展如何了呀，有遇到啥问题么？ \n",

  // The title of your message
  "title",

  // uid1 and uid2 is the users' id you want to @
  ["uid1", "uid2"],
  true
);
