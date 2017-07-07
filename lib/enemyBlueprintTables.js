const {parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#enemyBlueprintTables").next("table")

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

            let bpdropchance = $(tr.children[1]).text()

            bpdropchance = bpdropchance.slice("Blueprint Drop Chance: ".length, bpdropchance.length - 1)

            enemy = {enemyName: text, blueprintDropChance: bpdropchance, mods: []}
        }

        if(elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[2]
            let chance = parseChance($(chanceElem).text())

            enemy.mods.push({
                modName: $(tr.children[1]).text(),
                rarity: chance.rarity,
                chance: Number(chance.chance)
            })
        }
    }

    // push the last one too
    enemies.push(enemy)

    return enemies
}