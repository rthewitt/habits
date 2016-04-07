define([ 'backbone' ], function(Backbone) {

    var Habit = Backbone.Model.extend({
        urlRoot: 'habits',
        defaults: {
            id: 0,
            name: 'No name',
            flavor: 'NONE',
            color: 'white',
            description: 'No desc',
            behaviors: []
        }
    });

    var Habits = Backbone.Collection.extend({
        model: Habit,
        url: 'habits'
    });

    var Event = Backbone.Model.extend({
        urlRoot: 'events',
        defaults: {
            'title': '',
            'start': undefined,
            'end': undefined,
            'color': 'white'
        }
    });

    var Events = Backbone.Collection.extend({
        model: Event,
        url: 'events'
        // TODO remove this after changing all Events to HabitEvents
        /*
        model: function(attrs, options) {
            console.log('old event collection model function');
            return _getModelForAttrs(attrs, options);
        }
        */
    }); 

    // We are not using inheritance because it doesn't work as expected
    var HabitEvent = Backbone.Model.extend({
        defaults: {
            'title': '',
            'type': null, // reference to habit
            'start': undefined,
            'end': undefined,
            'behaviors': {},
        },
        initialize: function() {
            console.log('created habit event');
        },
        isComplete: function() {
            var behav = this.get('behaviors');
            for(var k in behav) {
                if(typeof behav[k] !== boolean || ! behav[k]) {
                    return false;
                }
            }
            return true;
        }
    });

    var HabitEvents = Backbone.Collection.extend({
        model: HabitEvent,
        url: 'events'
    });

    /*
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
        defaults: { 
            'type': 3,
            'morning_wake': false,
            'morning_run': false
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
    */

    return {
        Event: Event,
        Events: Events,
        HabitEvent: HabitEvent,
        HabitEvents: HabitEvents,
        Habit: Habit,
        Habits: Habits
    }
});
