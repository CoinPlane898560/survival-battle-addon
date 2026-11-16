import { world } from "@minecraft/server";
import { Game, TEAM_DATA, PlayerStateData } from "../game/data";

export function TeamHandle(origin, arg) {
    if (!origin.sourceEntity || origin.sourceEntity.typeId !== 'minecraft:player') return undefined;

    if (Game.state != 'play') {
        return {
            message: 'command.failure.NotGameStart.teamList',
            status: 1
        }
    }

    const player = origin.sourceEntity;

    if (arg === "all") {
        for (let i = 0; i < Game.setting.teamCount; i++) {
            const color = TEAM_DATA[i].color
            const name = TEAM_DATA[i].name
            const list = Game.teamList[i]

            player.sendMessage(`${color}§l－－－－ << ${name} >> －－－－`)
            list.forEach((playerName) => {
                const state = PlayerStateData[playerName]
                state.death ? player.sendMessage(`§c${playerName}`) : player.sendMessage(`§a${playerName} `)
            })
            player.sendMessage(`${color}§l－－－－－－－－－－－－－`)
        }
        return
    } else {
        if (!PlayerStateData[player.name]) return

        const playerState = PlayerStateData[player.name]
        const team = playerState.team

        for (let i = 0; i < Game.setting.teamCount; i++) {
            if (team == i) {

                const color = TEAM_DATA[i].color
                const name = TEAM_DATA[i].name
                const list = Game.teamList[i]

                player.sendMessage(`${color}§l－－－－ << ${name} >> －－－－`)
                list.forEach((playerName) => {
                    const state = PlayerStateData[playerName]
                    state.death ? player.sendMessage(`§c${playerName}`) : player.sendMessage(`§a${playerName} `)
                })
                player.sendMessage(`${color}§l－－－－－－－－－－－－－`)
                return
            }
        }

        {
            const list = world.getAllPlayers().filter(p => p.hasTag("spectator"))

            player.sendMessage({ rawtext: [{ translate: `lateGameSpectator.listTitle` }] })

            list.forEach((player) => {
                player.sendMessage(`${player.name}`)
            })

            player.sendMessage({ rawtext: [{ text: `§7－－－－－－－－－－－－－－－` }] })

        }


    }
}