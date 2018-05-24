const {hash, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#enemyModTables").next("table")
    const tbody = table.children()['0']

    let enemy = null
    let enemies = []

    for (let tr of tbody.children) {
        let elem = tr.children[0]
        let text = $(elem).text()

        if (elem.name === "th" && tr.children.length === 2) {
            if (enemy) {
                if (checkUnique(enemies, enemy) == true) { enemies.push(enemy) }
            }

            let moddropchance = $(tr.children[1]).text()
            moddropchance = moddropchance.slice("Mod Drop Chance: ".length, moddropchance.length - 1)

            enemy = {_id: hash(text), enemyName: text, enemyModDropChance: moddropchance, mods: []}
        }

        if (elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[2]
            let chance = parseChance($(chanceElem).text())
            let modName = $(tr.children[1]).text()

            enemy.mods.push({
                _id: hash(modName),
                modName: modName,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            })
        }
    }

    // Push the remaining item
    if (checkUnique(enemies, enemy) == true) { enemies.push(enemy) }

    return enemies
}

function checkUnique(enemies, enemy) {
    for (let item of enemies) {
        // Check for the ID to not occur twice.
        if (item._id == enemy._id) {
            // Try the most consistent stat first.
            item._id = hash(`${item.enemyName} ${item.enemyModDropChance}`)
            enemy._id = hash(`${enemy.enemyName} ${enemy.enemyModDropChance}`)

            if (item._id == enemy._id) {
                // Try the length of the collection second.
                item._id = hash(`${item.enemyName} ${item.enemyModDropChance} ${item.mods.length}`)
                enemy._id = hash(`${enemy.enemyName} ${enemy.enemyModDropChance} ${enemy.mods.length}`)

                if (item._id == enemy._id) {
                    // If all else fails, just hash the full object to make it almost guaranteed to be unique.
                    item._id = hash(JSON.stringify(item))
                    enemy._id = hash(JSON.stringify(enemy))

                    if (item._id == enemy._id) {
                        // If we hit this point, the object was already added. Bail.
                        return false
                    }
                }
            }
        }
    }

    return true
}
