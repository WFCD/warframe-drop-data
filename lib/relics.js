const {hash, addUniqueHashedObject, parseRelic, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#relicRewards").next("table")
    const tbody = table.children()['0']

    let relic = null
    let relics = []

    for (let tr of tbody.children) {
        let elem = tr.children[0]
        let text = $(elem).text()

        if (elem.name === "th") {
            if (relic) {
                relics.push(relic)
            }

            let parsedRelic = parseRelic(text)

            if (parsedRelic) {
                relic = parsedRelic
                relic._id = hash(`${relic.tier}_${relic.relicName}_${relic.state}`)
            }
        }

        if (elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[1]
            let chance = parseChance($(chanceElem).text())

            let reward = {
                _id: hash(text),
                itemName: text,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            }

            addUniqueHashedObject(relic.rewards, reward, ["itemName", "chance"])
        }
    }

    // Push the remaining item
    relics.push(relic)

    return relics
}