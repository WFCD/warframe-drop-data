const fetch = require('node-fetch')
const cheerio = require("cheerio")
const crypto = require("crypto")
const path = require("path")
const fs = require("fs")

const {formatSiteData} = require("./lib/utils.js")

const writeData = (data, key, format) => {
  console.log(`Writing... /data/${key}.json`)


  const body = {}
  body[key] = data[key]
  
  const bodyStr = JSON.stringify(body, null, format)

  fs.writeFileSync(path.resolve(__dirname, "data", `${key}.json`), bodyStr)
}

const config = {
    jsonMinify: (process.argv.indexOf("-expand") > -1) || true,
    forceRegeneration: false || (process.argv.indexOf("-force") > -1),

    dropDataUrl: "https://n8k6e2y6.ssl.hwcdn.net/repos/hnfvc0o3jnfvc873njb03enrf56.html"
}

console.log("### Warframe Drop Data\n")
console.log(`Requesting Drop Data from ${config.dropDataUrl}...\n`)

fetch(config.dropDataUrl)
  .then(async (res) => {
    const body = await res.text()
    
    console.log(`Response: ${res.status} - ${res.statusText}\n`)

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
            fs.writeFileSync(".build_status", "halt")
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
        cetusBountyRewards: require("./lib/cetusBountyRewards.js")($),
        // miscItems: require("./lib/miscItems.js")($),
        solarisBountyRewards: require("./lib/solarisBountyRewards.js")($),
        sigilByAvatar: require("./lib/sigilByAvatar.js")($),
        additionalItemByAvatar: require("./lib/additionalItemByAvatar.js")($),
    }

    const dropSiteData = formatSiteData(data)

    let date = new Date(res.headers.get("last-modified")).getTime()

    const info = {
        hash: hash,
        timestamp: (new Date().getTime()),
        modified: date
    }

    trymkdir(path.resolve(__dirname, "data"))

    let jsonFormat = config.jsonMinify ? "" : "    "

    // add to builds
    console.log("Adding build...")
    let builds = JSON.parse(fs.readFileSync(path.resolve(__dirname, "data", "builds", "builds.json")))
    if(builds.filter(build => build.hash === info.hash).length === 0)
        builds.push(info)

    console.log("Writing... /data/builds/builds.json")
    fs.writeFileSync(path.resolve(__dirname, "data", "builds", "builds.json"), JSON.stringify(builds, null, jsonFormat))

    console.log(`Writing... /data/builds/${info.hash}.json`)
    fs.writeFileSync(path.resolve(__dirname, "data", "builds", `${info.hash}.json`), JSON.stringify(data, null, jsonFormat))

    console.log("Writing... /data/all.json")
    fs.writeFileSync(path.resolve(__dirname, "data", "all.json"), JSON.stringify(data, null, jsonFormat))

    console.log("Writing... /data/all.slim.json")
    fs.writeFileSync(path.resolve(__dirname, "data", "all.slim.json"), JSON.stringify(dropSiteData, null, jsonFormat))

    console.log("Writing... /data/info.json")
    fs.writeFileSync(path.resolve(__dirname, "data", "info.json"), JSON.stringify(info, null, jsonFormat))
    
    Object.keys(data).forEach(key => { writeData(data, key, jsonFormat) })

    trymkdir(path.resolve(__dirname, `data`, `missionRewards`))

    // write structure
    for(let planet of Object.keys(data.missionRewards)) {
        for(let location of Object.keys(data.missionRewards[planet])) {
            trymkdir(path.resolve(__dirname, `data`, `missionRewards`, `${planet}`))

            console.log(`Writing... /data/missionRewards/${planet}/${location.replace(':', '')}.json`)
            let missionData = Object.assign({}, data.missionRewards[planet][location])
            missionData.planet = planet
            missionData.location = location
            fs.writeFileSync(path.resolve(__dirname, `data`, `missionRewards`, `${planet}`, `${location.replace(':', '')}.json`), JSON.stringify(missionData, null, jsonFormat))
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
    fs.writeFileSync(".build_status", "continue")
  })

function trymkdir(dir) {
    try {
        fs.mkdirSync(dir)
    } catch(ex) {
        // directory already exists, probably
    }
}
