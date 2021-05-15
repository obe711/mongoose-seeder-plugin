
const stringSeeder = require("./String/index");
const { getRandomInt } = require("./utils");


const seeder = (schema) => {

    /**
     *  
     *  - Create Seeded Docs
     * 
     * @param {integer} numberToCreate Number of documents to create
     * @returns {Array} 
     * 
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
     * - Get array of seed path schemas
     * 
     * @returns {Array} array of seed ref paths
     * 
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
     * 
     * @param {string} refName Ref Model
     * @returns {ObjectId}
     * 
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
     * 
     * @param {string} refName Ref Model
     * @param {integer} count Number of ObjectIds to return
     * @returns {Array} Array of ObjectIds
     * 
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
     * 
     * @param {integer} count Number of documents to create
     * @returns {Promise} resolves to array of new doc ids
     * 
     */

    schema.statics.seed = async function (count) {
        const seedRefPaths = await this.getSeedRefPaths();
        const docs = await this.createSeedDocs(count);
        const savedDocs = await this.create(docs);

        return Promise.all(savedDocs.map(async (docs) => {
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
            const seedRefDocs = seedRefs.reduce((acc, path, idx) => {
                return {
                    ...acc,
                    [seedRefPaths[idx].pathname]: path
                }
            }, {});

            const updated = await this.findByIdAndUpdate(docs._doc._id, seedRefDocs, { new: true });
            return updated._id;
        }));
    }
}

module.exports = seeder;