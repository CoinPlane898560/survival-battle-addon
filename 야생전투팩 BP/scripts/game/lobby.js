import { world } from "@minecraft/server"

export function lobbyState() {
    world.gameRules.pvp = false
    world.gameRules.commandBlockOutput = false
    world.gameRules.sendCommandFeedback = false
    world.gameRules.doWeatherCycle = false
    // world.gameRules.playerWaypoints = false 현재 안됨 수동으로 해야댐
    world.gameRules.doImmediateRespawn = true
    world.getDimension('overworld').runCommand('time set 0')
    world.getDimension('overworld').setWeather("Clear")

    const overWorld = world.getDimension("overworld");

    world.getAllPlayers().sort((a, b) => a.id - b.id).forEach((player, index, list) => {

        const Y = 10000
        let R = 2

        for (R; R * 2 * Math.PI < world.getAllPlayers().length * 2; R++);

        const angle = 2 * (index + 1) * Math.PI / world.getAllPlayers().length
        const X = R * Math.cos(angle)
        const Z = R * Math.sin(angle)

        try {
            player.teleport({ x: X, y: Y, z: Z }, { dimension: overWorld, facingLocation: { x: 0, y: Y - 0.2, z: 0 } });
        } catch { }

        const playerCount = list.filter(p => !p.hasTag("spectator")).length

        player.onScreenDisplay.setActionBar({
            rawtext: [{ text: `§a` }, { translate: `lobby.playerCount` }, { text: `§r ｜ ${playerCount} \n§9` },
            { translate: `lobby.discord` }, { text: `§r ｜ https://discord.gg/rheQ9Sp8MF` }]
        })

    })
}