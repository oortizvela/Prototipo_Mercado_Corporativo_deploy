sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.mantenimiento.Main", {

        onInit: function () {
            var oKpiModel = new JSONModel({ cntConstantes: 0, cntNiveles: 0, cntMarcas: 0, cntCostosMC: 0, mercadoCorporativo: false });
            this.getView().setModel(oKpiModel, "mantenimientoKpi");

            this.getRouter()
                .getRoute("mantenimientoMain")
                .attachPatternMatched(this._onRouteMatched.bind(this, false), this);

            this.getRouter()
                .getRoute("mcMantenimientoMain")
                .attachPatternMatched(this._onRouteMatched.bind(this, true), this);
        },

        _onRouteMatched: function (bMC) {
            this.getView().getModel("mantenimientoKpi").setProperty("/mercadoCorporativo", !!bMC);
            var oModel = this.getOwnerComponent().getModel("mantenimiento");
            var fnRefresh = function () {
                var oKpi = this.getView().getModel("mantenimientoKpi");
                oKpi.setProperty("/cntConstantes",  (oModel.getProperty("/constantes")        || []).length);
                oKpi.setProperty("/cntNiveles",     (oModel.getProperty("/nivelesAprobacion") || []).length);
                oKpi.setProperty("/cntMarcas",      (oModel.getProperty("/marcaProveedor")    || []).length);
                oKpi.setProperty("/cntCostosMC",    (oModel.getProperty("/costosMC")          || []).length);
            }.bind(this);

            if (oModel.getData && Object.keys(oModel.getData()).length > 0) {
                fnRefresh();
            } else {
                oModel.attachRequestCompleted(fnRefresh);
            }
        },

        onTileConstantes: function () {
            this.getRouter().navTo("mantenimientoConstantes");
        },

        onTileNiveles: function () {
            this.getRouter().navTo("mantenimientoNiveles");
        },

        onTileMarcaProveedor: function () {
            this.getRouter().navTo("mantenimientoMarcaProveedor");
        },

        onTileCostosMC: function () {
            this.getRouter().navTo("mantenimientoCostosMC");
        },

        onTileLineasNegocio: function () {
            this.getRouter().navTo("mcLineasNegocio");
        },

        onTileTiposMC: function () {
            this.getRouter().navTo("mcTiposMC");
        },

        onTileClientesMC: function () {
            this.getRouter().navTo("mcClientesMC");
        }
    });
});