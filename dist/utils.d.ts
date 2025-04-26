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
export interface GitHubPackage {
    id: number;
    name: string;
    package_type: string;
    owner: {
        login: string;
        id: number;
        type: string;
    };
    version_count?: number;
    visibility: string;
    url: string;
    html_url: string;
    created_at: string;
    updated_at: string;
    repository?: {
        id: number;
        node_id: string;
        name: string;
        full_name: string;
        private: boolean;
    };
}
export declare function getGitHubConfig(): GitHubConfig;
export declare function extractVersion(tagName: string): string | null;
export declare function formatRelease(release: GitHubRelease, fullDescription?: boolean): string;
export declare function fetchAllReleases(owner: string, repo: string, config: GitHubConfig): Promise<GitHubRelease[]>;
export declare function fetchReleaseByVersion(owner: string, repo: string, version: string, config: GitHubConfig, packageName?: string): Promise<GitHubRelease | null>;
export declare function fetchReleasesBetweenVersions(owner: string, repo: string, fromVersion: string, toVersion: string, config: GitHubConfig, packageName?: string): Promise<GitHubRelease[]>;
export declare function extractPackageName(release: GitHubRelease): string;
export declare function fetchOrganizationPackages(org: string, config: GitHubConfig, packageType?: string, visibility?: 'public' | 'private' | 'internal'): Promise<GitHubPackage[]>;
