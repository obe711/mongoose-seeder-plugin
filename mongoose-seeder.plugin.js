
const stringSeeder = require("./String/index");
const { getRandomInt } = require("./utils");


const seeder = (schema) => {

    /**
     * 
     * - Get array of seed path schemas
     * @returns {Array} array of seed ref paths
     */
    schema.statics.getSeedPaths = function () {

        let seedPathArray = [];

        schema.eachPath((pathname, schematype) => {
            if (schematype.options.hasOwnProperty("seed")) {
                seedPathArray.push({
                    pathname,
                    seed: schematype.options.seed,
                    seedType: schema.path(pathname).options.seed,
                    seedVar: schema.path(pathname).options.hasOwnProperty("enum") ?
                        schema.path(pathname).options.enum
                        : schema.path(pathname).options.seed
                })
            }
        });

        return seedPathArray;
    }


    /**
     *  
     * - Seed and create single document
     * @param {array} seedPaths 
     * @returns {Promise<object>}
     */
    schema.statics.seedOne = async function (seedPaths) {

        const newSeed = seedPaths.reduce((acc, path) => {
            if (path.seedType === "pickOne") return {
                ...acc,
                [path.pathname]: stringSeeder[path.seedType](path.seedVar)
            }


            return {
                ...acc,
                [path.pathname]: path.seedType === "pickOne" ?
                    stringSeeder[path.seedType](path.seedVar)
                    : stringSeeder[path.seedType]()
            }
        }, {});

        return this.create(newSeed)
    }


    /**
     *  
     *  - Create Seeded Docs
     * @param {integer} numberToCreate Number of documents to create
     * @returns {Array} 
     */
    schema.statics.createSeedDocs = function (numberToCreate = 0) {

        if (numberToCreate < 1) return [];

        const seedPaths = [...
            [...Object.keys(schema.paths)
                .filter(path => schema.paths[path].options.hasOwnProperty("seed"))]
                .map(seedPath => { return { path: seedPath, seedType: schema.path(seedPath).options.seed, seedVar: schema.path(seedPath).options.hasOwnProperty("enum") ? schema.path(seedPath).options.enum : schema.path(seedPath).options.seed } })];

        return Array.from({ length: numberToCreate }, (v) => seedPaths.reduce((acc, seed) => {
            return {
                ...acc,
                [seed.path]: seed.seedType === "pickOne" ?
                    stringSeeder[seed.seedType](seed.seedVar)
                    : stringSeeder[seed.seedType]()
            }
        }, []));
    }


    /**
     * 
     * - Get array of seed ref path schemas
     * @returns {Array} array of seed ref paths
     */
    schema.statics.getSeedRefPaths = function () {

        let refseedArray = [];

        schema.eachPath((pathname, schematype) => {
            if (schematype.options.hasOwnProperty("refseed")) {
                //console.log(pathname, schematype.options.ref)
                refseedArray.push({ pathname, ref: schematype.options.ref, seed: schematype.options.refseed })
            }

            if (schematype.hasOwnProperty("caster") && schematype.caster.options.hasOwnProperty("refseed")) {
                //console.log(pathname, schematype.caster.options);
                refseedArray.push({ pathname, ref: schematype.caster.options.ref, seed: schematype.caster.options.refseed })
            }
        })

        return refseedArray

    }


    /**
     *  
     * - Get One ObjectId from ref model
     * @param {string} refName Ref Model
     * @returns {Promise<ObjectId>}
     */
    schema.statics.getOneRef = async function (refName) {
        const collectionCount = await this.db.model(refName).estimatedDocumentCount();
        const skipTo = getRandomInt(0, collectionCount - 1);

        const oneRef = await this.db.model(refName).findOne({}).skip(skipTo).limit(1).select({ _id: 1 });
        return oneRef._id;
    }


    /**
     * 
     * - Get array of Object Ids from ref model
     * @param {string} refName Ref Model
     * @param {integer} count Number of ObjectIds to return
     * @returns {Promise<Array>} Array of ObjectIds
     */
    schema.statics.getManyRef = async function (refName, count) {
        const collectionCount = await this.db.model(refName).estimatedDocumentCount();
        const skipTo = getRandomInt(0, collectionCount - 1);

        const manyRef = await this.db.model(refName).find({}).skip(skipTo).limit(count).select({ _id: 1 });
        return manyRef.map(singleRef => {
            return singleRef._id
        })
    }


    /**
     * 
     * - Seed model
     * @param {integer} count Number of documents to create
     * @returns {Promise<Array>} resolves to array of new doc ids
     */
    schema.statics.seed = async function (count) {
        const seedRefPaths = await this.getSeedRefPaths();

        // If schema contains Ref paths
        if (seedRefPaths.length > 0) {

            const docs = await this.createSeedDocs(count);

            return await Promise.all(docs.map(async (doc) => {

                // Map through seed ref paths
                const seedRefs = await Promise.all(seedRefPaths.map(path => {
                    // If Array
                    if (Array.isArray(path.seed)) {
                        return this.getManyRef(path.ref, getRandomInt(path.seed[0], path.seed[1]));
                    }
                    // If Single
                    return this.getOneRef(path.ref);
                }));


                // Create update
                const seedRefDoc = seedRefs.reduce((acc, path, idx) => {
                    return {
                        ...acc,
                        [seedRefPaths[idx].pathname]: path
                    }
                }, {});

                return this.create({ ...seedRefDoc, ...doc });
            }));
        }


        const seedPaths = await this.getSeedPaths();
        return Promise.all(Array.from({ length: count }, (v) => {

            return this.seedOne(seedPaths).then(res => res)
                .catch((ex) => {
                    console.log("Fail 1")
                    this.seedOne(seedPaths)
                })
                .catch(() => {
                    console.log("Fail 2")
                    this.seedOne(seedPaths)
                })
                .catch(() => {
                    throw new Error('Failed retrying 3 times');
                })
        }));
    }


    /**
     * 
     * - Return object of registered Models
     * @returns {object}
     */
    schema.statics.getAllModels = function () {
        return this.db.models;
    }


    /**
     * 
     * - Remove all documents from current Model
     * @returns {Promise<object>}
     */
    schema.statics.drop = async function () {
        return this.deleteMany({});
    }


    /**
     * 
     * - Remove all documents from Model name
     * @param {string} model 
     * @returns {Promise<object>}
     */
    schema.statics.dropModel = async function (model) {
        return this.model(model).deleteMany({});
    }


    /**
     * 
     * - Remove All documents from all registered Models
     * @returns {Promise<array>}
     */
    schema.statics.dropAll = async function () {
        const models = this.getAllModels();
        return Promise.all(Object.keys(models).map(modelName => {
            if (models.hasOwnProperty(modelName))
                return models[modelName].deleteMany({})

            return Promise.resolve({ n: 0, ok: 1, deletedCount: 0 });
        }))
    }
}

module.exports = seeder;