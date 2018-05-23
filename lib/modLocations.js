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
                mod._id = hash(`${mod.modName} ${mod.enemies.length}`)
                mods.push(mod)
            }

            mod = {modName: text, enemies: []}
        }

        if (elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[2]
            let chance = parseChance($(chanceElem).text())
            let enemyModDropChance = $(tr.children[1]).text()
            enemyModDropChance = Number(enemyModDropChance.slice(0, enemyModDropChance.length - 1))

            mod.enemies.push({
                _id: hash(`${text} ${enemyModDropChance} ${chance.rarity}`),
                enemyName: text,
                enemyModDropChance: enemyModDropChance,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            })
        }
    }

    // push the last one too
    mod._id = hash(`${mod.modName} ${mod.enemies.length}`)
    mods.push(mod)

    return mods
}
