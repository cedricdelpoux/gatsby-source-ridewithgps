#! /usr/bin/env node

const inquirer = require("inquirer")

const {writeToEnvFile} = require("../utils/env.js")
const {createAuthToken} = require("../utils/ridewithgps.js")

const usage = `Usage: gatsby-source-ridewithgps-token [options]

Asks for the API key of your RideWithGPS API client, your email and your
password, creates an authentication token, and writes RWGPS_API_KEY and
RWGPS_AUTH_TOKEN to your .env file. The password is only sent to RideWithGPS,
never stored.

Options:
  --help  Show this message
`

const isFilled = (input) => input.trim() !== ""

const generateToken = async (argv) => {
  if (argv.includes("--help")) {
    console.log(usage)

    return true
  }

  console.log("Create a RideWithGPS API client at")
  console.log("https://ridewithgps.com/api/api_clients")
  console.log("")

  const {apiKey, email, password} = await inquirer.prompt([
    {
      type: "input",
      name: "apiKey",
      message: "RideWithGPS API key:",
      default: process.env.RWGPS_API_KEY,
      validate: isFilled,
    },
    {
      type: "input",
      name: "email",
      message: "RideWithGPS email:",
      validate: isFilled,
    },
    {
      type: "password",
      name: "password",
      message: "RideWithGPS password:",
      mask: "*",
      validate: isFilled,
    },
  ])

  const authToken = await createAuthToken({apiKey, email, password})

  writeToEnvFile("RWGPS_API_KEY", apiKey)
  writeToEnvFile("RWGPS_AUTH_TOKEN", authToken)

  console.log("")
  console.log("RWGPS_API_KEY and RWGPS_AUTH_TOKEN added to your .env file")

  return true
}

if (require.main === module) {
  generateToken(process.argv.slice(2))
    .then((isDone) => process.exit(isDone ? 0 : 1))
    .catch((error) => {
      console.error(error.message)
      process.exit(1)
    })
}

module.exports = {generateToken}
