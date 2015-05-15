(function () {

  var async = require('async');
  var request = require('request');

  var BASE_URL = 'http://www.reddit.com/r/SUBREDDIT/about.json';

  module.exports = function (config, externalcallback) {
    console.log('Checking config.json');

    // check valid document counts for each subreddit
    for (var meta in config) {
      for (var subreddit in config[meta]) {
        if (!Number.isInteger(config[meta][subreddit])) {
          console.error('Invalid count: %s in %s', config[meta][subreddit], meta);
          process.exit(1);
        }
      }
    }

    // check valid subreddit titles
    var metaArray = Object.keys(config);

    // for each meta tag, if any of the subreddits belongong to a meta returns a true,
    // the meta will return true and detect will call it out
    async.detect(metaArray, function (meta, outercallback) {
      var keys = Object.keys(config[meta]);

      // detect if each of the subreddits are valid
      async.detect(keys, function (key, callback) {
        request(BASE_URL.replace('SUBREDDIT', key), function (err, resp, body) {
          var respObject = JSON.parse(body);

          // valid if kind == t5
          if (respObject.kind === 't5') {
            callback(false);
          } else {
            // otherwise invalid
            callback(true);
          }
        });
      }, function (result) {
        if (result !== undefined) {
          // if result is not undefined, one of the callbacks returned true. invalid subreddit.
          console.error('Invalid subreddit: %s', result);
          outercallback(true);
        } else {
          outercallback(false);
        }
      });
    }, function (outerresult) {

      // if one of the subreddits returned true, the meta will return true. exit.
      if (outerresult !== undefined) {
        process.exit(1);
      } else {

        // otherwise, we have a valid json. 
        console.log('Valid config.json');

        // print some summary statistics
        var totalDocCount = 0;
        var totalSubCount = 0;
        for (var meta in config) {
          for (var subreddit in config[meta]) {
            totalDocCount += config[meta][subreddit];
            totalSubCount++;
          }
        }
        console.log('Sraping %d threads from %d subreddits', totalDocCount, totalSubCount);
        externalcallback();
      }
    });
  }
})();
