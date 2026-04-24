sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "com/claro/compras/portal/model/models"
], function (UIComponent, Device, models) {
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

            this.getRouter().initialize();
        }
    });
});
