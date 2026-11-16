import { world, system } from "@minecraft/server";
import { Game, PlayerStateData, TEAM_DATA } from "../game/data";
import { tryVote } from "../game/vote";
import { disconnect, spawnBot } from "../game/bot-spawn";
import { SaveData } from "../utils/save-road";
import { saveInv, saveState } from "../game/bot-saveData";

export const playerChatEvent = world.beforeEvents.chatSend.subscribe(ev => {
    const sender = ev.sender;
    const msg = ev.message;

    ev.cancel = true;

    // if (msg == 'a') {
    //     system.runTimeout(() => {
    //         spawnBot(sender)
    //     }, 40)
    // }
    // if (msg == 'b') {
    //     disconnect()
    // }
    // if (msg == 'e') {
    //     const invBots = world.getDimension('overworld').getEntities({ type: 'coin:inv' })
    //     system.run(() => {
    //         saveInv(sender, invBots[0])
    //         saveState(sender)
    //         world.sendMessage(`인벤설정됨`)
    //     })
    // }
    // if (msg == 'spawn') {
    //     const invBots = world.getDimension('overworld').getEntities({ type: 'coin:inv' })
    //     if (invBots.length >= 1) {
    //         world.sendMessage(`이미 있음`)
    //     } else {
    //         system.run(() => {
    //             const entity = world.getDimension('overworld').spawnEntity('coin:inv', { x: -68, y: 67, z: -55 })
    //             entity.name = `inv-${sender.name}`
    //             world.sendMessage(`스폰됨`)
    //         })
    //     }
    // }
    // if (msg == 'f') {
    //     for (const player of world.getAllPlayers()) {
    //         world.sendMessage(`${player.getComponent("minecraft:cursor_inventory").item}`)
    //     }
    // }

    if (Game.state == "lobby") {
        world.sendMessage({ rawtext: [{ translate: `msgTitle.lobby` }, { text: ` ${sender.name} ｜ ${msg}` }] })
        return
    }

    if (Game.state == 'vote') {
        if (tryVote(sender, msg)) return
        world.sendMessage({ rawtext: [{ translate: `msgTitle.lobby` }, { text: ` ${sender.name} ｜ ${msg}` }] })
        return
    }

    if (Game.state == "end") {
        if (PlayerStateData[sender.name]) {
            const state = PlayerStateData[sender.name]
            const team = state.team

            const color = TEAM_DATA[team].color

            if (team == Game.data.winnerTeam) {
                world.sendMessage({ rawtext: [{ translate: `msgTitle.end.winer` }, { text: ` ${color}${sender.name}§f ｜ ${msg}` }] })
            } else {
                world.sendMessage({ rawtext: [{ translate: `msgTitle.end.loser` }, { text: ` ${color}${sender.name}§f ｜ ${msg}` }] })
            }
        } else {
            world.sendMessage({ rawtext: [{ translate: `msgTitle.end.spectator` }, { text: ` ${sender.name} ｜ ${msg}` }] })
        }
        return
    }

    if (Game.state == "play") {

        if (PlayerStateData[sender.name]) {
            const state = PlayerStateData[sender.name]
            const team = state.team

            const color = TEAM_DATA[team].color
            const list = Game.teamList[team]
            const name = TEAM_DATA[team].name

            const teamReader = world.getAllPlayers().filter(p => !PlayerStateData[p.name] || list.includes(p.name))

            for (const reader of teamReader) {
                reader.sendMessage(`[ §l${color}${name}§r ] ${sender.name} ｜ ${msg}`)
            }

            const enemyReader = world.getAllPlayers().filter(p => PlayerStateData[p.name] && !list.includes(p.name))

            enemyReader.forEach((player) => {
                const ex = player.location.x
                const ey = player.location.y
                const ez = player.location.z

                const px = sender.location.x
                const py = sender.location.y
                const pz = sender.location.z

                const r = Number(Math.sqrt(Math.ceil((ex - px) ** 2 + (ey - py) ** 2 + (ez - pz) ** 2)).toFixed(3))

                if (r < 16) {
                    player.sendMessage(`[ §l${color}${name}§r ] ${sender.name} ｜ ${msg}`)
                    return
                }

                if (r > 64) return

                const message = msg.split("")
                const unClearMessage = [];

                message.forEach((char) => {
                    if (Math.floor(Math.random() * 100) < (64 - r) * (100 / 48)) {
                        unClearMessage.push(char)
                    } else {
                        unClearMessage.push(`. `)
                    }

                })

                player.sendMessage(`[ §l${color}${name}§r ] ${sender.name} ｜ ${unClearMessage.join("")}`)

            })

        } else {

            const readableList = world.getAllPlayers().filter(p => !PlayerStateData[p.name])

            for (const reader of readableList) {
                reader.sendMessage({ rawtext: [{ translate: `lateGameSpectator.chatTitle` }, { text: ` ${sender.name} ｜ ${msg}` }] })
            }
        }

    }

})