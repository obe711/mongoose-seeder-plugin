# mongoose-seeder-plugin

Generates seed data for mongodb database through mongoose plugin

## Installation

`npm install --save mongoose-seeder-plugin`

## Requiring

Export your schema(s) instead of the model(s).

```js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    firstName: { type: String, lowercase: true, seed: 'firstName' },
    lastName: { type: String, lowercase: true, seed: 'lastName' },
    email: { type: String, lowercase: true, seed: 'email' },
  },
  { timestamps: true }
);

module.exports = clientSchema;
```

## Setup

Add the "seed" option to each path you wish to seed.

```js
const clientSchema = new mongoose.Schema({
  firstName: { type: String, seed: 'firstName' },
});
```

### Seed Options

The seed option accepts the following values:

- **"firstName"** - Random male or female first name.
- **"lastName"** - Random last name.
- **"firstMen"** - Random male first name.
- **"firstWomen"** - Random female first name.
- **"fullName"** - Random male or female full name.
- **"phone"** - Random 10 digit phone number.
- **"email"** - Random email address.
- **"password"** - Random password.
- **"fileName"** - Random file name.
- **"pickOne"** - Select random item from array. MUST PASS 'enum' option in path.

```js
    fileType: {
        type: String,
        enum: ['application/pdf', 'application/json'],
        default: 'application/pdf',
        seed: "pickOne"
    },
```

## Seeding Refs for population

Schema type must contain 'ref' option with the value of the model you wish to populate from. The type option must equal **mongoose.Schema.Types.ObjectId**.

- For single document population pass **1** as the value of the 'refseed' option.

```js
  client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        refseed: 1,
    },
```

- For multipul documents pass an array with two numbers. This will return a random count of Object Ids ranging between them. The example below will seed between 2 to six Object Ids from the model "Client"

```js
  client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        refseed: [2, 6],
    },
```

## Example Seeder

```js
// index.js

require('dotenv').config();
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;
const opt = require('./options');

// Create mongoose connection & add seeder plugin
const conn = mongoose.createConnection(uri, opt);
conn.plugin(require('mongoose-seeder-plugin'));

// Create models
const User = conn.model('User', require('./schema/user.schema'));
const Client = conn.model('Client', require('./schema/client.schema'));
const Upload = conn.model('Upload', require('./schema/upload.schema'));

(async () => {
  // Seed 10 Users
  const users = await User.seed(10);
  console.log(users.length, 'Users added');

  // Seed 5 Clients
  const clients = await Client.seed(5);
  console.log(clients.length, 'Clients added');

  // Seed 10 Uploads
  const uploads = await Upload.seed(10);
  console.log(uploads.length, 'Uploads added');

  console.log('Seeding complete');
})();
```

```js
// user.schema.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      lowercase: true,
      seed: 'fullName',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      seed: 'email',
    },
    password: {
      type: String,
      seed: 'password',
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
      seed: 'pickOne',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = userSchema;
```

```js
// client.schema.js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    firstName: { type: String, lowercase: true, seed: 'firstName' },
    lastName: { type: String, lowercase: true, seed: 'lastName' },
    email: { type: String, lowercase: true, seed: 'email' },
  },
  { timestamps: true }
);

module.exports = clientSchema;
```

```js
// upload.schema.js
const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema(
  {
    _client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      private: true,
      privateRef: true,
      refseed: 1,
    },
    _users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        private: true,
        privateRef: true,
        refseed: [1, 5],
      },
    ],
    fileName: { type: String, trim: true, lowercase: true, seed: 'fileName' },
    fileType: {
      type: String,
      enum: ['application/pdf', 'application/json'],
      default: 'application/pdf',
      seed: 'pickOne',
    },
    fileSize: Number,
  },
  { timestamps: true }
);

module.exports = uploadSchema;
```

## Mongoose Connection Options

Example

```js
// options.js
module.exports = {
  /**
   * Connection Settings
   */
  //bufferTimeoutMS: 500,   // default 30000
  autoIndex: true, // true for dev - (false = Don't build indexes)
  dbName: 'mydb', // db to connect to
  /**
   * Tunning Settings
   */
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  poolSize: 5, // Default 5 - MAX 10?
  socketTimeoutMS: 45000, // 30000 by Default (30 seconds), you should set this to 2-3x your longest running operation
  family: 4, // Use IP4 instead of trying IP6 first
  //socketTimeoutMS: 0,
  //keepAlive: true,
  //reconnectTries: 30

  /**
   * useUnifiedTopology: true - Options
   */
  useUnifiedTopology: true,
  //
  //
  // Raise this if you get a timeout error
  serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 sec - 30000 by Default (30 seconds) -
  heartbeatFrequencyMS: 30000, //A heartbeat is subject to serverSelectionTimeoutMS
};
```
