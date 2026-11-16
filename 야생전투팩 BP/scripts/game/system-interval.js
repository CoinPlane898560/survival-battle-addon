import { world, system } from "@minecraft/server";

import { Game, PlayerStateData, PlayerDistanceData } from "./data";

import { checkWinnerTeam } from "./checkwin";
import { playerDistance } from "./playerDistance";
import { spectatorChangeDimension } from "./spectatorDimChange";
import { lobbyState } from "./lobby";
import { wildPlayer } from "./wildMode";
import { spectatorSpeed } from "./spectator-speed";

import { transtime } from "../utils/support-functions";
import { SaveData } from "../utils/save-road";
import { reloadData } from "./data";
import { reloadBotData } from "./bot-data";
import { ResetHandle } from "../commands/cmd_reset";

let RELOAD = false;

export const systemInterval = system.runInterval(() => {
    //변수 리로드
    if (world.getAllPlayers()[0] && !RELOAD) {
        if (world.getDynamicProperty("init") === undefined) {
            ResetHandle()
            SaveData('init', true)
        }
        RELOAD = true
        reloadData()
        reloadBotData
        return
    }

    if (!RELOAD) return;

    // 현재 시간 구하기
    Game.data.currentTime = Date.now() + 32400000

    if (Game.state == 'lobby' || Game.state == 'vote') {
        lobbyState();
        return
    }

    if (Game.state == "play") {

        checkWinnerTeam()
        Game.data.tickTime += 50;

        for (const player of world.getAllPlayers().filter(p => PlayerStateData[p.name])) {

            Game.setting.thirdPersonLimit ? player.camera.setCamera("minecraft:first_person") : player.camera.clear

            if (Game.setting.wildMode) wildPlayer(player)
            playerDistance(player)
            spectatorChangeDimension(player)
            spectatorSpeed(player)

            player.nameTag = "";

            const dis = PlayerStateData[player.name].distance
            const high = PlayerStateData[player.name].height

            if (PlayerStateData[player.name]) {
                //${transtime(Game.data.currentTime - Game.data.startTime, 1)}\n
                player.onScreenDisplay.setActionBar(`§6${transtime(Game.data.tickTime, 1)}`)
            }
        }
    }
    for (const spectator of world.getAllPlayers().filter(p => !PlayerStateData[p.name])) {
        spectator.onScreenDisplay.setActionBar({
            rawtext: [

                // 1. 게임 상태 안내
                { translate: `actionbar.lateGameSpectator.message` },

                // 2. 게임 시간 표시
                { translate: `actionbar.lateGameSpectator.timer` },
                { text: ` §6${transtime(Game.data.currentTime - Game.data.startTime, 1)} \n§f` },

                // 3. 디스코드 링크
                { translate: `actionbar.lateGameSpectator.discord` }
            ]
        })
    }

    if (Game.state != 'play') {
        world.getAllPlayers().map(p => p.nameTag = p.name)
    }

}, 1)