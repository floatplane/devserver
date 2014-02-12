'use strict';

var child_process = require('child_process');
var Path = require('path');
var fs = require('fs-extra');
var Q = require('q');
var _ = require('lodash');


var QFS = {
    mkdirp: Q.denodeify(fs.mkdirp)
};
var init_complete = Q.defer();
var BASE_DIR = '.repo';
var UPDATE_INTERVAL = 30000;

function waitForChildProcess(cmd, args, options) {
    var defer = Q.defer();
    var clone = child_process.spawn(cmd, args, options );
    clone.on('close', function(code) {
        console.log('process', cmd, args.join(' '), 'finished with exit code', code);
        if (code === 0) {
            defer.resolve(code);
        } else {
            defer.reject(code);
        }
    });
    clone.stdout.on('data', function(data) {
        process.stdout.write(data);
    });
    clone.stderr.on('data', function(data) {
        process.stderr.write(data);
    });
    return defer.promise;
}

function getRepoName(repo_url) {
    return repo_url.split('/')[1].split('.')[0];
}

function getRepositoryRoot(repo_url, branch) {
    return Path.join(BASE_DIR, branch, getRepoName(repo_url))
}

function createRepository(repo_url) {
    var init = Q.defer();
    var repo_name = getRepoName(repo_url);
    console.log("Initializing", repo_name, "from", repo_url);
    var master_path = Path.join(BASE_DIR, "master");
    fs.exists(Path.join(master_path, repo_name, ".git"), function(exists) {
        if (exists) {
            console.log('repository exists');
            init.resolve();
        } else {
            console.log('creating directories');
            QFS.mkdirp(master_path)
                .then(function() {
                    console.log('Cloning repo', repo_url);
                    return waitForChildProcess('git', ['clone', repo_url], { cwd: master_path } );
                })
                .then(function(exit_code) {
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
    return waitForChildProcess('git', ['pull', 'origin'], { cwd: getRepositoryRoot(repo_url, 'master') } );
}

function buildBranch(repo_url, branch, build_command) {
    console.log('build', branch);
    // See if need to build - look for a special file with last built revision
    // If building, stop current server if running
    // Build
    // Launch server process
    return true;
}

function getLocalBranches(repo_url) {
    console.log('getLocalBranches');
    return true;
}

function getBranchList(repo_url) {
    console.log('getBranchList');
    return [];
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
        createRepository(repo_url)
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
