(function () {

  var config = require('./config.json');
  var verifier = require('./verifier.js');
  var writer = require('./omega-writer.js');
  var author = require('./omega-author.js');

  var async = require('async');

  // exponential backoff
  var waittime = 500;

  verifier(config, function () {
    var metaArray = Object.keys(config);
    async.eachSeries(metaArray, function (meta, metacallback) {
      var subArray = Object.keys(config[meta]);

      async.each(subArray, function (sub, subcallback) {
        console.log('\tStart sub:\t%s/%s', meta, sub);
        scrapeSubreddit(meta, sub, config[meta][sub], '', subcallback);
      }, function (err) {
        if (err) {
          console.error('Error in meta: %s', meta);
          metacallback(err);
        } else {
          console.log('Meta complete:\t%s', meta);
          metacallback();
        }
      });
    }, function (err) {
      if (err) {
        console.error('Error');
      } else {
        console.log('Completely done');
      }
    });
  });

  function scrapeSubreddit(meta, sub, count, after, subcallback) {
    var reddit = require('redcarb');
    if (after === null) {
      after = '';
    }

    if (count > 0) {
      reddit.r(sub).after(after).limit(100, function (err, data, res) {
        if (err) {
          // probably because rate limited
          // start exponential backoffing
          waittime = Math.min(parseInt(waittime * Math.random() * 5), 30000);
          console.error('\tRate limited. Waiting %s ms', waittime);
          setTimeout(function () {
            scrapeSubreddit(meta, sub, count, after, subcallback);
          }, waittime);
        } else {
          // reset backoff
          waittime = 500;

          var threads = data.data.children;
          threads.forEach(function (thread) {
            var entry = {
              text: thread.data.selftext,
              title: thread.data.title,
              url: thread.data.url,
              id: thread.data.id,
              subreddit: sub,
              meta: meta,
              time: thread.data.created_utc,
              author: thread.data.author,
              ups: thread.data.ups,
              downs: thread.data.downs,
              authorlinkkarma: 0,
              authorcommentkarma: 0,
              authorisgold: false
            };

            scrapeThread(meta, sub, entry.id);

            after = entry.id;

            author(entry, function (err) {
              if (!err) {
                writer.writeThread(entry);
              }
            });
          });
          // console.log(sub + ' ' + count);
          scrapeSubreddit(meta, sub, count - 100, after, subcallback);
        }
      });
    } else {
      console.log('\tSub complete:\t%s/%s', meta, sub);
      subcallback();
    }
  }

  function scrapeThread(meta, sub, id) {
    var reddit = require('redcarb');
    reddit.comments(sub, id, function (err, data, res) {
      if (err) {
        // probably because rate limited
        // start exponential backoffing
        waittime = Math.min(parseInt(waittime * Math.random() * 5), 30000);
        console.error('\tRate limited. Waiting %s ms', waittime);
        setTimeout(function () {
          scrapeThread(meta, sub, id);
        }, waittime);
      } else {
        //reset exponential backoff
        waittime = 500;

        var comments = data;
        if (comments !== null && comments[0].data.children !== null) {
          var op = comments[0].data.children[0];
          var entry = {
            text: op.data.selftext,
            id: op.data.id,
            subreddit: sub,
            meta: meta,
            time: op.data.created_utc,
            author: op.data.author,
            ups: op.data.ups,
            downs: op.data.downs,
            authorlinkkarma: 0,
            authorcommentkarma: 0,
            authorisgold: false
          };

          author(entry, function (err) {
            if (!err) {
              writer.writeComment(entry);
            }
          });

          recursiveComments(meta, sub, id, comments[1].data.children);
        }
      }
    });
  }

  function recursiveComments(meta, sub, id, tempComments) {
    tempComments.forEach(function (tempComment) {
      var tempEntry = {
        text: tempComment.data.body,
        id: tempComment.data.id,
        subreddit: sub,
        meta: meta,
        time: tempComment.data.created_utc,
        author: tempComment.data.author,
        ups: tempComment.data.ups,
        downs: tempComment.data.downs,
        authorlinkkarma: 0,
        authorcommentkarma: 0,
        authorisgold: false
      };

      author(tempEntry, function (err) {
        if (!err) {
          writer.writeComment(tempEntry);
        }
      });

      if (tempComment.data.replies && tempComment.data.replies.children) {
        recursiveComments(meta, sub, id, tempComment.data.replies.children);
      }
    });
  }
})();
