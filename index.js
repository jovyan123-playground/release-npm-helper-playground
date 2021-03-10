const fs = require('fs');
const child_process = require('child_process');
const path = require('path');
const os = require('os');
const process = require('process');
const utils = require('@jupyterlab/buildutils');

const default_verdaccio_package = "verdaccio@^4.5.1";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// configurables: target dir - %TEMPDIR%/verdaccio
//                port - 4873
async function startLocalRegistry() {
    await stopLocalRegistry();

    // make a known dir in /tmp to run verdaccio
    const out_dir = path.join(os.tmpdir(), 'verdaccio');

    // copy the config file there
    fs.copyFileSync('verdaccio.yml', path.join(out_dir, 'verdaccio.yml'))
    const log_file = path.join(out_dir, 'verdaccio.log');
    const pkg_name = default_verdaccio_package;

    // Start local registry
    let port = 5559;
    console.log('Installing', pkg_name);
    child_process.execSync(`npm install -g ${pkg_name}`)

    const args = `-c verdaccio.yml -l localhost:${port}`;
    console.log('Running in', out_dir);
    console.log('>', 'verdaccio', args);

    const out = fs.openSync(log_file, 'a');
    const err = fs.openSync(log_file, 'a');

    const options = { cwd: out_dir, detached: true, stdio: ['ignore', out, err] };
    const subproc = child_process.spawn('verdaccio', args.split(' '), options);
    subproc.unref();

    // Wait for Verdaccio to boot
    let content = '';
    while (true) {
        process.stdout.write('.');
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
    console.log('\nverdaccio started');

    // Get current registry values
    const prev_npm = utils.run('npm config get registry');
    try {
        const prev_yarn = utislrun('yarn config get registry');
    } catch {
        const prev_yarn = '';
    }
    // Store registry values and pid in files
    const info_file = path.join(out_dir, 'info.json');
    const data = {
        prev_npm,
        prev_yarn,
        pid: subproc.pid
    }
    utils.writeJSONFile(info_file, data);

    // Set registry to local registry
    const custom_registry_url = `http://localhost:${port}`;
    child_process.execSync(`npm set registry "${custom_registry_url}"`)
    try {
        child_process.execSync(`yarn config set registry "${custom_registry_url}"`)
    } catch (e) {
        // yarn not available
    }
    process.exit(0);
}


// Restore the original NPM and Yarn registry URLs and stop Verdaccio
// configurables: target dir - %TEMPDIR%/verdaccio
async function stopLocalRegistry() {
    // Get the pid and the previous registry entries from the info file
    const out_dir = path.join(os.tmpdir(), 'verdaccio');
    if (!fs.existsSync(out_dir)) {
        return
    }
    const info_file = path.join(out_dir, 'info.json');
    const data = utils.readJSONFile(info_file);

    // Kill the pid
    process.kill(data.pid);

    // Restore the previous registry entries
    child_process.execSync(`npm set registry ${data.prev_npm}`);
    if (data.prev_yarn) {
        child_process.execSync(`yarn config set registry ${data.prev_yarn}`);
    }
}


(async function () {
    await startLocalRegistry();
})()
