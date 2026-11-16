import { world, system, SetBookContentsFunction } from "@minecraft/server"
import { spawnSimulatedPlayer, getPlayerSkin } from "@minecraft/server-gametest"
import { PlayerBotStateData } from "./bot-data"
import { setBot } from "./bot-setData"

export function spawnBot(player) {
    system.run(() => {

        const data = PlayerBotStateData[player.name]

        //const skin = getPlayerSkin(player)
        //bot.setSkin(skin)

        const loc = data.location
        const dim = world.getDimension(data.dimensionID)

        // 스폰
        const bot = spawnSimulatedPlayer({ x: loc.x, y: loc.y, z: loc.z, dimension: dim }, `bot-${player.name}`, "Survival")

        bot.addTag('bot')
        bot.nameTag = ''

        setBot(player, bot)
    })
}

export function disconnect() {
    system.run(() => {
        for (const bot of world.getAllPlayers().filter(p => p.hasTag('bot'))) {
            bot.disconnect()
        }
    })
}