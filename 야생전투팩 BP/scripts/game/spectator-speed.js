export const playerSpeedState = {}

export function spectatorSpeed(player) {
    if (player.getGameMode() != 'Spectator') return

    if (playerSpeedState[player.name]) {
        const value_x = playerSpeedState[player.name].x / 5
        const value_y = playerSpeedState[player.name].y / 5

        if (value_x == 0 && value_y == 0) return

        const up = player.inputInfo.getButtonState("Jump") == "Pressed" ? 1 : 0
        const down = player.inputInfo.getButtonState("Sneak") == "Pressed" ? -1 : 0
        const y = up + down

        const move = player.inputInfo.getMovementVector()
        const rotation = player.getRotation().y * Math.PI / 180

        const cos = Math.cos(rotation)
        const sin = Math.sin(rotation)

        const x = move.x * cos - move.y * sin
        const z = move.x * sin + move.y * cos

        player.applyImpulse({ x: x * value_x, y: y * value_y, z: z * value_x })
    } else {
        return
    }
}