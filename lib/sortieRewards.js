const {hash, parseLocation, parseRotation, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#sortieRewards").next("table")

    const tbody = table.children()['0']

    let rewards = []

    for(let tr of tbody.children) {
        let elem = tr.children[0]
        let text = $(elem).text()

        if(elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[1]
            let chance = parseChance($(chanceElem).text())

            rewards.push({
                _id: hash(text),
                itemName: text,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            })
        }
    }

    return rewards
}