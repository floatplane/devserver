'use strict';

var child_process = require('child_process');
var Path = require('path');
var fs = require('fs-extra');
var Q = require('q');
var _ = require('lodash');


var QFS = {
    mkdirp: Q.denodeify(fs.mkdirp)
};
var initComplete = Q.defer();
var BASE_DIR = '.repo';

function waitForChildProcess(cmd, args, options) {
    var defer = Q.defer();
    var clone = child_process.spawn(cmd, args, options );
    clone.on('close', function(code) {
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

function buildBranch(repo, branch, build_command) {
//    var 
}

module.exports = {
    ready: function(readyCallback) {
        initComplete.promise.done(readyCallback);
    },

    watch: function(repo, launch_command, branch_blacklist) {
        createRepository(repo)
            .then(function() {
                initComplete.resolve();
            })
            .then(_.bind(this._runLoop, this));
    },

    // Create the master repo if it doesn't exist already
    _initializeRepo: function(repo) {
    },

    _runLoop: function() {
        _.bind(this._updateMaster, this)()
            .then(_.bind(this._buildMaster, this))
            .then(_.bind(this._updateBranches, this))
            .then(_.bind(this._buildBranches, this));

        setTimeout(_.bind(this._runLoop, this), 15000);
    },

    _updateBranch: function(branch_name) {
        console.log('update branch', branch_name);
        return Q.defer().resolve().promise;
    },

    _buildBranch: function(branch_name) {
        console.log('build branch', branch_name);
        return Q.defer().resolve().promise;
    },

    _serveBranch: function(branch_name) {
        console.log('serve branch', branch_name);
        return Q.defer().resolve().promise;
    },

    _updateMaster: function() {
        console.log('update master');
        return Q.defer().resolve().promise;
    },

    _buildMaster: function(buildCommand) {
        console.log('build master');
        return Q.defer().resolve().promise;
    },

    _buildBranches: function(build_command) {
        console.log('build branches');
        return Q.defer().resolve().promise;
    }
};
