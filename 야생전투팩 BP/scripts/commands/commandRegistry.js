import { system } from "@minecraft/server"
import { CommandList } from "./commandList"

export const CommandRegistry = system.beforeEvents.startup.subscribe((init) => {
    for (const cmd of CommandList) {
        init.customCommandRegistry.registerCommand(cmd.command, cmd.callBack)
    }
})