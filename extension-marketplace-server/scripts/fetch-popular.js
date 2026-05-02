/**
 * Fetches popular extensions from Open VSX and creates metadata
 * Usage: npm run fetch-popular
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const EXTENSIONS_DIR = path.join(__dirname, '..', 'extensions');
const CACHE_DIR = path.join(__dirname, '..', 'cache');

// Popular extensions to fetch
const POPULAR_EXTENSIONS = [
  // Language support
  { id: 'ms-python.python', publisher: 'ms-python', name: 'python' },
  { id: 'ms-vscode.cpptools', publisher: 'ms-vscode', name: 'cpptools' },
  { id: 'redhat.java', publisher: 'redhat', name: 'java' },
  { id: 'golang.go', publisher: 'golang', name: 'go' },
  { id: 'rust-lang.rust-analyzer', publisher: 'rust-lang', name: 'rust-analyzer' },
  { id: 'dart-code.dart-code', publisher: 'dart-code', name: 'dart-code' },
  { id: 'ms-dotnettools.csharp', publisher: 'ms-dotnettools', name: 'csharp' },
  { id: 'ziglang.vscode-zig', publisher: 'ziglang', name: 'vscode-zig' },
  { id: 'llvm-vs-code-extensions.vscode-clangd', publisher: 'llvm-vs-code-extensions', name: 'vscode-clangd' },
  
  // Web development
  { id: 'esbenp.prettier-vscode', publisher: 'esbenp', name: 'prettier-vscode' },
  { id: 'dbaeumer.vscode-eslint', publisher: 'dbaeumer', name: 'vscode-eslint' },
  { id: 'formulahendry.auto-close-tag', publisher: 'formulahendry', name: 'auto-close-tag' },
  { id: 'formulahendry.auto-rename-tag', publisher: 'formulahendry', name: 'auto-rename-tag' },
  { id: 'ritwickdey.liveserver', publisher: 'ritwickdey', name: 'live-server' },
  { id: 'christian-kohler.path-intellisense', publisher: 'christian-kohler', name: 'path-intellisense' },
  
  // Themes and icons
  { id: 'pkief.material-icon-theme', publisher: 'pkief', name: 'material-icon-theme' },
  { id: 'vscode-icons-team.vscode-icons', publisher: 'vscode-icons-team', name: 'vscode-icons' },
  { id: 'dracula-theme.theme-dracula', publisher: 'dracula-theme', name: 'theme-dracula' },
  { id: 'zhuangtongfa.material-theme', publisher: 'zhuangtongfa', name: 'material-theme' },
  { id: 'akamud.vscode-theme-onedark', publisher: 'akamud', name: 'vscode-theme-onedark' },
  { id: 'sdras.night-owl', publisher: 'sdras', name: 'night-owl' },
  { id: 'wesbos.theme-cobalt2', publisher: 'wesbos', name: 'theme-cobalt2' },
  
  // Productivity
  { id: 'eamodio.gitlens', publisher: 'eamodio', name: 'gitlens' },
  { id: 'github.vscode-pull-request-github', publisher: 'github', name: 'vscode-pull-request-github' },
  { id: 'oderwat.indent-rainbow', publisher: 'oderwat', name: 'indent-rainbow' },
  { id: 'yzhang.markdown-all-in-one', publisher: 'yzhang', name: 'markdown-all-in-one' },
  { id: 'bungcip.better-toml', publisher: 'bungcip', name: 'better-toml' },
  { id: 'redhat.vscode-yaml', publisher: 'redhat', name: 'vscode-yaml' },
  { id: 'editorconfig.editorconfig', publisher: 'editorconfig', name: 'editorconfig' },
  { id: 'ms-vscode.hexeditor', publisher: 'ms-vscode', name: 'hexeditor' },
  { id: 'timonwong.shellcheck', publisher: 'timonwong', name: 'shellcheck' },
  
  // Debuggers and tools
  { id: 'ms-vscode.hexeditor', publisher: 'ms-vscode', name: 'hexeditor' },
  { id: 'mutantdino.resourcemonitor', publisher: 'mutantdino', name: 'resourcemonitor' },
  { id: 'gruntfuggly.todo-tree', publisher: 'gruntfuggly', name: 'todo-tree' },
  { id: 'aaron-bond.better-comments', publisher: 'aaron-bond', name: 'better-comments' },
  
  // Remote development
  { id: 'ms-vscode-remote.remote-ssh', publisher: 'ms-vscode-remote', name: 'remote-ssh' },
  { id: 'ms-vscode-remote.remote-wsl', publisher: 'ms-vscode-remote', name: 'remote-wsl' },
  { id: 'ms-vscode-remote.remote-containers', publisher: 'ms-vscode-remote', name: 'remote-containers' },
  
  // Frameworks
  { id: 'angular.ng-template', publisher: 'angular', name: 'ng-template' },
  { id: 'vue.volar', publisher: 'vue', name: 'volar' },
  { id: 'svelte.svelte-vscode', publisher: 'svelte', name: 'svelte-vscode' },
  { id: 'ms-vscode.vscode-typescript-next', publisher: 'ms-vscode', name: 'vscode-typescript-next' },
  { id: 'orta.vscode-jest', publisher: 'orta', name: 'vscode-jest' },
  
  // Docker and cloud
  { id: 'ms-azuretools.vscode-docker', publisher: 'ms-azuretools', name: 'vscode-docker' },
  { id: 'ms-kubernetes-tools.vscode-kubernetes-tools', publisher: 'ms-kubernetes-tools', name: 'vscode-kubernetes-tools' },
  
  // Database
  { id: 'cweijan.vscode-database-client2', publisher: 'cweijan', name: 'vscode-database-client2' },
  { id: 'ckolkman.vscode-postgres', publisher: 'ckolkman', name: 'vscode-postgres' },
  
  // API testing
  { id: 'rangav.vscode-thunder-client', publisher: 'rangav', name: 'thunder-client' },
  { id: 'humao.rest-client', publisher: 'humao', name: 'rest-client' },
  
  // Fun and extras
  { id: 'iceliu.hacker-sounds', publisher: 'iceliu', name: 'hacker-sounds' },
  { id: 'tonybaloney.vscode-pets', publisher: 'tonybaloney', name: 'vscode-pets' },
  { id: 'janisdd.vscode-edit-csv', publisher: 'janisdd', name: 'vscode-edit-csv' },
  { id: 'mechatroner.rainbow-csv', publisher: 'mechatroner', name: 'rainbow-csv' },
];

async function fetchExtensionMetadata(publisher, name) {
  try {
    const url = `https://open-vsx.org/api/${publisher}/${name}`;
    console.log(`Fetching: ${publisher}.${name}...`);
    const response = await axios.get(url, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.log(`  ✗ Failed: ${publisher}.${name} - ${error.message}`);
    return null;
  }
}

async function downloadExtension(publisher, name, version) {
  const filename = `${publisher}.${name}-${version}.vsix`;
  const filepath = path.join(EXTENSIONS_DIR, filename);
  
  if (fs.existsSync(filepath)) {
    console.log(`  ✓ Already have: ${filename}`);
    return true;
  }
  
  try {
    const url = `https://open-vsx.org/api/${publisher}/${name}/${version}/file/${publisher}.${name}-${version}.vsix`;
    console.log(`  Downloading: ${filename}...`);
    const response = await axios.get(url, { 
      responseType: 'stream',
      timeout: 60000
    });
    
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    console.log(`  ✓ Downloaded: ${filename}`);
    return true;
  } catch (error) {
    console.log(`  ✗ Download failed: ${filename} - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     Fetching Popular Extensions for DimIDE             ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  fs.ensureDirSync(EXTENSIONS_DIR);
  fs.ensureDirSync(CACHE_DIR);
  
  const metadata = { extensions: [], lastUpdated: new Date().toISOString() };
  let successCount = 0;
  let failCount = 0;
  
  for (const ext of POPULAR_EXTENSIONS) {
    const extData = await fetchExtensionMetadata(ext.publisher, ext.name);
    
    if (extData && extData.namespace && extData.name) {
      metadata.extensions.push(extData);
      
      // Try to download the latest version
      const latestVersion = extData.versions?.[0]?.version;
      if (latestVersion) {
        const downloaded = await downloadExtension(ext.publisher, ext.name, latestVersion);
        if (downloaded) successCount++;
        else failCount++;
      }
    } else {
      failCount++;
    }
    
    // Small delay to be nice to the API
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Save metadata
  const metadataPath = path.join(__dirname, '..', 'extensions.json');
  fs.writeJsonSync(metadataPath, metadata, { spaces: 2 });
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                   Summary                              ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Total extensions: ${POPULAR_EXTENSIONS.length}                              ║`);
  console.log(`║  Successful: ${successCount}                                    ║`);
  console.log(`║  Failed: ${failCount}                                         ║`);
  console.log(`║  Metadata saved to: extensions.json                    ║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);
