# github-weekly-statistics

A tool to help you do github statistics.

It can:

- generate a weekly report for the github projects you care about
- calculate an "activity score" for every project
- use the scores to rank these projects

Screenshots of the reports:

![](grafana.png)

![excel](excel.png)

## Usage

### Generate Weekly Report as Excel

0. clone the repo

```bash
git clone https://github.com/seeflood/github-weekly-statistics.git
```

1. Modify the configuration items in `src/index.js` as you like

```javascript
// Modify these configuration items as you like
// 1. Your github API token
// We use your token to invoke github graphql api to query some repo data and won't do any modification.
// see https://docs.github.com/en/graphql/guides/forming-calls-with-graphql#authenticating-with-graphql
const token = ``;

// 2. Time range.
// modify it as you like
// e.g.
// let since = `2021-06-12T00:32:13Z`;
// let since = utils.lastSunday();
// let since = `2021-10-09T00:32:13Z`;
let since = utils.sevenDaysBefore();
// let to = utils.thisFriday23_59_59();
let to = utils.today();

// 3. Which repositries do you care about?
// Parameters in the repos array are:
// owner, repo
let repos = [
  ["sofastack", "sofa-tracer"],
  ["sofastack", "sofa-rpc-node"],
```

2. Run it

```bash
# install packages
npm install
npm run week
```

3. Now you have the weekly report for your repositories!

   ![result](result.png)

   Check the generated .csv files:

   ![csv](csv.png)

   You can open them with Excel:

   ![excel](excel.png)

### Generate Weekly Report as Grafana Dashboard

To generate a Grafana Dashboard,you have to load the `report.csv` data into a MYSQL table and start a Grafana server integrated with the MYSQL table.

1. Create a MYSQL Table

```SQL
CREATE TABLE `github_repo_weekly` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `date_from` datetime DEFAULT NULL,
  `date_to` datetime DEFAULT NULL,
  `record_date` datetime DEFAULT NULL,
  `rank` int(11) NOT NULL,
  `score` int(11) DEFAULT NULL,
  `owner` varchar(40) DEFAULT NULL,
  `project` varchar(100) DEFAULT NULL,
  `new_stars` int(11) DEFAULT NULL,
  `new_contributors` int(11) DEFAULT NULL,
  `new_forks` int(11) DEFAULT NULL,
  `new_pr` int(11) DEFAULT NULL,
  `closed_pr` int(11) DEFAULT NULL,
  `new_issues` int(11) DEFAULT NULL,
  `closed_issues` int(11) DEFAULT NULL,
  `pr_comment` int(11) DEFAULT NULL,
  `issue_comment` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AVG_ROW_LENGTH=150 ROW_FORMAT=DYNAMIC COMMENT='github_repo_weekly'
;

```

2. Run a Grafana server and add the MYSQL Table as a new datasource.
   ![](add_datasource.png)

3. Set up your Grafana dashboard using the config file [grafana/dashboard.json](grafana/dashboard.json)

4. Run our script to generate Excel reports(see above).

5. Load the generated `report.csv` into the MYSQL table.
   You can use any tool you like to finish this step.
   Since I deploy MYSQL in alibaba cloud,I use the [DMS Console provided by alibaba cloud](https://dms.aliyun.com/) to load the csv data.

6. Open your Grafana Dashboard:
   ![](grafana.png)

### Generate "Monthly Active Contributors(MAC)" report as Excel

```bash
npm run month
```

## Rationale

### How is the 'score' calculated?

Based on the [formula](http://oss.x-lab.info/github-insight-report-2020.pdf) proposed by [open-digger](https://github.com/X-lab2017/open-digger),but I add a new factor "new_contributors"
![how.png](how.png)

## TODO

1. Currently the `pr_comment` number does not include the pr reviews.
