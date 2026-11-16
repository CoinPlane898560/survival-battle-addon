import { Game, PlayerDistanceData, PlayerStateData, PlayerWildModeData } from "./data";

export function playerDistance(player) {

    let distance = PlayerDistanceData[player.name]
    let state = PlayerStateData[player.name]

    if (!distance || !state) return

    if (distance.dim != player.dimension.id) {
        distance.x = player.location.x
        distance.y = player.location.y
        distance.z = player.location.z
        distance.dim = player.dimension.id

        if (Game.setting.renderLimit) {
            if (player.dimension.id == "minecraft:overworld") {
                // player.fogSetting.push(`bridge:over_view_limit`, `over`)
                // player.fogSetting.remove('nether')
                // player.fogSetting.remove('end')
                player.runCommand(`fog @s push bridge:over_view_limit over`)
                player.runCommand(`fog @s remove nether`)
                player.runCommand(`fog @s remove end`)
            }
            if (player.dimension.id == "minecraft:nether") {
                // player.fogSetting.remove('over')
                // player.fogSetting.push(`bridge:nether_view_limit`, `nether`)
                // player.fogSetting.remove('end')
                player.runCommand(`fog @s remove over`)
                player.runCommand(`fog @s push bridge:nether_view_limit nether`)
                player.runCommand(`fog @s remove end`)
            }
            if (player.dimension.id == "minecraft:the_end") {
                // player.fogSetting.remove('over')
                // player.fogSetting.remove('nether')
                // player.fogSetting.push(`bridge:end_view_limit`, `end`)
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

        const movement = Math.sqrt((distance.x - player.location.x) ** 2 + (distance.z - player.location.z) ** 2)

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
    if (Game.setting.wildMode) {
        let survivalState = PlayerWildModeData[player.name]

        const movement = Math.sqrt((distance.x - player.location.x) ** 2 + (distance.z - player.location.z) ** 2)
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

    distance.x = player.location.x
    distance.z = player.location.z
    distance.ground = player.isOnGround
}