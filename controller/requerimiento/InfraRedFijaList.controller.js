sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (BaseController, Filter, FilterOperator, JSONModel, MessageToast) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.requerimiento.InfraRedFijaList", {

        onInit: function () {
            this.getView().setModel(new JSONModel({ haySeleccion: false }), "ui");

            this.getView().setModel(new JSONModel({
                items: [
                    {
                        reqId: "REQ-RF-2026-000001",
                        titulo: "Despliegue de red de fibra \u00f3ptica en zona residencial \u2013 Surco",
                        canal: "Infraestructura",
                        lineaNegocio: "Red Fija",
                        tipoSolicitud: "Despliegue Fibra \u00d3ptica",
                        estado: "Registrado",
                        numeroSolped: "-",
                        numeroPedido: "-"
                    },
                    {
                        reqId: "REQ-RF-2026-000002",
                        titulo: "Implementaci\u00f3n Red Fija para complejo empresarial San Isidro",
                        canal: "Infraestructura",
                        lineaNegocio: "Red Fija",
                        tipoSolicitud: "Proyecto Red Fija",
                        estado: "En Aprobaci\u00f3n",
                        numeroSolped: "-",
                        numeroPedido: "-"
                    },
                    {
                        reqId: "REQ-RF-2026-000003",
                        titulo: "Ampliaci\u00f3n Red Mun Miraflores",
                        canal: "Infraestructura",
                        lineaNegocio: "Red Fija",
                        tipoSolicitud: "Ampliaci\u00f3n Red",
                        estado: "Aprobado",
                        numeroSolped: "-",
                        numeroPedido: "-"
                    },
                    {
                        reqId: "REQ-RF-2026-000004",
                        titulo: "Expansi\u00f3n de red para cliente corporativo \u2013 Ate",
                        canal: "Infraestructura",
                        lineaNegocio: "Red Fija",
                        tipoSolicitud: "Despliegue Fibra \u00d3ptica",
                        estado: "Finalizado",
                        numeroSolped: "2000000001",
                        numeroPedido: "4500000001"
                    }
                ]
            }), "redFija");

            this.getRouter()
                .getRoute("infraRedFijaList")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._syncFromGlobal();
            this._clearFilters();
            this._applyFilters();
            var oTable = this.byId("redFijaTable");
            if (oTable) { oTable.removeSelections(true); }
            this.getView().getModel("ui").setProperty("/haySeleccion", false);
        },

        // Refresca estados desde el modelo global al volver a la lista
        _syncFromGlobal: function () {
            var oGlobal = this.getOwnerComponent().getModel();
            if (!oGlobal) { return; }
            var aReqs  = oGlobal.getProperty("/requerimientos") || [];
            var oLocal = this.getView().getModel("redFija");
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
            ["rfFilterNumSol", "rfFilterTitulo"].forEach(function (sId) {
                if (v.byId(sId)) { v.byId(sId).setValue(""); }
            });
            ["rfFilterEstado", "rfFilterSolped", "rfFilterPedido", "rfFilterTipo"].forEach(function (sId) {
                if (v.byId(sId)) { v.byId(sId).setSelectedKey(""); }
            });
        },

        _applyFilters: function () {
            var oTable = this.byId("redFijaTable");
            if (!oTable) { return; }
            var v = this.getView();
            var aFilters = [];

            var sNum    = (v.byId("rfFilterNumSol")  && v.byId("rfFilterNumSol").getValue())       || "";
            var sTitulo = (v.byId("rfFilterTitulo")  && v.byId("rfFilterTitulo").getValue())       || "";
            var sEstado = (v.byId("rfFilterEstado")  && v.byId("rfFilterEstado").getSelectedKey()) || "";
            var sSolped = (v.byId("rfFilterSolped")  && v.byId("rfFilterSolped").getSelectedKey()) || "";
            var sPedido = (v.byId("rfFilterPedido")  && v.byId("rfFilterPedido").getSelectedKey()) || "";
            var sTipo   = (v.byId("rfFilterTipo")    && v.byId("rfFilterTipo").getSelectedKey())   || "";

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
            var oTable = this.byId("redFijaTable");
            this.getView().getModel("ui").setProperty("/haySeleccion",
                !!(oTable && oTable.getSelectedItems().length > 0));
        },

        onCrearSolicitud: function () {
            this.byId("dlgRfTitulo").setValue("");
            this.byId("dlgRfTipo").setSelectedKey("Despliegue Fibra Óptica");
            this.byId("dlgCrearRedFija").open();
        },

        onConfirmCrear: function () {
            var sTitulo = this.byId("dlgRfTitulo").getValue().trim();
            if (!sTitulo) {
                this.byId("dlgRfTitulo").setValueState("Error");
                this.byId("dlgRfTitulo").setValueStateText("El título es obligatorio");
                return;
            }
            this.byId("dlgRfTitulo").setValueState("None");
            var sTipo    = this.byId("dlgRfTipo").getSelectedKey();
            var sNewId   = "REQ-RF-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 900000) + 100000);
            var sNow     = new Date().toLocaleDateString("de-DE") + " " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
            var oNewItem = { reqId: sNewId, titulo: sTitulo,
                             canal: "Infraestructura", lineaNegocio: "Red Fija",
                             tipoSolicitud: sTipo,
                             estado: "Registrado", numeroSolped: "-", numeroPedido: "-" };
            var oModel   = this.getView().getModel("redFija");
            var aItems   = oModel.getProperty("/items") || [];
            aItems.unshift(oNewItem);
            oModel.setProperty("/items", aItems);

            // Sincronizar al modelo global para que Detail lo encuentre
            var oGlobal = this.getOwnerComponent().getModel();
            var aReqs   = oGlobal.getProperty("/requerimientos") || [];
            aReqs.unshift(Object.assign({}, oNewItem, {
                mercado: "redfija",
                creadoPor: "current.user@claro.com",
                fechaCreacion: sNow,
                ultimaModificacion: sNow,
                importeEstimadoUSD: 0,
                items: [], adjuntos: [], flujoAprobacion: [],
                historialFeedback: [], stock: [], materialesSolicitados: []
            }));
            oGlobal.setProperty("/requerimientos", aReqs);

            this.byId("dlgCrearRedFija").close();
            MessageToast.show("Solicitud " + sNewId + " creada");
        },

        onCancelCrear:       function () { this.byId("dlgCrearRedFija").close(); },
        onValidacionTecnica: function () { MessageToast.show("Validaci\u00f3n T\u00e9cnica"); },
        onAprobNecesidad:    function () { MessageToast.show("Aprobaci\u00f3n de Necesidad"); },
        onEnviarCompras:     function () { MessageToast.show("Enviado a Compras"); },
        onFinalizar:         function () { MessageToast.show("Solicitud finalizada"); },
        onExportar:          function () { MessageToast.show("Exportar Excel"); },

        onItemPress: function (oEvent) {
            var oCtx  = oEvent.getSource().getBindingContext("redFija");
            if (!oCtx) { return; }
            var oItem  = oCtx.getObject();
            var sReqId = oItem.reqId;

            // Sincronizar al modelo global
            var oGlobalModel = this.getOwnerComponent().getModel();
            var aReqs = oGlobalModel.getProperty("/requerimientos") || [];
            var iIdx  = aReqs.findIndex(function (r) { return r.reqId === sReqId; });

            var oMerged = Object.assign({
                mercado:            "redfija",
                canal:              oItem.canal         || "Infraestructura",
                lineaNegocio:       oItem.lineaNegocio  || "Red Fija",
                responsable:        oItem.responsable   || "-",
                importeEstimadoUSD: oItem.importeEstimadoUSD || 0,
                creadoPor:          oItem.creadoPor     || "-",
                fechaCreacion:      oItem.fechaCreacion  || "-",
                ultimaModificacion: oItem.ultimaModificacion || "-",
                items:              oItem.items         || [],
                adjuntos:           oItem.adjuntos      || [],
                flujoAprobacion:    oItem.flujoAprobacion || [],
                historialFeedback:  oItem.historialFeedback || [],
                stock:              oItem.stock         || [],
                materialesSolicitados: oItem.materialesSolicitados || []
            }, oItem);

            if (iIdx === -1) {
                aReqs.push(oMerged);
            } else {
                aReqs[iIdx] = Object.assign(aReqs[iIdx], oMerged);
            }
            oGlobalModel.setProperty("/requerimientos", aReqs);

            this.getRouter().navTo("infraRedFijaDetail", {
                reqId: encodeURIComponent(sReqId)
            });
        }
    });
});
