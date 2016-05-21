import jwt from 'jsonwebtoken'
import debug from 'debug'

const log = debug('koa-session3:index.js')

const defaultCookie = {
  httpOnly: false,
  path: '/',
  overwrite: true,
  signed: false,
  secure: false,
  maxAge: 24 * 60 * 60 * 1000
}

function generateToken (session, cert) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { session },
      cert,
      { algorithm: 'HS512' },
      (err, token) => {
        if (err) return reject(token)
        resolve(token)
      }
    )
  })
}

export default ({ store, secret }) => {
  log('constructing middleware')
  const memorystore = Symbol()

  if (!store) {
    global[memorystore] = global[memorystore] || {}
    store = {
      get (token) {
        return global[memorystore][token]
      },

      set (token, expire, value) {
        global[memorystore][token] = value
      },

      options: {
        ttl: 60 * 60 * 24
      }
    }
  }

  if (!secret) throw new Error('secret is required')
  return async function (context, next) {
    let token = context.cookies.get('koa.sid')
    let isAuth = token && await store.get(token)

    isAuth
      ? context.session = jwt.decode(token).session
      : context.session = { authenticated: false }

    log('session in ', JSON.stringify(context.session, null, 2))

    await next()

    // FIXME: May be not need to sign token everytime
    // compare with previous version
    token = await generateToken(context.session, secret)
    await store.set(token, store.options.ttl, true)
    context.cookies.set('koa.sid', token, Object.assign({}, defaultCookie))
    log('session out', JSON.stringify(context.session, null, 2))
  }
}

