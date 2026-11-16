import { world } from "@minecraft/server";
import { Game, PlayerStateData } from "../game/data";
import { SaveData } from "../utils/save-road";

export const playerLeaveEvent = world.beforeEvents.playerLeave.subscribe(ev => {
    const player = ev.player

    const state = PlayerStateData[player.name]

    // 게임중, 플레이어, 안죽음 : 나감 -> 사망처리
    if (Game.state == "play" && state && !state.death) {
        state.death = true
        state.reason = '게임을 나갔습니다.'
        state.liveTime = Game.data.currentTime

        PlayerDeathPosData[player.name] = new defaultPlayerDeathPos(player.location, player.dimension.id)

        SaveData('PlayerStateData', PlayerStateData)
        SaveData('PlayerDeathPosData', PlayerDeathPosData)
    }
})