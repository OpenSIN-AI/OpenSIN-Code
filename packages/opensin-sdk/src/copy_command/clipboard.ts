import { exec } from 'child_process';
import { promisify } from 'util';
import { CopyFormat } from './types';

const execAsync = promisify(exec);

function formatContent(content: string, format: CopyFormat): string {
  switch (format) {
    case 'markdown':
      return `\`\`\`\n${content}\n\`\`\``;
    case 'code':
      return content;
    case 'json':
      try {
        return JSON.stringify(JSON.parse(content), null, 2);
      } catch {
        return content;
      }
    case 'plain':
    default:
      return content;
  }
}

export async function copyToClipboard(content: string): Promise<boolean> {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      await execAsync(`echo ${JSON.stringify(content)} | pbcopy`);
    } else if (platform === 'linux') {
      await execAsync(`echo ${JSON.stringify(content)} | xclip -selection clipboard`);
    } else if (platform === 'win32') {
      await execAsync(`echo ${JSON.stringify(content)} | clip`);
    }
    return true;
  } catch {
    return false;
  }
}

export function formatForClipboard(content: string, format: CopyFormat): string {
  return formatContent(content, format);
}
