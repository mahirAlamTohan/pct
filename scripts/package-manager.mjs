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

  const entryExtension = path.extname(packageManagerEntry ?? "").toLowerCase()
  if (
    process.platform === "win32" &&
    packageManagerEntry &&
    [".exe", ".com"].includes(entryExtension)
  ) {
    return spawnSync(packageManagerEntry, args, {
      ...options,
      shell: false,
    })
  }

  const fallbackResult = spawnSync(packageManagerName, args, {
    ...options,
    shell: false,
  })
  if (!fallbackResult.error) return fallbackResult

  if (process.platform === "win32" && packageManagerName !== "bun") {
    throw new Error(
      `Cannot invoke ${packageManagerName} without a Windows shell: npm_execpath=${packageManagerEntry || "<missing>"}; npm_config_user_agent=${process.env.npm_config_user_agent || "<missing>"}; direct executable error=${fallbackResult.error.message}. Use a Node JavaScript entry or a native package-manager executable on PATH.`
    )
  }

  return fallbackResult
}
