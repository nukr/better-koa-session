'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const log = (0, _debug2.default)('koa-session3:index.js');

const defaultCookie = {
  httpOnly: false,
  path: '/',
  overwrite: true,
  signed: false,
  secure: false,
  maxAge: 24 * 60 * 60 * 1000
};

function generateToken(session, cert) {
  return new Promise((resolve, reject) => {
    _jsonwebtoken2.default.sign({ session }, cert, { algorithm: 'HS512' }, (err, token) => {
      if (err) return reject(token);
      resolve(token);
    });
  });
}

exports.default = ({ store, secret }) => {
  log('constructing middleware');
  const memorystore = Symbol();

  if (!store) {
    global[memorystore] = global[memorystore] || {};
    store = {
      get(token) {
        return global[memorystore][token];
      },

      set(token, expire, value) {
        global[memorystore][token] = value;
      }
    };
  }

  if (!secret) throw new Error('secret is required');
  return (() => {
    var ref = _asyncToGenerator(function* (context, next) {
      let token = context.cookies.get('koa.sid');
      let isAuth = token && (yield store.get(token));

      isAuth ? context.session = _jsonwebtoken2.default.decode(token).session : context.session = { authenticated: false };

      log('session in ', JSON.stringify(context.session, null, 2));

      yield next();

      // FIXME: May be not need to sign token everytime
      // compare with previous version
      token = yield generateToken(context.session, secret);
      store.set(token, 10, true);
      context.cookies.set('koa.sid', token, Object.assign({}, defaultCookie));
      log('session out', JSON.stringify(context.session, null, 2));
    });

    return function (_x, _x2) {
      return ref.apply(this, arguments);
    };
  })();
};