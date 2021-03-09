// Log to ~/.
const fs = require('fs');
const child_process = require('child_process');
const path = require('path');
const os = require('os');
const process = require('process');


const custom_registry_url = "http://localhost:4877"
const original_npm_registry_url = `npm get registry`
const original_yarn_registry_url = `yarn config get registry`
const default_verdaccio_package = "verdaccio@^4.5.1";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function startLocalRegistry() {
    // make a temp dir to run verdaccio
    const temp_dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verdaccio_'))

    // copy the config file there
    fs.copyFileSync('verdaccio.yml', path.join(temp_dir, 'verdaccio.yml'))
    const log_file = path.join(temp_dir, 'verdaccio.log');
    const pkg_name = default_verdaccio_package;

    // Start local registry
    const cmd = `npx --yes -- ${pkg_name} -c verdaccio.yml -l localhost:4877`;
    console.log('Running in', temp_dir);
    console.log('>', cmd);

    child_process.spawnSync(cmd, { cwd: temp_dir, detached: true });

    // Wait for Verdaccio to boot
    let content = '';
    while (true) {
        console.log(log_file, content);
        if (content.indexOf('http address') !== -1) {
            break
        }
        if (content.indexOf('ERR!') !== -1) {
            console.error(content);
            process.exit(1);
        }
        await delay(100);
        if (fs.existsSync(log_file)) {
            content = fs.readFileSync(log_file, encoding = 'utf-8');
        }
    }

    // Set registry to local registry
    child_process.execFileSync(`npm set registry "${custom_registry_url}"`)
    child_process.execFileSync(`yarn config set registry "${custom_registry_url}"`)
}

// function stopLocalRegistry {
//   # Restore the original NPM and Yarn registry URLs and stop Verdaccio
//     npm set registry "$original_npm_registry_url"
//     yarn config set registry "$original_yarn_registry_url"
// }

(async function () {
    await startLocalRegistry();
})()
