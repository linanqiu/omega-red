(function () {
  var reddit = require('redcarb');
  var BASE_URL = 'http://www.reddit.com/user/USERNAME/about.json';

  var request = require('request');

  var authorCache = {};

  module.exports = function (entry, callback) {
    var author = entry.author;

    if (authorCache.hasOwnProperty(author)) {
      entry.authorlinkkarma = authorCache[author].authorlinkkarma;
      entry.authorcommentkarma = authorCache[author].authorcommentkarma;
      entry.authorisgold = authorCache[author].authorisgold;
    } else {
      request(BASE_URL.replace('USERNAME', author), function (err, resp, body) {
        if (!err) {
          var isJson = true;
          try {
            var respObject = JSON.parse(body);
          } catch (e) {
            isJson = false;
          }
          if (isJson && respObject.data !== undefined) {
            entry.authorlinkkarma = respObject.data.link_karma;
            entry.authorcommentkarma = respObject.data.comment_karma;
            entry.authorisgold = respObject.data.is_gold ? 1 : 0;
            authorCache[author] = entry;
            callback(false);
          } else {
            // console.error('Author %s caused JSON parsing error', author);
            callback(true);
          }
        }
      });
    }
  }
})();
