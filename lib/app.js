/**
 * @author Stanislav Kalashnik <darkpark.main@gmail.com>
 * @license GNU GENERAL PUBLIC LICENSE Version 3
 */

'use strict';

var fs      = require('fs'),
    path    = require('path'),
    Emitter = require('cjs-emitter'),
    Runner  = require('cjs-runner'),
    extend  = require('extend'),
    debug   = require('debug')('app'),
    tasks   = require('./tasks'),
    app     = new Emitter(),
    runner  = new Runner(),
    cwd     = process.cwd(),
    ignore  = [];

//debug('init');

app.config  = require('../config');
app.package = require(path.join(cwd, 'package.json'));
app.paths   = {
    root:          cwd,
    project:       path.join(cwd, '.sdk'),
    ignorePlugins: path.join(cwd, '.sdk', 'ignore.json')
};

try {
    fs.mkdirSync(app.paths.project);
    debug('create project directory: ' + app.paths.project);
} catch ( error ) {
    debug('existing project directory: ' + app.paths.project);
}

try {
    ignore = require(app.paths.ignorePlugins);
    debug('ignore plugins', ignore);
} catch ( error ) {
    debug('no ignored plugins');
}

app.init = function ( config ) {
    var tasks = {};

    debug('tasks to execute', config.tasks);

    // load plugin tasks
    config.plugins.forEach(function ( name ) {
        var plugin;

        if ( ignore.indexOf(name) === -1 ) {
            // load
            plugin = require(name);
            // and merge
            extend(true, tasks, plugin.tasks);
        }
    });

    // extract global tasks
    Object.keys(tasks).forEach(function ( name ) {
        var parts = name.split(':');

        // task like "jade:build"
        if ( parts.length === 2 ) {
            // create/add in general list
            tasks[parts[1]] = tasks[parts[1]] || [];
            tasks[parts[1]].push(name);
        }
    });

    //console.log(tasks);

    // create runner tasks
    Object.keys(tasks).forEach(function ( name ) {
        // skip marked for deletion
        if ( name && tasks[name] && typeof tasks[name] === 'function' ) {
            runner.task(name, tasks[name]);
        }
    });

    //console.log(runner);
    runner.run(config.tasks[0]);
};

//tasks.load('spa-system-');


//debug('exit');

// public
module.exports = app;