import debug from 'debug'
import uid from 'uid-safe'

const log = debug('koa-session3:index.js')
const ONEDAY = 60 * 60 * 24 * 100

const default_cookie = {
  httpOnly: true,
  path: '/',
  overwrite: true,
  signed: false,
  secure: false,
  maxAge: ONEDAY
}

// TODO: memory_store ttl
let memory_store = {
  async get (key) {
    return this[key]
  },

  async setex (key, expire, value) {
    this[key] = value
  },

  async del (key) {
    delete this[key]
  }
}

export default ({
  // params and default values
  store = memory_store,
  cookie_key = 'koa.sid',
  cookie_options = {},
  session_id_length = 18,
  session_id_generator = uid.bind(null, session_id_length),
  ttl = ONEDAY
} = {}) => {
  return async function (context, next) {
    context._session_id = context.cookies.get(cookie_key)

    if (context._session_id) {
      context.session = await store.get(context._session_id)
    }

    if (!context.session) {
      context._session_id = await session_id_generator()
      context.session = {}
    }

    log('session in ', JSON.stringify(await context.session, null, 2))

    await next()

    if (context.session === null) {
      store.del(context._session_id)
      context.cookies.set(cookie_key, null)
    } else {
      store.setex(context._session_id, ttl, context.session)
      context.cookies.set(cookie_key, context._session_id, Object.assign(cookie_options, default_cookie))
    }
    log('session out', JSON.stringify(await context.session, null, 2))
  }
}

