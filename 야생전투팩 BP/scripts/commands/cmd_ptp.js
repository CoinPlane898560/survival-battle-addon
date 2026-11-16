import { ActionFormData } from "@minecraft/server-ui";
import { Game, TEAM_DATA } from "../game/data";

export function PTPHandle(origin) {
    if (!origin.sourceEntity || origin.sourceEntity.typeId !== 'minecraft:player') return undefined;

    const player = origin.sourceEntity;

    if (Game.state != "play") {
        return {
            message: `command.failure.NotGameStart.tpUI`,
            status: 1
        }
    }

    if (PlayerStateData[player.name]) {
        return {
            message: `command.failure.playerUseTpUI`,
            status: 1
        }
    }

    let storge = [];

    const form = new ActionFormData().title({ rawtext: [{ translate: `lateGameSpectator.tpUItitle` }] })

    for (let i = 0; i < TeamCount; i++) {
        const teamList = TEAM_DATA[i].list
        const teamName = TEAM_DATA[i].name
        const teamColor = TEAM_DATA[i].color

        teamList.forEach((name) => {
            if (world.getAllPlayers().find(p => p.name == name)) {
                form.button(`[ §l${teamColor}${teamName}§r ] ${name}`)
                storge.push(name)
            }
        })

    }
    system.run(() => {
        form.show(player).then(res => {
            if (res.canceled) return;
            const tpPlayer = transNametoPlayer(storge[res.selection])
            try {
                player.teleport(tpPlayer.location, { dimension: tpPlayer.dimension })
            } catch (err) {
                return {
                    message: `command.failure.PTPnotPlayer`,
                    status: 1
                }
            }

        })
    })
}