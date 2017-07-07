const {parseRelic, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#relicRewards").next("table")

    const tbody = table.children()['0']

    let relic = null

    let relics = []

    for(let tr of tbody.children) {
        let elem = tr.children[0]
        let text = $(elem).text()

        if(elem.name === "th") {

            if(relic) {
                relics.push(relic)
            }

            let tmp = parseRelic(text)

            if(tmp) {
                relic = tmp
            }
        }

        if(elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[1]
            let chance = parseChance($(chanceElem).text())

            relic.rewards.push({
                name: text,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            })
        }
    }

    // push the last one too
    relics.push(relic)

    return relics
}