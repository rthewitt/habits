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
        template: _.template('<div class="foo"><%- name %></div>')
    });

    var HabitsView = Marionette.CollectionView.extend({
        el: '#habit-list',
        childView: HabitView
    });

    // Do we really want EventView and SummaryView to belong here?
    var EventsView = Marionette.ItemView.extend({
        initialize: function(options){
            _.bindAll(this, 'select', 'addAll', 'addOne', 'change', 'destroy', 'eventClick', 'eventRender', 'eventMouseOver', 'eventMouseOut'); 

            this.collection.bind('reset', this.addAll);
            this.collection.bind('add', this.addOne);
            this.collection.bind('change', this.change);            
            this.collection.bind('destroy', this.destroy);

            this.habits = options.habits; // collection
            this.eventView = new EventView();
            this.summaryView = new SummaryView({ model: emptyEvent });            
            this.summaryView.habits = options.habits;
            this.summaryView.render();
        },
        render: function() {
            this.$el.fullCalendar({
                header: {
                    center: 'title',
                    left: 'month,basicWeek',
                    right: 'prev,next today'
                },
                selectable: true,
                selectHelper: true,
                editable: true,
                ignoreTimezone: false,                
                select: this.select,
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
            console.log("Ok, we added to the collection, but the SERVER will be giving us the id, so let's wait until we get a response before rendering!")
            //this.$el.fullCalendar('renderEvent', event.toJSON());
        },        
        select: function(startDate, endDate) {
                    console.log('at least this is working');
                    debugger;
            this.eventView.collection = this.collection;
            // TODO we should have a list of "current ongoing habits" that render out each new day - manual add only for the past
            // TODO make this new event create only
            var eventType = Number($('#active-habit-type').val());
            // TODO FIXME this no longer exists
            this.eventView.model = Models.getModelForAttrs({ type: eventType, allDay: true, start: startDate.toISOString() });
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

            var color = habit.get('color');
            elem.css({ 'background-color': color, 'border-color': color });


            // TODO FIXME - now we want a class like habit-food except habit-<num_behaviors>
            // except we will have more than one such type for a habit of two behaviors
            // so a better method is placing a prop on the habit ITSELF.
            // We can make all of this simpler by making the hEvent type parameter have a string
            // that corresponds to the id of habit, and that string will be used as the css class
            // habit-<type>
            // not much would change here at all, and we could theoretically remove the habit collection
            // from this View.  Don't have to, but we won't need it.
            // well now, that's not entirely true is it?
            // because plan_<food> wouldn't allow us to reuse that class but in a different color
            // therefore we need a flavor attribute on the habit object itself.
            // we could achieve reuse by FLAVOR<num_behaviors> which is sort of what we're doing
            // and then we could establish versions for 0..N for each added flavor
            numHabits = props.length;
            append = _.reduce(props, function(memo, item){ 

                console.log("memo " + memo);
                var wasTrue = actions[item];
                console.log('wasTrue: '+wasTrue);
                return memo + Number(wasTrue) + (props.indexOf(item) == numHabits-1 ? '' : '-')
                }, '-')
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
        //template: _.template($('#summary-template').html())
        template: function(hEvent) {
            console.log('in template function');
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
            _.bindAll(this, 'render', 'save', 'close', 'destroy');           
            //this.$el.on('show.bs.modal', this.open);
        },

        onRender: function() {
            this.$el.modal('show');
            return this;
        },        

        template: _.template($('#details-template').html()),

        save: function() {

            // assumes model has already been set??
            if (this.model.isNew()) {
                switch(this.model.get('type')) {
                    // planning
                    case 1:
                        this.model.set({
                            'plan_morning': this.$('#plan_morning').is(':checked'),
                            'plan_evening': this.$('#plan_evening').is(':checked')
                        });
                        break;
                    // food
                    case 2:
                        this.model.set({
                            'prepare_meal': this.$('#prepare_meal').is(':checked'),
                            'first_meal': this.$('#first_meal').is(':checked'),
                            'last_meal': this.$('#last_meal').is(':checked')
                        });
                        break;
                    // morning
                    case 3:
                        this.model.set({
                            'morning_wake': this.$('#morning_wake').is(':checked'),
                            'morning_run': this.$('#morning_run').is(':checked')
                        });
                        break;
                    default:
                        break;
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
