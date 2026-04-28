sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (BaseController, Filter, FilterOperator, JSONModel, MessageToast) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.requerimiento.InfraRedMovilList", {

        onInit: function () {
            this.getView().setModel(new JSONModel({ haySeleccion: false }), "ui");

            // Mock data Red Movil
            this.getView().setModel(new JSONModel({
                items: [
                    {
                        reqId: "REQ-RM-2026-000001",
                        titulo: "Ampliaci\u00f3n de cobertura 4G en Zona Rural \u2013 Regi\u00f3n Piura",
                        canal: "Infraestructura",
                        lineaNegocio: "Red Movil",
                        tipoSolicitud: "Ampliaci\u00f3n de Cobertura",
                        estado: "Registrado",
                        numeroSolped: "-",
                        numeroPedido: "-"
                    },
                    {
                        reqId: "REQ-RM-2026-000002",
                        titulo: "Imp. Red Movil para Cluster Urbano",
                        canal: "Infraestructura",
                        lineaNegocio: "Red Movil",
                        tipoSolicitud: "Proyecto Red Movil",
                        estado: "En Aprobaci\u00f3n",
                        numeroSolped: "-",
                        numeroPedido: "-"
                    },
                    {
                        reqId: "REQ-RM-2026-000003",
                        titulo: "Nuevas Estaciones en corredor vial Panamericana Norte",
                        canal: "Infraestructura",
                        lineaNegocio: "Red Movil",
                        tipoSolicitud: "Implementaci\u00f3n de Estaciones / Antenas",
                        estado: "Aprobado",
                        numeroSolped: "-",
                        numeroPedido: "-"
                    },
                    {
                        reqId: "REQ-RM-2026-000004",
                        titulo: "Ampliaci\u00f3n de cobertura 5G en Zona Industrial \u2013 Lima",
                        canal: "Infraestructura",
                        lineaNegocio: "Red Movil",
                        tipoSolicitud: "Ampliaci\u00f3n de Cobertura",
                        estado: "Finalizado",
                        numeroSolped: "2000000001",
                        numeroPedido: "4500000001"
                    }
                ]
            }), "redMovil");

            this.getRouter()
                .getRoute("infraRedMovilList")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._syncFromGlobal();
            this._clearFilters();
            this._applyFilters();
            var oTable = this.byId("redMovilTable");
            if (oTable) { oTable.removeSelections(true); }
            this.getView().getModel("ui").setProperty("/haySeleccion", false);
        },

        // Refresca estados del modelo local desde el modelo global (fuente de verdad)
        _syncFromGlobal: function () {
            var oGlobal = this.getOwnerComponent().getModel();
            if (!oGlobal) { return; }
            var aReqs  = oGlobal.getProperty("/requerimientos") || [];
            var oLocal = this.getView().getModel("redMovil");
            if (!oLocal) { return; }
            var aLocal = oLocal.getProperty("/items") || [];
            aLocal.forEach(function (oItem) {
                var oGlobalItem = aReqs.find(function (r) { return r.reqId === oItem.reqId; });
                if (oGlobalItem) {
                    oItem.estado = oGlobalItem.estado;
                    if (oGlobalItem.numeroSolped) { oItem.numeroSolped = oGlobalItem.numeroSolped; }
                    if (oGlobalItem.numeroPedido) { oItem.numeroPedido = oGlobalItem.numeroPedido; }
                }
            });
            oLocal.setProperty("/items", aLocal);
        },
        onFilterChange: function () {
            this._applyFilters();
        },

        onClearFilters: function () {
            this._clearFilters();
            this._applyFilters();
        },

        _clearFilters: function () {
            var v = this.getView();
            ["rmFilterNumSol", "rmFilterTitulo"].forEach(function (sId) {
                if (v.byId(sId)) { v.byId(sId).setValue(""); }
            });
            ["rmFilterEstado", "rmFilterSolped", "rmFilterPedido", "rmFilterTipo"].forEach(function (sId) {
                if (v.byId(sId)) { v.byId(sId).setSelectedKey(""); }
            });
        },

        _applyFilters: function () {
            var oTable = this.byId("redMovilTable");
            if (!oTable) { return; }
            var v = this.getView();
            var aFilters = [];

            var sNum    = (v.byId("rmFilterNumSol")  && v.byId("rmFilterNumSol").getValue())        || "";
            var sTitulo = (v.byId("rmFilterTitulo")  && v.byId("rmFilterTitulo").getValue())        || "";
            var sEstado = (v.byId("rmFilterEstado")  && v.byId("rmFilterEstado").getSelectedKey())  || "";
            var sSolped = (v.byId("rmFilterSolped")  && v.byId("rmFilterSolped").getSelectedKey())  || "";
            var sPedido = (v.byId("rmFilterPedido")  && v.byId("rmFilterPedido").getSelectedKey())  || "";
            var sTipo   = (v.byId("rmFilterTipo")    && v.byId("rmFilterTipo").getSelectedKey())    || "";

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
            var oTable = this.byId("redMovilTable");
            var bHay = oTable && oTable.getSelectedItems().length > 0;
            this.getView().getModel("ui").setProperty("/haySeleccion", bHay);
        },

        /* ──────── CREAR SOLICITUD (2.2.2) ──────── */
        onCrearSolicitud: function () {
            this.byId("dlgRmTitulo").setValue("");
            this.byId("dlgRmTipo").setSelectedKey("Ampliación de Cobertura");
            this.byId("dlgCrearRedMovil").open();
        },

        onConfirmCrear: function () {
            var sTitulo = this.byId("dlgRmTitulo").getValue().trim();
            if (!sTitulo) {
                this.byId("dlgRmTitulo").setValueState("Error");
                this.byId("dlgRmTitulo").setValueStateText("El título es obligatorio");
                return;
            }
            this.byId("dlgRmTitulo").setValueState("None");

            var sTipo  = this.byId("dlgRmTipo").getSelectedKey();
            var sNewId = "REQ-RM-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 900000) + 100000);

            var sNow    = new Date().toLocaleDateString("de-DE") + " " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
            var oNewItem = {
                reqId: sNewId,
                titulo: sTitulo,
                canal: "Infraestructura",
                lineaNegocio: "Red Movil",
                tipoSolicitud: sTipo,
                estado: "Registrado",
                numeroSolped: "-",
                numeroPedido: "-"
            };
            var oModel = this.getView().getModel("redMovil");
            var aItems = oModel.getProperty("/items") || [];
            aItems.unshift(oNewItem);
            oModel.setProperty("/items", aItems);

            // Sincronizar al modelo global para que Detail lo encuentre
            var oGlobal = this.getOwnerComponent().getModel();
            var aReqs   = oGlobal.getProperty("/requerimientos") || [];
            aReqs.unshift(Object.assign({}, oNewItem, {
                mercado: "redmovil",
                creadoPor: "current.user@claro.com",
                fechaCreacion: sNow,
                ultimaModificacion: sNow,
                importeEstimadoUSD: 0,
                items: [], adjuntos: [], flujoAprobacion: [],
                historialFeedback: [], stock: [], materialesSolicitados: []
            }));
            oGlobal.setProperty("/requerimientos", aReqs);

            this.byId("dlgCrearRedMovil").close();
            MessageToast.show("Solicitud " + sNewId + " creada");
        },

        onCancelCrear: function () {
            this.byId("dlgCrearRedMovil").close();
        },

        /* ──────── ACCIONES TOOLBAR ──────── */
        onValidacionTecnica: function () { MessageToast.show("Validaci\u00f3n T\u00e9cnica"); },
        onAprobNecesidad:    function () { MessageToast.show("Aprobaci\u00f3n de Necesidad"); },
        onEnviarCompras:     function () { MessageToast.show("Enviado a Compras"); },
        onFinalizar:         function () { MessageToast.show("Solicitud finalizada"); },
        onExportar:          function () { MessageToast.show("Exportar Excel"); },

        onItemPress: function (oEvent) {
            var oCtx  = oEvent.getSource().getBindingContext("redMovil");
            if (!oCtx) { return; }
            var oItem  = oCtx.getObject();
            var sReqId = oItem.reqId;

            // Sincronizar al modelo global
            var oGlobalModel = this.getOwnerComponent().getModel();
            var aReqs = oGlobalModel.getProperty("/requerimientos") || [];
            var iIdx  = aReqs.findIndex(function (r) { return r.reqId === sReqId; });

            var oMerged = Object.assign({
                mercado:            "redmovil",
                canal:              oItem.canal         || "Infraestructura",
                lineaNegocio:       oItem.lineaNegocio  || "Red Movil",
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

            this.getRouter().navTo("infraRedMovilDetail", {
                reqId: encodeURIComponent(sReqId)
            });
        }
    });
});
