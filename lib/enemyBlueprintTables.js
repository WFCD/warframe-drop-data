const {hash, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#blueprintByAvatar").next("table")
    const tbody = table.children()['0']

    let enemy = null
    let enemies = []

    for (let tr of tbody.children) {
        let elem = tr.children[0]
        let text = $(elem).text()

        if (elem.name === "th" && tr.children.length === 2) {
            if (enemy) {
                enemies.push(enemy)
            }

            let itemdropchance = $(tr.children[1]).text()
            itemdropchance = itemdropchance.split(':')[1].trim().split('%')[0].trim();

            // blueprintDropChance and mods are legacy, should be removed ASAP...
            enemy = {_id: hash(text), enemyName: text, enemyItemDropChance: itemdropchance, blueprintDropChance: itemdropchance, items: [], mods: []}
        }

        if (elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[2]
            let chance = parseChance($(chanceElem).text())
            let itemName = $(tr.children[1]).text()

            // Legacy, should be removed ASAP...
            enemy.mods.push({
                _id: hash(itemName),
                modName: itemName,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            })

            enemy.items.push({
                _id: hash(itemName),
                itemName: itemName,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            })
        }
    }

    // Push the remaining item
    enemies.push(enemy)

    return enemies
}
