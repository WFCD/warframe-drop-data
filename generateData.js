const cheerio = require("cheerio")
const request = require("request")
const crypto = require("crypto")

const fs = require("fs")

const config = {
    json: true,
    yaml: true,

    jsonMinify: true,

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

    if(hash === oldHash) {
        // TODO: nothing new, close
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
    }

    const info = {
        hash: hash,
        timestamp: (new Date().getTime())
    }

    trymkdir("./data")

    console.log(`Export to .json enabled: ${config.json ? "true" : "false"}`)

    if(config.json) {
        let jsonFormat = config.jsonMinify ? "" : "    "

        console.log("Writing... /data/all.json")
        fs.writeFileSync("./data/all.json", JSON.stringify(data, null, jsonFormat))

        console.log("Writing... /data/info.json")
        fs.writeFileSync("./data/info.json", JSON.stringify(info, null, jsonFormat))

        console.log("Writing... /data/missionRewards.json")
        fs.writeFileSync("./data/missionRewards.json", JSON.stringify({missionRewards: data.missionRewards}, null, jsonFormat))

        console.log("Writing... /data/relics.json")
        fs.writeFileSync("./data/relics.json", JSON.stringify({relics: data.relics}, null, jsonFormat))

        console.log("Writing... /data/transientRewards.json")
        fs.writeFileSync("./data/transientRewards.json", JSON.stringify({transientRewards: data.transientRewards}, null, jsonFormat))

        console.log("Writing... /data/modLocations.json")
        fs.writeFileSync("./data/modLocations.json", JSON.stringify({modLocations: data.modLocations}, null, jsonFormat))

        console.log("Writing... /data/enemyModTables.json")
        fs.writeFileSync("./data/enemyModTables.json", JSON.stringify({enemyModTables: data.enemyModTables}, null, jsonFormat))

        console.log("Writing... /data/blueprintLocations.json")
        fs.writeFileSync("./data/blueprintLocations.json", JSON.stringify({blueprintLocations: data.blueprintLocations}, null, jsonFormat))

        console.log("Writing... /data/enemyBlueprintTables.json")
        fs.writeFileSync("./data/enemyBlueprintTables.json", JSON.stringify({enemyBlueprintTables: data.enemyBlueprintTables}, null, jsonFormat))

        console.log("Writing... /data/sortieRewards.json")
        fs.writeFileSync("./data/sortieRewards.json", JSON.stringify({sortieRewards: data.sortieRewards}, null, jsonFormat))

        // generate mission structure
        let missionStruct = {}

        for(let reward of data.missionRewards) {
            trymkdir(`./data/missionRewards/`)
            trymkdir(`./data/missionRewards/${reward.planet}`)

            if(!missionStruct[reward.planet]) {
                missionStruct[reward.planet] = {}
            }

            if(!missionStruct[reward.planet][reward.location]) {
                missionStruct[reward.planet][reward.location] = {}
            }

            missionStruct[reward.planet][reward.location].planet = reward.planet
            missionStruct[reward.planet][reward.location].location = reward.location
            missionStruct[reward.planet][reward.location].gameMode = reward.gameMode

            if(!missionStruct[reward.planet][reward.location].rewards) {
                missionStruct[reward.planet][reward.location].rewards = {A: [], B: [], C: []}
            }

            missionStruct[reward.planet][reward.location].rewards[reward.rotation].push({
                itemName: reward.itemName,
                rarity: reward.rarity,
                chance: reward.chance
            })
        }

        // write structure
        for(let planet of Object.keys(missionStruct)) {
            for(let location of Object.keys(missionStruct[planet])) {
                console.log(`Writing... /data/missionRewards/${planet}/${location}.json`)
                fs.writeFileSync(`./data/missionRewards/${planet}/${location}.json`, JSON.stringify(missionStruct[planet][location], null, jsonFormat))
            }
        }

        // generate relics structure
        let relicStruct = {}

        for(let relic of data.relics) {
            trymkdir(`./data/relics/`)
            trymkdir(`./data/relics/${relic.tier}/`)

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

        console.log(relicStruct)

        // write structure
        for(let tier of Object.keys(relicStruct)) {
            for(let relicName of Object.keys(relicStruct[tier])) {
                console.log(`Writing... /data/relics/${tier}/${relicName}.json`)
                fs.writeFileSync(`./data/relics/${tier}/${relicName}.json`, JSON.stringify(relicStruct[tier][relicName], null, jsonFormat))
            }
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