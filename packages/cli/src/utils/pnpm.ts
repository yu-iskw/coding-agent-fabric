import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spinner } from './spinner.js';

const execPromise = promisify(exec);

/**
 * Run pnpm add to install a resource
 */
export async function pnpmAdd(source: string, projectRoot: string): Promise<string> {
  spinner.start(`Running pnpm add ${source}...`);
  try {
    // Run pnpm add. We use --save-dev as these are tools/resources
    await execPromise(`pnpm add -D ${source}`, { cwd: projectRoot });
    spinner.succeed(`pnpm add successful`);

    // Extract package name from pnpm output or package.json
    // A simple way is to look at the last added dependency in package.json
    const pkgJsonPath = join(projectRoot, 'package.json');
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));

    // This is a bit naive but might work for simple cases.
    // Ideally we should parse pnpm output or use a more robust way.
    // For now, let's try to find the package name from the source.
    const packageName = inferPackageName(source, pkgJson);
    if (!packageName) {
      throw new Error(`Could not determine package name for ${source}`);
    }

    return packageName;
  } catch (error) {
    spinner.fail(`pnpm add failed: ${error}`);
    throw error;
  }
}

/**
 * Infer package name from source or package.json
 */
export function inferPackageName(
  source: string,
  pkgJson: { devDependencies?: Record<string, string>; dependencies?: Record<string, string> },
): string | null {
  const directSource = source.startsWith('npm:') ? source.slice(4) : source;
  const looksLikePackageSpecifier =
    !directSource.includes('/') ||
    (directSource.startsWith('@') && directSource.split('/').length === 2);

  // If source is already a package specifier (e.g. "@scope/pkg@1.2.3" or "pkg@latest")
  if (looksLikePackageSpecifier) {
    return normalizePackageSpecifier(source);
  }

  // If source is a URL or GitHub shorthand, look in devDependencies
  const deps = { ...pkgJson.devDependencies, ...pkgJson.dependencies };

  // Try to find a match in dependencies that looks like the source
  for (const [name, version] of Object.entries(deps)) {
    if (typeof version === 'string' && (version.includes(source) || source.includes(name))) {
      return name;
    }
  }

  return null;
}

/**
 * Normalize package specifiers to package names.
 */
export function normalizePackageSpecifier(specifier: string): string {
  const source = specifier.startsWith('npm:') ? specifier.slice(4) : specifier;

  if (source.startsWith('@')) {
    const scopeSeparator = source.indexOf('/');
    if (scopeSeparator === -1) {
      return source;
    }
    const versionSeparator = source.indexOf('@', scopeSeparator + 1);
    return versionSeparator === -1 ? source : source.slice(0, versionSeparator);
  }

  const versionSeparator = source.indexOf('@');
  return versionSeparator === -1 ? source : source.slice(0, versionSeparator);
}

/**
 * Resolve the local path of an installed package
 */
export function resolvePackagePath(packageName: string, projectRoot: string): string {
  try {
    const require = createRequire(join(projectRoot, 'index.js'));
    const pkgJsonPath = require.resolve(join(packageName, 'package.json'));
    return dirname(pkgJsonPath);
  } catch (error) {
    // Fallback to simple node_modules check
    const path = join(projectRoot, 'node_modules', packageName);
    if (existsSync(path)) {
      return path;
    }
    throw new Error(`Could not resolve path for package ${packageName}: ${error}`);
  }
}
