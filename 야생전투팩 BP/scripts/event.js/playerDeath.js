import { world } from "@minecraft/server";
import { Game, PlayerStateData, defaultPlayerDeathPos, PlayerDeathPosData } from "../game/data";
import { SaveData } from "../utils/save-road";

export const playerDeathEvent = world.afterEvents.entityDie.subscribe(ev => {
    const entity = ev.deadEntity

    if (entity.typeId != "minecraft:player") return;
    if (Game.state != "play") return;
    if (entity.hasTag("spectator")) return;

    const deathReason = getDeathReason(ev)

    let playerName = entity.name

    if (entity.hasTag('bot')) {
        playerName = entity.name.replace('bot-')
        entity.disconnect()
    }

    let state = PlayerStateData[playerName]
    state.death = true
    state.reason = deathReason
    state.liveTime = Game.data.currentTime

    entity.setGameMode(`Spectator`)

    PlayerDeathPosData[playerName] = new defaultPlayerDeathPos(entity.location, entity.dimension.id)

    SaveData('PlayerStateData', PlayerStateData)
    SaveData('PlayerDeathPosData', PlayerDeathPosData)
})

function getDeathReason(event) {
    // event.cause, event.damageSource, event.damagingEntity 등에서 정보 추출 시도
    const cause = event.damageSource.cause;
    const attacker = event.damageSource.damagingEntity?.name
        ?? event.damageSource.damagingEntity?.typeId?.replace("minecraft:", "")
        ?? "알 수 없음";
    const projectileType = event.damageSource.damagingProjectile?.typeId.replace("minecraft:", "");

    let reason = "사망했습니다.";

    if (cause) {
        switch (cause) {
            case "anvil":
                reason = "모루에 깔려 죽었습니다.";
                break;
            case "blockExplosion":
                reason = "블록 폭발에 의해 사망했습니다.";
                break;
            case "campfire":
                reason = "모닥불에 타 죽었습니다.";
                break;
            case "charging":
                reason = "차지에 죽었습니다.";
                break;
            case "contact":
                reason = '가시에 찔러 죽었습니다';
                break;
            case "drown":
            case "drowning":
                reason = "익사로 사망했습니다.";
                break;
            case "entityAttack":
                reason = `${attacker}에게 공격당해 사망했습니다.`;
                break;
            case "entityExplosion":
                reason = `${attacker}에게 폭발로 사망했습니다.`;
                break;
            case "fall":
                reason = "낙하 피해로 사망했습니다.";
                break;
            case "falling_block":
                reason = "떨어지는 블록에 맞아 사망했습니다.";
                break;
            case "fire":
            case "fire_tick":
                reason = "불에 타서 사망했습니다.";
                break;
            case "fireworks":
                reason = "폭죽 폭발로 사망했습니다.";
                break;
            case "flyIntoWall":
                reason = "고속으로 벽에 부딪혀 사망했습니다.";
                break;
            case "freeze":
                reason = "얼어 죽었습니다.";
                break;
            case "lava":
                reason = "용암에 빠져 사망했습니다.";
                break;
            case "lightning":
                reason = "번개에 맞아 사망했습니다.";
                break;
            case "maceSmash":
                reason = "메이스에 찍혀 사망했습니다.";
                break;
            case "magic":
                if (attacker) {
                    reason = `${attacker}의 마법 피해로 인해 사망했습니다.`;
                } else {
                    reason = "마법 피해로 사망했습니다.";
                }
                break;
            case "magma":
                reason = "마그마 블럭을 밟고 타 죽었습니다.";
                break;
            case "none":
                reason = "none 데미지의 의해 사망했습니다.";
                break;
            case "override":
                reason = "커맨드 데미지의 의해 사망했습니다.";
                break;
            case "piston":
                reason = "피스톤에 의해 사망했습니다.";
                break;
            case "projectile":
                reason = `${attacker}이 발사한 ${projectileType}에 맞아 사망했습니다.`
                break;
            case "ramAttack":
                reason = "염소 충돌로 인해 사망했습니다.";
                break;
            case "selfDestruct":
                reason = "/kill 커맨드에 의해 사망했습니다.";
                break;
            case "sonicBoom":
                reason = "워든의 음파 공격에 의해 사망했습니다.";
                break;
            case "soulCampfire":
                reason = "영혼 모닥불에 타 죽었습니다.";
                break;
            case "stalactite":
                reason = "떨어지는 종유석에 맞아 죽었습니다.";
                break;
            case "stalagmite":
                reason = "종유석에 찔러 죽었습니다.";
                break;
            case "starve":
                reason = "굶주려 죽었습니다.";
                break;
            case "suffocation":
                reason = "블럭에 끼어서 사망했습니다.";
                break;
            case "temperature":
                reason = "온도가 높아 사망했습니다.";
                break;
            case "thorns":
                reason = "가시 마법에 의해 죽었습니다.";
                break;
            case "void":
                reason = "공허에 빠져 사망했습니다.";
                break;
            case "wither":
                reason = "위더 효과에 의해 사망했습니다.";
                break;
            default:
                reason = `${cause} 원인으로 사망했습니다.`; // 알 수 없는 경우
                break;
        }
    }

    return reason;
}