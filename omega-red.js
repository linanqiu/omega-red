(function () {

  var config = require('./config.json');
  var verifier = require('./verifier.js');
  var writer = require('./omega-writer.js');
  var author = require('./omega-author.js');

  var async = require('async');

  verifier(config, function () {
    var metaArray = Object.keys(config);
    async.each(metaArray, function (meta, metacallback) {
      var subArray = Object.keys(config[meta]);

      async.each(subArray, function (sub, subcallback) {
        scrapeSubreddit(meta, sub, config[meta][sub], subcallback);
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

  function scrapeSubreddit(meta, sub, count, subcallback) {
    console.log('\tStart sub:\t%s/%s', meta, sub);

    var entries = [];

    var reddit = require('redwrap');
    reddit.r(sub).all(count, function (res) {
      res.on('data', function (data, res) {
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

          entries.push(entry);
        });
      });

      res.on('error', function (e) {
        console.log(e);
        // subcallback(true);
      });

      res.on('end', function () {
        // entries.forEach(function(entry) {
        //   author(entry, function(err) {
        //     if(!err) {
        //       writer.writeThread(entry);
        //     }
        //   });
        // });
        subcallback();
        console.log('\tSub complete:\t%s/%s', meta, sub);
      });
    });
  }

  function scrapeThread(meta, sub, id, threadCallback) {
    var reddit = require('redwrap');
    reddit.comments(sub, id, function (err, data, res) {
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

      if (tempEntry.text !== undefined) {
        author(tempEntry, function (err) {
          if (!err) {
            writer.writeComment(tempEntry);
          }
        });
      }

      if (tempComment.data.replies && tempComment.data.replies.children) {
        recursiveComments(meta, sub, id, tempComment.data.replies.children);
      }
    });
  }
})();
