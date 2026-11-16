import { world, system } from "@minecraft/server"
import { Game, PlayerDeathPosData, PlayerStateData } from "../game/data";

export const playerSpawnEvent = world.afterEvents.playerSpawn.subscribe(ev => {
    const player = ev.player

    // 게임중에 들어온 사람
    if (ev.initialSpawn && Game.state == 'play' && !PlayerStateData[player.name]) {
        player.addTag("spectator")
        player.setGameMode("Spectator")
        player.addEffect("invisibility", 2000000, { amplifier: 255, showParticles: false });
        player.addEffect("night_vision", 2000000, { amplifier: 255, showParticles: false });
    }

    // 야생모드 세팅
    if (Game.setting.wildMode) {
        player.runCommand("hud @s hide health");
        player.runCommand("hud @s hide hunger");
    }

    // 게임중에 죽은사람
    if (Game.state == "play" && PlayerStateData[player.name] && PlayerStateData[player.name].death) {

        const location = PlayerDeathPosData[player.name].location
        let dimID = PlayerDeathPosData[player.name].dimID

        const dim = world.getDimension(dimID)

        try {
            player.teleport(location, { dimension: dim })
        } catch { }

        Game.setting.thirdPersonLimit ? player.camera.setCamera("minecraft:first_person") : player.camera.clear
    }

    // 게임 중이고, 플레이어가 나갔다 들어왔을 때
    if (ev.initialSpawn && Game.state == "play" && PlayerStateData[player.name] && PlayerStateData[player.name].reason == '게임을 나갔습니다.') {
        //const state = PlayerStateData[player.name]
        player.sendMessage(`게임을 나가서 사망처리 되었습니다.`)

        entity.setGameMode(`Spectator`)

        // 봇이 살아 있을 떄

        // 봇이 죽었을 떄

    }

    // 게임 들어왔을 떄 기본 메세지
    if (ev.initialSpawn) {
        if (player.hasTag('bot')) return
        system.runTimeout(() => {
            player.sendMessage({ rawtext: [{ translate: `show.help` }] })
        }, 200)
    }
})