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

  var threadCount = 0;
  var commentCount = 0;

  var natural = require('natural');
  var tokenizer = new natural.TreebankWordTokenizer();


  function sanitize(text) {
    text = text.toLowerCase();
    text = tokenizer.tokenize(text).join(' ');

    return text;
  }

  module.exports = {
    writeThread: function (entry) {
      if (entry.text === null) {
        entry.text = '';
      }
      if (entry.title === null) {
        entry.title = '';
      }
      entry.text = sanitize(entry.text);
      entry.title = sanitize(entry.title);
      stringifierThreads.write(entry);
      threadCount++;
      if(threadCount % 1000 === 0) {
        console.log('\t\t%d threads', threadCount);
      }
    },
    writeComment: function (entry) {
      if (entry.text === undefined) {
        entry.text = '';
      }
      entry.text = sanitize(entry.text);
      stringifierComments.write(entry);
      commentCount++;
      if(commentCount % 1000 === 0) {
        console.log('\t\t%d comments', commentCount);
      }
    }
  };
})();
