const {hash, parseLocation, parseRotation, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#transientRewards").next("table")
    const tbody = table.children()['0']

    let transient = null
    let transients = []
    let rotation = null

    for (let tr of tbody.children) {
        let elem = tr.children[0]
        let text = $(elem).text()

        if (elem.name === "th") {
            let tmp = parseRotation(text)

            if (tmp) {
                rotation = tmp
            } else {
                if (transient) {
                    transient._id = hash(transient.objectiveName + transient.rewards.length)
                    transients.push(transient)
                }

                transient = {_id: null, objectiveName: text, rewards: []}
            }
        }

        if( elem.attribs.class === "blank-row") {
            rotation = null
        }

        if (elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[1]
            let chance = parseChance($(chanceElem).text())

            transient.rewards.push({
                _id: hash(text),
                rotation: rotation,
                itemName: text,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            })
        }
    }

    // push the last one too
    transient._id = hash(transient.objectiveName + transient.rewards.length)
    transients.push(transient)

    return transients
}