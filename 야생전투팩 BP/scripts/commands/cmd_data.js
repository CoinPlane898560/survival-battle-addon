import { world } from "@minecraft/server"

export function DataHandle() {
    for (const key of world.getDynamicPropertyIds()) {
        world.sendMessage(`§aID: §f${key} \n§eStorge: §f${world.getDynamicProperty(key)} `)
        world.sendMessage(` `)
    }
    world.sendMessage(`할당된 공간: ${world.getDynamicPropertyTotalByteCount()} byte`)
    world.sendMessage(`할당된 공간: ${world.getDynamicPropertyTotalByteCount() / 1024} kb`)
    world.sendMessage(`할당된 공간: ${world.getDynamicPropertyTotalByteCount() / (1024 * 1024)} mb`)
}