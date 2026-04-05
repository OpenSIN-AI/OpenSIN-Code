export function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.startsWith('# ')) {
      result.push(`\n${'='.repeat(60)}\n${line.substring(2).toUpperCase()}\n${'='.repeat(60)}`);
    } else if (line.startsWith('## ')) {
      result.push(`\n${'-'.repeat(40)}\n${line.substring(2)}\n${'-'.repeat(40)}`);
    } else if (line.startsWith('### ')) {
      result.push(`\n${line.substring(4)}\n${'~'.repeat(30)}`);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      result.push(`  • ${line.substring(2)}`);
    } else if (/^\d+\.\s/.test(line)) {
      result.push(`  ${line}`);
    } else if (line.startsWith('```')) {
      const lang = line.substring(3).trim();
      result.push(lang ? `\n[${lang} code block]` : '\n[code block]');
    } else if (line.startsWith('> ')) {
      result.push(`  > ${line.substring(2)}`);
    } else if (line.trim() === '') {
      result.push('');
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}
