import { world, system } from "@minecraft/server";
import {
    Game, TEAM_DATA,
    PlayerStateData, PlayerDistanceData, PlayerWildModeData,
    defaultPlayerState, defaultPlayerDistance, defaultPlayerWildMode
} from "../game/data";
import { SaveData } from "../utils/save-road";

function teamMix(PlayerList) {
    for (let i = PlayerList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [PlayerList[i], PlayerList[j]] = [PlayerList[j], PlayerList[i]];
    }

    PlayerList.forEach((player, index) => {
        const count = index % Game.setting.teamCount

        let state = PlayerStateData[player.name]

        state.team = count

        player.addTag(`${TEAM_DATA[count].tag}`);
        Game.teamList[count].push(player.name)
    })

    SaveData("Game", Game)
    SaveData("PlayerStateData", PlayerStateData)
}

function spreadPlayer(PlayerList) {
    const oneSide = 3000
    const minDistance = 300
    const tryCount = 30

    let cellSize = minDistance / Math.sqrt(2);
    const gridSide = Math.ceil(oneSide / cellSize);

    let points = []
    let active_list = []

    let grid = []

    for (let x = 0; x < gridSide; x++) {
        let row = []
        for (let y = 0; y < gridSide; y++) {
            row.push(-1)
        }
        grid.push(row)
    }

    let x = Math.floor(Math.random() * oneSide)
    let y = Math.floor(Math.random() * oneSide)

    const initial_point = [x, y]

    points.push(initial_point)
    active_list.push(initial_point)

    let grid_x = Math.floor(x / cellSize)
    let grid_y = Math.floor(y / cellSize)
    grid[grid_x][grid_y] = 0

    while (active_list.length > 0) {

        let index = Math.floor(Math.random() * active_list.length)
        let base_point = active_list[index]

        let found = false

        for (let i = 0; i < tryCount; i++) {
            let angle = Math.random() * 2 * Math.PI
            let radius = Math.random() * minDistance + minDistance

            let new_x = base_point[0] + radius * Math.cos(angle)
            let new_y = base_point[1] + radius * Math.sin(angle)

            if (new_x < 0 || new_x >= oneSide || new_y < 0 || new_y >= oneSide) continue

            let new_grid_x = Math.floor(new_x / cellSize)
            let new_grid_y = Math.floor(new_y / cellSize)

            let ok = true

            for (let j = Math.max(0, new_grid_x - 2); j < Math.min(gridSide, new_grid_x + 3); j++) {
                for (let k = Math.max(0, new_grid_y - 2); k < Math.min(gridSide, new_grid_y + 3); k++) {
                    let neighbor_idx = grid[j][k]
                    if (neighbor_idx != -1) {
                        let neighbor = points[neighbor_idx]
                        let dist_sq = (neighbor[0] - new_x) ** 2 + (neighbor[1] - new_y) ** 2
                        if (dist_sq < minDistance ** 2) {
                            ok = false
                            break
                        }
                        if (!ok) break
                    }

                }
            }
            if (ok) {
                found = true
                let new_point = [Math.floor(new_x), Math.floor(new_y)]
                points.push(new_point)
                active_list.push(new_point)
                grid[new_grid_x][new_grid_y] = points.length - 1
                break
            }
        }
        if (!found) {
            active_list.splice(index, 1)
        }
    }

    const centerX = oneSide / 2
    const centerY = oneSide / 2

    points.sort((a, b) => {
        const da = (a[0] - centerX) ** 2 + (a[1] - centerY) ** 2
        const db = (b[0] - centerX) ** 2 + (b[1] - centerY) ** 2
        return da - db
    })
    // 스폰 가능한 좌표 수
    //world.sendMessage(`${ points.length } `)
    // 지상 배치
    if (Game.setting.teamSpawn) {
        for (let tc = 0; tc < Game.setting.teamCount; tc++) {
            const point_x = points[tc][0] - (oneSide / 2) + 0.5
            const point_z = points[tc][1] - (oneSide / 2) + 0.5
            const dim = world.getDimension("overworld")

            let safey = 300
            let tpOK = false;

            const teamList = TEAM_DATA[tc].list
            const repPlayer = transNametoPlayer(teamList[0])

            const tp = system.runInterval(() => {

                if (tpOK) {
                    system.clearRun(tp);
                    SaveData("PlayerDistanceData", PlayerDistanceData)
                    return;
                }

                repPlayer.teleport({ x: point_x, y: 300, z: point_z })
                for (safey = 320; safey > -20; safey--) {
                    const block = dim.getBlock({ x: point_x, y: safey - 1, z: point_z })

                    if (block && !block.isAir) {
                        teamList.forEach((name) => {
                            const player = transNametoPlayer(name)
                            player.teleport({ x: point_x, y: safey, z: point_z })
                            PlayerDistanceData[player.name] = new defaultPlayerDistance
                        })
                        tpOK = true
                        break
                    }
                }
            })

        }
    } else {
        PlayerList.forEach((player, index) => {
            const point_x = points[index][0] - (oneSide / 2) + 0.5
            const point_z = points[index][1] - (oneSide / 2) + 0.5
            const dim = world.getDimension("overworld")
            let safey = 300
            let tpOK = false;

            let tp = system.runInterval(() => {

                if (tpOK) {
                    system.clearRun(tp);
                    SaveData("PlayerDistanceData", PlayerDistanceData)
                    return;
                }

                player.teleport({ x: point_x, y: 300, z: point_z })
                for (safey = 300; safey > -20; safey--) {
                    const block = dim.getBlock({ x: point_x, y: safey - 1, z: point_z })

                    if (block && !block.isAir) {
                        player.teleport({ x: point_x, y: safey, z: point_z })
                        PlayerDistanceData[player.name] = new defaultPlayerDistance
                        tpOK = true
                        break
                    }
                }
            })

        })

    }
}

