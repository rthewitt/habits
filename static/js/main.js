require.config({
    paths: {
        "jquery": ["http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min",
                    "libs/jquery/dist/jquery.min"],
        "bootstrap": "libs/bootstrap/js/bootstrap",
        "socketio": "libs/socketio/socket.io-1.3.7",
        "underscore": "libs/underscore/underscore",
        "backbone": "libs/backbone/backbone",
        "backbone.wreqr": "libs/backbone.wreqr/backbone.wreqr.min",
        "templates": "../templates", // text plugin will allow this to be a base path
        "text": 'libs/requirejs/text', 
        "dragevent": "libs/jquery-events/jquery.event.drag-2.2",
        "dropevent": "libs/jquery-events/jquery.event.drop-2.2",
        "mustache": "libs/mustache/mustache",
		"fullcalendar": "libs/fullcalendar/fullcalendar",
		"moment": "libs/moment/moment.min",
        "marionette": "libs/marionette/lib/backbone.marionette.min"
    },
    shim: {
        "backbone": {
            deps: ["jquery", "underscore"],
            exports: "Backbone"
        }, 
        "bootstrap": ["jquery"],
        "dragevent": ["jquery"],
        "dropevent": ["jquery"]
    }
});

require([ 'jquery', 'socketio', 'backbone', 'marionette', 'mustache',
        // controllers
        'pages/calendar/controller',
        'config',
        // consume
        'bootstrap',
        'moment',
        'fullcalendar'
        ], function($, io, Backbone, Marionette, Mustache, 
            Calendar,  // controllers
            config) {

            var msgBus = Backbone.Wreqr.radio.channel('global');

            var socket;

            var app = new Marionette.Application();

            app.addRegions({
                menu: "#menu",
                pageContainer: "#page-container"
            });

            // hook, if I need it
            // app.addInitializer(function() { });

            app.on("start", function() {

                if(!Backbone.History.started) Backbone.history.start();

                /*
                socket = io.connect('ws://' + document.domain + ':' + location.port + '/test', { 'reconnectionAttempts': 5 });

                // History is not the same as history
                // moved above for now (no socketio)
                // if(!Backbone.History.started) Backbone.history.start();

                // status still pending
                socket.on('connect', function() {
                    connecting = false;
                });

                socket.on('reconnecting', function() {
                    connecting = true;
                    updateProxyStatus(null, null);
                });

                socket.on('reconnect_failed', function() {
                    alert("Unable to reach Admin VM");
                });
                */

            });

            msgBus.vent.on("app:show", function(view) {
                return app.pageContainer.show(view);
            });

            window.myApp = app;
            app.start();
});
