import { mkdir, readdir, readFile, writeFile, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const documents = [];
for (const name of (await readdir(join(root, 'knowledge'))).filter(n => n.endsWith('.txt')).sort()) {
  const content = (await readFile(join(root, 'knowledge', name), 'utf8')).trim();
  if (content) documents.push({ name, content });
}
const rolePrompt = (await readFile(join(root, 'role_prompt.txt'), 'utf8')).trim();
await mkdir(join(root, 'lib'), { recursive: true });
await writeFile(join(root, 'lib/knowledge.mjs'), `// 自动生成：请修改 knowledge/*.txt 后重新构建。\nexport const documents = ${JSON.stringify(documents, null, 2)};\nexport const rolePrompt = ${JSON.stringify(rolePrompt)};\n`);
await mkdir(join(root, 'public'), { recursive: true });
await cp(join(root, 'static'), join(root, 'public'), { recursive: true });
console.log(`已构建网页，并内嵌 ${documents.length} 份知识库资料。`);
