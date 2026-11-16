export const difficultLabel = [
    { name: `Peaceful`, color: `§b` },
    { name: `Easy`, color: `§a` },
    { name: `Normal`, color: `§e` },
    { name: `Hard`, color: `§c` },
]

export let voteResult = []

let voterList = []

export function voteReset() {
    voteResult = [0, 0, 0, 0]
    voterList = []
}

export function tryVote(sender, msg) {
    if (msg != "0" && msg != "1" && msg != "2" && msg != "3") return false

    if (voterList.includes(sender.name)) {
        sender.sendMessage({ rawtext: [{ translate: `vote.already` }] })
        return true
    }

    const vote = Number(msg)

    voteResult[vote]++
    const label = difficultLabel[vote]
    sender.sendMessage({ rawtext: [{ translate: `vote.complete`, with: { rawtext: [{ text: `${label.color}` }, { translate: `${label.name}` }] } }] })
    voterList.push(sender.name)
    return true
}