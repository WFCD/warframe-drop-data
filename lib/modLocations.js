const {hash, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#modLocations").next("table")
    const tbody = table.children()['0']

    let mod = null
    let mods = []

    for (let tr of tbody.children) {
        let elem = tr.children[0]
        let text = $(elem).text()

        if (elem.name === "th" && tr.children.length === 1) {
            if (mod) {
                mods.push(mod)
            }

            mod = {_id: hash(text), modName: text, enemies: []}
        }

        if (elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[2]
            let chance = parseChance($(chanceElem).text())
            let enemyModDropChance = $(tr.children[1]).text()
            enemyModDropChance = Number(enemyModDropChance.slice(0, enemyModDropChance.length - 1))

            enemy = {
                _id: hash(text),
                enemyName: text,
                enemyModDropChance: enemyModDropChance,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            }

            if (checkUnique(mod.enemies, enemy)) { mod.enemies.push(enemy) }
        }
    }

    // Push the remaining item
    mods.push(mod)

    return mods
}

function checkUnique(enemies, enemy) {
    // Check for the ID to not occur twice.
    for (let item of enemies) {
        if (item._id == enemy._id) {
            item._id = hash(`${item.enemyName} ${item.enemyModDropChance}`)
            enemy._id = hash(`${enemy.enemyName} ${enemy.enemyModDropChance}`)

            if (item._id == enemy._id) {
                item._id = hash(`${item.enemyName} ${item.enemyModDropChance} ${item.chance}`)
                enemy._id = hash(`${enemy.enemyName} ${enemy.enemyModDropChance} ${item.chance}`)

                if (item._id == enemy._id) {
                    item._id = hash(JSON.stringify(item))
                    enemy._id = hash(JSON.stringify(enemy))

                    if (item._id == enemy._id) {
                        // Discard all changes and don't add the object.
                        item._id = hash(item.enemyName)
                        return false
                    }
                }
            }
        }
    }

    return true
}