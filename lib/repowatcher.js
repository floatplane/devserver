'use strict';

var child_process = require('child_process');
var Path = require('path');
var fs = require('fs-extra');
var Q = require('q');
var QFS = {
    mkdirp: Q.denodeify(fs.mkdirp)
};

var initComplete = Q.defer();
var BASE_DIR = '.repo';

module.exports = {
    ready: function(readyCallback) {
        initComplete.promise.done(readyCallback)
    },

    watch: function(repo, launch_command, branch_blacklist) {
        this._initializeRepo(repo).then(function() {
            initComplete.resolve();
        });
    },

    // Create the master repo if it doesn't exist already
    _initializeRepo: function(repo) {
        var init = Q.defer();
        var master_path = Path.join(BASE_DIR, "master")
        fs.exists(Path.join(master_path, ".git"), function(exists) {
            if (exists) {
                Q.resolve();
            } else {
                console.log('creating directories');
                QFS.mkdirp(master_path)
                    .then(function() {
                        console.log('Cloning repo', repo);
                        var clone = child_process.spawn('git', ['clone', repo], { cwd: master_path } );
                        clone.on('close', function(code) {
                            console.log('repo init', code);
                            (code == 0) ? init.resolve() : init.reject();
                        });
                        clone.stdout.on('data', function(data) {
                            process.stdout.write(data)
                        });
                        clone.stderr.on('data', function(data) {
                            process.stderr.write(data)
                        });
                    }).done();
            }
        });
        return init.promise;
    }
};
