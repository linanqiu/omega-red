#omega-red

Aggressive (rate limit disobeying) scraper for reddit.

##Quick Start

Add in the subreddits you want to scrape into the `config.json` file. 

```js
{
  "law": {
    "law": 200,
    "legaled": 200,
    "cyberlaws": 200,
    "isthislegal": 200,
    "legalnews": 200,
    "lsat": 200
  },
  "technology": {
    "technology": 200,
    "android": 200,
    "bitcoin": 200,
    "programming": 200,
    "apple": 200
  }
}
```

Each object in the `config.json` is a "metareddit", a tag for a group of subreddits. Each of the keys of the object is a subreddit, with its value the number of threads to scrape.

In this case, I'm scraping two "meta"s, each having their own subreddits.

The scraper will try its best to approximate the number of threads specified subject to errors and length of the subreddit.

To start the scraper, run

```js
$ node omega-red.js
```

The scraper will then run.

##Nitty Gritty

###Buffering
The scraper uses a buffered write stream, meaning that writes to the disk will happen in bursts. Hence, observing file size to see progress will be inaccurate since quite a large amount of data can be cached.

###Rate Limits
Reddit will rate limit excessive queries. Hence, (increasingly towards the end of scraping) omega-red will produce error messages such as `Rate limited. Waiting 531 ms`. It uses an exponential backoff for waiting time (with maximum of 30,000ms). This is aimed at reducing the likelihood of multiple scrapers jamming the query.

###Outputs
Outputs two `.csv`s: `threads.csv` and `comments.csv`. Both CSVs have no headers. The meaning of the columns are:

####Threads

```js
['text', 'title', 'url', 'id', 'subreddit', 'meta', 'time', 'author', 'ups', 'downs', 'authorlinkkarma', 'authorcommentkarma', 'authorisgold']
```

- `text`: text of the thread
- `title`: title of the thread
- `url`: url of the thread
- `id`: unique ID of the thread
- `subreddit`: subreddit that the thread belongs to
- `meta`: meta tag assigned to the subreddit of the thread in `config.json`
- `time`: timestamp of the thread
- `author`: username of the author of the thread
- `ups`: number of ups the thread has received
- `downs`: number of downs the thread has received
- `authorlinkkarma`: the author's link karma
- `authorcommentkarma`: the author's comment karma
- `authorisgold`: `1` if the author has gold status, `0` otherwise

####Comments

```js
['text', 'id', 'subreddit', 'meta', 'time', 'author', 'ups', 'downs', 'authorlinkkarma', 'authorcommentkarma', 'authorisgold']
```

- `text`: text of the comment
- `id`: unique ID of the comment
- `subreddit`: subreddit that the thread belongs to
- `meta`: meta tag assigned to the subreddit of the thread in `config.json`
- `time`: timestamp of the thread
- `author`: username of the author of the thread
- `ups`: number of ups the thread has received
- `downs`: number of downs the thread has received
- `authorlinkkarma`: the author's link karma
- `authorcommentkarma`: the author's comment karma
- `authorisgold`: `1` if the author has gold status, `0` otherwise

All text is normalized to lower case, tokenized using a TreebankTokenizer from [natural](https://github.com/NaturalNode/natural), then joined with spaces. This results in punctuation being separated from words, a desired effect.
