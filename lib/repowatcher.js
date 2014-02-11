'use strict';

var FS = require('fs');
var Q = require('q');
var QFS = {
    mkdir: Q.denodeify(FS.mkdir)
};

var initComplete = Q.defer()

module.exports = {
    init: function(repo, launch_command, branch_blacklist) {
        console.log('init');
        QFS.mkdir(".repo").then(function() {
            console.log('made .repo');
            return QFS.mkdir(".repo/master");
        }).then(function() {
            console.log('made master');
            FS.exists(".repo/master", function(exists) {
                console.log('directories created?', exists);
                exists ? initComplete.resolve() : initComplete.reject();
            });
        });
        return this;
    },
    watch: function() {
        console.log('starting watch');
        initComplete.promise.done(function () {
            console.log('ready to go');
        });
    }
};
