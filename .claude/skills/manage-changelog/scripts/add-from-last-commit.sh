#!/bin/bash
set -e

# Get the last commit subject
SUBJECT=$(git log -1 --pretty=%s)

# Extract kind and body (assuming conventional commits like "feat: description")
KIND=$(echo "${SUBJECT}" | grep -oE "^[a-z]+" | head -1 || true)
BODY=$(echo "${SUBJECT}" | sed -E 's/^[a-z]+(\(.*\))?!?: //' || true)

# If KIND is empty or not in our expected list, default to "chore"
case ${KIND} in
feat | fix | docs | refactor | perf | test | chore) ;;
*) KIND="chore" ;;
esac

echo "Creating new change fragment..."
echo "Kind: ${KIND}"
echo "Body: ${BODY}"

changie new --kind "${KIND}" --body "${BODY}"
