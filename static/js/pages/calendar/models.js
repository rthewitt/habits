define([ 'backbone' ], function(Backbone) {

    var Event = Backbone.Model.extend({
        defaults: {
                      'title': '',
                      'type': 0,
                      'color': 'purple',
                      'plan_morning': false,
                      'plan_evening': false,
                      'prepare_meal': false,
                      'first_meal': false,
                      'last_meal': false
                  }
    });

    var Events = Backbone.Collection.extend({
        model: Event,
        url: 'events'
    }); 

    return {
        Event: Event,
        Events: Events
    }
});
