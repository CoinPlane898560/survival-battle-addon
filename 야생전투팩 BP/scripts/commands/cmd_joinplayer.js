import { world, system } from "@minecraft/server"
import { ModalFormData } from "@minecraft/server-ui"
import { Game } from "../game/data"

export function JoinPlayerHandle(origin) {
    const player = origin.sourceEntity

    if (Game.state == "play") {
        return {
            message: `command.failure.ChangeSettingsDuringGame`,
            status: 1
        }
    }

    const form = new ModalFormData().title({ rawtext: [{ translate: `joinplayer.ui_title` }] })

    const allplayer = world.getAllPlayers().sort((a, b) => a.name.localeCompare(b.name))

    allplayer.forEach((player) => {
        form.toggle(`${player.name} `, { defaultValue: !player.hasTag("spectator") })
    })

    system.run(() => {
        form.show(player).then(res => {
            if (res.canceled) return;

            allplayer.forEach((player, index) => {
                if (res.formValues[index]) {
                    player.removeTag("spectator");
                } else {
                    player.addTag("spectator");
                }

            })

            const spectatorPlayer = [...allplayer.filter(p => p.hasTag("spectator")).map(p => p.name)].join(", ")

            if (!spectatorPlayer) {
                world.sendMessage({ rawtext: [{ translate: `joinplayer.message2` }] })
            } else {
                world.sendMessage({ rawtext: [{ translate: `joinplayer.message` }, { text: ` ${spectatorPlayer} ` }] })
            }

        })
    })
}