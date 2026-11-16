import { world, system } from "@minecraft/server"
import { ModalFormData } from "@minecraft/server-ui"
import { Game } from "../game/data"
import { SaveData } from "../utils/save-road"

export function SettingHandle(origin) {
    const player = origin.sourceEntity

    if (Game.state == 'play') {
        return {
            message: `command.failure.ChangeSettingsDuringGame`,
            status: 1
        }
    }

    const Setting = Game.setting

    const form = new ModalFormData()
        .title({ rawtext: [{ translate: `setting.title` }] })
        .toggle({ rawtext: [{ translate: `setting.show_coordinates` }] }, { defaultValue: Setting.showcoordinates })
        .toggle({ rawtext: [{ translate: `setting.restrict_third-person_view` }] }, { defaultValue: Setting.thirdPersonLimit })
        .toggle({ rawtext: [{ translate: `setting.render_distance_limit` }] }, { defaultValue: Setting.renderLimit })
        .toggle({ rawtext: [{ translate: `setting.team_spawn` }] }, { defaultValue: Setting.teamSpawn })
        .toggle({ rawtext: [{ translate: `setting.wild_mode` }] }, { defaultValue: Setting.wildMode })
        .slider({ rawtext: [{ translate: `setting.number_of_teams` }] }, 2, 4, { defaultValue: Setting.teamCount });

    system.run(() => {
        form.show(player)
            .then(res => {
                if (res.canceled) return;

                Setting.showcoordinates = res.formValues[0];
                Setting.thirdPersonLimit = res.formValues[1];
                Setting.renderLimit = res.formValues[2];
                Setting.teamSpawn = res.formValues[3];
                Setting.wildMode = res.formValues[4];
                Setting.teamCount = res.formValues[5];

                if (Setting.teamCount > world.getAllPlayers().filter(p => !p.hasTag("spectator")).length) {
                    world.sendMessage({ rawtext: [{ translate: `error.TeamCountOver` }] });
                    Setting.teamCount = 2;
                }

                SaveData("Game", Game)

                function settingMessage(transMessage, isOn, color) {
                    return {
                        rawtext: [
                            { text: color ? "§7" : "" },
                            { translate: transMessage },
                            { text: ": " },
                            {
                                translate: isOn ? `setting.on` : `setting.off`
                            }
                        ]
                    };
                }

                function settingMessageTeamSpawn(transMessage, isOn, color) {
                    return {
                        rawtext: [
                            { text: color ? "§7" : "" },
                            { translate: transMessage },
                            { text: ": " },
                            { text: isOn ? `§l§b` : `§l§e` },
                            {
                                translate: isOn ? `setting.team_spawn` : `setting.random_spawn`
                            }
                        ]
                    };
                }

                world.sendMessage({ rawtext: [{ text: `§g－－－－－－－－ §6` }, { translate: `setting.title` }, { text: ` §g－－－－－－－－` }] });
                world.sendMessage(settingMessage(`setting.show_coordinates`, Setting.showcoordinates));
                world.sendMessage(settingMessage(`setting.restrict_third-person_view`, Setting.thirdPersonLimit, true));
                world.sendMessage(settingMessage(`setting.render_distance_limit`, Setting.renderLimit));
                world.sendMessage(settingMessage(`setting.wild_mode`, Setting.wildMode, true));
                world.sendMessage({ rawtext: [{ translate: `setting.number_of_teams.result`, with: [`${Setting.teamCount}`] }] });
                world.sendMessage(settingMessageTeamSpawn(`setting.team_spawn`, Setting.teamSpawn))
                world.sendMessage(`§g－－－－－－－－－－－－－－－－－－－－－－－`)

                world.gameRules.showCoordinates = Setting.showcoordinates
            })
    })
}