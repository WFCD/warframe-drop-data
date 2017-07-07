const {parseLocation, parseRotation, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#transientRewards").next("table")

    const tbody = table.children()['0']

    let name = null
    let rotation = null

    let transientRewards = []
    let curr = {}

    for(let tr of tbody.children) {
        let elem = tr.children[0]
        let text = $(elem).text()

        if(elem.name === "th") {
            let tmp = parseRotation(text)

            if(tmp) {
                rotation = tmp
            } else {
                if(name) {
                    transientRewards.push(curr)
                }

                name = text
                curr = {name: name, rewards: []}
            }
        }

        if(elem.attribs.class === "blank-row") {
            rotation = null
        }

        if(elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[1]
            let chance = parseChance($(chanceElem).text())

            curr.rewards.push({
                rotation: rotation,
                name: text,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            })
        }
    }

    transientRewards.push(curr)

    return transientRewards
}