# koa-session3

simple session for koa support store that following redis api


## store conventions

Store accepts value are Javascript object, if your store store data in string
you hava to implement stringify object in you store

redis for example

```javascript
import Redis from 'ioredis'

const redis = new Redis()

const redis_store = {
  async get (key) {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : value
  },
  
  setex (key, expire, value) {
    return redis.setex(key, expire, JSON.stringify(value))
  },
  
  del (key) {
    return redis.del(key)
  }
}
```
