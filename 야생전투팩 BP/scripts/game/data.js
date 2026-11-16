import { system } from "@minecraft/server"
import { SaveData, LoadData } from "../utils/save-road"
import { PlayerBotStateData } from "./bot-data"

export const TEAM_DATA = [
    { name: "A", color: "§c", tag: "team-a" },
    { name: "B", color: "§6", tag: "team-b" },
    { name: "C", color: "§e", tag: "team-c" },
    { name: "D", color: "§a", tag: "team-d" }
]

export let Game = {
    version: "v26.33",

    state: 'lobby',

    info: '',

    setting: {
        showcoordinates: false,
        thirdPersonLimit: false,
        renderLimit: false,
        teamSpawn: false,
        teamCount: 2,
        wildMode: false
    },

    data: {
        tickTime: 0,
        startTime: 0,
        endTime: 0,
        currentTime: 0,
        winnerTeam: '',
        difficult: null
    },

    teamList: [[], [], [], []]
}

export const defaultGame = {
    version: "v26.33",

    state: 'lobby',

    info: '',

    setting: {
        showcoordinates: false,
        thirdPersonLimit: false,
        renderLimit: false,
        teamSpawn: false,
        teamCount: 2,
        wildMode: false
    },

    data: {
        tickTime: 0,
        startTime: 0,
        endTime: 0,
        currentTime: 0,
        winnerTeam: '',
        difficult: null
    },

    teamList: [[], [], [], []]
}

export class defaultPlayerState {
    constructor() {
        this.team = null
        this.reason = null
        this.death = false
        this.leavedeath = false
        this.liveTime = 0
        this.distance = {
            survival: { over: 0, nether: 0, end: 0 },
            spectator: { over: 0, nether: 0, end: 0 }
        }
        this.height = {
            over: { max: -64, min: 320 },
            nether: { max: -64, min: 320 },
            end: { max: -64, min: 320 }
        }
    }
}

export class defaultPlayerDistance {
    constructor() {
        this.x = 0
        this.y = 0
        this.z = 0
        this.dim = ''
        this.ground = false
    }
}

export class defaultPlayerWildMode {
    constructor() {
        this.score = 0
        this.hungerScore = 0
        this.beforeHunger = 20
        this.zh_score = 0
        this.zh_value = 0
        this.zh_endTimer = 0
        this.thirst = 40
        this.exhaustion = 0
        this.startBoost = true
        this.fog = false
        this.runCool = 0
        this.runTick = 0
    }
}

export class defaultPlayerDeathPos {
    constructor(loc = { x: 0, y: 0, z: 0 }, dim = 'minecraft:overworld') {
        this.location = loc
        this.dimID = dim
    }
}

export let PlayerStateData = {}
export let PlayerDistanceData = {}
export let PlayerWildModeData = {}
export let PlayerDeathPosData = {}

export function reloadData() {
    Game = LoadData("Game")
    PlayerStateData = LoadData("PlayerStateData")
    PlayerDistanceData = LoadData('PlayerDistanceData')
    PlayerWildModeData = LoadData('PlayerWildModeData')
    PlayerDeathPosData = LoadData('PlayerDeathPosData')
}

system.runInterval(() => {
    if (Game.state != 'play') return

    SaveData("Game", Game);
    SaveData("PlayerStateData", PlayerStateData)
    SaveData("PlayerBotStateData", PlayerBotStateData)
    SaveData("PlayerDeathPosData", PlayerDeathPosData)

    if (Game.setting.wildMode) SaveData('PlayerWildModeData', PlayerWildModeData)
}, 100)