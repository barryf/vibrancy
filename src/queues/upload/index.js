const arc = require('@architect/functions')
const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'vibrancy'
})

exports.handler = async function queue (event) {
  console.log(`event=${event}`)
}