export function StartHandle() {
    // if (!Game.data.difficult) {
    // return {
    //     message: 'command.failure.NotVoteDifficult',
    //     status: 1
    // }
    // }

    if (Game.state == "play") {
        return {
            message: 'command.failure.AlreadyStartGame',
            status: 1
        }
    }

    //인원수 부족 경고 문구
    // if (Game.setting.teamCount > world.getAllPlayers().filter(p => !p.hasTag("spectator")).length) {
    // return {
    //     message: 'command.failure.TeamCountLack',
    //     status: 1
    // }
    // }

    system.run(() => {
        Game.state = "play"

        Game.data.startTime = Date.now() + 32400000 // +32400000 는 한국 현지시간 맞추는거
        Game.data.tickTime = 0;
        //스타트 세팅
        {
            world.gameRules.pvp = true
            world.gameRules.doWeatherCycle = true
            //체력, 아이템, 배고픔 초기화
            world.getDimension('overworld').runCommand(`clear @a`)
            for (const player of world.getAllPlayers()) {
                player.addEffect("instant_health", 1, { amplifier: 255, showParticles: false });
                player.addEffect("saturation", 1, { amplifier: 255, showParticles: false });
            }
        }

        let PlayerList = []

        for (const player of world.getAllPlayers()) {
            if (!player.hasTag("spectator")) {

                PlayerStateData[player.name] = new defaultPlayerState
                player.setGameMode("Survival")
                PlayerList.push(player)

                if (Game.setting.wildMode) { PlayerWildModeData[player.name] = new defaultPlayerWildMode }

                if (Game.setting.thirdPersonLimit) { player.camera.setCamera("minecraft:first_person") }
                //if (Game.setting.renderLimit) { player.fogSetting.push(`bridge:over_view_limit`, `over`) }
                if (Game.setting.renderLimit) { player.runCommand(`fog @s push bridge:over_view_limit over`) }
            } else {
                player.setGameMode("Spectator")
                player.sendMessage({ rawtext: [{ translate: `system.startTPMessage` }] })
            }
        }

        teamMix(PlayerList);
        spreadPlayer(PlayerList);

        SaveData("Game", Game)
        SaveData("PlayerStateData", PlayerStateData)

        //팀 명단 공개
        for (let i = 0; i < Game.setting.teamCount; i++) {
            const color = TEAM_DATA[i].color
            const name = TEAM_DATA[i].name
            const list = Game.teamList[i]

            world.sendMessage(`${color}§l－－－－ << ${name} >> －－－－`)
            list.forEach((playerName, index) => {
                index % 2 === 0 ? world.sendMessage(`${playerName} `) : world.sendMessage(`§7${playerName} `)
            })
            world.sendMessage(`${color}§l－－－－－－－－－－－－－`)
        }

        system.runTimeout(() => {
            world.getDimension('overworld').runCommand("playsound horn.call.2 @a");
            world.sendMessage({ rawtext: [{ translate: `startMessage` }] })
        }, 5)

        if (Game.setting.wildMode) {
            world.getDimension('overworld').runCommand("say abc");
            world.getDimension('overworld').runCommand("hud @a hide health");
            world.getDimension('overworld').runCommand("hud @a hide hunger");
        }
    })
}