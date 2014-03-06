var child_process = require('child_process')
var Path = require('path')
var fs = require('fs-extra')
var Q = require('q')
var _ = require('lodash')

var DevServer = function(branch, working_directory) {
	console.log("dev server ctor for", branch, "in", working_directory)
	this.branch = branch
	this.working_directory = working_directory
	this.running = false;
}

DevServer.prototype.start = function() {
	this.stop()
	console.log("start", this.branch)
	this.running = true
}

DevServer.prototype.stop = function() {
	if (this.running) {
		console.log("stop", this.branch)
		this.running = false
	}
}

module.exports = DevServer