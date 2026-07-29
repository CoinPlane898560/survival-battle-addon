import { world } from "@minecraft/server"

export function SaveData(key, data) {
    world.setDynamicProperty(key, JSON.stringify(data));
    return
}

export function LoadData(key) {
    return JSON.parse(world.setDynamicProperty(key))
}