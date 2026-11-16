import { world } from "@minecraft/server";
import { Game } from "./data";
import { transNametoPlayer } from "../utils/support-functions";

export function spectatorChangeDimension(player) {
    if (player.getGameMode() != "Spectator") return;

    if ((player.dimension.id == "minecraft:overworld") && (player.location.y < -64 || player.location.y > 320)) return
    if ((player.dimension.id == "minecraft:nether") && (player.location.y < 0 || player.location.y > 128)) return
    if ((player.dimension.id == "minecraft:the_end") && (player.location.y < 0 || player.location.y > 256)) return

    const block = player.dimension.getBlock(player.location)

    if (!block) return
    if (block.typeId != "minecraft:portal" && block.typeId != "minecraft:end_portal") return

    const x = player.location.x
    const z = player.location.z

    const dimOver = world.getDimension("overworld");
    const dimNether = world.getDimension("nether");
    const dimEnd = world.getDimension("the_end");

    try {
        // 오버 -> 네더
        if (player.dimension.id == "minecraft:overworld" && block.typeId == "minecraft:portal") {
            player.teleport({ x: x / 8, y: 64, z: z / 8 }, { dimension: dimNether })
            return;
        }
        //네더 -> 오버
        if (player.dimension.id == "minecraft:nether" && block.typeId == "minecraft:portal") {
            player.teleport({ x: x * 8, y: 64, z: z * 8 }, { dimension: dimOver })
            return;
        }

        //오버 -> 엔더
        if (player.dimension.id == "minecraft:overworld" && block.typeId == "minecraft:end_portal") {
            player.teleport({ x: 0, y: 80, z: 0 }, { dimension: dimEnd })
            return;
        }

        //엔더 -> 오버
        if (player.dimension.id == "minecraft:the_end" && block.typeId == "minecraft:end_portal") {
            const worldx = world.getDefaultSpawnLocation().x
            const worldz = world.getDefaultSpawnLocation().z

            if (!PlayerStateData[player.name]) {
                player.teleport({ x: worldx, y: 64, z: worldz }, { dimension: dimOver })
                return
            }

            const team = PlayerStateData[player.name].team
            const teamList = Game.teamList[team]

            let tpableList = [];

            teamList.forEach((name) => {
                const target = transNametoPlayer(name)

                if (target.dimension.id === "minecraft:overworld" && target.getGameMode() == "Survival") {
                    tpableList.push(name)
                }
            })


            if (tpableList.length > 0) {
                //팀 플레이어가 있을 떄
                const form = new ActionFormData().title({ rawtext: [{ translate: `spectatorChangeDimension.formTitle` }] })

                tpableList.forEach((name) => {
                    form.button(`${name}`)
                })

                form.show(player).then(res => {
                    if (res.canceled) {
                        player.teleport({ x: x, y: player.location.y + 1, z: z });
                        return;
                    }

                    const tpLocation = transNametoPlayer(tpableList[res.selection]).location
                    player.teleport(tpLocation, { dimension: dimOver })
                    return;
                })

            } else {
                //팀 플레이어가 없을 때
                system.runTimeout(() => {
                    player.sendMessage({ rawtext: [{ translate: `spectatorChangeDimension.noPlayerMessage` }] })
                }, 10)
                player.teleport({ x: worldx, y: 64, z: worldz }, { dimension: dimOver })
                return;
            }
        }

    } catch (error) {
    }

}