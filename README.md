# GitHub Releases MCP Tool

A Model Context Protocol (MCP) tool that fetches and displays GitHub repository releases in a formatted way.

## Features

- Fetches releases from any public GitHub repository
- Displays release information including:
  - Tag name
  - Release name
  - Publication date
  - Release description (first 200 characters)
- Handles errors gracefully
- Uses GitHub's REST API

## Installation

```bash
# Using pnpm (recommended)
pnpm install

# Using npm
npm install

# Using yarn
yarn install
```

## Usage

This tool is designed to be used with the Model Context Protocol. To use it in your MCP-compatible environment:

```typescript
const result = await mcp.invoke("github.releases", {
  owner: "owner-name",
  repo: "repo-name"
});
```

### Parameters

- `owner`: The GitHub repository owner (username or organization)
- `repo`: The name of the GitHub repository

### Response Format

The tool returns releases in a formatted text with emojis:

```
🔖 v1.0.0 (First Release)
🗓️ 2024-01-01T00:00:00Z
📝 Release description...

---

🔖 v0.9.0 (Beta Release)
🗓️ 2023-12-01T00:00:00Z
📝 Beta release description...
```

## Error Handling

The tool handles various error cases:
- Invalid repository
- No releases found
- API errors
- Network issues

## Development

To run the tool in development mode:

```bash
pnpm dev
```

## License

ISC

## Author

Sergio Linero 