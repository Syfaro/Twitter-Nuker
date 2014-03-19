var twit = require('twit')
  , fs = require('fs')
  , async = require('async');

var config = require('./config.json');

var T = new twit(config.twitter);

var keep = config.keep;

var getAllTweets = function(user, done) {
  var data = [];

  var search = function(lastId) {
    var args = {
      screen_name: user,
      count: 200,
      max_id: lastId
    };

    var onTimeline = function(err, chunk) {
      if(err) {
        console.error(err);
        return done(err);
      }

      if(data.length)
        chunk.shift();

      data = data.concat(chunk);

      var thisId = parseInt(data[data.length - 1].id_str);

      if(chunk.length)
        return search(thisId);

      return done(undefined, data);
    };

    T.get('statuses/user_timeline', args, onTimeline);
  };

  search();
};

getAllTweets('FoxAtNight', function(err, tweets) {
  var total = tweets.length;
  var i = 1;
  async.eachLimit(tweets, 20, function(tweet, done) {
    var cur = i;
    if(keep.indexOf(tweet.id_str) === -1) {
      T.post('statuses/destroy/' + tweet.id_str, function(err) {
        console.log('(%s/%s) Removed "%s"', cur, total, tweet.text);
        done(err);
      });
    } else {
      console.log('Keeping "%s"', tweet.text);
      done(undefined);
    }
    i++;
  }, function(err) {
    console.log('Done.');
  });
});
