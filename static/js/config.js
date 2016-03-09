define([ "backbone", "marionette" ], function(Backbone, Marionette) {

    var msgBus = Backbone.Wreqr.radio.channel('global');

    var AppConfig = Backbone.Model.extend({

        defaults: {
            "foo": "bar"
        },

        initialize: function() {
            var self = this;
            msgBus.reqres.setHandler("app:config", function() { return self; });
        }
    });
});
