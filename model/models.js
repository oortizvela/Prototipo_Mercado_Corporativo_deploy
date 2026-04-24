sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (JSONModel, Device) {
    "use strict";

    return {

        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        createRequerimientosModel: function () {
            var oModel = new JSONModel();
            oModel.loadData(sap.ui.require.toUrl("com/claro/compras/portal/model/mockdata/requerimientos.json"));
            return oModel;
        },

        createAprobacionesModel: function () {
            var oModel = new JSONModel();
            oModel.loadData(sap.ui.require.toUrl("com/claro/compras/portal/model/mockdata/aprobaciones.json"));
            return oModel;
        },

        createMantenimientoModel: function () {
            var oModel = new JSONModel();
            oModel.loadData(sap.ui.require.toUrl("com/claro/compras/portal/model/mockdata/mantenimiento.json"));
            return oModel;
        }
    };
});
