import { SettingHandle } from "./cmd_setting";
import { JoinPlayerHandle } from "./cmd_joinplayer";

export const CommandList = [
    {
        command: {
            name: 'coin:setting',
            description: `command.setting`,
            permissionLevel: 3 // 호스트
        },
        callBack: SettingHandle
    },
    {
        command: {
            name: 'coin:joinplayer',
            description: `command.joinplayer`,
            permissionLevel: 3 // 호스트
        },
        callBack: JoinPlayerHandle
    },
    {
        command: {
            name: 'coin:votestart',
            description: `command.votestart`,
            permissionLevel: 3 // 호스트
        },
        callBack: JoinPlayerHandle
    },
    {
        command: {
            name: 'coin:vote',
            description: `command.vote`,
            permissionLevel: 0 // 모두
        },
        callBack: JoinPlayerHandle
    }
]