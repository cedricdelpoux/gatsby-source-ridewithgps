const fs = require("fs")

const ENV_FILE = ".env"

// Sets the variable in place when it is already there, so that running the
// command again replaces the token instead of stacking an outdated one
const setEnvVariable = (content, name, value) => {
  const line = `${name}=${value}`
  const lines = content ? content.replace(/\n+$/, "").split("\n") : []
  const isVariable = (existingLine) => existingLine.startsWith(`${name}=`)
  const variableIndex = lines.findIndex(isVariable)
  const otherLines = lines.filter((existingLine) => !isVariable(existingLine))

  if (variableIndex === -1) {
    otherLines.push(line)
  } else {
    otherLines.splice(variableIndex, 0, line)
  }

  return otherLines.join("\n") + "\n"
}

const writeToEnvFile = (name, value, file = ENV_FILE) => {
  const content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""

  fs.writeFileSync(file, setEnvVariable(content, name, value))
}

module.exports = {setEnvVariable, writeToEnvFile}
