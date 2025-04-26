#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getGitHubConfig, formatRelease, fetchAllReleases, fetchReleaseByVersion, fetchReleasesBetweenVersions } from "./utils.js";
// Create MCP server
const server = new McpServer({
    name: "GitHub Releases MCP Server",
    version: "1.0.0",
});
// Helper function for logging
function log(level, message) {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[${timestamp}] ${level.toUpperCase()}: ${message}\n`);
}
// Schema definitions
const baseSchema = {
    owner: z.string().describe("GitHub repository owner"),
    repo: z.string().describe("GitHub repository name"),
};
const releaseInfoSchema = {
    ...baseSchema,
    version: z.string().describe("The specific version to get information about (supports formats: v1.0.0, @1.0.0, 1.0.0)")
};
const releasesCompareSchema = {
    ...baseSchema,
    fromVersion: z.string().describe("The base version to compare from (supports formats: v1.0.0, @1.0.0, 1.0.0)"),
    toVersion: z.string().describe("The target version to compare to (supports formats: v1.0.0, @1.0.0, 1.0.0)")
};
const releasesListSchema = {
    ...baseSchema,
    limit: z.number().optional().describe("Maximum number of releases to return (default: all)"),
    includePreReleases: z.boolean().optional().describe("Whether to include pre-releases in the results (default: false)")
};
// Register 'github_release_info' tool
server.tool("github_release_info", "Get detailed information about a specific GitHub release version. Supports semantic versioning formats (v1.0.0, @1.0.0, 1.0.0) and returns comprehensive release details including tag name, release title, publication date, and full release notes. Perfect for understanding what changed in a specific version or for documentation purposes.", releaseInfoSchema, async ({ owner, repo, version }, context) => {
    const config = getGitHubConfig();
    try {
        log('info', `Fetching release info for ${owner}/${repo}@${version}`);
        const release = await fetchReleaseByVersion(owner, repo, version, config);
        if (!release) {
            log('warn', `No release found for version ${version}`);
            return {
                content: [
                    {
                        type: "text",
                        text: `No release found for version ${version} in repository ${owner}/${repo}.`,
                    },
                ],
            };
        }
        log('info', `Successfully retrieved release info for ${release.tag_name}`);
        return {
            content: [
                {
                    type: "text",
                    text: formatRelease(release, true), // true for full description
                },
            ],
        };
    }
    catch (error) {
        log('error', `Error fetching release info: ${error.message}`);
        return {
            content: [
                {
                    type: "text",
                    text: `Error fetching release info: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});
// Register 'github_releases_compare' tool
server.tool("github_releases_compare", "Compare changes between two GitHub release versions. Ideal for understanding what changed between versions, generating changelogs, or migration guides. Returns a chronological list of all releases between the two versions with their full release notes, making it perfect for analyzing the evolution of features, bug fixes, and breaking changes. Supports semantic versioning formats (v1.0.0, @1.0.0, 1.0.0).", releasesCompareSchema, async ({ owner, repo, fromVersion, toVersion }, context) => {
    const config = getGitHubConfig();
    try {
        log('info', `Comparing releases between ${fromVersion} and ${toVersion} for ${owner}/${repo}`);
        const releases = await fetchReleasesBetweenVersions(owner, repo, fromVersion, toVersion, config);
        if (releases.length === 0) {
            log('warn', `No releases found between versions ${fromVersion} and ${toVersion}`);
            return {
                content: [
                    {
                        type: "text",
                        text: `No releases found between versions ${fromVersion} and ${toVersion} in repository ${owner}/${repo}.`,
                    },
                ],
            };
        }
        log('info', `Found ${releases.length} releases between ${fromVersion} and ${toVersion}`);
        const formattedReleases = releases
            .map(release => formatRelease(release, true))
            .join("\n\n---\n\n");
        return {
            content: [
                {
                    type: "text",
                    text: `Changes between ${fromVersion} and ${toVersion}:\n\n${formattedReleases}`,
                },
            ],
        };
    }
    catch (error) {
        log('error', `Error comparing releases: ${error.message}`);
        return {
            content: [
                {
                    type: "text",
                    text: `Error comparing releases: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});
// Register 'github_releases_list' tool
server.tool("github_releases_list", "List all GitHub releases for a repository with rich formatting and comprehensive details. Returns releases in chronological order with emojis for better readability (🔖 for versions, 🗓️ for dates, 📝 for descriptions). Perfect for getting an overview of a project's release history, finding the latest version, or monitoring release frequency. Supports pagination and filtering of pre-releases.", releasesListSchema, async ({ owner, repo, limit, includePreReleases = false }, context) => {
    const config = getGitHubConfig();
    try {
        log('info', `Fetching releases for ${owner}/${repo} (limit: ${limit || 'none'}, includePreReleases: ${includePreReleases})`);
        let releases = await fetchAllReleases(owner, repo, config);
        // Filter pre-releases if needed
        if (!includePreReleases) {
            releases = releases.filter(release => !release.prerelease);
        }
        // Apply limit if specified
        if (limit && limit > 0) {
            releases = releases.slice(0, limit);
        }
        if (releases.length === 0) {
            log('warn', `No releases found for ${owner}/${repo}`);
            return {
                content: [
                    {
                        type: "text",
                        text: `No releases found for repository ${owner}/${repo}.`,
                    },
                ],
            };
        }
        log('info', `Found ${releases.length} releases for ${owner}/${repo}`);
        const formattedReleases = releases
            .map(release => formatRelease(release))
            .join("\n\n---\n\n");
        return {
            content: [
                {
                    type: "text",
                    text: formattedReleases,
                },
            ],
        };
    }
    catch (error) {
        log('error', `Error fetching releases: ${error.message}`);
        return {
            content: [
                {
                    type: "text",
                    text: `Error fetching releases: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});
// Connect server using stdio transport
const transport = new StdioServerTransport();
// Log server startup
log('info', 'GitHub Releases MCP Server starting up');
await server.connect(transport);
