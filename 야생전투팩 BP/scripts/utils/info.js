import { world } from "@minecraft/server";
import { Game, TEAM_DATA, PlayerStateData } from "../game/data";
import { SaveData } from "./save-road";
import { transtime, fixedValue } from "./support-functions";


export function semiInfo() {
    const winnerTeam = TEAM_DATA[Game.data.winnerTeam].name
    const winnerTeamColor = TEAM_DATA[Game.data.winnerTeam].color

    world.sendMessage({
        rawtext: [{ text: `#§e` },
        { translate: `semiInfo.gameResult` },
        { text: `§f - ` },
        {
            translate: `${winnerTeam == "draw" ? `semiInfo.gameResult.draw` : `semiInfo.gameResult.win`}`,
            with: [`${winnerTeamColor}`, `${winnerTeam}`]
        },
        { text: ` §f(§7${transtime(Game.data.endTime - Game.data.startTime, 1)}§f)` }]
    })

    world.sendMessage(` `)

    for (let i = 0; i < Game.setting.teamCount; i++) {
        world.sendMessage(`${TEAM_DATA[i].color}----- ${TEAM_DATA[i].name} -----§f`);

        Game.teamList[i].forEach((name) => {
            const playerStateList = [];
            let state = PlayerStateData[name]

            playerStateList.push(`${name} - ( ${state.death ? `§c${state.reason}§f` : state.leave ? "§e자리를 비웠습니다.§f" : "§a생존§f"} ) ${state.death ? `${transtime(state.liveTime - Game.data.startTime, 1)} ` : ""} `)
            world.sendMessage(playerStateList.join(""))

        })

        if (i != Game.setting.teamCount - 1) {
            world.sendMessage(` `)
            world.sendMessage(`       VS`)
            world.sendMessage(` `)
        }
    }
    world.sendMessage(` `)
    world.sendMessage(` `)
}

export function madeInfo() {
    let infoList = [];

    const infoDifficultLable = { Peaceful: "평화로움", Easy: "쉬움", Normal: "보통", Hard: "어려움" }
    const Data = Game.data

    infoList.push(`야생전투 ID - ${Data.winnerTeam == "draw" ? `무승부` : `${TEAM_DATA[Data.winnerTeam].name}팀 승`}`);
    infoList.push("");
    infoList.push(`경기 날짜: ${transtime(Data.startTime, 2)} `);
    infoList.push("");
    infoList.push(`난이도 - ${infoDifficultLable[Data.difficult]}, 좌표보기 - ${Game.setting.showcoordinates ? "on" : "off"}, 버전 - ${Game.version} `);
    infoList.push("");
    infoList.push(`플레이 타임 - ${transtime(Data.startTime, 3)} ~ ${transtime(Data.endTime, 3)} (${transtime(Data.endTime - Data.startTime, 1)}) | tick: ${transtime(Data.tickTime, 1)}`)
    infoList.push("");

    for (let i = 0; i < Game.setting.teamCount; i++) {
        infoList.push(`----- ${TEAM_DATA[i].name} 팀 -----`);
        infoList.push(``);

        Game.teamList[i].forEach((name) => {
            const playerStateListForm = [];
            let state = PlayerStateData[name]

            playerStateListForm.push(`${name} - ( ${state.death ? state.reason : "생존"} ) ${state.death ? `${transtime(state.liveTime - Data.startTime, 1)} ` : ""} `)
            const dtS = state.distance.survival
            const dtSp = state.distance.spectator
            const dh = state.height

            playerStateListForm.push(`${dtS.over == 0 ? "" : "| Survival | "} `)
            playerStateListForm.push(`${dtS.over == 0 ? `` : `W: ${fixedValue(dtS.over)} / ${dh.over.max}↑ ${dh.over.min}↓`} `)
            playerStateListForm.push(`${dtS.nether == 0 ? `` : ` N: ${fixedValue(dtS.nether)} / ${dh.nether.max}↑ ${dh.nether.min}↓`} `)
            playerStateListForm.push(`${dtS.end == 0 ? `` : ` E: ${fixedValue(dtS.end)} / ${dh.end.max}↑ ${dh.end.min}↓`} `)

            if (state.death) {
                playerStateListForm.push(`${dtSp.over == 0 ? `` : `| Spectator | `} `)
                playerStateListForm.push(`${dtSp.over == 0 ? `` : `W: ${fixedValue(dtSp.over)}`} `)
                playerStateListForm.push(`${dtSp.nether == 0 ? `` : ` N: ${fixedValue(dtSp.nether)}`} `)
                playerStateListForm.push(`${dtSp.end == 0 ? `` : ` E: ${fixedValue(dtSp.end)}`} `)
            }

            infoList.push(playerStateListForm.join(""))

        })


        if (i != Game.setting.teamCount - 1) {
            infoList.push(``)
            infoList.push(`vs`)
            infoList.push(``)
        }
    }

    infoList.push(``)
    infoList.push(`특이사항: `)
    infoList.push(`MVP: `)

    Game.info = infoList

    SaveData("Game", Game)
}