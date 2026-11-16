import { world } from "@minecraft/server";
import { Game, PlayerStateData, PlayerWildModeData, PlayerDistanceData } from "./data";
import { SaveData } from "../utils/save-road";
import { semiInfo, madeInfo } from "../utils/info";

export function checkWinnerTeam() {
    let aliveTeam = [];

    for (let i = 0; i < Game.setting.teamCount; i++) {
        const checkList = Game.teamList[i]
        for (const playerName of checkList) {
            const state = PlayerStateData[playerName]

            if (!state.death) {
                aliveTeam.push(i)
                break
            }
        }
    }

    if (aliveTeam.length > 1) return

    if (aliveTeam.length == 1) {
        Game.data.winnerTeam = aliveTeam[0]
        Game.data.endTime = Date.now() + 32400000
        Game.state = 'end'

        semiInfo();
        madeInfo();

        world.getAllPlayers().map(p => p.playSound("horn.call.1"))

        SaveData('Game', Game)
        SaveData('PlayerStateData', PlayerStateData)
        SaveData('PlayerDistanceData', PlayerDistanceData)
        SaveData('PlayerWildModeData', PlayerWildModeData)
        return
    }

    if (aliveTeam.length == 0) {
        Game.data.winnerTeam = "draw"
        Game.data.endTime = Date.now() + 32400000
        Game.state = 'end'

        semiInfo();
        madeInfo();

        world.getAllPlayers().map(p => p.playSound("horn.call.1"))

        SaveData('Game', Game)
        SaveData('PlayerStateData', PlayerStateData)
        SaveData('PlayerDistanceData', PlayerDistanceData)
        SaveData('PlayerWildModeData', PlayerWildModeData)
        return
    }
}