const {hash, parseRelic, parseChance} = require("./utils.js")

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

            let tmp = parseRelic(text)

            if (tmp) {
                relic = tmp
                relic._id = hash(`${relic.tier}_${relic.relicName}_${relic.state}`)
            }
        }

        if (elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[1]
            let chance = parseChance($(chanceElem).text())

            relic.rewards.push({
                _id: hash(text),
                itemName: text,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            })
        }
    }

    if (relic.relicName) {
      // Push the remaining item
      relics.push(relic)
    }

    return relics
}