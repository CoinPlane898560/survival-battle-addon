import { world } from "@minecraft/server"

export function transtime(t, mode) {
    const time = new Date(t)
    const yy = time.getFullYear()
    const mn = time.getMonth() + 1
    const dd = time.getDate()
    const hh = time.getHours().toString().padStart(2, "00")
    const mm = time.getMinutes().toString().padStart(2, "00")
    const ss = time.getSeconds().toString().padStart(2, "00")

    if (mode == 1) { return (`${hh}:${mm}:${ss}`) }

    if (mode == 2) { return (`${yy}년 ${mn}월 ${dd}일`) }

    if (mode == 3) { return (`${hh}시 ${mm}분 ${ss}초`) }

}

export function transNametoPlayer(name) {
    return world.getAllPlayers().find(p => p.name === name)
}

export function fixedValue(value) {
    return (value / 1000).toFixed(2)
}