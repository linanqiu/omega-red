(function () {

  var fs = require('fs');
  // var threadsFile = fs.createWriteStream('threads.csv');
  // var commentsFile = fs.createWriteStream('comments.csv');

  var threadsFile = 'threads.csv';
  var commentsFile = 'comments.csv';

  var threadsRows = [];
  var commentsRows = [];

  var stringify = require('csv-stringify');
  var columnsThreads = ['text', 'title', 'url', 'id', 'subreddit', 'meta', 'time', 'author', 'ups', 'downs', 'authorlinkkarma', 'authorcommentkarma', 'authorisgold'];
  var stringifierThreads = stringify({
    columns: columnsThreads
  });
  stringifierThreads.on('readable', function () {
    var row = '';
    while (row = stringifierThreads.read()) {
      // threadsFile.write(row);
      if (threadsRows.length < 1000) {
        threadsRows.push(row);
      } else {
        fs.appendFileSync(threadsFile, threadsRows.join(''));
        threadsRows = [];
      }
    }
  });
  var columnsComments = ['text', 'id', 'subreddit', 'meta', 'time', 'author', 'ups', 'downs', 'authorlinkkarma', 'authorcommentkarma', 'authorisgold'];
  var stringifierComments = stringify({
    columns: columnsComments
  });
  stringifierComments.on('readable', function () {
    var row = '';
    while (row = stringifierComments.read()) {
      // commentsFile.write(row);
      if (commentsRows.length < 1000) {
        commentsRows.push(row);
      } else {
        fs.appendFileSync(commentsFile, commentsRows.join(''));
        commentsRows = [];
      }
    }
  });

  var natural = require('natural');
  var tokenizer = new natural.TreebankWordTokenizer();

  var threadCount = 0;
  var commentCount = 0;

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
      if (threadCount % 1000 === 0) {
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
      if (commentCount % 1000 === 0) {
        console.log('\t\t%d comments', commentCount);
      }
    }
  };
})();
