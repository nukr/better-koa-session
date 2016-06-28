import Koa from 'koa'
import session from '../src'
import Redis from 'ioredis'

const app = new Koa()

let redis = new Redis()

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

app.use(session({redis_store}))
app.use(async (context, next) => {
  if (!context.session.aa) context.session.aa = 0
  context.session.aa = context.session.aa + 1
  await next()
  if (context.session.aa > 5) context.session = null
})

app.listen(3000, () => console.log('server listening port 3000'))
