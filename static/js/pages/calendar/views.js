define([ 'marionette', 'pages/calendar/models', 'pages/calendar/templates' ], function(Marionette, Models, Templates) {

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

    var EventsView = Backbone.View.extend({
        initialize: function(){
            _.bindAll(this, 'select', 'addAll', 'addOne', 'change', 'destroy', 'eventClick'); 

            this.collection.bind('reset', this.addAll);
            this.collection.bind('add', this.addOne);
            this.collection.bind('change', this.change);            
            this.collection.bind('destroy', this.destroy);

            this.eventView = new EventView();            
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
                eventDrop: this.eventDropOrResize,        
                eventResize: this.eventDropOrResize
            });
        },
        // apparently this isn't needed in order to add to the collection...
        addAll: function() {
            this.$el.fullCalendar('addEventSource', this.collection.toJSON());
        },
        addOne: function(event) {
            console.log("Ok, we added to the collection, but the SERVER will be giving us the id, so let's wait until we get a response before rendering!")
            //this.$el.fullCalendar('renderEvent', event.toJSON());
        },        
        select: function(startDate, endDate) {
            this.eventView.collection = this.collection;
            this.eventView.model = new Models.Event({start: startDate, end: endDate});
            this.eventView.render();            
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
        eventDropOrResize: function(fcEvent) {
            // Lookup the model that has the ID of the event and update its attributes
            this.collection.get(fcEvent.id).save({start: fcEvent.start, end: fcEvent.end});            
        },
        destroy: function(event) {
            this.$el.fullCalendar('removeEvents', event.id);         
        }        
    });

    var EventView = Backbone.View.extend({
        el: $('#event-details'),

        events: {
            'click .save-event': 'save',
            'click .delete-event': 'destroy'
        },
        
        initialize: function() {
            _.bindAll(this, 'render', 'open', 'save', 'close', 'destroy');           
            this.$el.on('show.bs.modal', this.open);
        },
        render: function() {
            if(!this.model.isNew()) this.$el.addClass('edit');
            this.$el.modal('show');
            return this;
        },        
        open: function() {
            this.$('#title').val(this.model.get('title'));
            this.$('#color').val(this.model.get('color'));            
        },        
        save: function() {
            this.model.set({'title': this.$('#title').val(), 'color': this.$('#color').val()});
            
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
