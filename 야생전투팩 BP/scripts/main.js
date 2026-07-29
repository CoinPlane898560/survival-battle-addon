import { world, system, CommandPermissionLevel, EntityComponentTypes, CustomCommandParamType } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { getDeathReason } from "./deathReason"
import { CommandRegistry } from "./commands/commandRegistry";

// -------------- 게임 세팅들 --------------
let showcoordinates = false;
let thirdPersonLimit = false;
let renderLimit = false;
let teamSpawn = false;
let TeamCount = 2;
let survivalMode = false;

let GAME_START = false;
let GAME_END = false;

let infoList = [];

let winnerTeam = null;
let winnerTeamColor = null;

let tickTime = 0;
let startTime = null;
let endTime = null;
let currentTime = null;


//----------------------

export let Game = {
    version: "v26.33",

    setting: {
        showcoordinates: false,
        thirdPersonLimit: false,
        renderLimit: false,
        teamSpawn: false,
        teamCount: 2,
        survivalMode: false
    },

    state: 'lobby',

    info: {
        tickTime: 0,
        startTime: 0,
        endTime: 0,
        currentTime: 0,
        winnerTeam: 0,
        difficult: null
    },

    teamList: {
        A: [],
        B: [],
        C: [],
        D: []
    }
}

const TeamData = [
    { name: "A", color: "§c", tag: "team-a" },
    { name: "B", color: "§6", tag: "team-b" },
    { name: "C", color: "§e", tag: "team-c" },
    { name: "D", color: "§a", tag: "team-d" }
]

class defaultPlayerState {
    constructor() {
        this.distance = {
            x: 0,
            z: 0,
            dim: 0,
            ground: false
        }
        this.state = {
            team: null,
            reason: null,
            death: false,
            liveTime: 0,
            distance: {
                survival: { over: 0, nether: 0, end: 0 },
                spectator: { over: 0, nether: 0, end: 0 }
            },
            height: {
                over: { max: -64, min: 320 },
                nether: { max: -64, min: 320 },
                end: { max: -64, min: 320 }
            }
        }
        this.survivalState = null
    }
}

const defaultSurvivalState = {
    score: 0,
    hungerScore: 0,
    beforeHunger: 20,
    zh_score: 0,
    zh_value: 0,
    zh_endTimer: 0,
    thirst: 40,
    exhaustion: 0,
    startBoost: true,
    fog: false,
    runCool: 0,
    runTick: 0
}

let PlayerDataList = {}
//PlayerDataList['a'] = new defaultPlayerState

const StateList = new Map();
const SurvivalStateList = new Map();
const PlayerDistanceList = new Map();

function createDistance(player) {
    return {
        x: player.location.x, z: player.location.z,
        dim: player.dimension.id,
        ground: false,
    };
}

function createSurvivalState() {
    return {
        score: 0,
        hungerScore: 0,
        beforeHunger: 20,
        zh_score: 0,
        zh_value: 0,
        zh_endTimer: 0,
        thirst: 40,
        exhaustion: 0,
        startBoost: true,
        fog: false,
        runCool: 0,
        runTick: 0
    };
}

const verson = "v1.21.131";

function createState() {
    return {
        team: null,
        reason: null,
        death: false,
        leave: false,
        liveTime: 0,
        distance: {
            survival: { over: 0, nether: 0, end: 0 },
            spectator: { over: 0, nether: 0, end: 0 }
        },
        height: {
            over: { max: 0, min: 320 },
            nether: { max: 0, min: 320 },
            end: { max: 0, min: 320 }
        }
    };
}

let PlayerList = [];

let TeamAList = [];
let TeamBList = [];
let TeamCList = [];
let TeamDList = [];

const TEAM_DATA = [
    { name: "A", color: "§c", tag: "team-a", list: TeamAList },
    { name: "B", color: "§6", tag: "team-b", list: TeamBList },
    { name: "C", color: "§e", tag: "team-c", list: TeamCList },
    { name: "D", color: "§a", tag: "team-d", list: TeamDList }
]


let OP = null;
let RealOP = null;

let RELOAD = false;

function transtime(t, mode) {
    const time = new Date(t)
    const yy = time.getFullYear()
    const mn = time.getMonth() + 1
    const dd = time.getDate()
    const hh = time.getHours().toString().padStart(2, "00")
    const mm = time.getMinutes().toString().padStart(2, "00")
    const ss = time.getSeconds().toString().padStart(2, "00")

    if (mode == 1) { return (`${hh}:${mm}:${ss}`) }

    if (mode == 2) { return (`${yy}년 ${mn}월 ${dd}일`) }

    if (mode == 3) { return (`${hh}시 ${mm}분 ${ss}초`) }

}

function transNametoPlayer(name) {
    return world.getAllPlayers().find(p => p.name === name)
}

function reloadValue() {
    RealOP = transNametoPlayer(getValue("RealOP"))
    //    게임 상태
    GAME_START = getValue("GAME_START");
    GAME_END = getValue("GAME_END");

    startTime = getValue("startTime");
    endTime = getValue("endTime")
    tickTime = getValue("tickTime");

    //    게임 설정
    showcoordinates = getValue("showcoordinates");
    thirdPersonLimit = getValue("thirdPersonLimit");
    renderLimit = getValue("renderLimit");
    teamSpawn = getValue("teamSpawn");
    survivalMode = getValue("survivalMode");
    TeamCount = getValue("TeamCount");
    finllyDifficultVote = getValue("difficultVote");

    // 리스트 & 객체 변환
    JSONGetToSetValue(PlayerList, "PlayerList")
    JSONGetToSetValue(TeamAList, "TeamAList")
    JSONGetToSetValue(TeamBList, "TeamBList")
    JSONGetToSetValue(TeamCList, "TeamCList")
    JSONGetToSetValue(TeamDList, "TeamDList")
    JSONGetToSetValue(infoList, "infoList")

    loadAllStates()
    loadAllDistance()
    loadAllSurvivalStates()

    for (const player of world.getAllPlayers()) {
        thirdPersonLimit ? player.camera.setCamera("minecraft:first_person") : player.camera.clear
    }
}


// ---------------- 관전 설정 UI 함수 ----------------

// ---------------- 투표 UI 함수 ----------------

let voteResult = {
    peaceful: 0,
    easy: 0,
    normal: 0,
    hard: 0,
};

const difficultLabel = [
    "Peaceful",
    "Easy",
    "Normal",
    "Hard"
];

let finllyDifficultVote = null;

