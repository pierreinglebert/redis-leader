'use strict';

var assert = require('chai').assert;
var Leader = require('..');

describe('Leader', function() {

  describe('constructor', function() {
    it('should set default options', function() {
      var redis = {};
      var leader = new Leader(redis);
      assert.equal(redis, leader.redis);
      assert.isObject(leader.options);
      assert.equal(leader.options.ttl, 10000);
      assert.equal(leader.options.wait, 1000);
    });
    it('should override default options with given one', function() {
      var leader = new Leader({}, {
        key: 'lead',
        ttl: 2000,
        wait: 100
      });
      assert.isObject(leader.options);
      assert.equal(leader.options.ttl, 2000);
      assert.equal(leader.options.wait, 100);
    });
    it('should compute an id', function() {
      var leader = new Leader();
      assert.isString(leader.id);
    });
    it('should compute a lock key', function() {
      var leader = new Leader();
      assert.isString(leader.key);
    });
  });

  describe('prototype', function() {

    describe('elect', function() {
      it.skip('should elect a leader', function(done) {
        var redisMock = {
          elected: false,
          set: function(key, value) {
            var cb = arguments[arguments.length - 1];
            if(this.elected) {
              return cb(null, null);
            }
            this.elected = value;
            return cb(null, true);
          },
          get: function() {
            var cb = arguments[arguments.length - 1];
            cb(null, this.elected);
          }
        };

        var options = {
          ttl: 1000,
          wait: 100
        };
        var leader1 = {
          id: 1,
          redis: redisMock,
          key: 'testkey',
          options: options,
          emit: function() {
            this.elected = true;
          }
        };
        Leader.prototype.elect.call(leader1);

        var leader2 = {
          id: 2,
          redis: redisMock,
          key: 'testkey',
          options: options,
        };

        Leader.prototype.elect.call(leader2);

        assert.equal(redisMock.elected, 1);
        assert.isTrue(leader1.elected);
        assert.isUndefined(leader1.electId);
        assert.isNotNull(leader1.renewId);
        assert.isNotNull(leader2.electId);
        assert.isUndefined(leader2.renewId);
      });

      describe('stop', function() {
        it.skip('should not delete the lock if he isnt leader');
        it.skip('should delete the lock if hes the leader');
      });

      describe('renew', function() {
        it.skip('should not renew lock if hes not leader');
        it.skip('should renew lock if hes leader');
      });
    });
  });
});
