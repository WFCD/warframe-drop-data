const {hash, addUniqueHashedObject, parseLocation, parseRotation, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#keyRewards").next("table")
    const tbody = table.children()['0']

    let keys = []
    let key = null

    let keyName = null
    let rotation = null

    for (let tr of tbody.children) {
        let elem = tr.children[0]
        let text = $(elem).text()

        if (elem.name === "th") {
            parsedRotation = parseRotation(text)

            if (parsedRotation) {
                rotation = parsedRotation
            } else {
                if (key) {
                    addUniqueHashedObject(keys, key, ["keyName", "rewards"])
                }

                key = {_id: hash(text), keyName: text, rewards: {A: [], B: [], C:[]}}
            }
        }

        if (elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[1]
            let chance = parseChance($(chanceElem).text())

            let item = {
                _id: hash(text),
                itemName: text,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            }

            addUniqueHashedObject(key.rewards[rotation], item, ["itemName", "chance"])
        }
    }

    // Push the remaining item
    addUniqueHashedObject(keys, key, ["keyName", "rewards"])

    return keys
}