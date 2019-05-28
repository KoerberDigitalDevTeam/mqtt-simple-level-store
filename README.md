MQTT.js Level Simple Store
=======================

This project implements a [`Store`](https://www.npmjs.com/package/mqtt#store)
as required by [MQTT.js](https://www.npmjs.com/package/mqtt), backed by a
simple [level](https://www.npmjs.com/package/level) database.

This is basically equivalent to the already-existing
[mqtt-level-store](https://www.npmjs.com/package/mqtt-level-store) project,
but sans the `level-sublevel` dependancy, and without double-lookups for
messages.

Usage
-----

Very simply:

```javascript
const mqtt = require('mqtt')
const simple = require('@koerber/mqtt-simple-level-store')

const outgoingStore = simple('/path/to/our/db/outgoing')
const incomingStore = simple('/somewhere/else/incoming')

const client = mqtt.connect('mqtts://some_mqtt_host:1234/', {
  outgoingStore,
  incomingStore,
  // ... other options
})
```
