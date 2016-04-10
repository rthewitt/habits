define([ 'marionette', 'pages/calendar/models', 'pages/calendar/templates' ], function(Marionette, Models, Templates) {

    var msgBus = Backbone.Wreqr.radio.channel('global');
    var emptyEvent = new Models.HabitEvent({id: undefined});

    var CalendarView = Marionette.ItemView.extend({

        tagName: 'div',

        className: 'calendar-foo',

        events: {
            //'click .choose-test': 'onTestSelect'
        },

        template: Templates.layoutTemplate,

        onTestSelect: function() {
            // we specifically want the router to handle this because
            // we this is technically another landing page
            Backbone.history.navigate('some-other-landing-page', { trigger: true });
        }
    });

    var HabitView = Marionette.ItemView.extend({
        template: _.template($('#habit-template').html()),
        events: {
            'click select': 'onClick',
            'change select': 'onChange',
            'mouseout select': 'onChange'
        },
        onClick: function(ev) {
            $(ev.target).removeClass();
        },
        onChange: function(ev) {
            cp = ev.target;
            var color = cp.options[cp.selectedIndex].value;
            $(cp).removeClass();
            $(cp).addClass('bg-'+color);
            this.model.set('color', color);

            msgBus.vent.trigger('color-change', { habitId: this.model.get('id'), 'color': color });
        }
    });

    var HabitsView = Marionette.CollectionView.extend({
        el: '#habit-area',
        childView: HabitView,
        onRender: function() {
            this.$('label').draggable({ helper: 'clone' });
        }
    });

    // Do we really want EventView and SummaryView to belong here?
    var EventsView = Marionette.ItemView.extend({
        initialize: function(options){
            _.bindAll(this, 'habitDrop', 'addAll', 'addOne', 'change', 'destroy', 'eventClick', 'eventRender', 'eventMouseOver', 'eventMouseOut'); 

            this.collection.bind('reset', this.addAll);
            this.collection.bind('add', this.addOne);
            this.collection.bind('change', this.change);            
            this.collection.bind('destroy', this.destroy);

            this.habits = options.habits; // collection
            this.eventView = new EventView;
            this.eventView.habits = options.habits;
            this.summaryView = new SummaryView({ model: emptyEvent });            
            this.summaryView.habits = options.habits;
            this.summaryView.render();

            var self = this;
            msgBus.vent.on('color-change', function(data) {
                console.log("I received color-change to " + data.color + "for habit with id="+data.habitId);
                self.$el.fullCalendar('rerenderEvents');
            });
        },
        render: function() {
            this.$el.fullCalendar({
                header: {
                    center: 'title',
                    left: 'month,basicWeek',
                    right: 'prev,next today'
                },
                editable: true,
                eventStartEditable: false, // disable dragging
                eventDurationEditable: false, // disable resize 
                droppable: true,
                drop: this.habitDrop, 
                ignoreTimezone: false,                
                eventClick: this.eventClick,
                eventMouseover: this.eventMouseOver,
                eventMouseout: this.eventMouseOut,
                eventRender: this.eventRender,        
                eventOrder: 'type'
            });
        },
        // apparently this isn't needed in order to add to the collection...
        addAll: function() {
            this.$el.fullCalendar('addEventSource', this.collection.toJSON());
        },
        // we have added to the collection? Where?
        addOne: function(event) {
            console.log("Ok, we added to the collection, but the SERVER will be giving us the id, so let's wait until we get a response before rendering!");
            //this.$el.fullCalendar('renderEvent', event.toJSON());
        },        
        // as long as we don't attach data to the draggable, we will end up here without a render
        habitDrop: function(startDate, ev, dragData) {
            this.eventView.collection = this.collection;
            var habitType = Number($(ev.target).attr('habit'));
            var habit = this.habits.get(habitType);
            this.eventView.model = new Models.HabitEvent({ allDay: true, start: startDate.toISOString() }, { fromHabit: habit });
            this.eventView.habit = habit;
            this.eventView.render();            
        },
        eventMouseOver: function(fcEvent) {
            if(this.isSummaryEmpty()) {
                this.summaryView.model = this.collection.get(fcEvent.id);
                this.summaryView.render();
            }
        },
        emptySummary: function() {
            this.summaryView.model = emptyEvent;
            this.summaryView.render();
        },
        isSummaryEmpty: function() {
            var isEmpty = this.summaryView.model === emptyEvent || this.summaryView.model.id === undefined;
            return isEmpty;
        },
        eventMouseOut: function(fcEvent) {
            if(!this.$('.fc-selected').length){
                this.summaryView.model = emptyEvent;
                this.summaryView.render();
            }
        },
        eventClick: function(fcEvent, jsEvent) {
            var anchor = $(jsEvent.target.closest('a'));
            if(anchor.hasClass('fc-selected')) {
                anchor.removeClass('fc-selected');
                this.emptySummary();
            } else {
                this.$('.fc-selected').removeClass('fc-selected');
                anchor.addClass('fc-selected');
                this.summaryView.model = this.collection.get(fcEvent.id);
                this.summaryView.render();
            }
        },
        eventRender: function(fcEvent, elem) {
            var hEvent = this.collection.get(fcEvent.id);
            var habit = this.habits.get(hEvent.get('type'));

            // Technically, we are mimicking props but we may have a better logic scenario
            // by simply iterating over behaviors of hEvent instead
            props = Object.keys(habit.get('behaviors'))
            clz = habit.get('flavor');
            var actions = hEvent.get('behaviors');

            numHabits = props.length;
            append = _.reduce(props, function(memo, item){ 
                var wasTrue = actions[item];
                return memo + Number(wasTrue) + (props.indexOf(item) == numHabits-1 ? '' : '-')
                }, '-')

            var color = habit.get('color');
            elem.addClass('bg-'+color);
            elem.addClass('fc-habit-'+clz+append);
            elem.addClass( ( append.indexOf('0') === -1 ? 'complete' : 'incomplete' ) )
        },
        change: function(event) {
            // Look up the underlying event in the calendar and update its details from the model
            var fcEvent = this.$el.fullCalendar('clientEvents', event.get('id'))[0];
            var habit = this.habits.get(event.get('type'));
            console.log('change event after server response');
            if(fcEvent === undefined) {
                this.$el.fullCalendar('renderEvent', event.toJSON(), true);
            } else {
                // When we change an event in the Backbone Collection
                // we still need to let Fullcalendar know what to render
                fcEvent.title = event.get('title');
                fcEvent.color = habit.get('color'); 
                this.$el.fullCalendar('updateEvent', fcEvent);           
            }
        },
        destroy: function(event) {
            this.$el.fullCalendar('removeEvents', event.id);         
        }        
    });

    // TODO move template out of index.html
    var SummaryView = Marionette.ItemView.extend({
        el: '#summary',
        className: 'from-views-js',
        initialize: function() {
            _.bindAll(this, 'template');
        },
        template: function(hEvent) {
            var habit = this.habits.get(hEvent.type);
            var context = hEvent.type === null ? hEvent : _.extend(hEvent, { 'habit': habit.attributes });
            return _.template($('#summary-template').html(), context);
        }
    });


    var EventView = Marionette.ItemView.extend({
        el: $('#event-details'),

        events: {
            'click .save-event': 'save',
            'click .delete-event': 'destroy'
        },
        
        initialize: function() {
            _.bindAll(this, 'render', 'save', 'close', 'destroy', 'template');           
            //this.$el.on('show.bs.modal', this.open);
        },

        onRender: function() {
            this.$el.modal('show');
            return this;
        },        

        template: function(hEvent) {
            var habit = this.habits.get(hEvent.type);
            var context = hEvent.type === null ? hEvent : _.extend(hEvent, { 'habit': habit.attributes });
            return _.template($('#create-template').html(), context);
        },

        save: function() {
                  //debugger;
            // assumes model has already been set??
            if (this.model.isNew()) {
                thisBehav = this.model.get('behaviors');
                for(var b in this.habit.get('behaviors')) {
                    console.log('saving '+b);
                    thisBehav[b] = this.$('#'+b).is(':checked');
                }
                this.model.save();
                this.collection.add(this.model, {success: this.close});
            } else {
                this.model.save({success: this.close});
            }
        },
        close: function() {
            this.$el.modal('hide');
        },
        destroy: function() {
            this.model.destroy({success: this.close});
        }        
    });
    
    return {
        CalendarView: CalendarView,
        HabitsView: HabitsView,
        EventsView: EventsView
    };
});
