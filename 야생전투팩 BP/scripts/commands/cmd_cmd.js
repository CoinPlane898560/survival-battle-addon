export function CmdHandle(origin) {
    const plyaer = origin.sourceEntity

    plyaer.sendMessage({ rawtext: [{ translate: `help` }] });
    return
}