function difficultVoteUI() {
    if (GAME_START) {
        OP.sendMessage({ rawtext: [{ translate: `error.VoteDuringGame` }] })
        return
    }

    world.getAllPlayers().filter(p => !p.hasTag("spectator")).map(p => p.addTag("voter"));
    const voter = world.getAllPlayers().filter(p => p.hasTag("voter"));

    voteResult = {
        Peaceful: 0,
        Easy: 0,
        Normal: 0,
        Hard: 0,
    };

    world.sendMessage({ rawtext: [{ translate: `system.vote.start` }] });

    let timer = 0;

    const form = new ActionFormData().title({ rawtext: [{ translate: `vote.ui.title` }] })
        .button({ rawtext: [{ translate: `peaceful` }] })
        .button({ rawtext: [{ translate: `easy` }] })
        .button({ rawtext: [{ translate: `normal` }] })
        .button({ rawtext: [{ translate: `hard` }] })

    for (const Voter of voter) {
        const showUI = system.runInterval(() => {
            timer++;

            if (!Voter.hasTag("voter") || timer > 400) {
                system.clearRun(showUI);
            }

            form.show(Voter).then(res => {
                if (res.canceled || !Voter.hasTag("voter") || timer > 400) return;
                Voter.removeTag("voter");

                const selectDifficult = `${difficultLabel[res.selection]}`

                voteResult[selectDifficult]++
            })
        }, 1)
    }
    system.runTimeout(() => {

        let maxVote = [];
        let storge = 0

        for (const count of [0, 1, 2, 3]) {
            const number = voteResult[difficultLabel[count]];

            if (storge > number) continue;

            if (storge == number) {
                maxVote.push(difficultLabel[count]);
                continue;
            }

            if (storge < number) {
                maxVote.length = 0;
                maxVote.push(difficultLabel[count]);
                storge = number
                continue;
            }
        }

        if (maxVote.length == 1) {
            finllyDifficultVote = maxVote;
        }

        if (maxVote.length >= 2) {
            finllyDifficultVote = maxVote[Math.floor(Math.random() * (maxVote.length))]
        }

        world.sendMessage({ rawtext: [{ translate: `vote.result1` }] });

        for (const count of [0, 1, 2, 3]) {
            world.sendMessage({ rawtext: [{ translate: `${difficultLabel[count]} ` }, { text: `: ${voteResult[difficultLabel[count]]}` }, { translate: `vote.unit` }] });
            //world.sendMessage(translateText(`${ difficultLabel[count] } `) + `: ${ voteResult[difficultLabel[count]] } 표`);
        }

        world.setDynamicProperty("difficultVote", `${finllyDifficultVote} `);
        world.setDifficulty(`${finllyDifficultVote}`)

        world.sendMessage(``);
        world.sendMessage({ rawtext: [{ translate: "vote.result2" }, { text: " §l" }, { translate: `${finllyDifficultVote}.color` }, { text: "§r " }, { translate: `vote.result3` }] })
        world.sendMessage(`§3－－－－－－－－－－－－－－－－－－`);

    }, 400)
}


function teamMix() {
    for (let i = PlayerList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [PlayerList[i], PlayerList[j]] = [PlayerList[j], PlayerList[i]];
    }

    PlayerList.forEach((name, index) => {
        const count = index % TeamCount

        let state = StateList.get(name)

        state.team = TEAM_DATA[count].name
        const player = transNametoPlayer(name)
        player.addTag(`${TEAM_DATA[count].tag} `);
        TEAM_DATA[count].list.push(name)

    })

    JSONsetValue(`TeamAList`, TeamAList)
    JSONsetValue(`TeamBList`, TeamBList)
    JSONsetValue(`TeamCList`, TeamCList)
    JSONsetValue(`TeamDList`, TeamDList)
    JSONsetValue("PlayerList", PlayerList)

}

function spreadPlayer() {
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
    if (teamSpawn) {
        for (let tc = 0; tc < TeamCount; tc++) {
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
                    saveAllDistance()
                    return;
                }

                repPlayer.teleport({ x: point_x, y: 300, z: point_z })
                for (safey = 320; safey > -20; safey--) {
                    const block = dim.getBlock({ x: point_x, y: safey - 1, z: point_z })

                    if (block && !block.isAir) {
                        teamList.forEach((name) => {
                            const player = transNametoPlayer(name)
                            player.teleport({ x: point_x, y: safey, z: point_z })
                            PlayerDistanceList.set(player.name, createDistance(player))
                        })
                        tpOK = true
                        break
                    }
                }
            })

        }
    } else {
        PlayerList.forEach((name, index) => {
            const player = transNametoPlayer(name)
            const point_x = points[index][0] - (oneSide / 2) + 0.5
            const point_z = points[index][1] - (oneSide / 2) + 0.5
            const dim = world.getDimension("overworld")
            let safey = 300
            let tpOK = false;

            let tp = system.runInterval(() => {

                if (tpOK) {
                    system.clearRun(tp);
                    saveAllDistance()
                    return;
                }

                player.teleport({ x: point_x, y: 300, z: point_z })
                for (safey = 300; safey > -20; safey--) {
                    const block = dim.getBlock({ x: point_x, y: safey - 1, z: point_z })

                    if (block && !block.isAir) {
                        player.teleport({ x: point_x, y: safey, z: point_z })
                        PlayerDistanceList.set(player.name, createDistance(player))
                        tpOK = true
                        break
                    }
                }
            })

        })

    }
}

function startGame(player) {

    if (!Game.info.difficult) {
        player.sendMessage({ rawtext: [{ translate: 'error.NotVoteDifficult' }] });
        return
    }

    if (Game.state == "play") {
        player.sendMessage({ rawtext: [{ translate: 'error.AlreadyStartGame' }] });
        return
    }

    //인원수 부족 경고 문구
    if (Game.setting.teamCount > world.getAllPlayers().filter(p => !p.hasTag("spectator")).length) {
        world.sendMessage({ rawtext: [{ translate: "error.TeamCountLack" }] })
        return;
    }

    Game.state = "play"

    Game.info.startTime = Date.now() + 32400000 // +32400000 는 한국 현지시간 맞추는거
    Game.info.tickTime = 0;

    startWorldSetting()

    for (const player of world.getAllPlayers()) {
        if (!player.hasTag("spectator")) {

            PlayerDataList[player.name] = new defaultPlayerState
            player.setGameMode("Survival")

            if (thirdPersonLimit) { player.camera.setCamera("minecraft:first_person") }
            player.fogSetting.push(`bridge:over_view_limit`, `over`)

        } else {
            player.setGameMode("Spectator")
            player.sendMessage({ rawtext: [{ translate: `system.startTPMessage` }] })
        }
    }

    teamMix();
    spreadPlayer();

    saveAllStates();

    //팀 명단 공개
    for (let i = 0; i < Game.setting.teamCount; i++) {
        const color = TEAM_DATA[i].color
        const list = TEAM_DATA[i].list
        const name = TEAM_DATA[i].name

        world.sendMessage(`${color}§l－－－－ << ${name} >> －－－－`)
        list.forEach((playerName, index) => {
            index % 2 === 0 ? world.sendMessage(`${playerName} `) : world.sendMessage(`§7${playerName} `)
        })
        world.sendMessage(`${color}§l－－－－－－－－－－－－－`)
    }

    system.runTimeout(() => {
        player.runCommand("playsound horn.call.2 @a");
        world.sendMessage({ rawtext: [{ translate: `startMessage` }] })
    }, 5)

    if (survivalMode) {
        player.runCommand("hud @a hide health");
        player.runCommand("hud @a hide hunger");
    }
}

