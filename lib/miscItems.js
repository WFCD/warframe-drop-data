const {hash, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#miscItems").next("table")

    const tbody = table.children()['0']

    let enemy = null

    let enemies = []

    for(let tr of tbody.children) {
        let elem = tr.children[0]
        let text = $(elem).text()

        if(elem.name === "th" && tr.children.length === 2) {
            if(enemy) {
                enemies.push(enemy)
            }

            let itemdropchance = $(tr.children[1]).text()

            itemdropchance = itemdropchance.slice("Miscellaneous Drop Chance: ".length, itemdropchance.length - 1)

            enemy = {_id: hash(text), enemyName: text, ememyItemDropChance: itemdropchance, items: []}
        }

        if(elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[2]
            let chance = parseChance($(chanceElem).text())

            let itemName = $(tr.children[1]).text()

            enemy.items.push({
                _id: hash(itemName),
                itemName: itemName,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            })
        }
    }

    // push the last one too
    enemies.push(enemy)

    return enemies
}
