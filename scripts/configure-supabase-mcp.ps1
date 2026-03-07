param(
    [string]$ProjectRef = "kddkyisukkmgfqerebkn"
)

$ErrorActionPreference = "Stop"

$codexCmd = Join-Path $env:APPDATA "npm\codex.cmd"
if (-not (Test-Path $codexCmd)) {
    throw "codex.cmd not found at $codexCmd"
}

$mcpUrl = "https://mcp.supabase.com/mcp?project_ref=$ProjectRef"

Write-Host "Configuring Supabase MCP server URL..."
& $codexCmd mcp remove supabase *> $null
& $codexCmd mcp add supabase --url $mcpUrl

Write-Host "Starting OAuth login flow for Supabase MCP..."
& $codexCmd mcp login supabase

Write-Host "Done. Restart Codex sessions so new MCP auth/config is picked up."