function resetGame() {

    world.sendMessage({ rawtext: [{ translate: `system.resetMessage` }] })

    system.run(() => {
        startWorldSetting();
    })

    // 태그
    for (const player of world.getAllPlayers()) {
        player.removeTag("team-a")
        player.removeTag("team-b")
        player.removeTag("team-c")
        player.removeTag("team-d")
        player.removeTag("spectator")
        player.removeTag("playing")
        player.setGameMode("Survival")
        player.removeEffect(`invisibility`)
        player.camera.clear()
        player.runCommand(`fog @s remove over`)
        player.runCommand(`fog @s remove nether`)
        player.runCommand(`fog @s remove end`)
        player.runCommand(`fog @s remove thirst`)
        player.runCommand("hud @s reset all");
    }

    setValue("startTime", 0);
    setValue("endTime", 0)
    setValue("tickTime", 0);


    //    게임 상태
    setValue("GAME_START", false);
    setValue("GAME_END", false);

    //    게임 설정
    setValue("showcoordinates", false);
    setValue("thirdPersonLimit", false);
    setValue("renderLimit", false);
    setValue("teamSpawn", false);
    setValue("survivalMode", false);
    setValue("TeamCount", 2);
    setValue("difficultVote", false);

    // 객체 & 리스트
    JSONsetValue("PlayerList", []);
    JSONsetValue("TeamAList", []);
    JSONsetValue("TeamBList", []);
    JSONsetValue("TeamCList", []);
    JSONsetValue("TeamDList", []);
    JSONsetValue("infoList", []);
    JSONsetValue("StateList", []);
    JSONsetValue("PlayerDistanceList", [])
    JSONsetValue("SurvivalStateList", [])

    reloadValue();

}

function semiInfo() {

    world.sendMessage({
        rawtext: [{ text: `#§e` },
        { translate: `semiInfo.gameResult` },
        { text: `§f - ` },
        {
            translate: `${winnerTeam == "no" ? `semiInfo.gameResult.draw` : `semiInfo.gameResult.win`}`,
            with: [`${winnerTeamColor}`, `${winnerTeam}`]
        },
        { text: ` §f(§7${transtime(endTime - startTime, 1)}§f)` }]
    })

    world.sendMessage(` `)

    for (let i = 0; i < TeamCount; i++) {
        world.sendMessage(`${TEAM_DATA[i].color}----- ${TEAM_DATA[i].name} -----§f`);

        TEAM_DATA[i].list.forEach((name) => {
            const playerStateList = [];
            let state = StateList.get(name)

            playerStateList.push(`${name} - ( ${state.death ? `§c${state.reason}§f` : state.leave ? "§e자리를 비웠습니다.§f" : "§a생존§f"} ) ${state.death ? `${transtime(state.liveTime - startTime, 1)} ` : ""} `)
            world.sendMessage(playerStateList.join(""))

        })

        if (i != TeamCount - 1) {
            world.sendMessage(` `)
            world.sendMessage(`       VS`)
            world.sendMessage(` `)
        }
    }
    world.sendMessage(` `)
    world.sendMessage(` `)
}

function makeInfo() {
    const infoDifficultLable = { peaceful: "평화로움", easy: "쉬움", normal: "보통", hard: "어려움" }
    infoList.length = 0;
    infoList.push(`야생전투 ID - ${winnerTeam == "no" ? `무승부` : `${winnerTeam}팀 승`}`);
    infoList.push("");
    infoList.push(`경기 날짜: ${transtime(startTime, 2)} `);
    infoList.push("");
    infoList.push(`난이도 - ${infoDifficultLable[finllyDifficultVote]}, 좌표보기 - ${showcoordinates ? "on" : "off"}, 버전 - ${verson} `);
    infoList.push("");
    infoList.push(`플레이 타임 - ${transtime(startTime, 3)} ~ ${transtime(endTime, 3)} (${transtime(endTime - startTime, 1)}) | tick: ${transtime(tickTime, 1)}`)
    infoList.push("");

    for (let i = 0; i < TeamCount; i++) {
        infoList.push(`----- ${TEAM_DATA[i].name} 팀 -----`);
        infoList.push(``);

        TEAM_DATA[i].list.forEach((name) => {
            const playerStateList = [];
            let state = StateList.get(name)

            playerStateList.push(`${name} - ( ${state.death ? state.reason : state.leave ? "자리를 비웠습니다." : "생존"} ) ${state.death ? `${transtime(state.liveTime - startTime, 1)} ` : ""} `)
            const dtS = state.distance.survival
            const dtSp = state.distance.spectator
            const dh = state.height

            function fixedValue(value) {
                return (value / 1000).toFixed(2)
            }

            playerStateList.push(`${dtS.over == 0 ? "" : "| Survival | "} `)
            playerStateList.push(`${dtS.over == 0 ? `` : `W: ${fixedValue(dtS.over)} / ${dh.over.max}↑ ${dh.over.min}↓`} `)
            playerStateList.push(`${dtS.nether == 0 ? `` : ` N: ${fixedValue(dtS.nether)} / ${dh.nether.max}↑ ${dh.nether.min}↓`} `)
            playerStateList.push(`${dtS.end == 0 ? `` : ` E: ${fixedValue(dtS.end)} / ${dh.end.max}↑ ${dh.end.min}↓`} `)
            if (state.death) {
                playerStateList.push(`${dtSp.over == 0 ? `` : `| Spectator | `} `)
                playerStateList.push(`${dtSp.over == 0 ? `` : `W: ${fixedValue(dtSp.over)}`} `)
                playerStateList.push(`${dtSp.nether == 0 ? `` : ` N: ${fixedValue(dtSp.nether)}`} `)
                playerStateList.push(`${dtSp.end == 0 ? `` : ` E: ${fixedValue(dtSp.end)}`} `)
            }

            infoList.push(playerStateList.join(""))

        })


        if (i != TeamCount - 1) {
            infoList.push(``)
            infoList.push(`vs`)
            infoList.push(``)
        }
    }

    infoList.push(``)
    infoList.push(`특이사항: `)
    infoList.push(`MVP: `)

    JSONsetValue("infoList", infoList)

}

function lobbyWorldSetting() {
    world.gameRules.pvp = false
    world.gameRules.commandBlockOutput = false
    world.gameRules.sendCommandFeedback = false
    world.gameRules.doWeatherCycle = false
    world.gameRules.locationbar = false
    world.gameRules.doImmediateRespawn = true
    world.setTimeOfDay(0)
    world.getDimension('overworld').setWeather("Clear")
}

