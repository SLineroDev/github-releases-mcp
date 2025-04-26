import * as semver from "semver";

export interface GitHubConfig {
  token?: string;
  headers: {
    Accept: string;
    "User-Agent": string;
    Authorization?: string;
  };
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  published_at: string;
  body?: string;
  prerelease: boolean;
}

// Get GitHub configuration with optional token
export function getGitHubConfig(): GitHubConfig {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  return {
    token,
    headers: {
      "Accept": "application/vnd.github+json",
      "User-Agent": "mcp-github-releases-server",
      ...(token && {
        "Authorization": `Bearer ${token}`
      })
    }
  };
}

// Extract clean version from tag name
export function extractVersion(tagName: string): string | null {
  const versionMatch = tagName.match(/@(\d+\.\d+\.\d+)$/) || tagName.match(/^v?(\d+\.\d+\.\d+)/);
  return versionMatch ? semver.clean(versionMatch[1]) : semver.clean(tagName);
}

// Format a release for display
export function formatRelease(release: GitHubRelease, fullDescription: boolean = false): string {
  const description = fullDescription ? release.body : release.body?.slice(0, 200);
  return `🔖 ${release.tag_name}${release.prerelease ? ' (Pre-release)' : ''} (${release.name || 'Unnamed release'})
🗓️ ${new Date(release.published_at).toISOString()}
📝 ${description ?? 'No description provided'}`;
}

// Fetch all releases with pagination
export async function fetchAllReleases(
  owner: string, 
  repo: string, 
  config: GitHubConfig
): Promise<GitHubRelease[]> {
  let page = 1;
  let allReleases: GitHubRelease[] = [];
  const perPage = 100; // Maximum allowed by GitHub API

  while (true) {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases?page=${page}&per_page=${perPage}`;
    
    try {
      const response = await fetch(url, { headers: config.headers })

      if (!response.ok) {
        throw new Error(`Error fetching releases: ${response.status} ${response.statusText}`);
      }

      const releases = await response.json();
      
      if (!Array.isArray(releases) || releases.length === 0) {
        break;
      }

      allReleases = allReleases.concat(releases);

      if (releases.length < perPage) {
        break;
      }

      page++;
    } catch (error) {
      throw new Error(`Failed to fetch releases from GitHub: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return allReleases;
}

// Get a specific release by version
export async function fetchReleaseByVersion(
  owner: string,
  repo: string,
  version: string,
  config: GitHubConfig
): Promise<GitHubRelease | null> {
  const releases = await fetchAllReleases(owner, repo, config);
  const cleanTargetVersion = extractVersion(version);
  
  if (!cleanTargetVersion) {
    throw new Error(`Invalid version format: ${version}`);
  }

  return releases.find(release => {
    const releaseVersion = extractVersion(release.tag_name);
    return releaseVersion && semver.eq(releaseVersion, cleanTargetVersion);
  }) || null;
}

// Get releases between two versions
export async function fetchReleasesBetweenVersions(
  owner: string,
  repo: string,
  fromVersion: string,
  toVersion: string,
  config: GitHubConfig
): Promise<GitHubRelease[]> {
  const releases = await fetchAllReleases(owner, repo, config);
  const cleanFromVersion = extractVersion(fromVersion);
  const cleanToVersion = extractVersion(toVersion);

  if (!cleanFromVersion || !cleanToVersion) {
    throw new Error(`Invalid version format: ${!cleanFromVersion ? fromVersion : toVersion}`);
  }

  return releases
    .filter(release => {
      const version = extractVersion(release.tag_name);
      if (!version) return false;
      return semver.gte(version, cleanFromVersion) && semver.lte(version, cleanToVersion);
    })
    .sort((a, b) => {
      const versionA = extractVersion(a.tag_name) || '';
      const versionB = extractVersion(b.tag_name) || '';
      return semver.compare(versionA, versionB);
    });
} 