const {hash, parseLocation, parseRotation, parseChance} = require("./utils.js")

module.exports = function($) {
    const table = $("#missionRewards").next("table")

    const tbody = table.children()['0']

    let location = null
    let rotation = null

    let missionRewards = {}

    for (let tr of tbody.children) {
        let elem = tr.children[0]
        let text = $(elem).text()

        if (elem.name === "th") {
            let tmp = parseLocation(text)

            if (tmp) {
                location = tmp

                if (!missionRewards[location.planet]) {
                    missionRewards[location.planet] = {}
                }
                
                if (missionRewards[location.planet][location.location] && location.planet == "Void") {
                    location.location += " (Extra)"
                }

                if (!missionRewards[location.planet][location.location]) {
                    missionRewards[location.planet][location.location] = {
                        gameMode: location.gameMode,
                        isEvent: location.isEvent,
                        rewards: {
                            A: [],
                            B: [],
                            C: []
                        }
                    }
                }
            } else {
                tmp = parseRotation(text)

                if (tmp) {
                    rotation = tmp
                }
            }
        }

        if (elem.name === "td" && elem.attribs.class === "blank-row") {
            rotation = null
        }

        if (elem.name === "td" && elem.attribs.class !== "blank-row") {
            let chanceElem = tr.children[1]
            let chance = parseChance($(chanceElem).text())

            let item = {
                _id: hash(text),
                itemName: text,
                rarity: chance.rarity,
                chance: Number(chance.chance)
            }

            if (!rotation) {
                if (!Array.isArray(missionRewards[location.planet][location.location].rewards))
                    missionRewards[location.planet][location.location].rewards = []

                missionRewards[location.planet][location.location].rewards.push(item)
            } else {
                if (!missionRewards[location.planet][location.location].rewards[rotation])
                    missionRewards[location.planet][location.location].rewards[rotation] = []

                missionRewards[location.planet][location.location].rewards[rotation].push(item)
            }
        }
    }

    return missionRewards
}
