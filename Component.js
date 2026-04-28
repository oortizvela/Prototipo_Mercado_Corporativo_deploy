sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "com/claro/compras/portal/model/models",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, Device, models, JSONModel) {
    "use strict";

    return UIComponent.extend("com.claro.compras.portal.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            this.setModel(models.createDeviceModel(), "device");
            this.setModel(models.createRequerimientosModel());
            this.setModel(models.createAprobacionesModel(), "aprobaciones");
            this.setModel(models.createMantenimientoModel(), "mantenimiento");

            // Modelo de sesión (vacío hasta que el usuario inicie sesión)
            this.setModel(new JSONModel({
                loggedIn:  false,
                usuario:   "",
                nombre:    "",
                rol:       "",
                categoria: ""
            }), "session");

            this.getRouter().initialize();
        }
    });
});

