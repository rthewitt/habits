require.config({
    paths: {
        "jquery": ["http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min",
                    "libs/jquery/dist/jquery.min"],
        "jquery-ui": "libs/jquery-ui/jquery-ui.min",
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
        "jquery-ui": {
            deps: ["jquery"],
            exports: "$"
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
        'jquery-ui',
        'bootstrap',
        'moment',
        'fullcalendar'
        ], function($, io, Backbone, Marionette, Mustache, 
            Calendar,  // controllers
            config) {

            var msgBus = Backbone.Wreqr.radio.channel('global');

            var socket;

            var app = new Marionette.Application();

            // TODO we want the calendar page layout to have several regions (summary, main, etc)
            // we will show the layout in the pageContainer, and the Layout will manage the regions
            // We can then switch views without reloading the page(s)
            app.addRegions({
                menu: "#menu",
                pageContainer: "#page-container"
            });


            app.on("start", function() {
                if(!Backbone.History.started) Backbone.history.start();
                $('#active-habit-area').on('change', function(v) {
                    $('#active-habit-type').val(v.target.value);
                });
            });

            msgBus.vent.on("app:show", function(view) {
                // TODO I added this logic - all it used to do was show
                return app.pageContainer.show(view);
            });

            window.myApp = app;
            app.start();
});
