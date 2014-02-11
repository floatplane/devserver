'use strict';

var repowatcher = require('./lib/repowatcher');
repowatcher.watch('git@github.com:picmonkey/Jitter.git', // 'git@github.com:picmonkey/picmonkey.git',
                  'rake launch',
                  ['master', 'production']);
repowatcher.ready(function() {
    // Add routes
    console.log('server.js: repo ready');
})

var express = require('express');

/**
 * Main application file
 */

// Default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Application Config
var config = require('./lib/config/config');

var app = express();

// Express settings
require('./lib/config/express')(app);

// Routing
require('./lib/routes')(app);

// Start server
app.listen(config.port, function () {
  console.log('Express server listening on port %d in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
