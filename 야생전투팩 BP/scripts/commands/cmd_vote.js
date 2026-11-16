import { world, system } from "@minecraft/server";
import { Game } from "../game/data";
import { SaveData } from "../utils/save-road";
import { voteReset, voteResult, difficultLabel } from "../game/vote";

export function VoteStartHandle(origin) {
    const player = origin.sourceEntity

    if (Game.state == "play") {
        return {
            message: 'command.failure.VoteDuringGame',
            status: 1
        }
    }

    Game.state = "vote"
    voteReset()

    system.run(() => {
        world.sendMessage({ rawtext: [{ translate: `system.vote.start` }] })
    })

    system.runTimeout(() => {

        Game.state = "lobby"

        let maxVote = [];
        let max = 0

        for (const count of [0, 1, 2, 3]) {

            const voteCount = voteResult[count]

            if (max > voteCount) continue;

            if (max == voteCount) {
                maxVote.push(count);
                continue;
            }

            if (max < voteCount) {
                maxVote.length = 0;
                maxVote.push(count);
                max = voteCount
                continue;
            }
        }

        if (maxVote.length > 1) {
            maxVote = [maxVote[Math.floor(Math.random() * (maxVote.length))]]
        }

        Game.data.difficult = difficultLabel[maxVote[0]].name;

        SaveData("Game", Game)
        world.setDifficulty(`${Game.data.difficult}`)

        //투표 결과 띄우기
        world.sendMessage({ rawtext: [{ translate: `vote.result1` }] });

        for (const count of [0, 1, 2, 3]) {
            world.sendMessage({ rawtext: [{ text: `${difficultLabel[count].color}` }, { translate: `${difficultLabel[count].name}` }, { text: `: ${voteResult[count]}` }] });
        }

        world.sendMessage(``);
        world.sendMessage({ rawtext: [{ translate: "vote.result2", with: { rawtext: [{ text: `§l${difficultLabel[maxVote].color}` }, { translate: `${Game.data.difficult}` }] } }] })
        world.sendMessage(`§3－－－－－－－－－－－－－－－－－－`);
    }, 100)
}