Redis leader
===========

Leader election backed by Redis

## Requirements

  - Redis 2.6.12

## Install

```
npm install redis-leader
```

## Examples

```javascript

var Leader = require('redis-leader');

```

## API

### new Leader(redis, options)

  Create a new Leader

  `redis` is a string key identifying the lock

#### options

  `ttl` Lock time to live in milliseconds (will be automatically released after that time)

  `wait` Time between 2 tries getting elected (ms)

### stop (callback)

  Release the lock for others.

### isLeader (callback)

  Tells if he got elected.

  callback(err, true/false)

### Events

`elected` when your candidate become leader

`revoked` when your leader got revoked from his leadership

`error` when an error occurred, best is to exit your process


## How it works

It uses [setnx](http://redis.io/commands/setnx) command to try to set a semaphore with the `ttl` given in options.
 - If it succeeds, it gets elected and will renew the semaphore every `ttl/2` ms.
 - If it fails or get revoked, it tries to get elected every `wait` ms.

## License

  MIT
