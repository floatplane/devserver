'use strict';

var child_process = require('child_process');
var Path = require('path');
var fs = require('fs-extra');
var Q = require('q');
var _ = require('lodash');
var DevServer = require('./repo/devserver');


var QFS = {
    mkdirp: Q.denodeify(fs.mkdirp)
};
var init_complete = Q.defer();
var BASE_DIR = '.repo';
var UPDATE_INTERVAL = 30000;

function waitForChildProcess(cmd, args, options) {
    var defer = Q.defer();
    var stdout = [], stderr = [];
    console.log('->', cmd, args.join(' '));
    var clone = child_process.spawn(cmd, args, options );
    clone.on('close', function(code) {
        // console.log('process', cmd, args.join(' '), 'finished with exit code', code);
        if (code === 0) {
            defer.resolve({ err: code, stdout: stdout, stderr: stderr });
        } else {
            defer.reject({ err: code, stdout: stdout, stderr: stderr });
        }
    });
    clone.stdout.on('data', function(data) {
        stdout.push(data);
        process.stdout.write(data);
    });
    clone.stderr.on('data', function(data) {
        stderr.push(data);
        process.stderr.write(data);
    });
    return defer.promise;
}

function repoBaseName(repo_url) {
    return repo_url.split('/')[1].split('.')[0];
}

function repoPathForBranch(repo_url, branch) {
    return Path.join(BASE_DIR, repoBaseName(repo_url), branch)
}

function initRepoOnBranch(repo_url, branch) {
    var init = Q.defer();
    var repo_name = repoBaseName(repo_url);
    console.log("Initializing", repo_name, "from", repo_url, ", branch", branch);
    var repo_path = Path.join(BASE_DIR, repo_name);
    fs.exists(Path.join(repo_path, branch, ".git"), function(exists) {
        if (exists) {
            console.log('repository exists');
            init.resolve();
        } else {
            console.log('creating directories');
            QFS.mkdirp(repo_path)
                .then(function() {
                    console.log('Cloning repo', repo_url);
                    return waitForChildProcess('git', ['clone', repo_url, branch], { cwd: repo_path } );
                })
                .then(function(result) {
                    console.log('repo init success');
                    init.resolve();
                })
                .done();
        }
    });
    return init.promise;
}

function updateMaster(repo_url) {
    console.log('update master');
    return waitForChildProcess('git', ['pull', 'origin'], { cwd: repoPathForBranch(repo_url, 'master') } );
}

var servers = {}

function buildBranch(repo_url, branch, build_command) {
    console.log('build', branch, build_command);
    // See if need to build - look for a special file with last built revision
    // If building, stop current server if running
    var server = servers[branch]
    if (!server) {
        server = servers[branch] = new DevServer(branch, repoPathForBranch(repo_url, branch))
    }
    server.stop()
    // Build
    // Launch server process
    server.start()
    return true;
}

function getLocalBranches(repo_url) {
    console.log('getLocalBranches');
    return true;
}

function getBranchList(repo_url) {
    console.log('getBranchList');
    return waitForChildProcess(
        'git', 'branch -r -l --no-merged'.split(' '), { cwd: repoPathForBranch(repo_url, 'master') } 
    ).then(function(result) {
        var branches = result.stdout.toString()
        console.log('branchlist', branches)
        return branches;
    });
}

function pruneDeadBranches(branch_list) {
    console.log('pruneDeadBranches');
    return true;
}

function updateCurrentBranches(branch_list, branch_blacklist) {
    console.log('updateCurrentBranches');
    return true;
}

function buildAndServeCurrentBranches(branch_list) {
    console.log('buildAndServe');
    return true;
}

function runLoop(repo_url, build_command, launch_command, branch_blacklist) {
    updateMaster(repo_url)
        .then(function() {
            buildBranch(repo_url, 'master', build_command);
        })
        .then(function() {
            return getBranchList(repo_url);
        })
        .then(function(branch_list) {
            pruneDeadBranches(branch_list);
            return branch_list;
        })
        .then(function(branch_list) {
            updateCurrentBranches(branch_list, branch_blacklist);
            return branch_list;
        })
        .then(function(branch_list) {
            buildAndServeCurrentBranches(branch_list);
            return true;
        })
        .then(function() {
            setTimeout(function() {
                runLoop(repo_url, build_command, launch_command, branch_blacklist);
            }, UPDATE_INTERVAL);
        })
        .done();
}

module.exports = {
    ready: function(ready_callback) {
        init_complete.promise.done(ready_callback);
    },

    watch: function(repo_url, build_command, launch_command, branch_blacklist) {
        initRepoOnBranch(repo_url, "master")
            .then(function() {
                runLoop(repo_url, build_command, launch_command, branch_blacklist);
            })
            .then(function() {
                // After the 1st time through the runloop, we should be ready to go
                init_complete.resolve();
            })
            .done();
    },
};
