'use strict'

const del = require('del')
const expect = require('chai').expect
const mktemp = require('mktemp')
const os = require('os')
const path = require('path')

const pattern = path.join(os.tmpdir(), 'XXXXXXXXXX')

describe('Simple Level Store Test', () => {
  let temp, simple

  before(() => simple = require('../index.js'))
  before(() => mktemp.createDir(pattern)
      .then((path) => console.log(`    * Created ${temp = path}`)))

  after(() => del(temp, { force: true })
      .then((path) => console.log(`    * Removed ${path}`)))

  /* ======================================================================== */

  it('should expose a couple of constructor functions', () => {
    expect(simple).to.be.a('function')
    expect(simple.LevelStore).to.be.a('function')
  })

  it('should create a store with a callback', () => {
    return new Promise((resolve, reject) => {
      const promise = simple(path.join(temp, '1'), async (error, store) => {
        try {
          expect(error).to.be.null
          expect(store).to.be.instanceof(simple.LevelStore)
          expect(store._db.constructor.name).to.eql('LevelUP')
          await store.close()
          resolve()
        } catch (error) {
          reject(error)
        }
      })

      expect(promise).to.be.undefined
    })
  })

  it('should create a store with a promise', async () => {
    const promise = simple(path.join(temp, '2'))

    expect(promise).to.be.instanceof(Promise)

    const store = await promise
    expect(store).to.be.instanceof(simple.LevelStore)
    expect(store._db.constructor.name).to.eql('LevelUP')

    await store.close()
  })

  it('should not create create a store with an invalid path', async () => {
    return simple(path.join(temp, 'no', 'this', 'is', 'invalid'))
        .then((result) => expect.fail('Promise resolved'),
            (error) => expect(error.message).to.match(/IO error/)
        )
  })

  it('should put, get and delete a packet', async () => {
    const packet = { messageId: 12345, value: 'a simple value' }

    const store = await simple(path.join(temp, '3'))
    try {
      const packet1 = await store.get({ messageId: 12345 })
      expect(packet1).to.be.null

      const packet2 = await store.put(packet)
      expect(packet2).to.equal(packet)

      const packet3 = await store.get({ messageId: 12345 })
      expect(packet3).to.eql(packet) // same contents
      expect(packet3).to.not.equal(packet) // but not same instance

      const packet4 = await store.del(packet)
      expect(packet4).to.equal(packet)

      const packet5 = await store.get({ messageId: 12345 })
      expect(packet5).to.be.null
    } finally {
      await store.close()
    }
  })

  it('should not get a null packet', async () => {
    const store = await simple(path.join(temp, '4'))
    try {
      await store.get(false)
    } catch (error) {
      expect(error).to.be.instanceof(TypeError)
      expect(error.message).to.eql('Invalid packet')
      return
    } finally {
      await store.close()
    }

    expect.fail('No exception thrown')
  })

  it('should not get a packet without message id', async () => {
    const store = await simple(path.join(temp, '5'))
    try {
      await store.get({ messageId: false })
    } catch (error) {
      expect(error).to.be.instanceof(TypeError)
      expect(error.message).to.eql('Invalid message id')
      return
    } finally {
      await store.close()
    }

    expect.fail('No exception thrown')
  })

  it('should create a read stream', async () => {
    const store = await simple(path.join(temp, '6'))

    try {
      await store.put({ messageId: 4, body: 'fourth' })
      await store.put({ messageId: 3, body: 'third' })
      await store.put({ messageId: 2, body: 'second' })
      await store.put({ messageId: 1, body: 'first' })

      await new Promise((resolve, reject) => {
        const stream = store.createStream()
        const messages = []

        stream.on('data', (message) => messages.push(message))
        stream.on('end', () => {
          try {
            expect(messages).to.eql([
              { messageId: 1, body: 'first' },
              { messageId: 2, body: 'second' },
              { messageId: 3, body: 'third' },
              { messageId: 4, body: 'fourth' },
            ])
            resolve()
          } catch (error) {
            reject(error)
          }
        })
      })
    } finally {
      await store.close()
    }
  })
})
