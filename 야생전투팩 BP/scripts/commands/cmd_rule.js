export function RuleHandle(origin) {
    const plyaer = origin.sourceEntity

    plyaer.sendMessage({ rawtext: [{ translate: `rule` }] });
    return
}