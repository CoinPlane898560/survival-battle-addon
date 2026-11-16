import { LoadData } from "../utils/save-road"

export class defaultPlayerBot {
    constructor() {
        this.satuaration = 0
        this.hunger = 0
        this.health = 0
        this.xp = 0
        this.hotbarSlot = 0
        this.location = null
        this.rotation = null
        this.dimensionID = null
        this.effect = []
    }
}

export let PlayerBotStateData = {}

export function reloadBotData() {
    PlayerBotStateData = LoadData("PlayerBotStateData")
}