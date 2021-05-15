const Seeder = require("./mongoose-seeder.functions");
const config = require('../config/config');
const uri = config.mongoose.url;
const opt = config.mongoose.options;

// Connect
Seeder.connect(uri, opt);

// Schemas
const { user, client, upload } = require("../models/schema");
Seeder.loadSchemas({
    User: user,
    Client: client,
    Upload: upload
});

// Set default admin user
Seeder.setAdmin({
    role: "admin",
    name: "Web Admin",
    email: "admin@example.com",
    password: "password1"
});

// Seeder Options
const clear = "ALL";

const seed = [
    {
        User: 300,
    }, {
        Client: 1000,
    }, {
        Upload: 1000
    }
];

// Seeder Main
(async () => {
    Seeder.start({ clear, seed })
    Seeder.close();
})();
