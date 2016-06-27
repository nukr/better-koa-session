import Koa from 'koa'
import session from '../src'
import Redis from 'ioredis'

const app = new Koa()

let store = new Redis()

app.use(session({store}))
app.use(async (context, next) => {
  if (!context.session.aa) context.session.aa = 0
  context.session.aa = context.session.aa + 1
  await next()
  if (context.session.aa > 5) context.session = null
})

app.listen(3000, () => console.log('server listening port 3000'))
