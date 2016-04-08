define([ "marionette", "pages/calendar/views", "pages/calendar/models" ], function(Marionette, Views, Models) {

    var msgBus = Backbone.Wreqr.radio.channel('global');

    var routes = { 
        "": "showDefault",
        "calendar": "show"
    };

    var controller = {
        // we trigger here instead of in main, so that people can still
        // navigate to the correct router with a saved URL
        showDefault: function() {
            Backbone.history.navigate('calendar', { trigger: true });
        },
        show: function() {

            var hEvents = new Models.HabitEvents();
            var habits = new Models.Habits();

            new Views.HabitsView({ collection: habits }).render();
            new Views.EventsView({el: $("#calendar"), collection: hEvents, habits: habits }).render()

            // we will need a callback here if we trigger an event...
            habits.fetch({ reset: true });
            hEvents.fetch({ reset: true });
            //return msgBus.vent.trigger("app:show", new Views.EventsView);
        }
    };

    return new Marionette.AppRouter({ appRoutes: routes, controller: controller });
});
