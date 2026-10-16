import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const IIS_TARGET = 'C:\\inetpub\\wwwroot\\motorweb';
const IIS_SITE = 'motor';
const IIS_APP_POOL = 'motor';

// Check if running as administrator
function isAdmin() {
  try {
    execSync('net session', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function stopIIS() {
  try {
    if (!isAdmin()) {
      console.warn('⚠️  Skipping IIS stop (requires admin). Run as Administrator for full deployment.');
      return;
    }
    if (IIS_APP_POOL) {
      execSync(`powershell -Command "Import-Module WebAdministration; Stop-WebAppPool -Name '${IIS_APP_POOL}'"`, { stdio: 'pipe' });
    }
    if (IIS_SITE) {
      execSync(`powershell -Command "Import-Module WebAdministration; Stop-Website -Name '${IIS_SITE}'"`, { stdio: 'pipe' });
    }
  } catch (e) {
    console.warn('⚠️  Could not stop IIS. Proceeding anyway.', e?.message);
  }
}

async function startIIS() {
  try {
    if (!isAdmin()) {
      console.warn('⚠️  Skipping IIS start (requires admin).');
      return;
    }
    if (IIS_APP_POOL) {
      execSync(`powershell -Command "Import-Module WebAdministration; Start-WebAppPool -Name '${IIS_APP_POOL}'"`, { stdio: 'pipe' });
    }
    if (IIS_SITE) {
      execSync(`powershell -Command "Import-Module WebAdministration; Start-Website -Name '${IIS_SITE}'"`, { stdio: 'pipe' });
    }
  } catch (e) {
    console.warn('⚠️  Could not start IIS.', e?.message);
  }
}

async function deploy() {
  try {
    console.log('🚀 Starting deployment...');

    if (!fs.existsSync('dist')) {
      throw new Error('dist folder not found. Run "npm run build:prod" first.');
    }

    if (!isAdmin()) {
      console.log('');
      console.log('⚠️  ADMIN PRIVILEGES REQUIRED');
      console.log('─'.repeat(50));
      console.log('To deploy to IIS, you must run this command as Administrator:');
      console.log('');
      console.log('  1. Open PowerShell or Command Prompt as Administrator');
      console.log('  2. Navigate to: cd d:\\project\\motorweb');
      console.log('  3. Run: npm run deploy');
      console.log('');
      console.log('Alternatively, you can:');
      console.log('  - Copy dist/ folder manually to C:\\inetpub\\wwwroot\\motorweb\\');
      console.log('  - Or use the dev server: npm start (for development)');
      console.log('─'.repeat(50));
      process.exit(1);
    }

    console.log('✅ Running with admin privileges');
    console.log('⏹️  Stopping IIS...');
    await stopIIS();

    // Clean target
    console.log('🧹 Cleaning ' + IIS_TARGET + '...');
    try {
      fs.rmSync(IIS_TARGET, { recursive: true, force: true });
    } catch (err) {
      console.warn('⚠️  Could not fully clean target folder. Attempting copy anyway.', err?.message);
    }

    // Create target directory
    fs.mkdirSync(IIS_TARGET, { recursive: true });

    // Copy files using PowerShell for better cross-platform compatibility
    console.log('📁 Copying files to IIS target...');
    const sourceDir = path.resolve('dist').replace(/\//g, '\\');
    const targetDir = IIS_TARGET;
    
    try {
      // Use PowerShell Copy-Item instead of robocopy for better error handling
      execSync(
        `powershell -Command "Copy-Item -Path '${sourceDir}\\*' -Destination '${targetDir}\\' -Recurse -Force"`,
        { stdio: 'inherit' }
      );
      console.log('✅ Files copied successfully');
      
      // Copy web.config
      console.log('📄 Copying web.config...');
      execSync(
        `powershell -Command "Copy-Item -Path '${path.resolve('web.config').replace(/\//g, '\\')}' -Destination '${targetDir}\\web.config' -Force"`,
        { stdio: 'inherit' }
      );
      console.log('✅ web.config copied');
    } catch (err) {
      console.error('❌ Copy failed:', err.message);
      throw new Error('Failed to copy files to IIS target directory');
    }

    // Set permissions
    console.log('🔐 Setting IIS permissions...');
    try {
      execSync(`icacls "${targetDir}" /grant "IIS_IUSRS:(OI)(CI)R" /T`, { stdio: 'pipe' });
      execSync(`icacls "${targetDir}" /grant "IUSR:(OI)(CI)R" /T`, { stdio: 'pipe' });
    } catch (err) {
      console.warn('⚠️  Could not set all permissions.', err?.message);
    }

    console.log('✅ Starting IIS...');
    await startIIS();

    // Verify deployment
    console.log('✔️  Verifying deployment...');
    verifyDeploy();

    console.log('');
    console.log('✨ Deployment completed successfully!');
    console.log('');
    console.log('Your app is available at:');
    console.log('  - https://motor.web/');
    console.log('  - http://127.0.0.1/');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ Deployment failed:', error.message);
    console.error('');
    process.exit(1);
  }
}

function verifyDeploy() {
  const jsDir = path.join(IIS_TARGET, 'assets', 'js');
  const cssDir = path.join(IIS_TARGET, 'assets', 'css');

  if (!fs.existsSync(jsDir)) {
    throw new Error(`Deployed js directory missing: ${jsDir}`);
  }
  if (!fs.existsSync(cssDir)) {
    throw new Error(`Deployed css directory missing: ${cssDir}`);
  }
  for (const requiredFile of [
    path.join('pages', 'sign-in.html'),
    path.join('pages', 'dashboard.html'),
    path.join('assets', 'js', 'bootstrap.js'),
    path.join('assets', 'js', 'dashboard.js'),
    path.join('assets', 'js', 'plugins', 'chartjs.min.js'),
    path.join('node_modules', 'jquery', 'dist', 'jquery.min.js'),
  ]) {
    const deployedPath = path.join(IIS_TARGET, requiredFile);
    if (!fs.existsSync(deployedPath)) {
      throw new Error(`Required production file missing: ${deployedPath}`);
    }
  }

  const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
  if (jsFiles.length === 0) {
    throw new Error(`No .js files found in deployed js directory: ${jsDir}`);
  }

  const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
  if (cssFiles.length === 0) {
    throw new Error(`No .css files found in deployed css directory: ${cssDir}`);
  }

  console.log(`  - ✅ ${jsFiles.length} JS files deployed`);
  console.log(`  - ✅ ${cssFiles.length} CSS files deployed`);
}

deploy().catch(error => {
  console.error(error);
  process.exit(1);
});
