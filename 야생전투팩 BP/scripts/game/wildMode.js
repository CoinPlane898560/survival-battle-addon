import { world } from "@minecraft/server";
import { Game, PlayerWildModeData, defaultPlayerWildMode } from "./data";

export const wild_item = world.afterEvents.itemCompleteUse.subscribe((ev) => {
    if (!Game.setting.wildMode) return
    if (ev.source.typeId != "minecraft:player") return;
    let state = PlayerWildModeData[ev.source.name]

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

export const wild_hurt = world.afterEvents.entityHurt.subscribe((ev) => {
    if (!Game.setting.wildMode) return
    if (ev.damage >= 8 && ev.hurtEntity.typeId == "minecraft:player") {
        ev.hurtEntity.camera.fade({ fadeTime: { fadeInTime: 0.3, holdTime: 1, fadeOutTime: 0.7 }, fadeColor: { red: 0, green: 0, blue: 0 } })
    }
    if (ev.damage > 0 && ev.hurtEntity.typeId == "minecraft:player") {
        let state = PlayerWildModeData[ev.hurtEntity.name]
        state.exhaustion += 0.3
    }
})

export const wild_hit = world.afterEvents.entityHitEntity.subscribe((ev) => {
    if (!Game.setting.wildMode) return
    if (ev.damagingEntity.typeId == "minecraft:player") {
        let state = PlayerWildModeData[ev.damagingEntity.name]
        state.exhaustion += 0.05
    }
})
export const wild_break = world.afterEvents.playerBreakBlock.subscribe((ev) => {
    if (!Game.setting.wildMode) return
    let state = PlayerWildModeData[ev.player.name]
    state.exhaustion += 0.005
})


export function wildPlayer(player) {
    if (player.getGameMode() != "Survival") return

    const detectHealth = player.getComponent("minecraft:health").currentValue
    const detectHunger = player.getComponent("minecraft:player.hunger").currentValue

    if (!PlayerWildModeData[player.name]) {
        PlayerWildModeData[player.name] = new defaultPlayerWildMode
    }

    let state = PlayerWildModeData[player.name]
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