function startWorldSetting() {
    world.gameRules.pvp = true
    world.gameRules.doWeatherCycle = true
    //체력, 아이템, 배고픔 초기화
    world.getDimension('overworld').runCommand(`clear @a`)
    for (const player of world.getAllPlayers()) {
        player.addEffect("instant_health", 1, { amplifier: 255, showParticles: false });
        player.addEffect("saturation", 1, { amplifier: 255, showParticles: false });
    }
}

function playerCirclePlace() {

    const overWorld = world.getDimension("overworld");

    world.getAllPlayers().sort((a, b) => a.id - b.id).forEach((player, index) => {

        const Y = 10000
        let R = 2

        for (R; R * 2 * Math.PI < world.getAllPlayers().length * 2; R++);

        const angle = 2 * (index + 1) * Math.PI / world.getAllPlayers().length
        const X = R * Math.cos(angle)
        const Z = R * Math.sin(angle)

        player.teleport({ x: X, y: Y, z: Z }, { dimension: overWorld, facingLocation: { x: 0, y: Y - 0.2, z: 0 } });

    })
}

world.afterEvents.entityDie.subscribe(ev => {
    const entity = ev.deadEntity

    if (entity.typeId != "minecraft:player") return;
    if (!GAME_START || GAME_END) return;
    if (entity.hasTag("spectator")) return;


    const deathReason = getDeathReason(ev)
    let state = StateList.get(entity.name)
    state.death = true
    state.reason = deathReason
    state.liveTime = currentTime

    saveAllStates()
    saveAllDistance()

    entity.setDynamicProperty("deathPos", { x: entity.location.x, y: entity.location.y, z: entity.location.z })
    entity.setDynamicProperty("deathDim", `${entity.dimension.id}`)
    entity.setGameMode(`Spectator`)
})

world.afterEvents.playerSpawn.subscribe(ev => {
    const player = ev.player

    if (ev.initialSpawn && GAME_START && !player.hasTag("playing")) {
        player.setGameMode("Spectator")
        player.addEffect("invisibility", 20000000, { amplifier: 255, showParticles: false });
        player.addEffect("night_vision", 20000000, { amplifier: 255, showParticles: false });
    }

    if (survivalMode) {
        player.runCommand("hud @s hide health");
        player.runCommand("hud @s hide hunger");
    }

    if (GAME_START && player.hasTag("playing") && player.getGameMode() == "Spectator") {

        let state = StateList.get(player.name)
        if (state.leave) { state.leave = false }
        saveAllStates()

        const location = player.getDynamicProperty("deathPos")
        let dimID = player.getDynamicProperty("deathDim")

        const dim = world.getDimension(dimID)

        player.teleport(location, { dimension: dim })

        thirdPersonLimit ? player.camera.setCamera("minecraft:first_person") : player.camera.clear

    }

    if (ev.initialSpawn && !player.hasTag("showTip")) {
        player.addTag("showTip");
        system.runTimeout(() => {
            try {
                player.sendMessage({ rawtext: [{ translate: `show.help` }] })
            } catch (err) {
            }
        }, 200)
    }
})

world.afterEvents.playerLeave.subscribe(ev => {
    if (!GAME_START) return;
    let state = StateList.get(ev.playerName)
    if (!state) return;
    state.leave = true
    saveAllStates()
})

//----------- 메세지 -----------
world.beforeEvents.chatSend.subscribe(ev => {
    const sender = ev.sender;
    const msg = ev.message;

    if (!GAME_START && !GAME_END) {
        ev.cancel = true;
        world.sendMessage({ rawtext: [{ translate: `msgTitle.lobby` }, { text: ` ${sender.name} ｜ ${msg}` }] })
        return
    }
    if (GAME_END) {
        ev.cancel = true;
        if (sender.hasTag("playing")) {
            const state = StateList.get(sender.name)
            const teamName = state.team

            const key = TEAM_DATA.findIndex(v => v.name == teamName)

            const color = TEAM_DATA[key].color
            const listName = TEAM_DATA[key].name

            if (listName == winnerTeam) {
                world.sendMessage({ rawtext: [{ translate: `msgTitle.end.winer` }, { text: ` ${color}${sender.name}§f ｜ ${msg}` }] })
            } else {
                world.sendMessage({ rawtext: [{ translate: `msgTitle.end.loser` }, { text: ` ${color}${sender.name}§f ｜ ${msg}` }] })
            }
        } else {
            world.sendMessage({ rawtext: [{ translate: `msgTitle.end.spectator` }, { text: ` ${sender.name} ｜ ${msg}` }] })
        }
        return
    }
    if (GAME_START && !GAME_END) {
        ev.cancel = true;

        if (sender.hasTag("playing")) {
            const state = StateList.get(sender.name)
            const teamName = state.team

            const key = TEAM_DATA.findIndex(v => v.name == teamName)

            const color = TEAM_DATA[key].color
            const list = TEAM_DATA[key].list
            const name = TEAM_DATA[key].name

            const teamReader = world.getAllPlayers().filter(p => !p.hasTag("playing") || list.includes(p.name))

            for (const reader of teamReader) {
                reader.sendMessage(`[ §l${color}${name}§r ] ${sender.name} ｜ ${msg}`)
            }

            const enemyReader = world.getAllPlayers().filter(p => p.hasTag("playing") && !list.includes(p.name))

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

            const readableList = world.getAllPlayers().filter(p => !p.hasTag("playing"))

            for (const reader of readableList) {
                reader.sendMessage({ rawtext: [{ translate: `lateGameSpectator.chatTitle` }, { text: ` ${sender.name} ｜ ${msg}` }] })
            }
        }

    }

})

