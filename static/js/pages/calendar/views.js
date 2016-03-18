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
            _.bindAll(this, 'select', 'addAll', 'addOne', 'change', 'destroy', 'eventClick', 'eventMouseOver', 'eventMouseOut'); 

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
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,basicWeek,basicDay'
                },
                selectable: true,
                selectHelper: true,
                editable: true,
                ignoreTimezone: false,                
                select: this.select,
                eventClick: this.eventClick,
                eventMouseover: this.eventMouseOver,
                eventMouseout: this.eventMouseOut,
                eventDrop: this.eventDropOrResize,        
                eventResize: this.eventDropOrResize
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
            this.eventView.collection = this.collection;
            this.eventView.model = new Models.Event({start: startDate, end: endDate});
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
        change: function(event) {
            // Look up the underlying event in the calendar and update its details from the model
            var fcEvent = this.$el.fullCalendar('clientEvents', event.get('id'))[0];
            console.log('change event after server response');
            if(fcEvent === undefined) {
                this.$el.fullCalendar('renderEvent', event.toJSON());
            } else {
                console.log(fcEvent);
                //this.$el.fullCalendar('renderEvent', event.toJSON());
                fcEvent.title = event.get('title');
                fcEvent.color = event.get('color');
                this.$el.fullCalendar('updateEvent', fcEvent);           
            }
        },
        // TODO verify / improve this function, I have never used it
        eventDropOrResize: function(fcEvent) {
            // Lookup the model that has the ID of the event and update its attributes
            this.collection.get(fcEvent.id).save({start: fcEvent.start, end: fcEvent.end});            
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
            // This could be avoided with a model binder, but it will work for now.
            //this.model.set({'title': this.$('#title').val(), 'color': this.$('#color').val()});
            // I need to be consistent in my JSON & form naming conventions (not python)
            this.model.set({
                'prepare_meal': this.$('#prepare_meal').is(':checked'),
                'first_meal': this.$('#first_meal').is(':checked'),
                'type': Number(this.$('#habit-type').val()),
                'last_meal': this.$('#last_meal').is(':checked'),
                'plan_morning': this.$('#plan_morning').is(':checked'),
                'plan_evening': this.$('#plan_evening').is(':checked'),
                'prepare_meal': this.$('#prepare_meal').is(':checked')
            });
            
            if (this.model.isNew()) {
                // this is a reference to the EventsView collection
                this.collection.create(this.model, {success: this.close});
            } else {
                // this is a reference to the model created above
                this.model.save({}, {success: this.close});
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
