# GitHub Releases MCP Server

This MCP server provides access to GitHub repository releases information.

## Configuration

The server accepts the following optional environment variables:

- `GITHUB_PERSONAL_ACCESS_TOKEN`: GitHub Personal Access Token (optional). If provided, it will be used to authenticate API requests, allowing for higher rate limits and access to private repositories.

## Quick Start

You can run this MCP server using npx:

```bash
# Using environment variables
GITHUB_PERSONAL_ACCESS_TOKEN=your_token npx @modelcontextprotocol/github-releases-mcp

# Or using a .env file
echo "GITHUB_PERSONAL_ACCESS_TOKEN=your_token" > .env
npx @modelcontextprotocol/github-releases-mcp
```

## Client Configuration

The server can be used with various MCP clients. Add the following configuration to your client's config file:

- Cursor: `~/.cursor/mcp.json`
- VS Code: `.vscode/settings.json` (use `mcp.servers` instead of `mcpServers`)
- Claude Desktop: `claude_desktop_config.json`
- Windsurf: `windsurf_config.json`

### Using Local Development Version

```json
{
  "mcpServers": {
    "github-releases": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "${workspaceRoot}/main.ts"
      ]
    }
  }
}
```

### Using Published Version

```json
{
  "mcpServers": {
    "github-releases": {
      "command": "npx",
      "args": [
        "-y",
        "@slinerodev/github-releases-mcp"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

Note: 
- For VS Code, replace `mcpServers` with `mcp.servers` in the configuration.
- Replace `your_token_here` with your GitHub Personal Access Token if you want to access private repositories or need higher rate limits.
- The local development version is typically used when working on the server code itself.

## Available Tools

The server provides the following tool:

- `github.releases`: Retrieves the list of releases from a GitHub repository.

### Parameters

- `owner`: Repository owner (user or organization)
- `repo`: Repository name

### Example Response

```
🔖 v1.0.0 (First stable release)
🗓️ 2025-04-01T12:00:00Z
📝 This is the first stable release of the project...

---

🔖 v0.9.0 (Beta)
🗓️ 2025-03-15T10:30:00Z
📝 Beta version with main features...
```

## Development

1. Install dependencies:
```bash
pnpm install
```

2. Run the server:
```bash
pnpm start
```

## Features

- Fetches releases from any public GitHub repository
- Displays release information including:
  - Tag name
  - Release name
  - Publication date
  - Release description (first 200 characters)
- Handles errors gracefully
- Uses GitHub's REST API
- Optional authentication for private repositories and higher rate limits

## Usage in MCP Environment

This tool is designed to be used with the Model Context Protocol. To use it in your MCP-compatible environment:

```typescript
const result = await mcp.invoke("github.releases", {
  owner: "owner-name",
  repo: "repo-name"
});
```

### Error Handling

The tool handles various error cases:

- Invalid repository
- No releases found
- API rate limits
- Network issues
- Authentication errors

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Author

Sergio Linero
