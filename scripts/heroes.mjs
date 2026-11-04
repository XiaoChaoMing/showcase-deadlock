// npm run heroes:bench   (sau này: heroes:validate, heroes:migrate)
// Nạp code TypeScript của dự án qua runnerImport của Vite.
import path from 'node:path';
import { runnerImport } from 'vite';

const [command, ...rest] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, '..');
const heroesDir = path.join(root, 'heroes');
const { module: cli } = await runnerImport(path.join(root, 'src/game/character/tools/heroesCli.ts'), { logLevel: 'error' });

switch (command) {
  case 'bench': {
    console.log(`# Số đo hiệu năng hero (${new Date().toISOString().slice(0, 10)})\n`);
    console.log(cli.runBenchCommand(heroesDir, Number(rest[0] ?? 5)));
    break;
  }
  default:
    console.error(`Lệnh không hợp lệ: ${command ?? '(trống)'}. Có: bench`);
    process.exit(1);
}
