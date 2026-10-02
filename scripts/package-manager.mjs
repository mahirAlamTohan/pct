import { spawnSync } from "node:child_process"
import path from "node:path"

const supportedManagers = new Set(["npm", "pnpm", "bun"])
const userAgent = process.env.npm_config_user_agent?.split(/\s+/, 1)[0]
const managerFromAgent = userAgent?.split("/", 1)[0]?.toLowerCase()
const executableName = path
  .basename(process.env.npm_execpath ?? "")
  .toLowerCase()
const managerFromPath = executableName.includes("pnpm")
  ? "pnpm"
  : executableName.includes("bun")
    ? "bun"
    : "npm"

export const packageManagerName = supportedManagers.has(managerFromAgent ?? "")
  ? managerFromAgent
  : managerFromPath

const packageManagerEntry = process.env.npm_execpath
const canRunEntryWithNode = /\.(?:cjs|mjs|js)$/i.test(packageManagerEntry ?? "")

export function packageManagerRun(script, ...args) {
  return ["run", script, ...args]
}

export function packageManagerExec(command, ...args) {
  if (packageManagerName === "bun") return ["x", command, ...args]
  if (packageManagerName === "pnpm") return ["exec", command, ...args]
  return ["exec", "--", command, ...args]
}

export function packageManagerLabel(args) {
  return `${packageManagerName} ${args.join(" ")}`
}

export function runPackageManager(args, options = {}) {
  if (canRunEntryWithNode) {
    return spawnSync(process.execPath, [packageManagerEntry, ...args], {
      ...options,
      shell: false,
    })
  }

  if (process.platform === "win32" && packageManagerName !== "bun") {
    throw new Error(
      "Run this test script through `npm run` or `pnpm run` so it can invoke the package-manager JavaScript entry without a Windows shell."
    )
  }

  return spawnSync(packageManagerName, args, {
    ...options,
    shell: false,
  })
}
