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
            this.set('color', this.getColorForType(this.get('type')));
        },

        getColorForType: function(t) {
            var color = '';
            switch(t) {
                case 1:
                    color = '#091A69';
                    break;
                case 2:
                    color = 'green';
                    break;
                default:
                    break;
            }
            return color;
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
