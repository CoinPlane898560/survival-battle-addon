import { world, system } from "@minecraft/server";
import { Game, PlayerStateData, TEAM_DATA } from "../game/data";
import { transNametoPlayer } from "../utils/support-functions";

const surrender = [
    { voter: [], baseline: 0, state: false },
    { voter: [], baseline: 0, state: false },
    { voter: [], baseline: 0, state: false },
    { voter: [], baseline: 0, state: false },
]

export function GGHandle(origin) {
    if (!origin.sourceEntity || origin.sourceEntity.typeId !== 'minecraft:player') return undefined;

    const player = origin.sourceEntity;

    if (Game.state != "play") {
        return {
            message: `command.failure.NotGameStart.Surrender`,
            status: 1
        }
    }
    if (!PlayerStateData[player.name]) {
        return {
            message: `command.failure.SpectatorUseSurrender`,
            status: 1
        }
    }

    const state = PlayerStateData[player.name]
    const team = state.team
    const teamSurrend = surrender[team]

    // 투표 올리기
    if (!teamSurrend.state) {
        teamSurrend.voter = []
        teamSurrend.baseline = 0
        teamSurrend.state = true

        for (const name of Game.teamList[team]) {
            const p = transNametoPlayer(name)
            p.sendMessage({ rawtext: [{ translate: `surrender.voteStart` }] })

            const death = PlayerStateData[name].death
            if (!death) teamSurrend.baseline++
        }

        teamSurrend.baseline = Math.ceil(teamSurrend.baseline / 2)

        let time = 400

        // 투표 자동 참가
        if (!state.death) {
            teamSurrend.voter.push(player.name)
        }

        const voteInterval = system.runInterval(() => {
            time--

            // 항복
            if (teamSurrend.voter.length >= teamSurrend.baseline) {
                world.sendMessage({ rawtext: [{ translate: `surrender.resualt.gg`, with: [`${TEAM_DATA[state.team].name}`] }] })

                for (const teamPlayer of Game.teamList[team]) {
                    const state = PlayerStateData[teamPlayer]
                    if (!state.death) {
                        state.death = true
                        state.reason = '항복했습니다.'
                        state.liveTime = Game.data.currentTime
                    }
                    transNametoPlayer(teamPlayer).setGameMode(`Spectator`)
                }

                system.clearRun(voteInterval)
                teamSurrend.state = false
                teamSurrend.voter = []
                teamSurrend.baseline = 0
            }

            // 시간 초과
            if (time < 0) {
                for (const name of Game.teamList[team]) {
                    const p = transNametoPlayer(name)
                    p.sendMessage({ rawtext: [{ translate: `surrender.resualt.cancel` }] })
                }

                system.clearRun(voteInterval)
                teamSurrend.state = false
                teamSurrend.voter = []
                teamSurrend.baseline = 0
            }
        })
        return
    }

    // 투표하기
    if (teamSurrend.state) {
        if (state.death) {
            player.sendMessage({ rawtext: [{ translate: `surrender.vote.deathCantVote` }] })
            return
        }

        if (teamSurrend.voter.includes(player.name)) {
            player.sendMessage({ rawtext: [{ translate: `surrender.vote.already` }] })
            //teamSurrend.voter.pop(player.name)
            return
        } else {
            player.sendMessage({ rawtext: [{ translate: `surrender.vote.voting` }] })
            teamSurrend.voter.push(player.name)
            return
        }
    }
}