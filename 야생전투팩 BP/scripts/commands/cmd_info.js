import { Game } from "../game/data";

export function InfoHandle() {
    const info = Game.info

    if (info.length == 0) {
        return {
            message: `command.failure.notMadeInfoList`,
            status: 1
        }
    }
    console.warn(info.join("\n"));
}