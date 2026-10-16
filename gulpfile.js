// gulpfile.js (ESM)

import gulp, { src, dest, series, parallel } from 'gulp';
import { execSync } from 'child_process';
import fsSync from 'fs';
import { deleteAsync } from 'del';
import glob from 'glob';

import concat from 'gulp-concat';
import terser from 'gulp-terser';
import cleanCSS from 'gulp-clean-css';
import sourcemaps from 'gulp-sourcemaps';
import rename from 'gulp-rename';
import gulpIf from 'gulp-if';
import htmlmin from 'gulp-htmlmin';
import rev from 'gulp-rev';
import revReplace from 'gulp-rev-replace';
import useref from 'gulp-useref';
import path from 'path';

const IIS_TARGET = 'C:/inetpub/wwwroot/motorweb';
const IIS_SITE = 'motor';       // optional: site name in IIS
const IIS_APP_POOL = 'motor';   // optional: app pool name

async function stopIIS() {
  try {
    if (IIS_APP_POOL) execSync(`powershell -Command "Import-Module WebAdministration; Stop-WebAppPool -Name '${IIS_APP_POOL}'"`, { stdio: 'inherit' });
    if (IIS_SITE) execSync(`powershell -Command "Import-Module WebAdministration; Stop-Website -Name '${IIS_SITE}'"`, { stdio: 'inherit' });
  } catch (e) {
    console.warn('Could not stop IIS site/app pool automatically. Proceeding anyway.', e && e.message);
  }
}

async function startIIS() {
  try {
    if (IIS_APP_POOL) execSync(`powershell -Command "Import-Module WebAdministration; Start-WebAppPool -Name '${IIS_APP_POOL}'"`, { stdio: 'inherit' });
    if (IIS_SITE) execSync(`powershell -Command "Import-Module WebAdministration; Start-Website -Name '${IIS_SITE}'"`, { stdio: 'inherit' });
  } catch (e) {
    console.warn('Could not start IIS site/app pool automatically.', e && e.message);
  }
}

export async function deploy() {
  if (!fsSync.existsSync('dist')) throw new Error('dist folder not found. Run build first.');

  // stop IIS to avoid locks
  await stopIIS();

  // try to clean target (best-effort)
  try {
    console.log(`Cleaning ${IIS_TARGET}...`);
    await deleteAsync([`${IIS_TARGET}/**`, IIS_TARGET], { force: true });
  } catch (err) {
    console.warn('Could not fully clean target folder (may be locked). Will attempt to copy anyway.', err && err.code ? err.code : err);
  }

  // ensure target exists
  try {
    fsSync.mkdirSync(IIS_TARGET, { recursive: true });
  } catch (err) {
    console.warn('Could not create target folder directly, will attempt robocopy fallback.', err && err.message);
  }

  // try normal copy via gulp
  try {
    await new Promise((resolve, reject) => {
      src('dist/**', { base: 'dist', allowEmpty: true })
        .pipe(dest(IIS_TARGET))
        .on('end', resolve)
        .on('error', reject);
    });
    console.log('Files copied to IIS target.');
  } catch (err) {
    console.warn('Gulp copy failed, falling back to robocopy.', err && err.message);

    // fallback: use robocopy (robust on Windows). Mirror mode /MIR
    try {
      execSync(`robocopy "${process.cwd()}\\dist" "${IIS_TARGET}" /MIR /NFL /NDL /NJH /NJS`, { stdio: 'inherit' });
      console.log('Robocopy fallback succeeded.');
    } catch (robocopyErr) {
      throw new Error(`Robocopy failed: ${robocopyErr && robocopyErr.message}`);
    }
  }

  // restore permissions for IIS_IUSRS (best practice)
  try {
    execSync(`icacls "${IIS_TARGET}" /grant "IIS_IUSRS:(OI)(CI)R" /T`, { stdio: 'inherit' });
  } catch (e) {
    console.warn('Could not set IIS_IUSRS permissions automatically.', e && e.message);
  }

  // start IIS back up
  await startIIS();
}

