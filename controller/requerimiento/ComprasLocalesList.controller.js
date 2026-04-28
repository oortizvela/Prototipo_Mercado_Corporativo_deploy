sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (BaseController, Filter, FilterOperator, JSONModel, MessageToast) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.requerimiento.ComprasLocalesList", {

        onInit: function () {
            this.getView().setModel(new JSONModel({ haySeleccion: false }), "ui");

            this.getView().setModel(new JSONModel({
                items: [
                    {
                        reqId: "REQ-CL-2026-000001",
                        titulo: "Compra directa de herramientas de instalaci\u00f3n para cuadrillas t\u00e9cnicas",
                        tipoSolicitud: "Compra Directa",
                        canal: "Infraestructura",
                        lineaNegocio: "Compras Locales",
                        estado: "Registrado",
                        numeroSolped: "-",
                        numeroPedido: "-"
                    },
                    {
                        reqId: "REQ-CL-2026-000002",
                        titulo: "CD Materiales el\u00e9ctricos para soporte operativo \u2013 Nodo Norte",
                        tipoSolicitud: "Compra Urgente",
                        canal: "Infraestructura",
                        lineaNegocio: "Compras Locales",
                        estado: "En Aprobaci\u00f3n",
                        numeroSolped: "-",
                        numeroPedido: "-"
                    },
                    {
                        reqId: "REQ-CL-2026-000003",
                        titulo: "Bater\u00edas para equipo de respaldo - Lima",
                        tipoSolicitud: "Reposici\u00f3n Operativa",
                        canal: "Infraestructura",
                        lineaNegocio: "Compras Locales",
                        estado: "Aprobado",
                        numeroSolped: "-",
                        numeroPedido: "-"
                    },
                    {
                        reqId: "REQ-CL-2026-000004",
                        titulo: "Servicio de enlace MLPS \u2013 Cliente Corporativo Sede Central",
                        tipoSolicitud: "Compra Directa",
                        canal: "Infraestructura",
                        lineaNegocio: "Compras Locales",
                        estado: "Finalizado",
                        numeroSolped: "2000000001",
                        numeroPedido: "4500000001"
                    }
                ]
            }), "comprasLocales");

            this.getRouter()
                .getRoute("comprasLocalesList")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._syncFromGlobal();
            this._clearFilters();
            this._applyFilters();
            var oTable = this.byId("comprasLocalesTable");
            if (oTable) { oTable.removeSelections(true); }
            this.getView().getModel("ui").setProperty("/haySeleccion", false);
        },

        // Refresca estados desde el modelo global al volver a la lista
        _syncFromGlobal: function () {
            var oGlobal = this.getOwnerComponent().getModel();
            if (!oGlobal) { return; }
            var aReqs  = oGlobal.getProperty("/requerimientos") || [];
            var oLocal = this.getView().getModel("comprasLocales");
            if (!oLocal) { return; }
            var aLocal = oLocal.getProperty("/items") || [];
            aLocal.forEach(function (oItem) {
                var g = aReqs.find(function (r) { return r.reqId === oItem.reqId; });
                if (g) {
                    oItem.estado = g.estado;
                    if (g.numeroSolped) { oItem.numeroSolped = g.numeroSolped; }
                    if (g.numeroPedido) { oItem.numeroPedido = g.numeroPedido; }
                }
            });
            oLocal.setProperty("/items", aLocal);
        },

        onFilterChange: function () { this._applyFilters(); },

        onClearFilters: function () {
            this._clearFilters();
            this._applyFilters();
        },

        _clearFilters: function () {
            var v = this.getView();
            ["clFilterNumSol", "clFilterTitulo"].forEach(function (sId) {
                if (v.byId(sId)) { v.byId(sId).setValue(""); }
            });
            ["clFilterEstado", "clFilterSolped", "clFilterPedido", "clFilterTipo"].forEach(function (sId) {
                if (v.byId(sId)) { v.byId(sId).setSelectedKey(""); }
            });
        },

        _applyFilters: function () {
            var oTable = this.byId("comprasLocalesTable");
            if (!oTable) { return; }
            var v = this.getView();
            var aFilters = [];

            var sNum    = (v.byId("clFilterNumSol")  && v.byId("clFilterNumSol").getValue())       || "";
            var sTitulo = (v.byId("clFilterTitulo")  && v.byId("clFilterTitulo").getValue())       || "";
            var sEstado = (v.byId("clFilterEstado")  && v.byId("clFilterEstado").getSelectedKey()) || "";
            var sSolped = (v.byId("clFilterSolped")  && v.byId("clFilterSolped").getSelectedKey()) || "";
            var sPedido = (v.byId("clFilterPedido")  && v.byId("clFilterPedido").getSelectedKey()) || "";
            var sTipo   = (v.byId("clFilterTipo")    && v.byId("clFilterTipo").getSelectedKey())   || "";

            if (sNum.trim())    { aFilters.push(new Filter("reqId",         FilterOperator.Contains, sNum)); }
            if (sTitulo.trim()) { aFilters.push(new Filter("titulo",        FilterOperator.Contains, sTitulo)); }
            if (sEstado)        { aFilters.push(new Filter("estado",        FilterOperator.EQ, sEstado)); }
            if (sSolped)        { aFilters.push(new Filter("numeroSolped",  FilterOperator.EQ, sSolped)); }
            if (sPedido)        { aFilters.push(new Filter("numeroPedido",  FilterOperator.EQ, sPedido)); }
            if (sTipo)          { aFilters.push(new Filter("tipoSolicitud", FilterOperator.EQ, sTipo)); }

            oTable.getBinding("items").filter(
                aFilters.length ? new Filter({ filters: aFilters, and: true }) : []
            );
        },

        onSelectionChange: function () {
            var oTable = this.byId("comprasLocalesTable");
            this.getView().getModel("ui").setProperty("/haySeleccion",
                !!(oTable && oTable.getSelectedItems().length > 0));
        },

        onCrearSolicitud: function () {
            this.byId("dlgClTitulo").setValue("");
            this.byId("dlgClTitulo").setValueState("None");
            this.byId("dlgClTipo").setSelectedKey("Compra Directa");
            this.byId("dlgCrearCL").open();
        },

        onConfirmCrear: function () {
            var sTitulo = this.byId("dlgClTitulo").getValue().trim();
            if (!sTitulo) {
                this.byId("dlgClTitulo").setValueState("Error");
                this.byId("dlgClTitulo").setValueStateText("El título es obligatorio");
                return;
            }
            this.byId("dlgClTitulo").setValueState("None");
            var sTipo    = this.byId("dlgClTipo").getSelectedKey();
            var sNewId   = "REQ-CL-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 900000) + 100000);
            var sNow     = new Date().toLocaleDateString("de-DE") + " " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
            var oNewItem = { reqId: sNewId, titulo: sTitulo, tipoSolicitud: sTipo,
                             canal: "Infraestructura", lineaNegocio: "Compras Locales",
                             estado: "Registrado", numeroSolped: "-", numeroPedido: "-" };
            var oModel   = this.getView().getModel("comprasLocales");
            var aItems   = oModel.getProperty("/items") || [];
            aItems.unshift(oNewItem);
            oModel.setProperty("/items", aItems);

            // Sincronizar al modelo global para que Detail lo encuentre
            var oGlobal = this.getOwnerComponent().getModel();
            var aReqs   = oGlobal.getProperty("/requerimientos") || [];
            aReqs.unshift(Object.assign({}, oNewItem, {
                mercado: "compraslocales",
                creadoPor: "current.user@claro.com",
                fechaCreacion: sNow,
                ultimaModificacion: sNow,
                importeEstimadoUSD: 0,
                items: [], adjuntos: [], flujoAprobacion: [],
                historialFeedback: [], stock: [], materialesSolicitados: []
            }));
            oGlobal.setProperty("/requerimientos", aReqs);

            this.byId("dlgCrearCL").close();
            MessageToast.show("Solicitud " + sNewId + " creada");
        },

        onCancelCrear:    function () { this.byId("dlgCrearCL").close(); },
        onAprobNecesidad: function () { MessageToast.show("Aprobación de Necesidad"); },
        onEnviarCompras:  function () { MessageToast.show("Enviado a Compras"); },
        onFinalizar:      function () { MessageToast.show("Solicitud finalizada"); },
        onExportar:       function () { MessageToast.show("Exportar Excel"); },
        onItemPress: function (oEvent) {
            var oItem    = oEvent.getParameter("listItem") || oEvent.getSource();
            var oCtx     = oItem.getBindingContext("comprasLocales");
            if (!oCtx) { return; }
            var oData    = oCtx.getObject();
            var oGlobal  = this.getOwnerComponent().getModel();
            var aReqs    = oGlobal.getProperty("/requerimientos") || [];
            var iIndex   = aReqs.findIndex(function (r) { return r.reqId === oData.reqId; });
            var oMerged  = Object.assign({}, oData, { mercado: "compraslocales" });
            if (iIndex >= 0) {
                Object.assign(aReqs[iIndex], oMerged);
            } else {
                aReqs.push(oMerged);
            }
            oGlobal.setProperty("/requerimientos", aReqs);
            this.getRouter().navTo("comprasLocalesDetail", { reqId: encodeURIComponent(oData.reqId) });
        }
    });
});
