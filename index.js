'use strict';

var crypto = require('crypto');
var util = require('util');
var uuid = require('uuid');
var EventEmitter = require('events').EventEmitter;

// Make the key less prone to collision
var hashKey = function(key) {
  return 'leader:' + crypto.createHash('sha1').update(key).digest('hex');
};

function Leader(redis, options) {
  options = options || {};
  this.id = uuid.v4();
  this.redis = redis;
  this.options = {};
  this.options.ttl = options.ttl || 10000; // Lock time to live in milliseconds
  this.options.wait = options.wait || 1000; // time between 2 tries to get lock

  this.key = hashKey(options.key || 'default');
}

util.inherits(Leader, EventEmitter);

/**
 * Renew leader as elected
 */
Leader.prototype._renew = function _renew() {
  // it is safer to check we are still leader
  this.isLeader(function(err, isLeader) {
    if(isLeader) {
      this.redis.pexpire(this.key, this.options.ttl, function(err) {
        if(err) {
          this.emit('error', err);
        }
      }.bind(this));
    } else {
      clearInterval(this.renewId);
      this.electId = setTimeout(Leader.prototype.elect.bind(this), this.options.wait);
      this.emit('revoked');
    }
  }.bind(this));
};

/**
 * Try to get elected as leader
 */
Leader.prototype.elect = function elect() {
  // atomic redis set
  this.redis.set(this.key, this.id, 'PX', this.options.ttl, 'NX', function(err, res) {
    if(err) {
      return this.emit('error', err);
    }
    if(res !== null) {
      this.emit('elected');
      this.renewId = setInterval(Leader.prototype._renew.bind(this), this.options.ttl / 2);
    } else {
      // use setTimeout to avoid max call stack error
      this.electId = setTimeout(Leader.prototype.elect.bind(this), this.options.wait);
    }
  }.bind(this));
};

Leader.prototype.isLeader = function isLeader(done) {
  this.redis.get(this.key, function(err, id) {
    if(err) {
      return done(err);
    }
    done(null, (id === this.id));
  }.bind(this));
};

/**
 * if leader, stop being a leader
 * stop trying to be a leader
 */
Leader.prototype.stop = function stop() {
  this.isLeader(function(err, isLeader) {
    if(isLeader) {
      // possible race condition, cause we need atomicity on get -> isEqual -> delete
      this.redis.del(this.key, function(err) {
        if(err) {
          return this.emit('error', err);
        }
        this.emit('revoked');
      }.bind(this));
    }
    clearInterval(this.renewId);
    clearTimeout(this.electId);
  }.bind(this));
};

module.exports = Leader;