function playerDistance(player) {

    let distance = PlayerDistanceList.get(player.name)
    let state = StateList.get(player.name)
    if (!distance) return

    if (distance.dim != player.dimension.id) {
        distance.x = player.location.x
        distance.z = player.location.z
        distance.dim = player.dimension.id

        if (renderLimit) {
            if (player.dimension.id == "minecraft:overworld") {
                player.runCommand(`fog @s push bridge:over_view_limit over`)
                player.runCommand(`fog @s remove nether`)
                player.runCommand(`fog @s remove end`)
            }
            if (player.dimension.id == "minecraft:nether") {
                player.runCommand(`fog @s remove over`)
                player.runCommand(`fog @s push bridge:nether_view_limit nether`)
                player.runCommand(`fog @s remove end`)
            }
            if (player.dimension.id == "minecraft:the_end") {
                player.runCommand(`fog @s remove over`)
                player.runCommand(`fog @s remove nether`)
                player.runCommand(`fog @s push bridge:end_view_limit end`)
            }
        }

        return
    }

    if (player.getGameMode() == "Survival") {
        const y = player.location.y
        if (player.dimension.id == "minecraft:overworld") {
            const max = state.height.over.max
            const min = state.height.over.min
            state.height.over.max = Math.floor(Math.max(max, y))
            state.height.over.min = Math.floor(Math.min(min, y))
        }
        if (player.dimension.id == "minecraft:nether") {
            const max = state.height.nether.max
            const min = state.height.nether.min
            state.height.nether.max = Math.floor(Math.max(max, y))
            state.height.nether.min = Math.floor(Math.min(min, y))
        }
        if (player.dimension.id == "minecraft:the_end") {
            const max = state.height.end.max
            const min = state.height.end.min
            state.height.end.max = Math.floor(Math.max(max, y))
            state.height.end.min = Math.floor(Math.min(min, y))
        }
    }

    if (distance.x != player.location.x || distance.z != player.location.z) {

        const movement = Number(Math.sqrt((distance.x - player.location.x) ** 2 + (distance.z - player.location.z) ** 2).toFixed(3))

        if (player.getGameMode() == "Survival") {
            if (player.dimension.id == "minecraft:overworld") { state.distance.survival.over += movement }
            if (player.dimension.id == "minecraft:nether") { state.distance.survival.nether += movement }
            if (player.dimension.id == "minecraft:the_end") { state.distance.survival.end += movement }
        }

        if (player.getGameMode() == "Spectator") {
            if (player.dimension.id == "minecraft:overworld") { state.distance.spectator.over += movement }
            if (player.dimension.id == "minecraft:nether") { state.distance.spectator.nether += movement }
            if (player.dimension.id == "minecraft:the_end") { state.distance.spectator.end += movement }
        }
    }
    // 야생모드 이동에 따른 갈증
    function survivalDistance() {
        let survivalState = SurvivalStateList.get(player.name)

        const movement = Number(Math.sqrt((distance.x - player.location.x) ** 2 + (distance.z - player.location.z) ** 2).toFixed(3))
        const jumping = distance.ground && player.isJumping && !player.isOnGround
        const moveing = player.inputInfo.getMovementVector().x != 0 || player.inputInfo.getMovementVector().y != 0 ? true : false

        if (player.isSprinting && jumping && !player.isSwimming) {
            survivalState.exhaustion += 0.1
        }
        if (!player.isSprinting && jumping) {
            survivalState.exhaustion += 0.01
        }
        if (player.isSprinting && !player.isSwimming) {
            survivalState.exhaustion += 0.1 * movement
        }
        if (!player.isSprinting && moveing && !player.isSneaking) {
            survivalState.exhaustion += 0.00295 * movement
        }
        if (moveing && player.isSneaking) {
            survivalState.exhaustion += 0.001 * movement
        }
        if (!moveing) {
            survivalState.exhaustion += 0.000898560
        }
    }
    if (survivalMode) { survivalDistance() }
    distance.x = player.location.x
    distance.z = player.location.z
    distance.ground = player.isOnGround
}

//----------- 커맨드 -----------
const Command_STPT = {
    name: 'coin:ptp',
    description: `command.ptp`,
    permissionLevel: CommandPermissionLevel.Any
};

const Command_Chelp = {
    name: 'coin:chelp',
    description: `command.chelp`,
    permissionLevel: CommandPermissionLevel.Any
}

const Command_Rule = {
    name: 'coin:rule',
    description: `command.rule`,
    permissionLevel: CommandPermissionLevel.Any
}

const Command_Team = {
    name: 'coin:team',
    description: `command.team`,
    permissionLevel: CommandPermissionLevel.Any,
    optionalParameters: [
        { type: CustomCommandParamType.Enum, name: 'coin:teamTypes' }
    ]
}

const Command_SURRENDER = {
    name: 'coin:gg',
    description: `command.gg`,
    permissionLevel: CommandPermissionLevel.Any
}

const Command_Data = {
    name: 'coin:data',
    description: `command.data`,
    permissionLevel: CommandPermissionLevel.Host
}

const Command_vote = {
    name: 'coin:vote',
    description: `command.vote`,
    permissionLevel: CommandPermissionLevel.Host
}

const Command_reset = {
    name: 'coin:reset',
    description: `command.reset`,
    permissionLevel: CommandPermissionLevel.Host
}

const Command_start = {
    name: 'coin:start',
    description: `command.start`,
    permissionLevel: CommandPermissionLevel.Host
}

const Command_info = {
    name: 'coin:info',
    description: `command.info`,
    permissionLevel: CommandPermissionLevel.Host
}

function STPTHandle(origin) {
    if (!origin.sourceEntity || origin.sourceEntity.typeId !== 'minecraft:player') return undefined;

    const player = origin.sourceEntity;

    if (!GAME_START) { player.sendMessage({ rawtext: [{ translate: `error.NotGameStart.tpUI` }] }); return; }
    if (player.hasTag(`playing`)) { player.sendMessage({ rawtext: [{ translate: `error.playerUseTpUI` }] }); return; }

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
                player.sendMessage({ rawtext: [{ translate: `error.PTPnotPlayer` }] })
            }

        })
    })
}

function ChelpHandle(origin) {
    if (!origin.sourceEntity || origin.sourceEntity.typeId !== 'minecraft:player') return undefined;

    const player = origin.sourceEntity;
    player.sendMessage({ rawtext: [{ translate: `help` }] })
}

function RuleHandle(origin) {
    if (!origin.sourceEntity || origin.sourceEntity.typeId !== 'minecraft:player') return undefined;

    const player = origin.sourceEntity;
    player.sendMessage({ rawtext: [{ translate: `rule` }] })
}

function TeamHandle(origin, arg) {
    if (!origin.sourceEntity || origin.sourceEntity.typeId !== 'minecraft:player') return undefined;

    const player = origin.sourceEntity;

    if (arg === "all") {

        if (!GAME_START) { player.sendMessage({ rawtext: [{ translate: `error.NotGameStart.teamList` }] }); return; }

        for (let i = 0; i < TeamCount; i++) {
            const color = TEAM_DATA[i].color
            const list = TEAM_DATA[i].list
            const name = TEAM_DATA[i].name

            player.sendMessage(`${color}§l－－－－ << ${name} >> －－－－`)
            list.forEach((playerName) => {
                const state = StateList.get(playerName)
                state.death ? player.sendMessage(`§c${playerName}`) : state.leave ? player.sendMessage(`§e${playerName}`) : player.sendMessage(`§a${playerName} `)
            })
            player.sendMessage(`${color}§l－－－－－－－－－－－－－`)
        }
    } else {
        if (!GAME_START) { player.sendMessage({ rawtext: [{ translate: `error.NotGameStart.teamList` }] }); return; }
        if (player.hasTag("playing")) {
            const playerState = StateList.get(player.name)
            const teamName = playerState.team
            for (let i = 0; i < TeamCount; i++) {
                if (teamName == TEAM_DATA[i].name) {

                    const color = TEAM_DATA[i].color
                    const list = TEAM_DATA[i].list
                    const name = TEAM_DATA[i].name

                    player.sendMessage(`${color}§l－－－－ << ${name} >> －－－－`)
                    list.forEach((playerName) => {
                        const state = StateList.get(playerName)
                        state.death ? player.sendMessage(`§c${playerName}`) : state.leave ? player.sendMessage(`§e${playerName}`) : player.sendMessage(`§a${playerName} `)
                    })
                    player.sendMessage(`${color}§l－－－－－－－－－－－－－`)
                    return
                }
            }

        }

        {
            const list = world.getAllPlayers().filter(p => !p.hasTag("playing"))

            player.sendMessage({ rawtext: [{ translate: `lateGameSpectator.listTitle` }] })

            list.forEach((player) => {
                player.sendMessage(`${player.name}`)
            })

            player.sendMessage({ rawtext: [{ text: `§7－－－－－－－－－－－－－－－` }] })

        }


    }
}

