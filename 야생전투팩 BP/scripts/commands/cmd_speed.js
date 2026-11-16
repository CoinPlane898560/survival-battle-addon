import { Game } from "../game/data";
import { playerSpeedState } from "../game/spectator-speed";

export function SpeedHandle(origin, h, v) {
    const player = origin.sourceEntity

    if (h < 0 || h > 10 || v < 0 || v > 10) {
        return {
            message: `command.failure.speedRangeOver`,
            status: 1
        }
    }

    class speed {
        constructor(h = 0, v = 0) {
            this.x = h
            this.y = v
        }
    }

    playerSpeedState[player.name] = new speed(h, v)
    return
}