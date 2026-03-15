import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..', '..');
const workflowPath = resolve(projectRoot, '.github', 'workflows', 'deploy.yml');

describe('GitHub Actions Deployment Workflow', () => {
  let workflowContent: string;

  beforeAll(() => {
    if (existsSync(workflowPath)) {
      workflowContent = readFileSync(workflowPath, 'utf8');
    } else {
      workflowContent = '';
    }
  });

  it('workflow file exists', () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  it('workflow triggers on push to main branch', () => {
    expect(workflowContent).toMatch(/branches[^:]*:[^\n]*main/);
  });

  it('workflow has npm ci install step', () => {
    expect(workflowContent).toContain('npm ci');
  });

  it('workflow has npm run build step', () => {
    expect(workflowContent).toContain('npm run build');
  });

  it('workflow deploys to GitHub Pages', () => {
    expect(workflowContent).toMatch(/gh-pages|deploy-pages|actions\/deploy/);
  });

  it('workflow uses Node 20', () => {
    expect(workflowContent).toContain("node-version: '20'");
  });
});
