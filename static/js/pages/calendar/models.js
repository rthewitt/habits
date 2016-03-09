define([ 'backbone' ], function(Backbone) {

    var Event = Backbone.Model.extend();

    var Events = Backbone.Collection.extend({
        model: Event,
        url: 'events'
    }); 

    return {
        Event: Event,
        Events: Events
    }
});
