/**
 * OpenSIN Shell Strategy — Avoid interactive shell hangs
 *
 * Instructions file that teaches LLMs how to avoid interactive shell
 * commands that hang in non-TTY environments.
 *
 * Branded: OpenSIN/sincode
 */

export const SHELL_STRATEGY_INSTRUCTIONS = `
# Shell Strategy for Non-TTY Environments

When executing shell commands in an automated/agent context, always avoid
commands that require interactive input. These will hang indefinitely.

## Commands to AVOID

### Interactive Prompts
- \`git add -p\` → Use \`git add .\` or \`git add <file>\`
- \`git checkout -p\` → Use explicit file paths
- \`npm init\` → Use \`npm init -y\` or provide package.json
- \`yarn init\` → Use \`yarn init -y\`
- \`docker login\` → Use \`docker login -u <user> -p <pass>\`
- \`ssh-keygen\` → Use \`ssh-keygen -t ed25519 -f <file> -N ""\`
- \`gpg --edit-key\` → Use batch mode with \`--batch --yes\`
- \`sudo\` commands → Pre-configure sudoers or use passwordless sudo
- \`crontab -e\` → Use \`crontab -l | { cat; echo "0 * * * * cmd"; } | crontab -\`

### TUI/REPL Programs
- \`vim\`, \`nano\`, \`emacs\` → Use \`sed\`, \`awk\`, or file write tools
- \`top\`, \`htop\`, \`btop\` → Use \`ps aux\` or \`top -b -n 1\`
- \`python\` (interactive) → Use \`python -c "code"\` or scripts
- \`node\` (interactive) → Use \`node -e "code"\` or scripts
- \`mysql\`, \`psql\`, \`mongo\` (interactive) → Use \`-e "query"\`

### Pager Commands
- \`git log\` → Use \`git log --no-pager\` or \`git --no-pager log\`
- \`man\` → Use \`man <cmd> | cat\` or \`--help\`
- \`less\`, \`more\` → Pipe to \`cat\` or use head/tail
- \`systemctl status\` → Use \`systemctl show\`

## Safe Alternatives

### Git Operations
\`\`\`bash
# Instead of: git add -p
git add .

# Instead of: git checkout -p
git checkout -- <file>

# Instead of: git clean -i
git clean -fd

# Instead of: git rebase -i
git rebase --onto <base> <upstream> <branch>
\`\`\`

### Package Managers
\`\`\`bash
# Instead of: npm init
npm init -y

# Instead of: pip install (interactive)
pip install --yes <package>

# Instead of: conda install (interactive)
conda install --yes <package>
\`\`\`

### Docker
\`\`\`bash
# Instead of: docker login
echo "<password>" | docker login -u <user> --password-stdin

# Instead of: docker exec -it
docker exec <container> <command>

# Instead of: docker run -it
docker run --rm <image> <command>
\`\`\`

### SSH
\`\`\`bash
# Instead of: ssh-keygen (interactive)
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""

# Instead of: ssh (interactive password)
ssh -i <keyfile> -o StrictHostKeyChecking=no <user>@<host> <command>
\`\`\`

## Environment Variables

Always set these to disable interactivity:
\`\`\`bash
export CI=true
export DEBIAN_FRONTEND=noninteractive
export GIT_TERMINAL_PROMPT=0
export GCM_INTERACTIVE=never
export HOMEBREW_NO_INTERACTIVE=1
export PIP_NO_INPUT=1
export npm_config_yes=true
\`\`\`

## Timeout Protection

When running commands that might hang, always use timeout:
\`\`\`bash
timeout 30 <command>
# Or with specific signal
timeout --signal=KILL 30 <command>
\`\`\`

## Detection Checklist

Before executing ANY command, verify:
1. Does it require user input? → Replace with non-interactive version
2. Does it spawn a TUI? → Use script or non-TUI alternative
3. Does it use a pager? → Disable pager with --no-pager or pipe to cat
4. Does it require TTY? → Use --batch, --yes, or -y flags

## Quick Reference

| Interactive | Non-Interactive |
|-------------|-----------------|
| \`git add -p\` | \`git add .\` |
| \`npm init\` | \`npm init -y\` |
| \`docker login\` | \`echo "$PASS" \| docker login -u $USER --password-stdin\` |
| \`ssh-keygen\` | \`ssh-keygen -t ed25519 -f key -N ""\` |
| \`vim file\` | \`sed -i 's/old/new/g' file\` |
| \`top\` | \`top -b -n 1\` |
| \`man ls\` | \`ls --help\` or \`man ls \| cat\` |
`;

export function getShellStrategyPrompt(): string {
  return SHELL_STRATEGY_INSTRUCTIONS;
}

export function isInteractiveCommand(command: string): boolean {
  const interactivePatterns = [
    /\bgit\s+add\s+(-p|--patch)\b/,
    /\bgit\s+checkout\s+(-p|--patch)\b/,
    /\bgit\s+clean\s+(-i|--interactive)\b/,
    /\bgit\s+rebase\s+(-i|--interactive)\b/,
    /\bnpm\s+init\b(?!\s+-y|--yes)/,
    /\byarn\s+init\b(?!\s+-y|--yes)/,
    /\bdocker\s+login\b(?!\s+-[up])/,
    /\bssh-keygen\b(?!\s+-N)/,
    /\bsudo\b(?!\s+-S)/,
    /\bvim\b/,
    /\bnano\b/,
    /\btop\b(?!\s+-b)/,
    /\bhtop\b/,
    /\bpython\d*\b(?!\s+-[cqe])/,
    /\bnode\b(?!\s+-[ce])/,
    /\bmysql\b(?!\s+-e)/,
    /\bpsql\b(?!\s+-c)/,
  ];

  return interactivePatterns.some(pattern => pattern.test(command));
}

export function makeNonInteractive(command: string): string {
  if (/\bgit\s+log\b/.test(command) && !/--no-pager/.test(command)) {
    return `git --no-pager ${command.replace(/^git\s+/, '')}`;
  }
  if (/\bnpm\s+init\b/.test(command) && !/-y|--yes/.test(command)) {
    return `${command} -y`;
  }
  if (/\byarn\s+init\b/.test(command) && !/-y|--yes/.test(command)) {
    return `${command} -y`;
  }
  if (/\btop\b/.test(command) && !/-b/.test(command)) {
    return `${command} -b -n 1`;
  }

  return command;
}
