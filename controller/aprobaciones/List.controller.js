sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/TextArea",
    "sap/m/Button"
], function (BaseController, Filter, FilterOperator, JSONModel, MessageToast, Dialog, TextArea, Button) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.aprobaciones.List", {

        onInit: function () {
            var oUiModel = new JSONModel({ mercadoCorporativo: false });
            this.getView().setModel(oUiModel, "ui");

            this.getRouter()
                .getRoute("aprobacionesList")
                .attachPatternMatched(this._onRouteMatched.bind(this, false), this);

            this.getRouter()
                .getRoute("mcAprobacionesList")
                .attachPatternMatched(this._onRouteMatched.bind(this, true), this);
        },

        _onRouteMatched: function (bMC) {
            this.getView().getModel("ui").setProperty("/mercadoCorporativo", !!bMC);
            this._applyFilters();
        },

        onBuscar: function () {
            this._applyFilters();
        },

        onLimpiarFiltros: function () {
            this.byId("filterNSolicitud").setValue("");
            this.byId("filterTitulo").setValue("");
            this.byId("filterFechaDesde").setValue("");
            this.byId("filterFechaHasta").setValue("");
            this.byId("filterPeriodo").setValue("");
            this.byId("filterTipoSolicitud").setSelectedKey("");
            this.byId("tableSearch").setValue("");
            this._applyFilters();
        },

        onTableSearch: function () {
            this._applyFilters();
        },

        _applyFilters: function () {
            var oTable = this.byId("aprTable");
            if (!oTable) { return; }

            var aFilters = [];
            var bMC = this.getView().getModel("ui").getProperty("/mercadoCorporativo");

            // Filtro por mercado
            aFilters.push(new Filter("mercado", FilterOperator.EQ, bMC ? "corporativo" : "local"));

            var sNSolicitud = (this.byId("filterNSolicitud") && this.byId("filterNSolicitud").getValue()) || "";
            var sTitulo = (this.byId("filterTitulo") && this.byId("filterTitulo").getValue()) || "";
            var sPeriodo = (this.byId("filterPeriodo") && this.byId("filterPeriodo").getValue()) || "";
            var sTipoSolicitud = (this.byId("filterTipoSolicitud") && this.byId("filterTipoSolicitud").getSelectedKey()) || "";
            var sSearch = (this.byId("tableSearch") && this.byId("tableSearch").getValue()) || "";

            if (sNSolicitud.trim()) { aFilters.push(new Filter("aprId", FilterOperator.Contains, sNSolicitud.trim())); }
            if (sTitulo.trim())     { aFilters.push(new Filter("titulo", FilterOperator.Contains, sTitulo.trim())); }

            var oDateDesde = this.byId("filterFechaDesde") && this.byId("filterFechaDesde").getDateValue();
            if (oDateDesde) { aFilters.push(new Filter("fechaSolicitud", FilterOperator.GE, oDateDesde.toISOString().split("T")[0])); }
            var oDateHasta = this.byId("filterFechaHasta") && this.byId("filterFechaHasta").getDateValue();
            if (oDateHasta) { aFilters.push(new Filter("fechaSolicitud", FilterOperator.LE, oDateHasta.toISOString().split("T")[0])); }

            if (!bMC && sPeriodo.trim())  { aFilters.push(new Filter("periodo", FilterOperator.Contains, sPeriodo.trim())); }
            if (sTipoSolicitud)           { aFilters.push(new Filter("tipoSolicitud", FilterOperator.EQ, sTipoSolicitud)); }

            if (sSearch.trim()) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("aprId", FilterOperator.Contains, sSearch.trim()),
                        new Filter("titulo", FilterOperator.Contains, sSearch.trim()),
                        new Filter("estado", FilterOperator.Contains, sSearch.trim()),
                        new Filter("tipoSolicitud", FilterOperator.Contains, sSearch.trim())
                    ],
                    and: false
                }));
            }

            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.filter(aFilters.length ? new Filter({ filters: aFilters, and: true }) : []);
            }
        },

        onItemPress: function (oEvent) {
            var sAprId = oEvent.getSource().getBindingContext("aprobaciones").getProperty("aprId");
            var bMC = this.getView().getModel("ui").getProperty("/mercadoCorporativo");
            this.getRouter().navTo(
                bMC ? "mcAprobacionesDetail" : "aprobacionesDetail",
                { aprId: encodeURIComponent(sAprId) }
            );
        },

        onApprove: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("aprobaciones");
            this._performAction(oContext, "Aprobar");
        },

        onReject: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("aprobaciones");
            this._performAction(oContext, "Rechazar");
        },

        _performAction: function (oContext, sAction) {
            var oTextArea = new TextArea({ placeholder: "Ingrese comentario (opcional)...", width: "100%", rows: 3 });
            var sPath = oContext.getPath();

            var oDialog = new Dialog({
                title: sAction + " Solicitud",
                type: "Message",
                content: [
                    new sap.m.Text({ text: "Solicitante: " + oContext.getProperty("empleado") }),
                    new sap.m.Text({ text: "Dispositivo: " + oContext.getProperty("dispositivo") + " " + oContext.getProperty("modelo") }),
                    oTextArea
                ],
                beginButton: new Button({
                    text: sAction,
                    type: sAction === "Aprobar" ? "Emphasized" : "Reject",
                    press: function () {
                        var oModel = this.getOwnerComponent().getModel("aprobaciones");
                        var sEstado = sAction === "Aprobar" ? "Aprobado" : "Rechazado";
                        oModel.setProperty(sPath + "/estado", sEstado);
                        oModel.setProperty(sPath + "/aprobador", "Omar Ortiz");
                        oModel.setProperty(sPath + "/comentarioAprobador", oTextArea.getValue());
                        oModel.setProperty(sPath + "/fechaAprobacion", new Date().toISOString().split("T")[0]);
                        oDialog.close();
                        MessageToast.show("Solicitud " + sEstado.toLowerCase() + " exitosamente");
                    }.bind(this)
                }),
                endButton: new Button({ text: "Cancelar", press: function () { oDialog.close(); } })
            });
            this.getView().addDependent(oDialog);
            oDialog.open();
        }
    });
});
