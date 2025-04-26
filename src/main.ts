#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  getGitHubConfig,
  formatRelease,
  fetchAllReleases,
  fetchReleaseByVersion,
  fetchReleasesBetweenVersions,
  extractPackageName,
  fetchOrganizationPackages,
} from "./utils.js";
import { Buffer } from 'buffer';

// Create MCP server
const server = new McpServer({
  name: "GitHub Releases MCP Server",
  version: "1.0.0",
});

// Schema definitions
const baseSchema = {
  owner: z.string().describe("GitHub repository owner"),
  repo: z.string().describe("GitHub repository name"),
  package: z.string().optional().describe("Package name to filter releases for (e.g. 'astro', '@astrojs/vue'). If not provided, will match against all packages."),
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

// Schema for organization packages list
const orgPackagesSchema = {
  org: z.string().describe("The organization name"),
  package_type: z.string().optional().describe("The type of package to filter for (e.g. npm, maven, docker, container)"),
  visibility: z.enum(['public', 'private', 'internal']).optional().describe("Filter packages by their visibility")
};

// Schema for fetching a repo's README
const repoReadmeSchema = {
  owner: z.string().describe("GitHub repository owner"),
  repo: z.string().describe("GitHub repository name")
};

// Register 'github_release_info' tool
server.tool(
  "github_release_info",
  "Get detailed information about a specific GitHub release version. Supports semantic versioning formats (v1.0.0, @1.0.0, 1.0.0) and returns comprehensive release details including tag name, release title, publication date, and full release notes. Perfect for understanding what changed in a specific version or for documentation purposes.",
  releaseInfoSchema,
  async ({ owner, repo, version, package: packageName }, context) => {
    const config = getGitHubConfig();

    try {
      const release = await fetchReleaseByVersion(owner, repo, version, config, packageName);

      if (!release) {
        const packageInfo = packageName ? ` for package ${packageName}` : '';
        return {
          content: [
            {
              type: "text",
              text: `No release found for version ${version}${packageInfo} in repository ${owner}/${repo}.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: formatRelease(release, true), // true for full description
          },
        ],
      };
    } catch (error: any) {
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
  }
);

// Register 'github_releases_compare' tool
server.tool(
  "github_releases_compare",
  "Compare changes between two GitHub release versions. Ideal for understanding what changed between versions, generating changelogs, or migration guides. Returns a chronological list of all releases between the two versions with their full release notes, making it perfect for analyzing the evolution of features, bug fixes, and breaking changes. Supports semantic versioning formats (v1.0.0, @1.0.0, 1.0.0).",
  releasesCompareSchema,
  async ({ owner, repo, fromVersion, toVersion, package: packageName }, context) => {
    const config = getGitHubConfig();

    try {
      const releases = await fetchReleasesBetweenVersions(owner, repo, fromVersion, toVersion, config, packageName);

      if (releases.length === 0) {
        const packageInfo = packageName ? ` for package ${packageName}` : '';
        return {
          content: [
            {
              type: "text",
              text: `No releases found between versions ${fromVersion} and ${toVersion}${packageInfo} in repository ${owner}/${repo}.`,
            },
          ],
        };
      }

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
    } catch (error: any) {
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
  }
);

// Register 'github_releases_list' tool
server.tool(
  "github_releases_list",
  "List all GitHub releases for a repository with rich formatting and comprehensive details. Returns releases in chronological order with emojis for better readability (🔖 for versions, 🗓️ for dates, 📝 for descriptions). Perfect for getting an overview of a project's release history, finding the latest version, or monitoring release frequency. Supports pagination and filtering of pre-releases.",
  releasesListSchema,
  async ({ owner, repo, limit, includePreReleases = false, package: packageName }, context) => {
    const config = getGitHubConfig();

    try {
      let releases = await fetchAllReleases(owner, repo, config);

      // Filter by package if specified
      if (packageName) {
        releases = releases.filter(release => extractPackageName(release) === packageName);
      }

      // Filter pre-releases if needed
      if (!includePreReleases) {
        releases = releases.filter(release => !release.prerelease);
      }

      // Apply limit if specified
      if (limit && limit > 0) {
        releases = releases.slice(0, limit);
      }

      if (releases.length === 0) {
        const packageInfo = packageName ? ` for package ${packageName}` : '';
        return {
          content: [
            {
              type: "text",
              text: `No releases found${packageInfo} in repository ${owner}/${repo}.`,
            },
          ],
        };
      }

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
    } catch (error: any) {
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
  }
);

// Register 'github_org_packages' tool
server.tool(
  "github_org_packages",
  "List all packages for a GitHub organization. Returns detailed information about each package including its name, type, visibility, and repository details. Perfect for discovering available packages and their metadata in an organization.",
  orgPackagesSchema,
  async ({ org, package_type, visibility }, context) => {
    const config = getGitHubConfig();

    try {
      const packages = await fetchOrganizationPackages(org, config, package_type, visibility);

      if (packages.length === 0) {
        const typeInfo = package_type ? ` of type ${package_type}` : '';
        const visibilityInfo = visibility ? ` with ${visibility} visibility` : '';
        return {
          content: [
            {
              type: "text",
              text: `No packages found${typeInfo}${visibilityInfo} in organization ${org}.`,
            },
          ],
        };
      }

      const formattedPackages = packages.map(pkg => {
        return `📦 ${pkg.name} (${pkg.package_type})
🔒 Visibility: ${pkg.visibility}
📊 Version count: ${pkg.version_count || 'N/A'}
🔗 URL: ${pkg.html_url}
📅 Created: ${new Date(pkg.created_at).toISOString()}
🔄 Updated: ${new Date(pkg.updated_at).toISOString()}
${pkg.repository ? `📁 Repository: ${pkg.repository.full_name}` : ''}`;
      }).join('\n\n---\n\n');

      return {
        content: [
          {
            type: "text",
            text: formattedPackages,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching organization packages: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register 'github_repo_readme' tool
server.tool(
  "github_repo_readme",
  "Fetch the README file for a GitHub repository and return its plain text content. Useful for discovering package names and documentation in monorepos.",
  repoReadmeSchema,
  async ({ owner, repo }, context) => {
    const config = getGitHubConfig();
    const url = `https://api.github.com/repos/${owner}/${repo}/readme`;
    try {
      const response = await fetch(url, { headers: config.headers });
      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching README: ${response.status} ${response.statusText}`,
            },
          ],
          isError: true,
        };
      }
      const data = await response.json();
      if (!data.content) {
        return {
          content: [
            {
              type: "text",
              text: `No README content found in repository ${owner}/${repo}.`,
            },
          ],
          isError: true,
        };
      }
      // README is base64 encoded
      const readme = Buffer.from(data.content, 'base64').toString('utf-8');
      return {
        content: [
          {
            type: "text",
            text: readme,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching README: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Connect server using stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);