const cheerio = require("cheerio")
const request = require("request")

const {missionRewards} = require("./lib/data.js")

const config = {
    json: true,
    yaml: true,

    dropDataUrl: "https://n8k6e2y6.ssl.hwcdn.net/repos/hnfvc0o3jnfvc873njb03enrf56.html"
}

console.log("### Warframe Drop Data by https://github.com/atomicptr\n")
console.log(`Requesting Drop Data from ${config.dropDataUrl}...\n`)

request(config.dropDataUrl, (err, res, body) => {
    if(err) {
        console.error(err)
        return
    }

    console.log(`Response: ${res.statusCode}\n\t${res.statusMessage}`)

    const $ = cheerio.load(body)

    const missionRewardsTable = missionRewards($)


})