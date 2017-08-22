const {hash, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#blueprintLocations").next("table")

    const tbody = table.children()['0']

    let blueprint = null

    let blueprints = []

    for(let tr of tbody.children) {
        let elem = tr.children[0]
        let text = $(elem).text()

        if(elem.name === "th" && tr.children.length === 1) {
            if(blueprint) {
                blueprints.push(blueprint)
            }

            blueprint = {_id: hash(text), blueprintName: text, enemies: []}
        }

        if(elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[2]
            let chance = parseChance($(chanceElem).text())

            let enemyBlueprintDropChance = $(tr.children[1]).text()

            blueprint.enemies.push({
                _id: hash(text),
                enemyName: text,
                enemyBlueprintDropChance: Number(enemyBlueprintDropChance.slice(0, enemyBlueprintDropChance.length - 1)),
                rarity: chance.rarity,
                chance: Number(chance.chance)
            })
        }
    }

    // push the last one too
    blueprints.push(blueprint)

    return blueprints
}