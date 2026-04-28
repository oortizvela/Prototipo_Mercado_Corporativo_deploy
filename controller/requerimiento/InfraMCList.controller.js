sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (BaseController, Filter, FilterOperator, JSONModel, MessageToast) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.requerimiento.InfraMCList", {

        onInit: function () {
            // Modelo UI
            this.getView().setModel(new JSONModel({
                haySeleccion: false
            }), "ui");

            // Mock data de solicitudes Infra MC
            this.getView().setModel(new JSONModel({
                items: [
                    {
                        reqId: "REQ-INFRA-2026-000001",
                        titulo: "Despliegue de Infraestructura para BBVA - Sede Miraflores",
                        canal: "Infraestructura",
                        lineaNegocio: "Mercado Corporativo",
                        marca: "-",
                        periodo: "2026 Q1",
                        tipoSolicitud: "Solución a Medida > 60 Dias",
                        estado: "En Aprobación",
                        numeroSolped: "SOLPED-001",
                        numeroPedido: "-"
                    },
                    {
                        reqId: "REQ-INFRA-2026-000002",
                        titulo: "Renovación Red Corporativa Interbank",
                        canal: "Infraestructura",
                        lineaNegocio: "Mercado Corporativo",
                        marca: "-",
                        periodo: "2026 Q1",
                        tipoSolicitud: "Solución a Medida < 60 Dias",
                        estado: "Registrado",
                        numeroSolped: "-",
                        numeroPedido: "-"
                    },
                    {
                        reqId: "REQ-INFRA-2026-000003",
                        titulo: "Nota de Producto Fibra Óptica Scotiabank",
                        canal: "Infraestructura",
                        lineaNegocio: "Mercado Corporativo",
                        marca: "-",
                        periodo: "2026 Q2",
                        tipoSolicitud: "Nota de Producto",
                        estado: "Aprobado",
                        numeroSolped: "SOLPED-003",
                        numeroPedido: "PO-INFRA-001"
                    }
                ]
            }), "infraMC");

            this.getRouter()
                .getRoute("infraMCList")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._clearFilters();
            this._applyFilters();
            var oTable = this.byId("infraTable");
            if (oTable) { oTable.removeSelections(true); }
            this.getView().getModel("ui").setProperty("/haySeleccion", false);
        },

        /* ──────── FILTROS (2.2.3) ──────── */
        onFilterChange: function () {
            this._applyFilters();
        },

        onClearFilters: function () {
            this._clearFilters();
            this._applyFilters();
        },

        _clearFilters: function () {
            var v = this.getView();
            ["iFilterNumSol", "iFilterTitulo", "iFilterSolped", "iFilterPedido"].forEach(function (sId) {
                if (v.byId(sId)) { v.byId(sId).setValue(""); }
            });
            ["sFilterEstado", "sFilterTipo"].forEach(function (sId) {
                if (v.byId(sId)) { v.byId(sId).setSelectedKey(""); }
            });
        },

        _applyFilters: function () {
            var oTable = this.byId("infraTable");
            if (!oTable) { return; }
            var v = this.getView();
            var aFilters = [];

            var sNum    = (v.byId("iFilterNumSol")  && v.byId("iFilterNumSol").getValue())  || "";
            var sTitulo = (v.byId("iFilterTitulo")  && v.byId("iFilterTitulo").getValue())  || "";
            var sEstado = (v.byId("sFilterEstado")  && v.byId("sFilterEstado").getSelectedKey()) || "";
            var sSolped = (v.byId("iFilterSolped")  && v.byId("iFilterSolped").getValue())  || "";
            var sPedido = (v.byId("iFilterPedido")  && v.byId("iFilterPedido").getValue())  || "";
            var sTipo   = (v.byId("sFilterTipo")    && v.byId("sFilterTipo").getSelectedKey())   || "";

            if (sNum.trim())    { aFilters.push(new Filter("reqId",         FilterOperator.Contains, sNum)); }
            if (sTitulo.trim()) { aFilters.push(new Filter("titulo",        FilterOperator.Contains, sTitulo)); }
            if (sEstado)        { aFilters.push(new Filter("estado",        FilterOperator.EQ, sEstado)); }
            if (sSolped.trim()) { aFilters.push(new Filter("numeroSolped",  FilterOperator.Contains, sSolped)); }
            if (sPedido.trim()) { aFilters.push(new Filter("numeroPedido",  FilterOperator.Contains, sPedido)); }
            if (sTipo)          { aFilters.push(new Filter("tipoSolicitud", FilterOperator.EQ, sTipo)); }

            oTable.getBinding("items").filter(
                aFilters.length ? new Filter({ filters: aFilters, and: true }) : []
            );
        },

        onSelectionChange: function () {
            var oTable = this.byId("infraTable");
            var bHay = oTable && oTable.getSelectedItems().length > 0;
            this.getView().getModel("ui").setProperty("/haySeleccion", bHay);
        },

        /* ──────── CREAR SOLICITUD (2.2.2) ──────── */
        onCrearSolicitud: function () {
            this.byId("dlgInfraTitulo").setValue("");
            this.byId("dlgInfraTipo").setSelectedKey("Solución a Medida < 60 Dias");
            this.byId("dlgCrearInfra").open();
        },

        onConfirmCrear: function () {
            var sTitulo = this.byId("dlgInfraTitulo").getValue().trim();
            if (!sTitulo) {
                this.byId("dlgInfraTitulo").setValueState("Error");
                this.byId("dlgInfraTitulo").setValueStateText("El título es obligatorio");
                return;
            }
            this.byId("dlgInfraTitulo").setValueState("None");

            var sTipo = this.byId("dlgInfraTipo").getSelectedKey();
            var sNewId = "REQ-INFRA-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 900000) + 100000);

            var oModel = this.getView().getModel("infraMC");
            var aItems = oModel.getProperty("/items") || [];
            aItems.unshift({
                reqId: sNewId,
                titulo: sTitulo,
                canal: "Infraestructura",
                lineaNegocio: "Mercado Corporativo",
                marca: "-",
                periodo: "-",
                tipoSolicitud: sTipo,
                estado: "Registrado",
                numeroSolped: "-",
                numeroPedido: "-"
            });
            oModel.setProperty("/items", aItems);

            this.byId("dlgCrearInfra").close();
            MessageToast.show("Solicitud " + sNewId + " creada");
        },

        onCancelCrear: function () {
            this.byId("dlgCrearInfra").close();
        },

        /* ──────── ACCIONES TOOLBAR ──────── */
        onFactibilidad: function () {
            MessageToast.show("Factibilidad");
        },

        onAnalisisFinanciero: function () {
            MessageToast.show("Análisis Financiero");
        },

        onAprobNecesidad: function () {
            MessageToast.show("Aprobación de Necesidad");
        },

        onAprobCliente: function () {
            MessageToast.show("Aprobación Cliente");
        },

        onEnviarAprobacion: function () {
            MessageToast.show("Enviado a aprobación");
        },

        onFinalizar: function () {
            MessageToast.show("Solicitud finalizada");
        },

        onExportar: function () {
            MessageToast.show("Exportar Excel");
        },

        onItemPress: function (oEvent) {
            var oCtx  = oEvent.getSource().getBindingContext("infraMC");
            if (!oCtx) { return; }
            var oItem = oCtx.getObject();
            var sReqId = oItem.reqId;

            // Sincronizar el ítem al modelo global si aún no existe
            var oGlobalModel = this.getOwnerComponent().getModel();
            var aReqs = oGlobalModel.getProperty("/requerimientos") || [];
            var iIdx  = aReqs.findIndex(function (r) { return r.reqId === sReqId; });

            var oMerged = Object.assign({
                mercado:           "corporativo",
                canal:             oItem.canal             || "Infraestructura",
                lineaNegocio:      oItem.lineaNegocio      || "Mercado Corporativo",
                cliente:           oItem.cliente           || "-",
                areaFuncional:     oItem.areaFuncional      || "-",
                segmento:          oItem.segmento           || "-",
                responsable:       oItem.responsable        || "-",
                oportunidadId:     oItem.oportunidadId      || "-",
                importeEstimadoUSD: oItem.importeEstimadoUSD || 0,
                descripcionTecnica: oItem.descripcionTecnica || "",
                creadoPor:         oItem.creadoPor          || "-",
                fechaCreacion:     oItem.fechaCreacion      || "-",
                ultimaModificacion: oItem.ultimaModificacion || "-",
                items:             oItem.items              || [],
                adjuntos:          oItem.adjuntos           || [],
                flujoAprobacion:   oItem.flujoAprobacion    || [],
                historialFeedback: oItem.historialFeedback  || [],
                stock:             oItem.stock              || [],
                materialesSolicitados: oItem.materialesSolicitados || [],
                evaluacionFinanciera:  oItem.evaluacionFinanciera  || {}
            }, oItem);

            if (iIdx === -1) {
                aReqs.push(oMerged);
                iIdx = aReqs.length - 1;
            } else {
                aReqs[iIdx] = Object.assign(aReqs[iIdx], oMerged);
            }
            oGlobalModel.setProperty("/requerimientos", aReqs);

            // Navegar al detalle MC
            this.getRouter().navTo("mcRequerimientoDetail", {
                reqId: encodeURIComponent(sReqId)
            });
        }
    });
});
