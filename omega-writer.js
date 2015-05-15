(function () {

  var fs = require('fs');
  var threadsFile = fs.createWriteStream('threads.csv');
  var commentsFile = fs.createWriteStream('comments.csv');

  var stringify = require('csv-stringify');
  var columnsThreads = ['text', 'title', 'url', 'id', 'subreddit', 'meta', 'time', 'author', 'ups', 'downs', 'authorlinkkarma', 'authorcommentkarma', 'authorisgold'];
  var stringifierThreads = stringify({
    columns: columnsThreads
  });
  stringifierThreads.on('readable', function () {
    var row = '';
    while (row = stringifierThreads.read()) {
      threadsFile.write(row);
    }
  });
  var columnsComments = ['text', 'id', 'subreddit', 'meta', 'time', 'author', 'ups', 'downs', 'authorlinkkarma', 'authorcommentkarma', 'authorisgold'];
  var stringifierComments = stringify({
    columns: columnsComments
  });
  stringifierComments.on('readable', function () {
    var row = '';
    while (row = stringifierComments.read()) {
      commentsFile.write(row);
    }
  });

  var natural = require('natural');
  // too slow
  var tokenizer = new natural.TreebankWordTokenizer();


  function sanitize(text) {
    text = text.toLowerCase();
    text = tokenizer.tokenize(text).join(' ');

    return text;
  }

  module.exports = {
    writeThread: function (entry) {
      entry.text = sanitize(entry.text);
      stringifierThreads.write(entry);
    },
    writeComment: function (entry) {
      entry.text = sanitize(entry.text);
      stringifierComments.write(entry);
    }
  };
})();
