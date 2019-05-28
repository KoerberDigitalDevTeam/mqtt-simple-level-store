'use strict'

const pack = require('msgpack5')()
const level = require('level')

//   , pack  = msgpack()
//   , db    = level('foo', {
//       valueEncoding: pack
//     })
//   , obj   = { my: 'obj' }

// var p = msgpack()
// console.log(p.encode(obj).toString())

// db.put('hello', obj, function(err) {
//   db.get('hello', function(err, result) {
//     console.log(result)
//     db.close()
//   })
// })

function promise(fn) {
  return new Promise((resolve, reject) => {
    fn((error, result) => {
      if (error) return reject(error)
      return resolve(result)
    })
  })
}

function getKey(packet) {
  if (! packet) throw new TypeError('Invalid packet')
  if (typeof packet.messageId !== 'number') throw new TypeError('Invalid message id')

  /* Message ID is an unsigned 16-bit number */
  return ('0000' + packet.messageId.toString(16)).substr(-4)
}


class LevelStore {
  constructor(db) {
    Object.defineProperty(this, '_db', { configurable: false, enumerable: false, value: db })
  }

  get(packet, cb) {
    if (! cb) return promise((cb) => this.get(packet, cb))

    this._db.get(getKey(packet), (error, packet) => {
      if (error) {
        /* istanbul ignore else */
        if (error.notFound) {
          return cb(null, null)
        } else {
          return cb(error)
        }
      }
      return cb(null, packet)
    })

    return this
  }

  put(packet, cb) {
    if (! cb) return promise((cb) => this.put(packet, cb))

    this._db.put(getKey(packet), packet, (error) => {
      /* istanbul ignore if */
      if (error) return cb(error)
      return cb(null, packet)
    })

    return this
  }

  del(packet, cb) {
    if (! cb) return promise((cb) => this.del(packet, cb))

    this._db.del(getKey(packet), (error) => {
      /* istanbul ignore if */
      if (error) return cb(error)
      return cb(null, packet)
    })

    return this
  }

  createStream() {
    return this._db.createValueStream()
  }

  close(cb) {
    if (! cb) return promise((cb) => this.close(cb))
    this._db.close(cb)
  }
}

module.exports = function create(location, options, cb) {
  /* Options is optional, check parameters shift */
  if (typeof options === 'function') {
    cb = options
    options = { }
  } else if (! options) {
    options = { }
  }

  /* ALWAYS use our value encoder */
  options.valueEncoding = pack

  /* Promisify this call */
  if (! cb) return promise((cb) => create(location, options, cb))

  /* Asynchronously create/open the database */
  level(location, options, (error, db) => {
    return error ? cb(error) : cb(null, new LevelStore(db))
  })
}

module.exports.LevelStore = LevelStore
