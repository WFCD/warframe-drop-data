const {hash, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#blueprintLocations").next("table")

    const tbody = table.children()['0']

    let item = null

    let items = []

    for(let tr of tbody.children) {
        let elem = tr.children[0]
        let text = $(elem).text()

        if(elem.name === "th" && tr.children.length === 1) {
            if(item) {
                items.push(item)
            }

            item = {_id: hash(text), itemName: text, enemies: []}
        }

        if(elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[2]
            let chance = parseChance($(chanceElem).text())

            let itemdropchance = $(tr.children[1]).text()

            item.enemies.push({
                _id: hash(text),
                enemyName: text,
                ememyItemDropChance: Number(itemdropchance.slice(0, itemdropchance.length - 1)),
                rarity: chance.rarity,
                chance: Number(chance.chance)
            })
        }
    }

    // push the last one too
    items.push(item)

    return items
}
