import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import manifest from '../../public/manifest.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..', '..');

describe('PWA Manifest', () => {
  it('has required name fields', () => {
    expect(manifest.name).toBe('Friction Journal');
    expect(manifest.short_name).toBeDefined();
    expect(manifest.description).toBeDefined();
  });

  it('has standalone display mode', () => {
    expect(manifest.display).toBe('standalone');
  });

  it('has correct start_url for GH Pages', () => {
    expect(manifest.start_url).toBe('/friction-journal/');
  });

  it('has correct scope for GH Pages', () => {
    expect(manifest.scope).toBe('/friction-journal/');
  });

  it('has theme_color and background_color', () => {
    expect(manifest.theme_color).toBeDefined();
    expect(manifest.background_color).toBeDefined();
  });

  it('has icons array with 192x192 and 512x512 entries', () => {
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    const sizes = manifest.icons.map((icon) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('icon files referenced in manifest actually exist', () => {
    for (const icon of manifest.icons) {
      const iconPath = resolve(projectRoot, 'public', icon.src);
      expect(existsSync(iconPath), `Icon file missing: ${icon.src}`).toBe(true);
    }
  });
});
