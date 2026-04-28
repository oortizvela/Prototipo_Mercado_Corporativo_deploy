sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (BaseController, Filter, FilterOperator, JSONModel, MessageToast) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.requerimiento.InfraOMList", {

        onInit: function () {
            this.getView().setModel(new JSONModel({ haySeleccion: false }), "ui");

            this.getView().setModel(new JSONModel({
                items: [
                    {
                        reqId: "REQ-OM-2026-000001",
                        titulo: "Reposici\u00f3n de Routers Da\u00f1ados en red fija \u2013 Zona Lima Centro",
                        tipoSolicitud: "Reposici\u00f3n Equipos",
                        canal: "Infraestructura",
                        lineaNegocio: "O&M",
                        estado: "Registrado",
                        numeroSolped: "-",
                        numeroPedido: "-"
                    },
                    {
                        reqId: "REQ-OM-2026-000002",
                        titulo: "Atenci\u00f3n Fallas en FO \u2013 Cliente Corporativo Sede Central",
                        tipoSolicitud: "Atenci\u00f3n Fallas",
                        canal: "Infraestructura",
                        lineaNegocio: "O&M",
                        estado: "En Aprobaci\u00f3n",
                        numeroSolped: "-",
                        numeroPedido: "-"
                    },
                    {
                        reqId: "REQ-OM-2026-000003",
                        titulo: "Mtto Red Central Congreso Republica",
                        tipoSolicitud: "Mantenimiento Preventivo",
                        canal: "Infraestructura",
                        lineaNegocio: "O&M",
                        estado: "Aprobado",
                        numeroSolped: "-",
                        numeroPedido: "-"
                    },
                    {
                        reqId: "REQ-OM-2026-000004",
                        titulo: "Reposici\u00f3n de tarjetas de transmisi\u00f3n \u2013 Nodo Lima Norte",
                        tipoSolicitud: "Reposici\u00f3n Equipos",
                        canal: "Infraestructura",
                        lineaNegocio: "O&M",
                        estado: "Finalizado",
                        numeroSolped: "2000000001",
                        numeroPedido: "4500000001"
                    }
                ]
            }), "om");

            this.getRouter()
                .getRoute("infraOMList")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._syncFromGlobal();
            this._clearFilters();
            this._applyFilters();
            var oTable = this.byId("omTable");
            if (oTable) { oTable.removeSelections(true); }
            this.getView().getModel("ui").setProperty("/haySeleccion", false);
        },

        // Refresca estados desde el modelo global al volver a la lista
        _syncFromGlobal: function () {
            var oGlobal = this.getOwnerComponent().getModel();
            if (!oGlobal) { return; }
            var aReqs  = oGlobal.getProperty("/requerimientos") || [];
            var oLocal = this.getView().getModel("om");
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
            ["omFilterNumSol", "omFilterTitulo"].forEach(function (sId) {
                if (v.byId(sId)) { v.byId(sId).setValue(""); }
            });
            ["omFilterEstado", "omFilterSolped", "omFilterPedido", "omFilterTipo"].forEach(function (sId) {
                if (v.byId(sId)) { v.byId(sId).setSelectedKey(""); }
            });
        },

        _applyFilters: function () {
            var oTable = this.byId("omTable");
            if (!oTable) { return; }
            var v = this.getView();
            var aFilters = [];

            var sNum    = (v.byId("omFilterNumSol")  && v.byId("omFilterNumSol").getValue())       || "";
            var sTitulo = (v.byId("omFilterTitulo")  && v.byId("omFilterTitulo").getValue())       || "";
            var sEstado = (v.byId("omFilterEstado")  && v.byId("omFilterEstado").getSelectedKey()) || "";
            var sSolped = (v.byId("omFilterSolped")  && v.byId("omFilterSolped").getSelectedKey()) || "";
            var sPedido = (v.byId("omFilterPedido")  && v.byId("omFilterPedido").getSelectedKey()) || "";
            var sTipo   = (v.byId("omFilterTipo")    && v.byId("omFilterTipo").getSelectedKey())   || "";

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
            var oTable = this.byId("omTable");
            this.getView().getModel("ui").setProperty("/haySeleccion",
                !!(oTable && oTable.getSelectedItems().length > 0));
        },

        onCrearSolicitud: function () {
            this.byId("dlgOmTitulo").setValue("");
            this.byId("dlgOmTitulo").setValueState("None");
            this.byId("dlgOmTipo").setSelectedKey("Mantenimiento Correctivo");
            this.byId("dlgCrearOM").open();
        },

        onConfirmCrear: function () {
            var sTitulo = this.byId("dlgOmTitulo").getValue().trim();
            if (!sTitulo) {
                this.byId("dlgOmTitulo").setValueState("Error");
                this.byId("dlgOmTitulo").setValueStateText("El título es obligatorio");
                return;
            }
            this.byId("dlgOmTitulo").setValueState("None");
            var sTipo    = this.byId("dlgOmTipo").getSelectedKey();
            var sNewId   = "REQ-OM-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 900000) + 100000);
            var sNow     = new Date().toLocaleDateString("de-DE") + " " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
            var oNewItem = { reqId: sNewId, titulo: sTitulo, tipoSolicitud: sTipo,
                             canal: "Infraestructura", lineaNegocio: "O&M",
                             estado: "Registrado", numeroSolped: "-", numeroPedido: "-" };
            var oModel   = this.getView().getModel("om");
            var aItems   = oModel.getProperty("/items") || [];
            aItems.unshift(oNewItem);
            oModel.setProperty("/items", aItems);

            // Sincronizar al modelo global para que Detail lo encuentre
            var oGlobal = this.getOwnerComponent().getModel();
            var aReqs   = oGlobal.getProperty("/requerimientos") || [];
            aReqs.unshift(Object.assign({}, oNewItem, {
                mercado: "om",
                creadoPor: "current.user@claro.com",
                fechaCreacion: sNow,
                ultimaModificacion: sNow,
                importeEstimadoUSD: 0,
                items: [], adjuntos: [], flujoAprobacion: [],
                historialFeedback: [], stock: [], materialesSolicitados: []
            }));
            oGlobal.setProperty("/requerimientos", aReqs);

            this.byId("dlgCrearOM").close();
            MessageToast.show("Solicitud " + sNewId + " creada");
        },

        onCancelCrear:        function () { this.byId("dlgCrearOM").close(); },
        onValidacionOperativa: function () { MessageToast.show("Validación Operativa"); },
        onAprobNecesidad:     function () { MessageToast.show("Aprobación de Necesidad"); },
        onEnviarCompras:      function () { MessageToast.show("Enviado a Compras"); },
        onFinalizar:          function () { MessageToast.show("Solicitud finalizada"); },
        onExportar:           function () { MessageToast.show("Exportar Excel"); },
        onItemPress: function (oEvent) {
            var oItem    = oEvent.getParameter("listItem") || oEvent.getSource();
            var oCtx     = oItem.getBindingContext("om");
            if (!oCtx) { return; }
            var oData    = oCtx.getObject();
            var oGlobal  = this.getOwnerComponent().getModel();
            var aReqs    = oGlobal.getProperty("/requerimientos") || [];
            var iIndex   = aReqs.findIndex(function (r) { return r.reqId === oData.reqId; });
            var oMerged  = Object.assign({}, oData, { mercado: "om" });
            if (iIndex >= 0) {
                Object.assign(aReqs[iIndex], oMerged);
            } else {
                aReqs.push(oMerged);
            }
            oGlobal.setProperty("/requerimientos", aReqs);
            this.getRouter().navTo("infraOMDetail", { reqId: encodeURIComponent(oData.reqId) });
        }
    });
});
