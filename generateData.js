const cheerio = require("cheerio")
const request = require("request")
const crypto = require("crypto")
const path = require("path")

const fs = require("fs")

const config = {
    jsonMinify: true,
    forceRegeneration: false || (process.argv.indexOf("-force") > -1),

    dropDataUrl: "https://n8k6e2y6.ssl.hwcdn.net/repos/hnfvc0o3jnfvc873njb03enrf56.html"
}

console.log("### Warframe Drop Data\n")
console.log(`Requesting Drop Data from ${config.dropDataUrl}...\n`)

request(config.dropDataUrl, (err, res, body) => {
    if(err) {
        console.error(err)
        return
    }

    console.log(`Response: ${res.statusCode} - ${res.statusMessage}\n`)

    const hash = crypto.createHash("md5").update(body, "utf8").digest("hex")

    console.log(`Response hash: ${hash}`)

    let oldHash = null

    if(fs.existsSync("./data/info.json")) {
        const info = require("./data/info.json")
        oldHash = info.hash

        console.log(`Old hash found: ${oldHash}`)
    }

    if(!config.forceRegeneration) {
        if(hash === oldHash) {
            // TODO: nothing new, close
            console.log("Data hasn't changed, exit process.")
            process.exit(0)
        }
    }

    const $ = cheerio.load(body)

    const data = {
        missionRewards: require("./lib/missionRewards.js")($),
        relics: require("./lib/relics.js")($),
        transientRewards: require("./lib/transientRewards.js")($),
        modLocations: require("./lib/modLocations.js")($),
        enemyModTables: require("./lib/enemyModTables.js")($),
        blueprintLocations: require("./lib/blueprintLocations.js")($),
        enemyBlueprintTables: require("./lib/enemyBlueprintTables.js")($),
        sortieRewards: require("./lib/sortieRewards.js")($),
        keyRewards: require("./lib/keyRewards.js")($),
    }

    const info = {
        hash: hash,
        timestamp: (new Date().getTime())
    }

    trymkdir(path.resolve(__dirname, "data"))

    let jsonFormat = config.jsonMinify ? "" : "    "

    console.log("Writing... /data/all.json")
    fs.writeFileSync(path.resolve(__dirname, "data", "all.json"), JSON.stringify(data, null, jsonFormat))

    console.log("Writing... /data/info.json")
    fs.writeFileSync(path.resolve(__dirname, "data", "info.json"), JSON.stringify(info, null, jsonFormat))

    // add to historic
    console.log(`Writing... /data/historic/${info.hash}_data.json`)
    fs.writeFileSync(path.resolve(__dirname, "data", "historic", `${info.hash}_data.json`), JSON.stringify(data, null, jsonFormat))

    console.log(`Writing... /data/historic/${info.hash}_info.json`)
    fs.writeFileSync(path.resolve(__dirname, "data", "historic", `${info.hash}_info.json`), JSON.stringify(info, null, jsonFormat))

    console.log("Writing... /data/missionRewards.json")
    fs.writeFileSync(path.resolve(__dirname, "data", "missionRewards.json"), JSON.stringify({missionRewards: data.missionRewards}, null, jsonFormat))

    console.log("Writing... /data/relics.json")
    fs.writeFileSync(path.resolve(__dirname, "data", "relics.json"), JSON.stringify({relics: data.relics}, null, jsonFormat))

    console.log("Writing... /data/transientRewards.json")
    fs.writeFileSync(path.resolve(__dirname, "data", "transientRewards.json"), JSON.stringify({transientRewards: data.transientRewards}, null, jsonFormat))

    console.log("Writing... /data/modLocations.json")
    fs.writeFileSync(path.resolve(__dirname, "data", "modLocations.json"), JSON.stringify({modLocations: data.modLocations}, null, jsonFormat))

    console.log("Writing... /data/enemyModTables.json")
    fs.writeFileSync(path.resolve(__dirname, "data", "enemyModTables.json"), JSON.stringify({enemyModTables: data.enemyModTables}, null, jsonFormat))

    console.log("Writing... /data/blueprintLocations.json")
    fs.writeFileSync(path.resolve(__dirname, "data", "blueprintLocations.json"), JSON.stringify({blueprintLocations: data.blueprintLocations}, null, jsonFormat))

    console.log("Writing... /data/enemyBlueprintTables.json")
    fs.writeFileSync(path.resolve(__dirname, "data", "enemyBlueprintTables.json"), JSON.stringify({enemyBlueprintTables: data.enemyBlueprintTables}, null, jsonFormat))

    console.log("Writing... /data/sortieRewards.json")
    fs.writeFileSync(path.resolve(__dirname, "data", "sortieRewards.json"), JSON.stringify({sortieRewards: data.sortieRewards}, null, jsonFormat))

    console.log("Writing... /data/keyRewards.json")
    fs.writeFileSync(path.resolve(__dirname, "data", "keyRewards.json"), JSON.stringify({keyRewards: data.keyRewards}, null, jsonFormat))

    trymkdir(path.resolve(__dirname, `data`, `missionRewards`))

    // write structure
    for(let planet of Object.keys(data.missionRewards)) {
        for(let location of Object.keys(data.missionRewards[planet])) {
            trymkdir(path.resolve(__dirname, `data`, `missionRewards`, `${planet}`))

            console.log(`Writing... /data/missionRewards/${planet}/${location}.json`)
            let missionData = Object.assign({}, data.missionRewards[planet][location])
            missionData.planet = planet
            missionData.location = location
            fs.writeFileSync(path.resolve(__dirname, `data`, `missionRewards`, `${planet}`, `${location}.json`), JSON.stringify(missionData, null, jsonFormat))
        }
    }

    // generate relics structure
    let relicStruct = {}

    for(let relic of data.relics) {
        trymkdir(path.resolve(__dirname, `data`, `relics`))
        trymkdir(path.resolve(__dirname, `data`, `relics`, `${relic.tier}`))

        if(!relicStruct[relic.tier]) {
            relicStruct[relic.tier] = {}
        }

        if(!relicStruct[relic.tier][relic.relicName]) {
            relicStruct[relic.tier][relic.relicName] = {
                tier: relic.tier,
                name: relic.relicName,
                rewards: {
                    Intact: [],
                    Exceptional: [],
                    Flawless: [],
                    Radiant: []
                }
            }
        }

        relicStruct[relic.tier][relic.relicName].rewards[relic.state] = relic.rewards
    }

    // write structure
    for(let tier of Object.keys(relicStruct)) {
        for(let relicName of Object.keys(relicStruct[tier])) {
            console.log(`Writing... /data/relics/${tier}/${relicName}.json`)
            fs.writeFileSync(path.resolve(__dirname, `data`, `relics`, `${tier}`, `${relicName}.json`), JSON.stringify(relicStruct[tier][relicName], null, jsonFormat))
        }
    }


})

function trymkdir(dir) {
    try {
        fs.mkdirSync(dir)
    } catch(ex) {
        // directory already exists, probably
    }
}