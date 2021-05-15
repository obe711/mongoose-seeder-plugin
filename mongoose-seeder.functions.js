const mongoose = require("mongoose");
const eventDebug = require('event-debug');
const seederPlugin = require("./index");


function Seeder() {
    this.connected = false;
    this.eventLogEnabled = false;
    this._admin = null;
}

Seeder.prototype.setEventLog = function (eventLog) {
    this.eventLogEnabled = eventLog;
};

Seeder.prototype.connect = function (...params) {

    let uri, opt = {};

    if (params.length == 2) {
        uri = params[0];
        opt = params[1];
    } else if (params.length == 1) {
        uri = params[0];
        opt = {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    } else {
        uri = {};
        opt = {};
        console.error('Pass either 1 or 2 arguments to seeder.connect');
        process.exit(1);
    }

    this.conn = mongoose.createConnection(uri, opt);

    if (this.eventLogEnabled) eventDebug(this.conn, "Seeder Connection");

    this.conn.plugin(seederPlugin);

}

Seeder.prototype.loadSchemas = function (schemas) {

    this.models = {};

    for (const modelName in schemas) {
        if (Object.hasOwnProperty.call(schemas, modelName)) {
            this.models[modelName] = this.conn.model(modelName, schemas[modelName])
        }
    }

    this.setStatics(this.models);
}

Seeder.prototype.setStatics = function (models) {

    const modelName = Object.keys(models)[0];

    this.statics = models[modelName];
}

Seeder.prototype.setAdmin = function (admin) {
    this._admin = admin;
}

Seeder.prototype.start = function (options) {
    const { clear, seed } = options;
    this.conn.on("open", async () => {

        console.log("MongoDB - Connected")

        if (clear) await this.clear(clear);

        await loadDefaultAdmin(this)

        if (seed) await this.seed(seed);

        await this.conn.close();
    })
}


Seeder.prototype.clear = function (clearOption) {
    if (clearOption === "none" || clearOption === "" || clearOption === null || clearOption === 0) {
        console.log(`0 models cleared`)
        return []
    }

    if (clearOption === "ALL" || clearOption === "All") return clearAll(this);


    return this.statics.dropModel(clearOption).then(model => {
        console.log(`${model.deletedCount} cleared`)
        return model.deletedCount
    }).catch(() => {
        console.log(`Error clearing ${clearOption} - 0 cleared`)
    })
}

async function clearAll(_this) {
    console.log("\n", "Clearing ALL", "\n")
    return [...await _this.statics.dropAll()].map(model => {
        console.log(`${model.deletedCount} cleared`)
        return model.deletedCount
    })
}

async function loadDefaultAdmin(_this) {

    if (_this._admin) {
        try {
            const admin = await _this.statics.create({
                role: _this._admin.role,
                name: _this._admin.name,
                email: _this._admin.email,
                password: _this._admin.password
            });


            console.log("\n", `Default Admin ${admin.email} - loaded`)
            return admin.email
        } catch (ex) {
            return "Not saved"
        }


    }

    return "Not Set"
}

Seeder.prototype.seed = async function (models) {
    // Program Timer
    const programStartTime = new Date().getTime();
    console.log("\n", "Starting seeding", "\n");

    // Seed models
    for (const model of models) {
        await seedModel(this, model)
    }
    const programFinishTime = new Date().getTime();
    console.log("\n", `Seeding completed in ${programFinishTime - programStartTime} ms.`);

    return "complete"
}

async function seedModel(_this, model) {
    const modelName = Object.keys(model)[0]
    const startTime = new Date().getTime();
    if (_this.models.hasOwnProperty(modelName)) {
        const status = await _this.models[modelName].seed(model[modelName]);
        const endTime = new Date().getTime();
        console.log(status.length, `${modelName}s added in ${endTime - startTime} ms`);
        return status
    }

    console.log(`Error seeding ${modelName} - 0 added`);
    return []
}

Seeder.prototype.close = function () {
    this.conn.on("disconnecting", () => {
        console.log("\n", "Closing database connection", "\n")
    })

    this.conn.on("close", () => {
        console.log("\n", "MongoDB - Disconnected", "\n")
    })
}


module.exports = new Seeder();

