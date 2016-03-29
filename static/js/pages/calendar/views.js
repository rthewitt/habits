define([ 'marionette', 'pages/calendar/models', 'pages/calendar/templates' ], function(Marionette, Models, Templates) {

    var msgBus = Backbone.Wreqr.radio.channel('global');
    var emptyEvent = new Models.Event({id: undefined});

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

    // Do we really want EventView and SummaryView to belong here?
    var EventsView = Marionette.ItemView.extend({
        initialize: function(){
            _.bindAll(this, 'select', 'addAll', 'addOne', 'change', 'destroy', 'eventClick', 'eventRender', 'eventMouseOver', 'eventMouseOut'); 

            this.collection.bind('reset', this.addAll);
            this.collection.bind('add', this.addOne);
            this.collection.bind('change', this.change);            
            this.collection.bind('destroy', this.destroy);

            this.eventView = new EventView();            
            this.summaryView = new SummaryView({ model: emptyEvent });            
            this.summaryView.render();
        },
        render: function() {
            this.$el.fullCalendar({
                header: {
                    center: 'title',
                    //right: 'month,basicWeek,basicDay'
                    left: '',
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
            });
        },
        // apparently this isn't needed in order to add to the collection...
        addAll: function() {
            // TODO can I just specify the damned JSON collection so that it's dynamic?
            this.$el.fullCalendar('addEventSource', this.collection.toJSON());
        },
        // we have added to the collection? Where?
        addOne: function(event) {
            console.log("Ok, we added to the collection, but the SERVER will be giving us the id, so let's wait until we get a response before rendering!")
            //this.$el.fullCalendar('renderEvent', event.toJSON());
        },        
        select: function(startDate, endDate) {
            this.eventView.collection = this.collection;
            // TODO move active-event-type somewhere else
            var eventType = Number($('#active-habit-type').val());
            this.eventView.model = Models.getModelForAttrs({ type: eventType, allDay: true, start: startDate.toISOString() });
            this.eventView.render();            
        },
        // When do we want to use msgBus and when do we just want to render directly?
        eventMouseOver: function(fcEvent) {
            this.summaryView.model = this.collection.get(fcEvent.id);
            this.summaryView.render();
        },
        eventMouseOut: function(fcEvent) {
            this.summaryView.model = emptyEvent
            this.summaryView.render();
        },
        eventClick: function(fcEvent) {
            this.eventView.model = this.collection.get(fcEvent.id);
            this.eventView.render();
        },
        eventRender: function(fcEvent, elem) {
            var hEvent = this.collection.get(fcEvent.id);

            var planHabits = ['plan_morning', 'plan_evening'],
                foodHabits = ['first_meal', 'prepare_meal', 'last_meal'],
                morningHabits = [];

            var clz, props;
            switch(hEvent.get('type')) {
                case 1:
                    props = planHabits;
                    clz = 'plan';
                    break;
                case 2:
                    props = foodHabits;
                    clz = 'food';
                    break;
                case 3:
                    props = morningHabits;
                    clz = 'morning';
                    break;
                default:
            }
            if(clz !== undefined) {
                numHabits = props.length;
                append = _.reduce(props, function(memo, item){ 

                    console.log("memo " + memo);
                    var wasTrue = hEvent.get(item);
                    console.log('wasTrue: '+wasTrue);
                    return memo + Number(wasTrue) + (props.indexOf(item) == numHabits-1 ? '' : '-')
                    }, '-')
                elem.addClass('fc-habit-'+clz+append);
            }
        },
        change: function(event) {
            // Look up the underlying event in the calendar and update its details from the model
            var fcEvent = this.$el.fullCalendar('clientEvents', event.get('id'))[0];
            console.log('change event after server response');
            if(fcEvent === undefined) {
                console.log("event did not have an id");
                /*
                 * FIXME - we are hacking this now, we want the event source to update!!!!  
                 * another alternative it to simply do nothing, because if I update the 
                 * server-side collection then the next time I load the page it will be there 
                 * it creates a disparity, I would rather the eventsource was... not static...
                 *
                 * We have two options: either provide fullCalendar with an events function
                 * explicitly calling the callback, or
                 *
                 * provide a JSON url for it to retrieve events from. It may be able to just use
                 * the backbone collection object... or it could just use the same API to pull
                 * in which case I would have two collections instead of a derivative collection
                 *
                 * See:
                 *
                 * http://www.ngroutes.com/questions/1aecbd3/changes-in-eventsources-model-do-not-reflect-in-fullcalendar.html
                 */
               
                
                this.$el.fullCalendar('renderEvent', event.toJSON(), true);
            } else {
                console.log("event had an id: " + fcEvent);
                /*
                 * When we change an event in the Backbone Collection
                 * we still need to let Fullcalendar know what to
                 * render... I don't really know why they can't
                 * be the same object. Do I want them to be the same?
                 * If they are the same, I cannot easily share the model
                 */
                fcEvent.title = event.get('title');
                fcEvent.color = event.get('color');
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
        template: _.template($('#summary-template').html())
    });


    var EventView = Marionette.ItemView.extend({
        el: $('#event-details'),

        events: {
            'click .save-event': 'save',
            'click .delete-event': 'destroy'
        },
        
        initialize: function() {
            _.bindAll(this, 'render', 'open', 'save', 'close', 'destroy');           
            this.$el.on('show.bs.modal', this.open);
        },

        onRender: function() {
            if(!this.model.isNew()) this.$el.addClass('edit');
            this.$el.modal('show');
            return this;
        },        

        template: _.template($('#details-template').html()),

        open: function() {}, // occurs when we show the modal

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
                        //this.model.set({});
                        break;
                    default:
                        break;
                }
                this.model.save();
                this.collection.add(this.model, {success: this.close});
            } else {
                // this is a reference to the model created above
                // sends the whole model
                this.model.save({success: this.close});
            }
        },
        close: function() {
            this.$el.removeClass('edit');
            this.$el.modal('hide');
        },
        destroy: function() {
            this.model.destroy({success: this.close});
        }        
    });
    
    return {
        CalendarView: CalendarView,
        EventsView: EventsView
    };
});