function SURRENDERHandle(origin) {
    if (!origin.sourceEntity || origin.sourceEntity.typeId !== 'minecraft:player') return undefined;

    const player = origin.sourceEntity;
    if (!GAME_START) { player.sendMessage({ rawtext: [{ translate: `error.NotGameStart.Surrender` }] }); return; }
    if (!player.hasTag(`playing`)) { player.sendMessage({ rawtext: [{ translate: `error.SpectatorUseSurrender` }] }); return; }
}

function DataHandle() {
    for (const key of world.getDynamicPropertyIds()) {
        world.sendMessage(`§aID: §f${key} \n§eStorge: §f${world.getDynamicProperty(key)} `)
        world.sendMessage(` `)
    }
    world.sendMessage(`할당된 공간: ${world.getDynamicPropertyTotalByteCount()} byte`)
}

function VoteHandle() {
    system.run(() => { difficultVoteUI(); })
}

function ResetHandle() {
    system.run(() => { resetGame(); })
}

function StartHandle(origin) {
    if (!origin.sourceEntity || origin.sourceEntity.typeId !== 'minecraft:player') return undefined;
    const player = origin.sourceEntity;
    system.run(() => { startGame(player); })
}

function InfoHandle() {
    if (infoList.length == 0) { world.sendMessage({ rawtext: [{ translate: `error.notMadeInfoList` }] }) }
    console.warn(infoList.join("\n"));
}

system.beforeEvents.startup.subscribe((init) => {

    const commandList = [
        [Command_STPT, STPTHandle],
        [Command_Chelp, ChelpHandle],
        [Command_Rule, RuleHandle],
        [Command_Team, TeamHandle],
        [Command_SURRENDER, SURRENDERHandle],
        [Command_Data, DataHandle],
        [Command_vote, VoteHandle],
        [Command_reset, ResetHandle],
        [Command_start, StartHandle],
        [Command_info, InfoHandle]

    ]

    const teamTypes = [
        'all'
    ];
    init.customCommandRegistry.registerEnum('coin:teamTypes', teamTypes);

    for (const [cmd, handle] of commandList) {
        init.customCommandRegistry.registerCommand(cmd, handle)
    }


})
//----------------------------
function spectatorChangeDimension(player) {
    if (player.getGameMode() != "Spectator") return;

    if ((player.dimension.id == "minecraft:overworld") && (player.location.y < -64 || player.location.y > 320)) return
    if ((player.dimension.id == "minecraft:nether") && (player.location.y < 0 || player.location.y > 128)) return
    if ((player.dimension.id == "minecraft:the_end") && (player.location.y < 0 || player.location.y > 256)) return

    const block = player.dimension.getBlock(player.location)

    if (!block) return
    if (block.typeId != "minecraft:portal" && block.typeId != "minecraft:end_portal") return

    const x = player.location.x
    const z = player.location.z

    const dimOver = world.getDimension("overworld");
    const dimNether = world.getDimension("nether");
    const dimEnd = world.getDimension("the_end");

    try {
        // 오버 -> 네더
        if (player.dimension.id == "minecraft:overworld" && block.typeId == "minecraft:portal") {
            player.teleport({ x: x / 8, y: 64, z: z / 8 }, { dimension: dimNether })
            return;
        }
        //네더 -> 오버
        if (player.dimension.id == "minecraft:nether" && block.typeId == "minecraft:portal") {
            player.teleport({ x: x * 8, y: 64, z: z * 8 }, { dimension: dimOver })
            return;
        }

        //오버 -> 엔더
        if (player.dimension.id == "minecraft:overworld" && block.typeId == "minecraft:end_portal") {
            player.teleport({ x: 0, y: 80, z: 0 }, { dimension: dimEnd })
            return;
        }

        //엔더 -> 오버
        if (player.dimension.id == "minecraft:the_end" && block.typeId == "minecraft:end_portal") {
            const worldx = world.getDefaultSpawnLocation().x
            const worldz = world.getDefaultSpawnLocation().z

            if (!player.hasTag("playing")) {
                player.teleport({ x: worldx, y: 64, z: worldz }, { dimension: dimOver })
                return
            }

            const team = StateList.get(player.name).team
            const teamList = TEAM_DATA[TEAM_DATA.findIndex(v => v.name == team)].list

            let tpableList = [];


            teamList.forEach((name) => {
                const target = transNametoPlayer(name)

                if (target.dimension.id === "minecraft:overworld" && target.getGameMode() == "Survival") {
                    tpableList.push(name)
                }
            })



            if (tpableList.length > 0) {
                //팀 플레이어가 있을 떄
                const form = new ActionFormData().title({ rawtext: [{ translate: `spectatorChangeDimension.formTitle` }] })

                tpableList.forEach((name) => {
                    form.button(`${name}`)
                })

                form.show(player).then(res => {
                    if (res.canceled) { player.teleport({ x: x, y: player.location.y + 1, z: z }); return; }

                    const tpLocation = transNametoPlayer(tpableList[res.selection]).location
                    player.teleport(tpLocation, { dimension: dimOver })
                    return;
                })

            } else {
                //팀 플레이어가 없을 때
                system.runTimeout(() => {
                    player.sendMessage({ rawtext: [{ translate: `spectatorChangeDimension.noPlayerMessage` }] })
                }, 10)
                player.teleport({ x: worldx, y: 64, z: worldz }, { dimension: dimOver })
                return;
            }
        }

    } catch (error) {
    }

}

