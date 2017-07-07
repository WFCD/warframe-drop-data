module.exports = {
    parseLocation: function(str) {
        const locationRegex = /([A-z]*)\/([A-z]*)\s\(([A-z]*)\)/i

        let res = str.match(locationRegex)

        if(!Array.isArray(res) || res.length != 4) return null

        return {
            planet: res[1],
            location: res[2],
            gameMode: res[3]
        }
    },

    parseRotation: function(str) {
        const rotationRegex = /Rotation\s([A-D])/i

        let res = str.match(rotationRegex)

        if(!Array.isArray(res) || res.length != 2) return null

        return res[1]
    },

    parseChance: function(str) {
        const chanceRegex = /([A-z]*)\s\((.*)\%\)/i

        let res = str.match(chanceRegex)

        if(!Array.isArray(res) || res.length != 3) return null

        return {
            rarity: res[1],
            chance: res[2]
        }
    },

    parseRelic: function(str) {
        const relicRegex = /([A-z]*)\s([A-Z][0-9])\sRelic\s\(([A-z]*)\)/i

        let res = str.match(relicRegex)

        if(!Array.isArray(res) || res.length != 4) return null

        return {
            tier: res[1],
            relicName: res[2],
            state: res[3],
            rewards: []
        }
    }
}