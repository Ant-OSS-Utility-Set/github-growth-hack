/******************************************/
/*   TableName = github_dangerous_issues   */
/******************************************/
CREATE TABLE `github_dangerous_issues` (
  `duration` int(10) DEFAULT NULL,
  `repo` varchar(100) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `url` varchar(100) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='issues with no comment'
;
