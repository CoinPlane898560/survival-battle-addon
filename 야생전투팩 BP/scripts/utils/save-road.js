import { world, system } from "@minecraft/server"

export function SaveData(key, data) {
    world.setDynamicProperty(key, JSON.stringify(data));
    return
}

export function LoadData(key) {
    const data = world.getDynamicProperty(key);

    if (data === undefined) {
        return null;
    }

    return JSON.parse(data)
}