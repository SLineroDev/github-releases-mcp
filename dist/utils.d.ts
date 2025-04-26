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
export declare function getGitHubConfig(): GitHubConfig;
export declare function extractVersion(tagName: string): string | null;
export declare function formatRelease(release: GitHubRelease, fullDescription?: boolean): string;
export declare function fetchAllReleases(owner: string, repo: string, config: GitHubConfig): Promise<GitHubRelease[]>;
export declare function fetchReleaseByVersion(owner: string, repo: string, version: string, config: GitHubConfig): Promise<GitHubRelease | null>;
export declare function fetchReleasesBetweenVersions(owner: string, repo: string, fromVersion: string, toVersion: string, config: GitHubConfig): Promise<GitHubRelease[]>;
