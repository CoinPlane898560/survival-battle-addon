import { world, system } from "@minecraft/server";
import { Game } from "../main";

let voteResult = {
    peaceful: 0,
    easy: 0,
    normal: 0,
    hard: 0,
};

let voterList = []

export function VoteStartHandle(origin) {
    const player = origin.sourceEntity

    if (Game.state == "play") {
        player.sendMessage({ rawtext: [{ translate: `error.VoteDuringGame` }] })
        return
    }

    let time = 0;

    system.runTimeout(() => {
    }, 400)
}