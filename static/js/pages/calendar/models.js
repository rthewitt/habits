define([ 'backbone' ], function(Backbone) {

    var Event = Backbone.Model.extend({
        defaults: {
                      'title': '',
                      'type': 0,
                      'start': undefined,
                      'end': undefined,
                      'color': 'purple',
                      'plan_morning': false,
                      'plan_evening': false,
                      'prepare_meal': false,
                      'first_meal': false,
                      'last_meal': false
                  },
        // FIXME this does not get set appropriately on form change, 
        // we need to listen on change or set it in the view
        // It would be better if it didn't happen in model init...
        initialize: function() {
            switch(this.get('type')) {
                case 1:
                    this.set('color', '#091A69');
                    break;
                case 2:
                    this.set('color', 'green');
                    break;
                default:
                    break;
            }
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
