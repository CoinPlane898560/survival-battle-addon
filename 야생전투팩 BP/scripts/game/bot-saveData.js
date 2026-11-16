import { PlayerBotStateData, defaultPlayerBot } from "./bot-data"

export function saveInv(player, storge) {
    const playerCursorCmp = player.getComponent("minecraft:cursor_inventory")
    const PlayerEquipCmp = player.getComponent("minecraft:equippable")
    const PlayerInvCmp = player.getComponent("minecraft:inventory").container

    const botInvCmp = storge.getComponent("minecraft:inventory").container

    for (let i = 0; i < 36; i++) {
        botInvCmp.setItem(i, PlayerInvCmp.getItem(i))
    }

    botInvCmp.setItem(38, playerCursorCmp.item)
    botInvCmp.setItem(39, PlayerEquipCmp.getEquipment("Offhand"))
    botInvCmp.setItem(40, PlayerEquipCmp.getEquipment("Head"))
    botInvCmp.setItem(41, PlayerEquipCmp.getEquipment("Chest"))
    botInvCmp.setItem(42, PlayerEquipCmp.getEquipment("Legs"))
    botInvCmp.setItem(43, PlayerEquipCmp.getEquipment("Feet"))

    return
}

export function saveState(player) {
    if (!PlayerBotStateData[player.name]) {
        PlayerBotStateData[player.name] = defaultPlayerBot
    }
    const data = PlayerBotStateData[player.name]

    data.satuaration = player.getComponent("minecraft:player.saturation").currentValue
    data.hunger = player.getComponent("minecraft:player.hunger").currentValue
    data.health = player.getComponent("minecraft:health").currentValue
    data.xp = player.getTotalXp()
    data.hotbarSlot = player.selectedSlotIndex
    data.location = player.location
    data.rotation = player.getRotation()
    data.dimensionID = player.dimension.id
    data.effect = getEffect(player)

    return
}

export function getEffect(player) {
    if (player.getEffects().length == 0) []

    class effectState {
        constructor(amplifier = 0, duration = 0) {
            this.amplifier = amplifier
            this.duration = duration
        }
    }

    let list = []

    for (const effect of player.getEffects()) {
        let effectData = {
            typeId: '',
            amplifier: 0,
            duration: 0
        }

        effectData.typeId = effect.typeId
        effectData.amplifier = effect.amplifier
        effectData.duration = effect.duration

        list.push(effectData)
    }

    return list
}
