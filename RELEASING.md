# Release Process

1. Update version in `packages/opencode/package.json`
2. Commit: `git commit -m "chore: bump version to X.Y.Z"`
3. Tag: `git tag vX.Y.Z && git push origin vX.Y.Z`
4. n8n on OCI VM detects tag → auto-publish to npm
5. Verify: `npm view @opensin/code`

## npm Publishing

Publishing is handled by n8n on OCI VM (92.5.60.87:5678), NOT GitHub Actions.
The n8n workflow monitors for new tags and automatically publishes to npm.
