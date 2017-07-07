const {parseLocation, parseRotation, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#keyRewards").next("table")

    const tbody = table.children()['0']

    let keyName = null
    let rotation = null

    let keys = []
    let key = null

    for(let tr of tbody.children) {
        let elem = tr.children[0]
        let text = $(elem).text()

        if(elem.name === "th") {

            tmp = parseRotation(text)

            if(tmp) {
                rotation = tmp
            } else {
                if(key) {
                    keys.push(key)
                }

                key = {keyName: text, rewards: {A: [], B: [], C:[]}}
            }
        }

        if(elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[1]
            let chance = parseChance($(chanceElem).text())

            key.rewards[rotation].push({
                itemName: text,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            })
        }
    }

    keys.push(key)

    return keys
}