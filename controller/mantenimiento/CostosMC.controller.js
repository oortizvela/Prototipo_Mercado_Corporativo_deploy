sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (BaseController, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.mantenimiento.CostosMC", {

        onInit: function () {
            this.getView().setModel(new JSONModel({ haySeleccion: false }), "costosMCUi");
            this.getView().setModel(new JSONModel({ items: [] }), "costosMCConfig");

            this.getRouter()
                .getRoute("mantenimientoCostosMC")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var oMantenimiento = this.getOwnerComponent().getModel("mantenimiento");
            var fnInit = function () {
                // Construir lista única de marcas desde marcaProveedor
                var aMarcas = oMantenimiento.getProperty("/marcaProveedor") || [];
                var oSeen = {};
                var aUnique = [];
                aMarcas.forEach(function (m) {
                    if (m.marca && !oSeen[m.marca]) {
                        oSeen[m.marca] = true;
                        aUnique.push({ key: m.marca, text: m.marca });
                    }
                });
                this.getView().getModel("costosMCConfig").setProperty("/items", aUnique);

                var oTable = this.byId("tableCostos");
                if (oTable && oTable.getBinding("items")) {
                    oTable.getBinding("items").refresh();
                }
                this.getView().getModel("costosMCUi").setProperty("/haySeleccion", false);
            }.bind(this);

            if (oMantenimiento.getData && Object.keys(oMantenimiento.getData()).length > 0) {
                fnInit();
            } else {
                oMantenimiento.attachRequestCompleted(fnInit);
            }
        },

        onSelectionChange: function () {
            var oTable = this.byId("tableCostos");
            this.getView().getModel("costosMCUi").setProperty("/haySeleccion",
                !!(oTable && oTable.getSelectedItems().length > 0));
        },

        onAgregar: function () {
            var oModel = this.getOwnerComponent().getModel("mantenimiento");
            var aItems = oModel.getProperty("/costosMC") || [];
            var aMarcas = this.getView().getModel("costosMCConfig").getProperty("/items") || [];
            var sDefaultMarca = aMarcas.length ? aMarcas[0].key : "";
            var iNewId = aItems.reduce(function (iMax, oItem) { return Math.max(iMax, oItem.id || 0); }, 0) + 1;
            aItems.push({ id: iNewId, marca: sDefaultMarca, modeloEquipo: "", costo: 0, moneda: "USD" });
            oModel.setProperty("/costosMC", aItems);
        },

        onBorrar: function () {
            var oTable = this.byId("tableCostos");
            var aSelected = oTable ? oTable.getSelectedItems() : [];
            if (!aSelected.length) { return; }
            MessageBox.confirm("¿Desea eliminar " + aSelected.length + " registro(s) seleccionado(s)?", {
                title: "Confirmar eliminación",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        var oModel = this.getOwnerComponent().getModel("mantenimiento");
                        var aItems = oModel.getProperty("/costosMC") || [];
                        var aIndices = aSelected.map(function (oItem) {
                            return parseInt(oItem.getBindingContext("mantenimiento").getPath().replace("/costosMC/", ""), 10);
                        }).sort(function (a, b) { return b - a; });
                        aIndices.forEach(function (i) { aItems.splice(i, 1); });
                        oModel.setProperty("/costosMC", aItems);
                        this.getView().getModel("costosMCUi").setProperty("/haySeleccion", false);
                        MessageToast.show("Registro(s) eliminado(s)");
                    }
                }.bind(this)
            });
        },

        onGuardar: function () {
            MessageToast.show("Cambios guardados correctamente");
        },

        onImportarExcel: function () {
            MessageToast.show("Importar Excel - pendiente de implementar");
        },

        onDescargarPlantilla: function () {
            MessageToast.show("Descargar Plantilla - pendiente de implementar");
        },

        onExportar: function () {
            MessageToast.show("Exportar - pendiente de implementar");
        },

        onNavBack: function () {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getRouter().navTo("mantenimientoMain", {}, true);
            }
        }
    });
});
