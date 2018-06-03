const {hash, addUniqueHashedObject, parseLocation, parseRotation, parseChance} = require("./utils.js")

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
            let parsedRotation = parseRotation(text)

            if (parsedRotation) {
                rotation = parsedRotation
            } else {
                if (transient) {
                    transients.push(transient)
                }

                transient = {_id: hash(text), objectiveName: text, rewards: []}
            }
        }

        if (elem.attribs.class === "blank-row") {
            rotation = null
        }

        if (elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[1]
            let chance = parseChance($(chanceElem).text())

            let reward = {
                _id: hash(text),
                rotation: rotation,
                itemName: text,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            }

            addUniqueHashedObject(transient.rewards, reward, ["itemName", "rotation", "chance"])
        }
    }

    // Push the remaining item
    transients.push(transient)

    return transients
}