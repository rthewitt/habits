define([ 'backbone' ], function(Backbone) {

    var Event = Backbone.Model.extend({
        defaults: {
            'title': '',
            'type': 0,
            'start': undefined,
            'end': undefined,
            'color': 'white',
        },

        // We are moving from color to images, but for limited browsers
        // maybe we want to use only colors?
        initialize: function() {
            //this.set('color', this.getColorForType(this.get('type')));
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

    var PlanEvent = Event.extend({
        defaults: {
            'type': 1,
            'plan_morning': false,
            'plan_evening': false
        }
    });

    var FoodEvent = Event.extend({
        defaults: {
            'type': 2,
            'prepare_meal': false,
            'first_meal': false,
            'last_meal': false
        }
    });

    var MorningEvent = Event.extend({
        // TODO exercise
        defaults: { 
            'type': 3 
        }
    });

    var Events = Backbone.Collection.extend({
        model: Event,
        url: 'events',
        model: function(attrs, options) {
            return _getModelForAttrs(attrs, options);
        }
    }); 

    // call with { type: X } for new Model
    function _getModelForAttrs(attrs, options) {
        options = options || {};
        switch(attrs.type) {
            case 1:
                // planning
                return new PlanEvent(attrs, options);
            case 2:
                // food & spending 
                return new FoodEvent(attrs, options);
            case 3:
                // morning routine
                return new MorningEvent(attrs, options);
            default:
                return new Event(attrs, options);
        }
    }

    return {
        Event: Event,
        Events: Events,
        getModelForAttrs: _getModelForAttrs
    }
});