function checkWinTeam() {

    let aliveTeam = [];

    for (let i = 0; i < TeamCount; i++) {
        const checkList = TEAM_DATA[i].list
        for (const name of checkList) {
            const state = StateList.get(name)

            if (!state.death && !state.leave) {
                aliveTeam.push(TEAM_DATA[i].name)
                break
            }

        }
    }

    if (aliveTeam.length == 1) {

        winnerTeam = aliveTeam[0]
        winnerTeamColor = TEAM_DATA[TEAM_DATA.findIndex(v => v.name == aliveTeam[0])].color

        endTime = Date.now() + 32400000
        setValue("endTime", endTime)
        GAME_END = true
        setValue("GAME_END", true)
        semiInfo();
        makeInfo();
        OP.runCommand("playsound horn.call.1 @a");

        saveAllStates()

    }

    if (aliveTeam.length == 0) {
        winnerTeam = "no"

        endTime = Date.now() + 32400000
        setValue("endTime", endTime)
        GAME_END = true
        setValue("GAME_END", true)
        semiInfo();
        makeInfo();
        OP.runCommand("playsound horn.call.4 @a");

        saveAllStates()
    }


}

// ----------------- Survival Mode -----------------
world.afterEvents.itemCompleteUse.subscribe((ev) => {
    if (!survivalMode) return
    if (ev.source.typeId != "minecraft:player") return;
    let state = SurvivalStateList.get(ev.source.name)

    const potionComp = ev.itemStack.getComponent("potion");

    if (potionComp) {
        const id = potionComp.potionEffectType.id
        if (id == "minecraft:water") {
            state.thirst += 6
        } else if (id == "minecraft:turtle_master" || id == "minecraft:long_turtle_master" || id == "minecraft:strong_turtle_master") {
            state.thirst += 2
        } else if (id == "minecraft:wither" || id == "minecraft:poison" || id == "minecraft:long_poison" || id == "minecraft:strong_poison" || id == "minecraft:harming" || id == "minecraft:strong_harming") {
            state.thirst += 1
        } else if (id == "minecraft:healing" || id == "minecraft:strong_healing" || id == "minecraft:regeneration" || id == "minecraft:strong_regeneration" || id == "minecraft:long_regeneration") {
            state.thirst += 4
        } else {
            state.thirst += 6
        }
    }
    if (ev.itemStack.typeId == "minecraft:milk_bucket") {
        state.thirst += 4
    }
})

world.afterEvents.entityHurt.subscribe((ev) => {
    if (!survivalMode) return
    if (ev.damage >= 8 && ev.hurtEntity.typeId == "minecraft:player") {
        ev.hurtEntity.camera.fade({ fadeTime: { fadeInTime: 0.3, holdTime: 1, fadeOutTime: 0.7 }, fadeColor: { red: 0, green: 0, blue: 0 } })
    }
    if (ev.damage > 0 && ev.hurtEntity.typeId == "minecraft:player") {
        let state = SurvivalStateList.get(ev.hurtEntity.name)
        state.exhaustion += 0.3
    }
})
world.afterEvents.entityHitEntity.subscribe((ev) => {
    if (!survivalMode) return
    if (ev.damagingEntity.typeId == "minecraft:player") {
        let state = SurvivalStateList.get(ev.damagingEntity.name)
        state.exhaustion += 0.05
    }
})
world.afterEvents.playerBreakBlock.subscribe((ev) => {
    if (!survivalMode) return
    let state = SurvivalStateList.get(ev.player.name)
    state.exhaustion += 0.005
})


