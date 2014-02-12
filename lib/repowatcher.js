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
var UPDATE_INTERVAL = 5000;

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

function createRepository(repo) {
    var init = Q.defer();
    var repo_name = repo.split('/')[1].split('.')[0];
    console.log("Initializing", repo_name, "from", repo);
    var master_path = Path.join(BASE_DIR, "master");
    fs.exists(Path.join(master_path, repo_name, ".git"), function(exists) {
        if (exists) {
            console.log('repository exists');
            init.resolve();
        } else {
            console.log('creating directories');
            QFS.mkdirp(master_path)
                .then(function() {
                    console.log('Cloning repo', repo);
                    return waitForChildProcess('git', ['clone', repo], { cwd: master_path } );
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


function runLoop(repo, launch_command, branch_blacklist) {
    updateMaster()
        .then(buildMaster)
        .then(function() {
            return getBranchList(repo);
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
            setTimeout(runLoop, UPDATE_INTERVAL);
        })
        .done();
}

function updateMaster() {
    console.log('update master');
    var temp = Q.defer();
    temp.resolve();
    return temp.promise;
}

function buildMaster() {
    console.log('build master');
    return true;
}

function getLocalBranches(repo) {
    console.log('getLocalBranches');
    return true;
}

function getBranchList(repo) {
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

module.exports = {
    ready: function(ready_callback) {
        init_complete.promise.done(ready_callback);
    },

    watch: function(repo, launch_command, branch_blacklist) {
        createRepository(repo)
            .then(function() {
                init_complete.resolve();
            })
            .then(function() {
                runLoop(repo, launch_command, branch_blacklist);
            })
            .done();
    },
};
