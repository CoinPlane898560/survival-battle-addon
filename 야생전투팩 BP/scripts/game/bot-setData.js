import { world } from "@minecraft/server"
import { PlayerBotStateData } from "./bot-data"

export function setBot(player, bot) {
    // state
    const data = PlayerBotStateData[player.name]

    const loc = data.location
    const rot = data.rotation
    const dim = world.getDimension(data.dimensionID)

    // 위치
    try {
        bot.teleport({ x: loc.x, y: loc.y, z: loc.z }, { rotation: rot, dimension: dim })
    } catch { }

    // 상태
    bot.getComponent("minecraft:player.saturation").setCurrentValue(data.satuaration)
    bot.getComponent("minecraft:player.hunger").setCurrentValue(data.hunger)
    bot.getComponent("minecraft:health").setCurrentValue(data.health)
    bot.addExperience(data.xp)
    bot.selectedSlotIndex = data.hotbarSlot
    //effect
    for (const effect of data.effect) {
        if (!effect) break

        bot.addEffect(effect.typeId, effect.duration, { amplifier: effect.amplifier })
    }

    // inventory

    const invBot = world.getDimension('overworld').getEntities({ type: "coin:inv" }).find(p => p.name == `inv-${player.name}`)

    const invCmp = invBot.getComponent("minecraft:inventory").container

    const botEquipCmp = bot.getComponent("minecraft:equippable")
    const botInvCmp = bot.getComponent("minecraft:inventory").container

    botEquipCmp.setEquipment("Offhand", invCmp.getItem(39))
    botEquipCmp.setEquipment("Head", invCmp.getItem(40))
    botEquipCmp.setEquipment("Chest", invCmp.getItem(41))
    botEquipCmp.setEquipment("Legs", invCmp.getItem(42))
    botEquipCmp.setEquipment("Feet", invCmp.getItem(43))

    for (let i = 0; i < 36; i++) {
        botInvCmp.setItem(i, invCmp.getItem(i))
    }

    if (invCmp.getItem(38)) {
        if (botInvCmp.firstEmptySlot() === undefined) {
            bot.dimension.spawnItem(invCmp.getItem(38), bot.location)
        } else {
            botInvCmp.addItem(invCmp.getItem(38))
        }
    }

}