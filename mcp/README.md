# hlmnhkl-ui-mcp

A read-only MCP server for [hlmnhkl/ui](https://ui.hlmnhkl.my). AI coding tools such as Claude Code, Cursor and VS Code use it to look up components, their props and install steps.

```sh
claude mcp add hlmnhkl-ui -- npx -y hlmnhkl-ui-mcp
```

Setup for other tools, and what it can and cannot do: https://ui.hlmnhkl.my/mcp

It only reads the docs file in this package. It writes no files, runs no commands and makes no network requests. It needs Node 20 or later. MIT licence.