function survivalPlayer(player) {
    if (player.getGameMode() != "Survival") return

    const detectHealth = player.getComponent(EntityComponentTypes.Health).currentValue
    const detectHunger = player.getComponent(EntityComponentTypes.Hunger).currentValue

    if (!SurvivalStateList.has(player.name)) { SurvivalStateList.set(player.name, createSurvivalState()) }

    let state = SurvivalStateList.get(player.name)
    state.score++

    function baboMining(percent, tick, amlifier) {
        if (Math.random() < percent) {
            player.addEffect("mining_fatigue", tick, { amplifier: amlifier, showParticles: false })
        }
    }

    function baboMovement(percent) {
        const movement = player.inputInfo.getMovementVector();
        if (movement.y > 0) {
            if (Math.random() < percent) {
                player.inputPermissions.setPermissionCategory(9, false)
                system.run(() => { player.inputPermissions.setPermissionCategory(9, true) })
            }
        }
        if (movement.y < 0) {
            if (Math.random() < percent) {
                player.inputPermissions.setPermissionCategory(10, false)
                system.run(() => { player.inputPermissions.setPermissionCategory(10, true) })
            }
        }
        if (movement.x > 0) {
            if (Math.random() < percent) {
                player.inputPermissions.setPermissionCategory(11, false)
                system.run(() => { player.inputPermissions.setPermissionCategory(11, true) })
            }
        }
        if (movement.x < 0) {
            if (Math.random() < percent) {
                player.inputPermissions.setPermissionCategory(12, false)
                system.run(() => { player.inputPermissions.setPermissionCategory(12, true) })
            }
        }
        if (Math.random() < percent) {
            if (player.inputPermissions.isPermissionCategoryEnabled(6)) return
            player.inputPermissions.setPermissionCategory(6, false)
            system.runTimeout(() => { player.inputPermissions.setPermissionCategory(6, true) }, 12)

        }
    }

    //-------------- 체력 --------------
    if (!player.getEffect("regeneration")) {
        if (detectHealth <= 14 && detectHealth > 10) {
            if (state.score > 200) {
                state.score = 0;
                player.addEffect("nausea", 80, { amplifier: 255, showParticles: false })
            }
        }

        if (detectHealth <= 10 && detectHealth > 6) {
            if (state.score > 100) {
                state.score = 0;
                player.addEffect("nausea", 120, { amplifier: 255, showParticles: false })
            }
        }

        if (detectHealth <= 6 && detectHealth > 2) {
            if (state.score > 80) {
                state.score = 0;
                player.addEffect("nausea", 133, { amplifier: 4, showParticles: false })
            }
        }

        if (detectHealth <= 2 && detectHealth > 0) {
            if (state.score > 146) {
                state.score = 0;
                player.addEffect("nausea", 220, { amplifier: 255, showParticles: false })
                player.camera.fade({ fadeTime: { fadeInTime: 0.8, holdTime: 0, fadeOutTime: 6.5 }, fadeColor: { red: 0, green: 0, blue: 0 } })
            }
        }
    }
    //-------------- 배고픔 --------------
    {
        if (detectHunger <= 6 && detectHunger > 4) {
            baboMining(0.1, 1, 0)
            player.addEffect("weakness", 40, { amplifier: 0, showParticles: false })
        }
        if (detectHunger <= 4 && detectHunger > 2) {
            baboMovement(0.05)
            baboMining(0.3, 1, 2)
            player.addEffect("weakness", 40, { amplifier: 1, showParticles: false })
        }

        if (detectHunger <= 2 && detectHunger >= 0) {
            baboMovement(0.1)
            baboMining(0.5, 1, 2)
            player.addEffect("weakness", 40, { amplifier: 2, showParticles: false })
        }

        if (detectHunger <= 3) {
            state.hungerScore = Math.min(state.hungerScore + 1, 24000)
            state.zh_score++
            state.zh_endTimer = 0
            if (20 * 60 * 5 > state.zh_score) {
                state.zh_value = 3
            } else if (20 * 60 * 10 > state.zh_score) {
                state.zh_value = 4
            } else if (20 * 60 * 30 > state.zh_score) {
                state.zh_value = 5
            } else if (20 * 60 * 30 <= state.zh_score) {
                state.zh_value = Math.floor((state.zh_score - 20 * 60 * 30) / (60 * 20)) + 5
            }
        } else {
            state.hungerScore = Math.max(state.hungerScore - 6, 0)

            if (state.zh_score > 0) {
                state.zh_endTimer++
                if (state.zh_endTimer > 3 * 20 * 60) {
                    state.zh_endTimer = 0;
                    state.zh_value -= 1
                }
                if (state.zh_value > 5) {
                    state.zh_score = 20 * 60 * 30 + (state.zh_value - 5) * 20 * 60
                } else if (state.zh_value == 5) {
                    state.zh_score = 20 * 60 * 30
                } else if (state.zh_value == 4) {
                    state.zh_score = 20 * 60 * 10
                } else if (state.zh_value == 3) {
                    state.zh_score = 20 * 60 * 5
                } else if (state.zh_value == 2) {
                    state.zh_score = 0
                    state.zh_value = 0
                }
            }
        }
        if (state.zh_value > 0) {
            player.addEffect("weakness", 10, { amplifier: Math.floor(state.zh_value), showParticles: false })
            //world.sendMessage(`나약함 강도:${Math.floor(state.zh_value)}\n시간:${state.zh_score}\n엔드 타이머:${state.zh_endTimer}`)
        }
        if (Math.random() < state.hungerScore / 240000 && state.hungerScore != 0) {
            player.inputPermissions.setPermissionCategory(2, false)
        } else {
            if (state.hungerScore != 0) {
                player.inputPermissions.setPermissionCategory(2, true)
            }
        }

        if (detectHunger > state.beforHunger) {
            state.thirst -= (detectHunger - state.beforHunger) * 0.75
        }

        state.beforHunger = detectHunger
    }
    //-------------- 목마름 --------------
    {
        const detectThirst = state.thirst

        if (state.exhaustion > 4) {
            state.exhaustion -= 4
            state.thirst -= 1
        }

        if (state.thirst < 0) {
            state.thirst = 0
        } else if (state.thirst > 20 && !state.startBoost) {
            state.thirst = 20
        } else if (state.thirst < 20 && state.startBoost) {
            state.startBoost = false
        }
        if (detectThirst < 6 && !state.fog) {
            player.runCommand(`fog @s push bridge:thirst_fog thirst`)
            state.fog = true
        } else if (detectThirst >= 6 && state.fog) {
            player.runCommand(`fog @s remove thirst`)
            state.fog = false
        }

        const p = player.inputPermissions.isPermissionCategoryEnabled(2)
        const q = player.inputPermissions.isPermissionCategoryEnabled(6)

        if (detectThirst == 0) {
            if (player.isSprinting) {
                state.runTick += 6
            } else {
                state.runTick = Math.max(state.runTick - 1, 0)
            }

            if (state.runTick > 360 && state.runCool == 0) {
                state.runCool = 300
            }

            state.runCool = Math.max(state.runCool - 1, 0)
            if (state.runCool > 0 && q) {
                player.inputPermissions.setPermissionCategory(6, false)
            }
            if (state.runCool > 0 && player.isSprinting && p) {
                player.inputPermissions.setPermissionCategory(2, false)
                system.run(() => { player.inputPermissions.setPermissionCategory(2, true) })
            }
            if (state.runCool == 1) {
                state.runTick = 0
                player.inputPermissions.setPermissionCategory(6, true)
            }

        } else {
            state.runTick = 0
            state.runCool = 0
            if (!p || !q) {
                player.inputPermissions.setPermissionCategory(2, true)
                player.inputPermissions.setPermissionCategory(6, true)
            }
        }
    }
}

// -------------------------------------------------------

system.runInterval(() => {
    setValue("tickTime", tickTime);
    saveAllStates()
    saveAllDistance()
    if (survivalMode) { saveAllSurvivalStates() }
}, 100)

system.runInterval(() => {
    // 현재 시간 구하기
    currentTime = Date.now() + 32400000

    //변수 리로드
    if (world.getAllPlayers()[0] && !RELOAD) {
        RELOAD = true
        if (!getValue("init")) {
            resetGame()
            return
        }
        reloadValue();
        OP = world.getAllPlayers()[0]
        if (!OP) RELOAD = false;
        return
    }

    //관리자 선택
    if (!OP && RELOAD) {
        OP = world.getAllPlayers()[0]
        setValue("init", true);

        return
    }

    if (!OP) {
        OP = world.getAllPlayers()[0]
    }


    if (!RELOAD || !OP) return;

    for (const player of world.getAllPlayers()) {
        if (GAME_START && !GAME_END) {
            if (survivalMode) {
                survivalPlayer(player)
            }
            playerDistance(player)
            spectatorChangeDimension(player)
            player.nameTag = "";

            if (player.hasTag("playing")) {
                //${transtime(currentTime - startTime, 1)}\n
                player.onScreenDisplay.setActionBar(`§6${transtime(tickTime, 1)}`)
            } else {
                player.onScreenDisplay.setActionBar({
                    rawtext: [

                        // 1. 게임 상태 안내
                        { translate: `actionbar.lateGameSpectator.message` },

                        // 2. 게임 시간 표시
                        { translate: `actionbar.lateGameSpectator.timer` },
                        { text: ` §6${transtime(currentTime - startTime, 1)} \n§f` },

                        // 3. 디스코드 링크
                        { translate: `actionbar.lateGameSpectator.discord` }
                    ]
                })
            }
        }

        if (!GAME_START || GAME_END) {
            player.nameTag = player.name;
        }

        const playerCount = world.getAllPlayers().filter(p => !p.hasTag("spectator")).length
        if (!GAME_START && !GAME_END) {
            player.onScreenDisplay.setActionBar(
                {
                    rawtext: [{ text: `§a` }, { translate: `lobby.playerCount` }, { text: `§r ｜ ${playerCount} \n§9` },
                    { translate: `lobby.discord` }, { text: `§r ｜ https://discord.gg/rheQ9Sp8MF` }]
                })
        }
    }


    if (!GAME_START && !GAME_END && OP) {
        defaultWorldSetting();
        playerCirclePlace();
    }


    if (GAME_START && !GAME_END) {
        tickTime += 50;
        checkWinTeam()
    }

}, 1)