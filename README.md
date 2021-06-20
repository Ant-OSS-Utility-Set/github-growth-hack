# github-weekly-statistics

A tool to help you do github weekly statistics

## Usage

0. clone the repo
```
git clone https://github.com/seeflood/github-weekly-statistics.git
```

1. Modify the parameters in growth-hack/index.js as you like

```
// Modify these parameters as you like
const token = `Your Token Here`;
// since 7 days before
let since = `2021-06-12T00:32:13Z`;
// Parameters in the repos array:
// owner, repo, since, new_stars, new_contributors, new_folks
// Currently the 'new_stars','new_contributors' and 'new_folks' have to be manually counted and put into the code.
let repos = [
  ["mosn", "mosn", since, 13, 0, 1],
```

2. Run it

```
npm test
```

3. Now you have the weekly report for your repositories!
![result](result.png)
Check the generated .csv files:
![csv](csv.png)
You can open them with Excel:
![excel](excel.png)

## How is the 'score' calculated?

Based on the [formula](http://oss.x-lab.info/github-insight-report-2020.pdf) proposed by [open-digger](https://github.com/X-lab2017/open-digger),but I add a new factor "new_contributors"
![how.png](how.png)

## TODO

Currently the 'new_stars','new_contributors' and 'new_folks' have to be manually counted and put into the code.I will automate it in the future.

The design of github open-API is so bad that you can't get the diff data of 'star','contributor' and 'folk' easily.