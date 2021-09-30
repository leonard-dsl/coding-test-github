import { Octokit } from '@octokit/core'

import config from '../config'

const octokit = new Octokit(config.octokit)
export default octokit
