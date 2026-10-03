import { detectKindId } from '../kinds/detect'
import { githubPlatform } from '../platforms/github'
import { commitInfo } from '../platforms/githubCommitUrls'
import { prInfo } from '../platforms/githubPrUrls'
import { gitlabPlatform } from '../platforms/gitlab'
import { mrInfo } from '../platforms/gitlabMrUrls'

export const VIEW_SCRIPTS = [
  'gitlab-blob',
  'gitlab-mr',
  'github-blob',
  'github-pr',
  'github-commit',
] as const

export type ViewScript = (typeof VIEW_SCRIPTS)[number]

export type PageUrl = Pick<Location, 'hostname' | 'pathname'>

interface View {
  script: ViewScript
  rendersOn: (url: PageUrl) => boolean
}

const showsDiagramFile = (url: PageUrl) => detectKindId(url.pathname) !== null

const GITLAB_VIEWS: View[] = [
  {
    script: 'gitlab-blob',
    rendersOn: (url) => gitlabPlatform.isBlob(url) && showsDiagramFile(url),
  },
  { script: 'gitlab-mr', rendersOn: (url) => mrInfo(url) !== null },
]

const GITHUB_VIEWS: View[] = [
  {
    script: 'github-blob',
    rendersOn: (url) => githubPlatform.isBlob(url) && showsDiagramFile(url),
  },
  { script: 'github-pr', rendersOn: (url) => prInfo(url) !== null },
  { script: 'github-commit', rendersOn: (url) => commitInfo(url) !== null },
]

const GITLAB_ROUTE_MARKER = '/-/'

function viewsOfHost(url: PageUrl): View[] {
  if (url.hostname === 'github.com') return GITHUB_VIEWS
  if (url.hostname === 'gitlab.com') return GITLAB_VIEWS
  const selfHostedGitlabRoute = url.pathname.includes(GITLAB_ROUTE_MARKER)
  return selfHostedGitlabRoute ? GITLAB_VIEWS : GITHUB_VIEWS
}

export function viewScriptsFor(url: PageUrl): ViewScript[] {
  return viewsOfHost(url)
    .filter((view) => view.rendersOn(url))
    .map((view) => view.script)
}
