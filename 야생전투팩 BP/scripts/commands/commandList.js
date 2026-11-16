import { SettingHandle } from "./cmd_setting";
import { JoinPlayerHandle } from "./cmd_joinplayer";
import { VoteStartHandle } from "./cmd_vote";
import { PTPHandle } from "./cmd_ptp";
import { CmdHandle } from "./cmd_cmd";
import { RuleHandle } from "./cmd_rule";
import { DataHandle } from "./cmd_data";
import { InfoHandle } from "./cmd_info";
import { TeamHandle } from "./cmd_team";
import { ResetHandle } from "./cmd_reset";
import { StartHandle } from "./cmd_start";
import { SpeedHandle } from "./cmd_speed";
import { GGHandle } from "./cmd_gg";

export const CommandList = [
    {
        command: {
            name: 'coin:data',
            description: `command.data`,
            permissionLevel: 3 // 호스트
        },
        callBack: DataHandle
    },
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
            name: 'coin:vote',
            description: `command.vote`,
            permissionLevel: 3 // 호스트
        },
        callBack: VoteStartHandle
    },
    {
        command: {
            name: 'coin:info',
            description: `command.info`,
            permissionLevel: 3 // 호스트
        },
        callBack: InfoHandle
    },
    {
        command: {
            name: 'coin:reset',
            description: `command.reset`,
            permissionLevel: 3 // 호스트
        },
        callBack: ResetHandle
    },
    {
        command: {
            name: 'coin:start',
            description: `command.start`,
            permissionLevel: 3 // 호스트
        },
        callBack: StartHandle
    },
    {
        command: {
            name: 'coin:ptp',
            description: `command.ptp`,
            permissionLevel: 0 // 모두
        },
        callBack: PTPHandle
    },
    {
        command: {
            name: 'coin:cmd',
            description: `command.chelp`,
            permissionLevel: 0 // 모두
        },
        callBack: CmdHandle
    },
    {
        command: {
            name: 'coin:rule',
            description: `command.rule`,
            permissionLevel: 0 // 모두
        },
        callBack: RuleHandle
    },
    {
        command: {
            name: 'coin:gg',
            description: `command.gg`,
            permissionLevel: 0 // 모두
        },
        callBack: GGHandle
    },
    {
        command: {
            name: 'coin:team',
            description: `command.team`,
            permissionLevel: 0, // 모두
            optionalParameters: [
                { type: "Enum", name: 'coin:teamTypes' }
            ]
        },
        callBack: TeamHandle
    },
    {
        command: {
            name: 'coin:speed',
            description: `command.speed`,
            permissionLevel: 0, // 모두
            optionalParameters: [
                { type: "Float", name: 'horizontal' },
                { type: "Float", name: 'vertical' }
            ]
        },
        callBack: SpeedHandle
    }
]