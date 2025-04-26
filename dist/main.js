#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// Función para obtener la configuración de GitHub
function getGitHubConfig() {
    return {
        token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
        headers: {
            "Accept": "application/vnd.github+json",
            "User-Agent": "mcp-github-releases-server",
            ...(process.env.GITHUB_PERSONAL_ACCESS_TOKEN && {
                "Authorization": `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`
            })
        }
    };
}
// Input schema definition using Zod
const schema = {
    owner: z.string().describe("GitHub repository owner"),
    repo: z.string().describe("GitHub repository name"),
};
// Create MCP server
const server = new McpServer({
    name: "GitHub Releases MCP Server",
    version: "1.0.0",
});
// Register 'github_releases' tool
server.tool("github_releases", "Get the list of releases from a GitHub repository.", schema, async ({ owner, repo }) => {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases`;
    const config = getGitHubConfig();
    try {
        const response = await fetch(url, {
            headers: config.headers
        });
        if (!response.ok) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error fetching releases: ${response.status} ${response.statusText}`,
                    },
                ],
                isError: true,
            };
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No releases found for repository ${owner}/${repo}.`,
                    },
                ],
            };
        }
        const releases = data.map((release) => ({
            id: release.id,
            tag_name: release.tag_name,
            name: release.name,
            published_at: release.published_at,
            body: release.body,
        }));
        const formattedReleases = releases
            .map((r) => `🔖 ${r.tag_name} (${r.name})\n🗓️ ${r.published_at}\n📝 ${r.body?.slice(0, 200) ?? "No description"}\n`)
            .join("\n---\n");
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
        return {
            content: [
                {
                    type: "text",
                    text: `Exception while fetching releases: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});
// Connect server using stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