const isProd = process.env.NODE_ENV === 'production';

const paths = {
  js: [
    'assets/js/*.js',
    'assets/js/core/*.js',
    'assets/js/plugins/*.js',
    'assets/js/utils/*.js',
    'assets/js/admin/*.js',
    'assets/js/master/*.js',
    'assets/js/transaction/*.js',
  ],
  css: ['assets/css/*.css'],
  html: ['index.html', 'pages/**/*.html'],
  assets: ['assets/fonts/**/*', 'assets/img/**/*', 'assets/scss/**/*', 'assets/js/config.json'],
  vendor: [
    'node_modules/@fontsource/inter/**/*',
    'node_modules/font-awesome/css/*.css',
    'node_modules/font-awesome/fonts/*',
    'node_modules/material-symbols/**/*',
    'node_modules/datatables.net-dt/css/*.css',
    'node_modules/datatables.net/js/*.js',
    'node_modules/select2/dist/css/*.css',
    'node_modules/select2/dist/js/*.js',
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/github-buttons/dist/*.js'
  ]
};

// robust clean with retries (uses synchronous fallback)
export async function clean() {
  const target = 'dist';
  const maxRetries = 5;
  const retryDelayMs = 200;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await deleteAsync([`${target}/**`, target], { force: true });
      if (fsSync.existsSync(target)) {
        // sync remove as fallback
        try { fsSync.rmSync(target, { recursive: true, force: true }); } catch (e) {}
      }
      return;
    } catch (err) {
      if (err && (err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'ENOTEMPTY')) {
        console.warn(`clean attempt ${attempt} failed (${err.code}). Retrying in ${retryDelayMs}ms...`);
        await new Promise(r => setTimeout(r, retryDelayMs));
        continue;
      }
      // final sync fallback
      try {
        if (fsSync.existsSync(target)) {
          fsSync.rmSync(target, { recursive: true, force: true });
          return;
        }
      } catch (syncErr) {
        console.error('Fallback sync rm failed', syncErr);
      }
      throw err;
    }
  }

  try {
    if (fsSync.existsSync(target)) {
      fsSync.rmSync(target, { recursive: true, force: true });
    }
  } catch (finalErr) {
    throw new Error(`Failed to remove ${target} after ${maxRetries} attempts: ${finalErr.message}`);
  }
}

// Scripts: minify each file individually and write to dist/js
function scripts() {
  return src(paths.js, { base: 'assets/js', allowEmpty: true })
    .pipe(gulpIf(!isProd, sourcemaps.init()))
    .pipe(gulpIf(isProd, terser()))
    .pipe(gulpIf(isProd, rename({ suffix: '.min' })))
    .pipe(gulpIf(!isProd, sourcemaps.write('.')))
    .pipe(dest('dist/js'));
}

function styles() {
  return src(paths.css, { allowEmpty: true })
    .pipe(gulpIf(!isProd, sourcemaps.init()))
    .pipe(concat('app.css'))
    .pipe(gulpIf(isProd, cleanCSS({ level: 2 })))
    .pipe(gulpIf(isProd, rename({ suffix: '.min' })))
    .pipe(gulpIf(!isProd, sourcemaps.write('.')))
    .pipe(dest('dist/css'));
}

function copyAssets() {
  return src(['assets/**/*'], { base: 'assets', allowEmpty: true })
    .pipe(dest('dist/assets'));
}

function copyNodeModules() {
  return src(paths.vendor, { base: 'node_modules', allowEmpty: true })
    .pipe(dest('dist/node_modules'));
}

function copyConfig() {
  return src(['assets/js/config.json'], { allowEmpty: true })
    .pipe(dest('dist/assets/js'));
}

function html() {
  return src(paths.html, { allowEmpty: true })
    .pipe(gulpIf(isProd, htmlmin({ collapseWhitespace: true, removeComments: true })))
    .pipe(dest('dist'));
}

function revision() {
  return src(['dist/**/*.{css,js}'])
    .pipe(rev())
    .pipe(dest('dist'))
    .pipe(rev.manifest())
    .pipe(dest('dist'));
}

function revReplaceTask() {
  const manifest = src('dist/rev-manifest.json', { allowEmpty: true });
  return src('dist/**/*.html')
    .pipe(revReplace({ manifest }))
    .pipe(dest('dist'));
}

// create alias so bootstrap-login.js exists alongside minified file
function aliasBootstrap() {
  // find any bootstrap-login*.min.js in dist/js
  const matches = glob.sync('dist/js/bootstrap-login*.min.js');
  if (matches.length === 0) {
    console.warn('No minified bootstrap-login file found, creating from source...');
    // fallback: copy the source file directly
    return src('assets/js/bootstrap-login.js', { allowEmpty: true })
      .pipe(dest('dist/js'));
  }
  // copy the first match to bootstrap-login.js
  const srcPath = matches[0];
  console.log(`Creating alias from ${srcPath}`);
  return src(srcPath, { allowEmpty: true })
    .pipe(rename('bootstrap-login.js'))
    .pipe(dest('dist/js'));
}

// verify deployed files exist and are non-empty
function verifyDeploy() {
  const jsDir = `${IIS_TARGET}/js`;
  const cssDir = `${IIS_TARGET}/css`;
  
  // verify directories exist
  if (!fsSync.existsSync(jsDir)) {
    throw new Error(`Deployed js directory missing: ${jsDir}`);
  }
  if (!fsSync.existsSync(cssDir)) {
    throw new Error(`Deployed css directory missing: ${cssDir}`);
  }

  // verify js directory has content
  const jsFiles = fsSync.readdirSync(jsDir).filter(f => f.endsWith('.js'));
  if (jsFiles.length === 0) {
    throw new Error(`No .js files found in deployed js directory: ${jsDir}`);
  }

  // verify at least one key file was deployed (check for bootstrap-login or app)
  const hasKeyFile = jsFiles.some(f => 
    f.includes('bootstrap-login') || f.includes('app') || f.includes('sign-in')
  );
  if (!hasKeyFile) {
    throw new Error(`No key JavaScript files found in ${jsDir}. Files: ${jsFiles.join(', ')}`);
  }

  // verify css directory has content
  const cssFiles = fsSync.readdirSync(cssDir).filter(f => f.endsWith('.css'));
  if (cssFiles.length === 0) {
    throw new Error(`No .css files found in deployed css directory: ${cssDir}`);
  }

  // verify index.html exists
  const indexPath = `${IIS_TARGET}/index.html`;
  if (!fsSync.existsSync(indexPath)) {
    throw new Error(`Deployed index.html missing: ${indexPath}`);
  }

  console.log(`Deploy verification passed. Deployed ${jsFiles.length} JS files and ${cssFiles.length} CSS files.`);
  return Promise.resolve();
}

// Build tasks
const prodTasks = [
  scripts,
  styles,
  copyAssets,
  copyConfig,
  html,
  copyNodeModules
];

const devTasks = [
  scripts,
  styles,
  copyAssets,
  copyConfig,
  html
];

export const build = series(
  clean,
  parallel(...(isProd ? prodTasks : devTasks)),
  ...(isProd ? [aliasBootstrap] : [])
);

// optional: run revision and revReplace in production after build
export const buildProd = series(
  cb => { process.env.NODE_ENV = 'production'; cb(); },
  build,
  revision,
  revReplaceTask
);

// buildAndDeploy already:
export const buildAndDeploy = series(
  cb => { process.env.NODE_ENV = 'production'; cb(); },
  build,      // build -> creates dist and aliasBootstrap
  deploy,     // deploy -> copies dist to IIS_TARGET
  verifyDeploy
);

export const prod = buildProd;
