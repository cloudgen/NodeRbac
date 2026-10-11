// =============================================================================
// npm lifecycle for the self-management verbs.
// requirement-nodejs-oop — class SelfManage.
// requirement-nodejs-cli-interface — version-check and self-update call npm.
// The npm binary on PATH is used. This class does not call sudo and it does not use curl.
// =============================================================================
import { spawnSync } from 'node:child_process';

export class SelfManage {
  static DISTRIBUTION = 'noderbac';

  constructor(app_name, version, runner = null, logger = null) {
    if (app_name && typeof app_name === 'object' && !Array.isArray(app_name)) {
      ({ app_name, version, runner = null, logger = null } = app_name);
    }
    this.logger = logger;
    if (logger != null) {
      logger.log_message('instantiated', { component: 'SelfManage' });
    }
    this.app_name = app_name;
    this.version = version;
    this.DISTRIBUTION = SelfManage.DISTRIBUTION;
    this.runner = runner || ((argv) => this._subprocess_runner(argv));
  }

  local_version() {
    return `${this.app_name} ${this.version}`;
  }

  argv_for(verb) {
    const dist = this.DISTRIBUTION;
    if (verb === 'version-check') {
      return ['npm', 'view', dist, 'version'];
    }
    if (verb === 'self-update') {
      return ['npm', 'install', '-g', `${dist}@latest`];
    }
    if (verb === 'self-install') {
      return ['npm', 'install', '-g', dist];
    }
    if (verb === 'self-uninstall') {
      return ['npm', 'uninstall', '-g', dist];
    }
    const error = new Error(String(verb));
    error.name = 'ValueError';
    throw error;
  }

  run_pip(verb) {
    const argv = this.argv_for(verb);
    const [code, out, err] = this.runner(argv);
    const chunks = [`$ ${argv.join(' ')}`];
    if (verb === 'version-check') {
      chunks.unshift(this.local_version());
    }
    if (out && String(out).trim()) {
      chunks.push(String(out).trim());
    }
    if (err && String(err).trim()) {
      chunks.push(String(err).trim());
    }
    if (code !== 0 && !(out && String(out).trim()) && !(err && String(err).trim())) {
      chunks.push(`npm exited ${code}`);
    }
    return [code, chunks.join('\n')];
  }

  emit(verb) {
    const [code, text] = this.run_pip(verb);
    console.log(text);
    return code;
  }

  _subprocess_runner(argv) {
    const done = spawnSync(argv[0], argv.slice(1), {
      encoding: 'utf8',
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let code = 0;
    if (typeof done.status === 'number') {
      code = done.status;
    } else {
      code = 1;
    }
    const out = done.stdout || '';
    let err = done.stderr || '';
    if (!err && done.error) {
      err = String(done.error.message || done.error);
    }
    return [code, out, err];
  }
}
