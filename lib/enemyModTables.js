const {hash, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#enemyModTables").next("table")

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

            let moddropchance = $(tr.children[1]).text()

            moddropchance = moddropchance.slice("Mod Drop Chance: ".length, moddropchance.length - 1)

            enemy = {_id: hash(text), enemyName: text, ememyModDropChance: moddropchance, mods: []}
        }

        if(elem.name === "td" && elem.attribs.class !== "blank-row") {
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

    // push the last one too
    enemies.push(enemy)

    return enemies
}