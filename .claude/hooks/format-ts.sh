#!/bin/bash
# Hook: Auto-format TypeScript/JavaScript files after edits
# Triggered by: PostToolUse (Edit|Write) on .ts, .tsx, .js, .jsx files

set -e

INPUT=$(cat)
# Note: Cursor's Edit/Write tools might use 'path' instead of 'file_path'
FILE_PATH=$(echo "${INPUT}" | jq -r '.tool_input.path // empty')

# Only process TS/JS files
if [[ ${FILE_PATH} == *.ts || ${FILE_PATH} == *.tsx || ${FILE_PATH} == *.js || ${FILE_PATH} == *.jsx ]]; then
	# Check if trunk is available
	if command -v trunk &>/dev/null; then
		# Run trunk fmt on the file
		trunk fmt "${FILE_PATH}" 2>/dev/null || true
	fi
fi

exit 0
