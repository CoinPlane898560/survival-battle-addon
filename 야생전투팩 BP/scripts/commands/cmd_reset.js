import { world, system } from "@minecraft/server"
import { Game, defaultGame, reloadData } from "../game/data"
import { SaveData } from "../utils/save-road"
import { reloadBotData } from "../game/bot-data"
import { disconnect } from "../game/bot-spawn"

export function ResetHandle() {
    world.sendMessage({ rawtext: [{ translate: `system.resetMessage` }] })

    system.run(() => {
        for (const player of world.getAllPlayers()) {
            player.removeTag("team-a")
            player.removeTag("team-b")
            player.removeTag("team-c")
            player.removeTag("team-d")
            player.removeTag("spectator")

            player.setGameMode("Survival")
            player.removeEffect(`invisibility`)

            player.camera.clear()

            // player.fogSetting.remove('over')
            // player.fogSetting.remove('nether')
            // player.fogSetting.remove('end')
            // player.fogSetting.remove('thirst')
            player.runCommand(`fog @s remove over`)
            player.runCommand(`fog @s remove nether`)
            player.runCommand(`fog @s remove end`)
            player.runCommand(`fog @s remove thirst`)

            player.runCommand("hud @s reset all");
        }

        SaveData('Game', defaultGame)
        SaveData('PlayerStateData', {})
        SaveData('PlayerDistanceData', {})
        SaveData('PlayerWildModeData', {})
        SaveData('PlayerBotStateData', {})
        SaveData('PlayerBotInventoryData', {})
        SaveData('PlayerBotInventorykeyList', [])
        SaveData('PlayerDeathPosData', {})

        reloadData();
        reloadBotData();
        disconnect()
    })
}