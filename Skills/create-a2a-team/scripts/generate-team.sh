#!/usr/bin/env bash
set -e

SLUG="$1"
NAME="$2"
MANAGER="$3"
DESC="$4"

if [ -z "$SLUG" ] || [ -z "$NAME" ] || [ -z "$MANAGER" ]; then
  echo "Usage: generate-team.sh <slug> <\"Full Name\"> <\"Manager Name\"> <\"Description\">"
  exit 1
fi

REPO_ROOT="/Users/jeremy/dev/SIN-Solver"
TEMPLATE_DIR="$REPO_ROOT/a2a/template-repo/Template-A2A-SIN-Team"
TARGET_DIR="$REPO_ROOT/a2a/team-${SLUG#sin-team-}/A2A-SIN-Team-${SLUG#sin-team-}"
REPO_NAME="A2A-SIN-Team-${SLUG#sin-team-}"
GITHUB_ORG="OpenSIN-AI"

# Create target dir
mkdir -p "$TARGET_DIR"
cp -r "$TEMPLATE_DIR/"* "$TARGET_DIR/"
cp -r "$TEMPLATE_DIR/".* "$TARGET_DIR/" 2>/dev/null || true
rm -rf "$TARGET_DIR/node_modules" "$TARGET_DIR/dist"

# Replace placeholders
LC_ALL=C find "$TARGET_DIR" -type f -not -path "*/\.*" -exec sed -i '' "s/sin-team-template/$SLUG/g" {} +
LC_ALL=C find "$TARGET_DIR" -type f -not -path "*/\.*" -exec sed -i '' "s/Template-A2A-SIN-Team/$REPO_NAME/g" {} +
LC_ALL=C find "$TARGET_DIR" -type f -not -path "*/\.*" -exec sed -i '' "s/Team - Template/$NAME/g" {} +
LC_ALL=C find "$TARGET_DIR" -type f -not -path "*/\.*" -exec sed -i '' "s/SIN-Team-Template/$MANAGER/g" {} +


# Generate agent-spec.json mapping
cat > "$TARGET_DIR/agent.json" <<JSON
{
  "name": "$NAME",
  "slug": "$SLUG",
  "team": "$NAME",
  "teamManager": "$MANAGER",
  "summary": "$DESC",
  "usage": "Autonomes Management und Hermes-Routing fuer $NAME",
  "primaryModel": "openai/gpt-5.4",
  "vmServer": "Hugging Face Space free CPU VM",
  "mcpTransport": "stdio",
  "marketplace": {
    "category": "Management",
    "pricingModel": "free"
  }
}
JSON

# Initialize clean git repo
cd "$TARGET_DIR"
git init
git add .
git commit -m "chore: scaffold $NAME team manager"

# Create repo on OpenSIN-AI
if ! gh repo view "$GITHUB_ORG/$REPO_NAME" &>/dev/null; then
    gh repo create "$GITHUB_ORG/$REPO_NAME" --private --description "SIN A2A component: $REPO_NAME" --disable-issues --disable-wiki -y
fi
# Add topic
gh repo edit "$GITHUB_ORG/$REPO_NAME" --add-topic opnsin-team
# Setup remote and push
git remote add origin "https://github.com/$GITHUB_ORG/$REPO_NAME.git" || git remote set-url origin "https://github.com/$GITHUB_ORG/$REPO_NAME.git"
git branch -M main || true
git push -u origin main || git push -u origin HEAD:main --force

echo "✅ Team Manager $NAME scaffolded in $TARGET_DIR and pushed to OpenSIN-AI/$REPO_NAME"
