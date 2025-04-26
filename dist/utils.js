import * as semver from "semver";
// Get GitHub configuration with optional token
export function getGitHubConfig() {
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
export function extractVersion(tagName) {
    const versionMatch = tagName.match(/@(\d+\.\d+\.\d+)$/) || tagName.match(/^v?(\d+\.\d+\.\d+)/);
    return versionMatch ? semver.clean(versionMatch[1]) : semver.clean(tagName);
}
// Format a release for display
export function formatRelease(release, fullDescription = false) {
    const description = fullDescription ? release.body : release.body?.slice(0, 500);
    const packageName = extractPackageName(release);
    const packageIndicator = packageName !== 'default' ? `📦 ${packageName}\n` : '';
    return `${packageIndicator}🔖 ${release.tag_name}${release.prerelease ? ' (Pre-release)' : ''} (${release.name || 'Unnamed release'})
🗓️ ${new Date(release.published_at).toISOString()}
📝 ${description ?? 'No description provided'}`;
}
// Fetch all releases with pagination
export async function fetchAllReleases(owner, repo, config) {
    let page = 1;
    let allReleases = [];
    const perPage = 100; // Maximum allowed by GitHub API
    while (true) {
        const url = `https://api.github.com/repos/${owner}/${repo}/releases?page=${page}&per_page=${perPage}`;
        try {
            const response = await fetch(url, { headers: config.headers });
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
        }
        catch (error) {
            throw new Error(`Failed to fetch releases from GitHub: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    return allReleases;
}
// Get a specific release by version
export async function fetchReleaseByVersion(owner, repo, version, config, packageName) {
    const releases = await fetchAllReleases(owner, repo, config);
    const cleanTargetVersion = extractVersion(version);
    if (!cleanTargetVersion) {
        throw new Error(`Invalid version format: ${version}`);
    }
    return releases.find(release => {
        const releaseVersion = extractVersion(release.tag_name);
        const matchesVersion = releaseVersion && semver.eq(releaseVersion, cleanTargetVersion);
        const matchesPackage = !packageName || extractPackageName(release) === packageName;
        return matchesVersion && matchesPackage;
    }) || null;
}
// Get releases between two versions
export async function fetchReleasesBetweenVersions(owner, repo, fromVersion, toVersion, config, packageName) {
    const releases = await fetchAllReleases(owner, repo, config);
    const cleanFromVersion = extractVersion(fromVersion);
    const cleanToVersion = extractVersion(toVersion);
    if (!cleanFromVersion || !cleanToVersion) {
        throw new Error(`Invalid version format: ${!cleanFromVersion ? fromVersion : toVersion}`);
    }
    return releases
        .filter(release => {
        const version = extractVersion(release.tag_name);
        const matchesVersion = version && semver.gte(version, cleanFromVersion) && semver.lte(version, cleanToVersion);
        const matchesPackage = !packageName || extractPackageName(release) === packageName;
        return matchesVersion && matchesPackage;
    })
        .sort((a, b) => {
        const versionA = extractVersion(a.tag_name) || '';
        const versionB = extractVersion(b.tag_name) || '';
        return semver.compare(versionA, versionB);
    });
}
// Extract package name from release tag or name
export function extractPackageName(release) {
    // First try to get it from the tag name
    const tagMatch = release.tag_name.match(/^(@[^@/]+\/[^@/]+|[^@/]+)@/);
    if (tagMatch) {
        return tagMatch[1];
    }
    // Then try from the release name
    const nameMatch = release.name.match(/^(@[^@/]+\/[^@/]+|[^@/]+)@/);
    if (nameMatch) {
        return nameMatch[1];
    }
    // If no package name found, return the repository name as default package
    return 'default';
}
// Fetch all packages for an organization
export async function fetchOrganizationPackages(org, config, packageType, visibility) {
    let page = 1;
    let allPackages = [];
    const perPage = 100; // Maximum allowed by GitHub API
    while (true) {
        let url = `https://api.github.com/orgs/${org}/packages?page=${page}&per_page=${perPage}`;
        if (packageType) {
            url += `&package_type=${packageType}`;
        }
        if (visibility) {
            url += `&visibility=${visibility}`;
        }
        try {
            const response = await fetch(url, { headers: config.headers });
            if (!response.ok) {
                throw new Error(`Error fetching packages: ${response.status} ${response.statusText}`);
            }
            const packages = await response.json();
            if (!Array.isArray(packages) || packages.length === 0) {
                break;
            }
            allPackages = allPackages.concat(packages);
            if (packages.length < perPage) {
                break;
            }
            page++;
        }
        catch (error) {
            throw new Error(`Failed to fetch packages from GitHub: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    return allPackages;
}
