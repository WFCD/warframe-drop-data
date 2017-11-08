const {hash, parseLocation, parseRotation, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#cetusRewards").next("table")

    const tbody = table.children()['0']

    let bountyLevel = null
    let rotation = null

    let bountyRewards = []
    let bountyReward = null

    for(let tr of tbody.children) {
        let elem = tr.children[0]
        let text = $(elem).text()

        if(elem.name === "th") {

            tmp = parseRotation(text)

            if(tmp) {
                rotation = tmp
            } else {
                if(bountyReward) {
                    bountyRewards.push(bountyReward)
                }

                bountyReward = {_id: hash(text), bountyLevel: text, rewards: {A: [], B: [], C:[]}}
            }
        }

        if(elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[1]
            let chance = parseChance($(chanceElem).text())

            bountyReward.rewards[rotation].push({
                _id: hash(text),
                itemName: text,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            })
        }
    }

    bountyRewards.push(bountyReward)

    return bountyRewards
}