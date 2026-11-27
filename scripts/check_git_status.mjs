import { execSync } from 'child_process';

const repos = [
  { name: 'Backend', path: 'PanelForge_FA26SE251' },
  { name: 'Frontend', path: 'panelforge-fe' },
  { name: 'Mobile', path: 'panelforge-mobile' }
];

for (const r of repos) {
  console.log(`\n=== CHECKING UNMERGED COMMITS IN ${r.name} ===`);
  const branch = execSync(`git -C ${r.path} branch --show-current`, { encoding: 'utf8' }).trim();
  const remoteLines = execSync(`git -C ${r.path} branch -r`, { encoding: 'utf8' }).trim().split('\n');

  for (const raw of remoteLines) {
    const remote = raw.trim();
    if (remote.includes('HEAD') || remote === `origin/${branch}`) continue;
    try {
      const unmerged = execSync(`git -C ${r.path} rev-list --count ${branch}..${remote}`, { encoding: 'utf8' }).trim();
      const ahead = execSync(`git -C ${r.path} rev-list --count ${remote}..${branch}`, { encoding: 'utf8' }).trim();
      console.log(`  ${remote}: ${unmerged} unmerged commits into ${branch} (branch is ahead by ${ahead})`);
    } catch (e) {
      console.log(`  ${remote}: error checking`);
    }
  }
}
