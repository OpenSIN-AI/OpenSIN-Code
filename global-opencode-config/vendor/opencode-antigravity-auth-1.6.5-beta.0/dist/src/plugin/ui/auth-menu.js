import { ANSI } from './ansi';
import { select } from './select';
import { confirm } from './confirm';
function formatRelativeTime(timestamp) {
    if (!timestamp)
        return 'never';
    const days = Math.floor((Date.now() - timestamp) / 86400000);
    if (days === 0)
        return 'today';
    if (days === 1)
        return 'yesterday';
    if (days < 7)
        return `${days}d ago`;
    if (days < 30)
        return `${Math.floor(days / 7)}w ago`;
    return new Date(timestamp).toLocaleDateString();
}
function formatDate(timestamp) {
    if (!timestamp)
        return 'unknown';
    return new Date(timestamp).toLocaleDateString();
}
function getStatusBadge(status, verificationRequiredType) {
    switch (status) {
        case 'active': return `${ANSI.green}[active]${ANSI.reset}`;
        case 'rate-limited': return `${ANSI.yellow}[rate-limited]${ANSI.reset}`;
        case 'expired': return `${ANSI.red}[expired]${ANSI.reset}`;
        case 'verification-required': {
            switch (verificationRequiredType) {
                case 'gemini-cli': return `${ANSI.red}[needs Gemini CLI login]${ANSI.reset}`;
                case 'api-enable': return `${ANSI.red}[needs API enable]${ANSI.reset}`;
                case 'google-account': return `${ANSI.red}[needs Google verification]${ANSI.reset}`;
                default: return `${ANSI.red}[needs verification]${ANSI.reset}`;
            }
        }
        default: return '';
    }
}
export async function showAuthMenu(accounts) {
    const items = [
        { label: 'Actions', value: { type: 'cancel' }, kind: 'heading' },
        { label: 'Add account', value: { type: 'add' }, color: 'cyan' },
        { label: 'Check quotas', value: { type: 'check' }, color: 'cyan' },
        { label: 'Verify one account', value: { type: 'verify' }, color: 'cyan' },
        { label: 'Verify all accounts', value: { type: 'verify-all' }, color: 'cyan' },
        { label: 'Gemini CLI Login', value: { type: 'gemini-cli-login' }, color: 'cyan' },
        { label: 'Configure models in opencode.json', value: { type: 'configure-models' }, color: 'cyan' },
        { label: '', value: { type: 'cancel' }, separator: true },
        { label: 'Accounts', value: { type: 'cancel' }, kind: 'heading' },
        ...accounts.map(account => {
            const statusBadge = getStatusBadge(account.status, account.verificationRequiredType);
            const currentBadge = account.isCurrentAccount ? ` ${ANSI.cyan}[current]${ANSI.reset}` : '';
            const disabledBadge = account.enabled === false ? ` ${ANSI.red}[disabled]${ANSI.reset}` : '';
            const baseLabel = account.email || `Account ${account.index + 1}`;
            const numbered = `${account.index + 1}. ${baseLabel}`;
            const fullLabel = `${numbered}${currentBadge}${statusBadge ? ' ' + statusBadge : ''}${disabledBadge}`;
            return {
                label: fullLabel,
                hint: account.lastUsed ? `used ${formatRelativeTime(account.lastUsed)}` : '',
                value: { type: 'select-account', account },
            };
        }),
        { label: '', value: { type: 'cancel' }, separator: true },
        { label: 'Danger zone', value: { type: 'cancel' }, kind: 'heading' },
        { label: 'Delete all accounts', value: { type: 'delete-all' }, color: 'red' },
    ];
    while (true) {
        const result = await select(items, {
            message: 'Google accounts (Antigravity)',
            subtitle: 'Select an action or account',
            clearScreen: true,
        });
        if (!result)
            return { type: 'cancel' };
        if (result.type === 'delete-all') {
            const confirmed = await confirm('Delete ALL accounts? This cannot be undone.');
            if (!confirmed)
                continue;
        }
        return result;
    }
}
export async function showAccountDetails(account) {
    const label = account.email || `Account ${account.index + 1}`;
    const badge = getStatusBadge(account.status, account.verificationRequiredType);
    const disabledBadge = account.enabled === false ? ` ${ANSI.red}[disabled]${ANSI.reset}` : '';
    const header = `${label}${badge ? ' ' + badge : ''}${disabledBadge}`;
    const subtitleParts = [
        `Added: ${formatDate(account.addedAt)}`,
        `Last used: ${formatRelativeTime(account.lastUsed)}`,
    ];
    while (true) {
        const result = await select([
            { label: 'Back', value: 'back' },
            { label: 'Verify account access', value: 'verify', color: 'cyan' },
            { label: account.enabled === false ? 'Enable account' : 'Disable account', value: 'toggle', color: account.enabled === false ? 'green' : 'yellow' },
            { label: 'Refresh token', value: 'refresh', color: 'cyan' },
            { label: 'Delete this account', value: 'delete', color: 'red' },
        ], {
            message: header,
            subtitle: subtitleParts.join(' | '),
            clearScreen: true,
        });
        if (result === 'delete') {
            const confirmed = await confirm(`Delete ${label}?`);
            if (!confirmed)
                continue;
        }
        if (result === 'refresh') {
            const confirmed = await confirm(`Re-authenticate ${label}?`);
            if (!confirmed)
                continue;
        }
        return result ?? 'cancel';
    }
}
export { isTTY } from './ansi';
//# sourceMappingURL=auth-menu.js.map