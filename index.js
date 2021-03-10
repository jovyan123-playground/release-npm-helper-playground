const fs = require('fs');
const child_process = require('child_process');
const path = require('path');
const os = require('os');
const process = require('process');
const psList = require('ps-list');

const default_verdaccio_package = "verdaccio@^4.5.1";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function startLocalRegistry() {
    await stopLocalRegistry();

    // make a temp dir to run verdaccio
    const temp_dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verdaccio_'))

    // copy the config file there
    fs.copyFileSync('verdaccio.yml', path.join(temp_dir, 'verdaccio.yml'))
    const log_file = path.join(temp_dir, 'verdaccio.log');
    const pkg_name = default_verdaccio_package;

    // Start local registry
    let port = 5559;
    console.log('Installing', pkg_name);
    child_process.execSync(`npm install -g ${pkg_name}`)

    const args = `-c verdaccio.yml -l localhost:${port}`;
    console.log('Running in', temp_dir);
    console.log('>', 'verdaccio', args);

    const out = fs.openSync(log_file, 'a');
    const err = fs.openSync(log_file, 'a');

    const options = { cwd: temp_dir, detached: true, stdio: ['ignore', out, err] };
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
async function stopLocalRegistry() {
    child_process.execSync('npm config rm registry');
    try {
        child_process.execSync(`yarn config delete registry "${custom_registry_url}"`)
    } catch (e) {
        // yarn not available
    }
    const list = await psList();
    list.forEach(info => {
        if (info.name.indexOf('verdaccio') !== -1) {
            console.log('killing', info.name, info.pid);
            process.kill(info.pid);
        }
    })
}


(async function () {
    await startLocalRegistry();
})()
