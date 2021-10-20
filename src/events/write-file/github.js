const logger = require('@architect/shared/logger')
const { Octokit } = require('@octokit/rest')

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'Vibrancy https://github.com/barryf/vibrancy'
})

const githubConfig = {
  owner: process.env.GITHUB_OWNER,
  repo: process.env.GITHUB_REPO,
  ref: process.env.GITHUB_BRANCH || 'master'
}

async function writeFile (path, method, file, entity) {
  const params = {
    path,
    message: `${entity} ${method}d`,
    content: file,
    branch: githubConfig.ref,
    ...githubConfig
  }
  // check if file already exists (and we're updating)
  try {
    const response = await octokit.repos.getContent({
      path,
      ...githubConfig
    })
    params.sha = response.data.sha
  } catch (err) {
    if (err.status !== 404) {
      logger.error('Error fetching file from GitHub', JSON.stringify(err, null, 2))
    }
  }
  return await octokit.repos.createOrUpdateFileContents(params)
}

module.exports = { writeFile }
