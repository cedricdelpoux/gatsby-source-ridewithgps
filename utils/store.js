const fs = require("fs")
const path = require("path")

const DEFAULT_STORE_DIR = ".ridewithgps"

// Outside the Gatsby cache on purpose: Gatsby empties it on its own, and a CI
// job never has one, which would download every route on every build
const createStore = ({dir}) => {
  const routesDir = path.join(dir, "routes")
  const stateFile = path.join(dir, "state.json")
  const getRouteFile = (routeId) => path.join(routesDir, `${routeId}.json`)

  const readJson = async (file) => {
    let content

    try {
      content = await fs.promises.readFile(file, "utf8")
    } catch (error) {
      if (error.code === "ENOENT") return null

      throw error
    }

    try {
      return JSON.parse(content)
    } catch {
      throw new Error(`${file} is not valid JSON, delete it to fetch it again`)
    }
  }

  // Written next to the target then renamed, so that an interrupted build
  // leaves the previous version behind rather than a truncated file
  const writeJson = async (file, content) => {
    const temporaryFile = `${file}.tmp`

    await fs.promises.mkdir(path.dirname(file), {recursive: true})
    await fs.promises.writeFile(temporaryFile, JSON.stringify(content))
    await fs.promises.rename(temporaryFile, file)
  }

  return {
    async readRoutes() {
      let routesDirFiles

      try {
        routesDirFiles = await fs.promises.readdir(routesDir)
      } catch (error) {
        if (error.code === "ENOENT") return []

        throw error
      }

      const routeFiles = routesDirFiles.filter((file) => file.endsWith(".json"))
      const routes = []

      for (const routeFile of routeFiles) {
        const route = await readJson(path.join(routesDir, routeFile))

        if (route) routes.push(route)
      }

      return routes
    },

    async readRoute(routeId) {
      return readJson(getRouteFile(routeId))
    },

    async writeRoute(route) {
      await writeJson(getRouteFile(route.id), route)
    },

    async deleteRoute(routeId) {
      await fs.promises.rm(getRouteFile(routeId), {force: true})
    },

    async deleteAllRoutes() {
      await fs.promises.rm(routesDir, {force: true, recursive: true})
    },

    async readState() {
      return (await readJson(stateFile)) || {}
    },

    async writeState(state) {
      await writeJson(stateFile, state)
    },
  }
}

module.exports = {DEFAULT_STORE_DIR, createStore}
