define([ 'backbone' ], function(Backbone) {

    var Habit = Backbone.Model.extend({
        urlRoot: 'habits',
        defaults: {
            id: 0,
            name: 'No name',
            flavor: 'NONE',
            color: 'white',
            description: 'No desc',
            behaviors: {}
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
    }); 

    // We are not using inheritance because it doesn't work as expected
    var HabitEvent = Backbone.Model.extend({

        urlRoot: 'hevents',

        defaults: {
            'title': '',
            'type': null, // currently id of habit
            'start': undefined,
            'end': undefined,
            'behaviors': {},
        },

        initialize: function(attrs, opts) {
            if(opts && opts.fromHabit) {
                this.set('type', opts.fromHabit.get('id'));
                var fromBehav = opts.fromHabit.get('behaviors'); 
                var thisBehav = this.get('behaviors'); 
                for(var b in fromBehav) {
                    if(!(b in thisBehav)) thisBehav[b] = false;
                }
            }
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
        url: 'hevents'
    });


    return {
        Event: Event,
        Events: Events,
        HabitEvent: HabitEvent,
        HabitEvents: HabitEvents,
        Habit: Habit,
        Habits: Habits
    }
});
