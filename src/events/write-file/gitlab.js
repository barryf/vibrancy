const logger = require('@architect/shared/logger')
const { Gitlab } = require('@gitbeaker/node')

const gitlab = new Gitlab({
  token: process.env.GITLAB_TOKEN
})

const gitlabConfig = {
  projectId: process.env.GITLAB_PROJECT_ID,
  ref: process.env.GITLAB_REPO_REF || 'main'
}

async function writeFile (filePath, method, file, entity) {
  // check if file already exists (and we're updating)
  try {
    await gitlab.RepositoryFiles.show(
      gitlabConfig.projectId,
      filePath,
      gitlabConfig.ref
    )
  } catch (err) {
    if (err.status !== 404) {
      logger.error('Error fetching file from GitLab', JSON.stringify(err, null, 2))
    }
    return await gitlab.RepositoryFiles.create(
      gitlabConfig.projectId,
      filePath,
      gitlabConfig.ref,
      file,
      `${entity} ${method}d`
    )
  }
  method = 'update'
  return await gitlab.RepositoryFiles.edit(
    gitlabConfig.projectId,
    filePath,
    gitlabConfig.ref,
    file,
    `${entity} ${method}d`
  )
}

module.exports = { writeFile }
