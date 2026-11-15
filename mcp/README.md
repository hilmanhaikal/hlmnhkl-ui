# gooee-mcp

A read-only MCP server for [Gooee UI](https://ui.hlmnhkl.my). AI coding tools such as Claude Code, Cursor and VS Code use it to look up components, their props and install steps.

```sh
claude mcp add gooee -- npx -y gooee-mcp
```

Setup for other tools, and what it can and cannot do: https://ui.hlmnhkl.my/mcp

It only reads the docs file in this package. It writes no files, runs no commands and makes no network requests. It needs Node 20 or later. MIT licence.
