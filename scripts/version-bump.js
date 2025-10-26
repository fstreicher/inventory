#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-console */

/**
 * Version Bump Script
 * 
 * Sets the version number in package.json and service worker,
 * then creates a git tag.
 * 
 * Usage: pnpm version:bump <version>
 * Example: pnpm version:bump 1.2.3
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const newVersion = args[0];

if (!newVersion) {
  console.error('❌ Please provide a version number');
  console.error('Usage: pnpm version:bump <version>');
  console.error('Example: pnpm version:bump 1.2.3');
  process.exit(1);
}

// Validate version format (basic semver check)
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(newVersion)) {
  console.error('❌ Invalid version format. Use semantic versioning (e.g., 1.2.3)');
  process.exit(1);
}

// Paths
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const swPath = path.join(__dirname, '..', 'public', 'sw.js');

try {
  // 1. Read package.json
  console.log('📦 Reading package.json...');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;

  console.log(`🔼 Setting version: ${currentVersion} → ${newVersion}`);

  // 2. Update package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
  console.log('✅ Updated package.json');

  // 3. Update service worker
  let swContent = fs.readFileSync(swPath, 'utf8');
  const cacheNameRegex = /const CACHE_NAME = ['"]inventory-manager-v[\d.]+['"]/;
  
  if (cacheNameRegex.test(swContent)) {
    swContent = swContent.replace(
      cacheNameRegex,
      `const CACHE_NAME = 'inventory-manager-v${newVersion}'`
    );
    fs.writeFileSync(swPath, swContent, 'utf8');
    console.log('✅ Updated service worker cache name');
  } else {
    console.warn('⚠️  Could not find CACHE_NAME in service worker');
  }

  // 4. Git operations
  console.log('📝 Staging changes...');
  execSync('git add package.json public/sw.js', { stdio: 'inherit' });
  
  console.log('💾 Committing changes...');
  execSync(`git commit -m "chore(version): ${newVersion}"`, { stdio: 'inherit' });
  
  console.log('🏷️  Creating git tag...');
  execSync(`git tag -a v${newVersion} -m "Release version ${newVersion}"`, { stdio: 'inherit' });

  console.log('\n✨ Version bump complete!');
  console.log(`📌 New version: ${newVersion}`);
  console.log(`🏷️ Tag created: v${newVersion}`);

} catch (error) {
  console.error('❌ Error during version bump:', error.message);
  process.exit(1);
}
