sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (BaseController, Filter, FilterOperator, JSONModel, MessageToast) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.requerimiento.HandsetList", {

        onInit: function () {
            this.getView().setModel(new JSONModel({ haySeleccion: false, hsMostrarDerivado: false }), "ui");

            this.getView().setModel(new JSONModel({
                items: [
                    { reqId: "REQ-2026-000001", titulo: "Día de la Madre - Samsung Galaxy S26", marca: "Samsung", periodo: "2026 Q1", tipoSolicitud: "Handset Original", estado: "Registrado", numeroOC: "-", numeroOCDerivada: "-" },
                    { reqId: "REQ-2026-000002", titulo: "Campaña Fiestas Patrias - Motorola Edge 50", marca: "Motorola", periodo: "2026 Q2", tipoSolicitud: "Handset asociado a Pedido Directo", estado: "En Aprobación", numeroOC: "-", numeroOCDerivada: "-" },
                    { reqId: "REQ-2026-000003", titulo: "Reposición iPhone 15 - Canal Empresa", marca: "Apple", periodo: "2026 Q1", tipoSolicitud: "Handset asociado a Pedido Abierto", estado: "Aprobado", numeroOC: "4500000001", numeroOCDerivada: "-" },
                    { reqId: "REQ-2026-000004", titulo: "Xiaomi Redmi Note 15 - Pedido Derivado", marca: "Xiaomi", periodo: "2026 Q2", tipoSolicitud: "Handset asociado a Pedido Derivado", estado: "Registrado", numeroOC: "-", numeroOCDerivada: "-" }
                ]
            }), "handset");

            var aPlanAll = [
                { titulo: "Samsung - 2026Q1",  marca: "Samsung",  periodo: "2026 Q1", publicadoEl: "27.01.2026 19:00" },
                { titulo: "Samsung - 2026Q2",  marca: "Samsung",  periodo: "2026 Q2", publicadoEl: "15.04.2026 10:00" },
                { titulo: "Motorola - 2026Q1", marca: "Motorola", periodo: "2026 Q1", publicadoEl: "27.01.2026 19:00" },
                { titulo: "Apple - 2026Q1",    marca: "Apple",    periodo: "2026 Q1", publicadoEl: "27.01.2026 19:00" },
                { titulo: "Xiaomi - 2026Q1",   marca: "Xiaomi",   periodo: "2026 Q1", publicadoEl: "27.01.2026 19:00" }
            ];
            this._aHsPlanAll = aPlanAll;
            this.getView().setModel(new JSONModel({ items: aPlanAll }), "hsPlanificaciones");

            this.getView().setModel(new JSONModel({
                items: [
                    { pedidoId: "460000001", descripcion: "Pedido Día Madre" },
                    { pedidoId: "460000002", descripcion: "Pedido Fiestas Patrias" },
                    { pedidoId: "460000003", descripcion: "Pedido Promoción Samsung" }
                ]
            }), "hsPedidosAbiertos");

            this.getRouter()
                .getRoute("handsetList")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._syncFromGlobal();
            this._clearFilters();
            this._applyFilters();
            var oTable = this.byId("handsetTable");
            if (oTable) { oTable.removeSelections(true); }
            this.getView().getModel("ui").setProperty("/haySeleccion", false);
        },

        // Refresca estados desde el modelo global al volver a la lista
        _syncFromGlobal: function () {
            var oGlobal = this.getOwnerComponent().getModel();
            if (!oGlobal) { return; }
            var aReqs  = oGlobal.getProperty("/requerimientos") || [];
            var oLocal = this.getView().getModel("handset");
            if (!oLocal) { return; }
            var aLocal = oLocal.getProperty("/items") || [];
            aLocal.forEach(function (oItem) {
                var g = aReqs.find(function (r) { return r.reqId === oItem.reqId; });
                if (g) {
                    oItem.estado = g.estado;
                    if (g.numeroOC)        { oItem.numeroOC        = g.numeroOC; }
                    if (g.numeroOCDerivada){ oItem.numeroOCDerivada = g.numeroOCDerivada; }
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
            ["hsFilterNumSol", "hsFilterTitulo"].forEach(function (sId) {
                if (v.byId(sId)) { v.byId(sId).setValue(""); }
            });
            ["hsFilterEstado", "hsFilterPeriodo", "hsFilterMarca", "hsFilterTipo"].forEach(function (sId) {
                if (v.byId(sId)) { v.byId(sId).setSelectedKey(""); }
            });
        },

        _applyFilters: function () {
            var oTable = this.byId("handsetTable");
            if (!oTable) { return; }
            var v = this.getView();
            var aFilters = [];

            var sNum    = (v.byId("hsFilterNumSol")  && v.byId("hsFilterNumSol").getValue())       || "";
            var sTitulo = (v.byId("hsFilterTitulo")  && v.byId("hsFilterTitulo").getValue())       || "";
            var sEstado = (v.byId("hsFilterEstado")  && v.byId("hsFilterEstado").getSelectedKey()) || "";
            var sPeriodo= (v.byId("hsFilterPeriodo") && v.byId("hsFilterPeriodo").getSelectedKey())|| "";
            var sMarca  = (v.byId("hsFilterMarca")   && v.byId("hsFilterMarca").getSelectedKey())  || "";
            var sTipo   = (v.byId("hsFilterTipo")    && v.byId("hsFilterTipo").getSelectedKey())   || "";

            if (sNum.trim())    { aFilters.push(new Filter("reqId",         FilterOperator.Contains, sNum)); }
            if (sTitulo.trim()) { aFilters.push(new Filter("titulo",        FilterOperator.Contains, sTitulo)); }
            if (sEstado)        { aFilters.push(new Filter("estado",        FilterOperator.EQ, sEstado)); }
            if (sPeriodo)       { aFilters.push(new Filter("periodo",       FilterOperator.EQ, sPeriodo)); }
            if (sMarca)         { aFilters.push(new Filter("marca",         FilterOperator.EQ, sMarca)); }
            if (sTipo)          { aFilters.push(new Filter("tipoSolicitud", FilterOperator.EQ, sTipo)); }

            oTable.getBinding("items").filter(
                aFilters.length ? new Filter({ filters: aFilters, and: true }) : []
            );
        },

        onSelectionChange: function () {
            var oTable = this.byId("handsetTable");
            this.getView().getModel("ui").setProperty("/haySeleccion",
                !!(oTable && oTable.getSelectedItems().length > 0));
        },

        onItemPress: function (oEvent) {
            var oCtx  = oEvent.getSource().getBindingContext("handset");
            var sReqId = oCtx ? oCtx.getProperty("reqId") : null;
            if (sReqId) {
                this.getRouter().navTo("requerimientoDetail", { reqId: sReqId });
            }
        },

        onCrearSolicitud: function () {
            var oUi = this.getView().getModel("ui");
            oUi.setProperty("/hsMostrarDerivado", false);
            this.byId("hsDlgTitulo").setValue("");
            this.byId("hsDlgTitulo").setValueState("None");
            this.byId("hsDlgMarca").setSelectedKey("");
            this.byId("hsDlgTipo").setSelectedKey("Handset asociado a Pedido Directo");
            this.byId("hsDlgPeriodo").setSelectedKey("");
            var oList = this.byId("hsLstPlanificaciones");
            if (oList) { oList.removeSelections(true); }
            this.getView().getModel("hsPlanificaciones").setProperty("/items", this._aHsPlanAll);
            this.byId("dlgCrearHandset").open();
        },

        onDlgMarcaChange: function () {
            this._filterHsPlanificaciones();
        },

        onDlgPeriodoChange: function () {
            this._filterHsPlanificaciones();
        },

        _filterHsPlanificaciones: function () {
            var sMarca   = this.byId("hsDlgMarca").getSelectedKey();
            var sPeriodo = this.byId("hsDlgPeriodo").getSelectedKey();
            var aFiltered = (this._aHsPlanAll || []).filter(function (p) {
                return (!sMarca   || p.marca   === sMarca) &&
                       (!sPeriodo || p.periodo === sPeriodo);
            });
            this.getView().getModel("hsPlanificaciones").setProperty("/items", aFiltered);
        },

        onDlgTipoChange: function () {
            var sTipo = this.byId("hsDlgTipo").getSelectedKey();
            this.getView().getModel("ui").setProperty("/hsMostrarDerivado",
                sTipo === "Handset asociado a Pedido Derivado");
        },

        onConfirmCrear: function () {
            var sTitulo = this.byId("hsDlgTitulo").getValue().trim();
            if (!sTitulo) {
                this.byId("hsDlgTitulo").setValueState("Error");
                this.byId("hsDlgTitulo").setValueStateText("El título es obligatorio");
                return;
            }
            this.byId("hsDlgTitulo").setValueState("None");
            var sMarca   = this.byId("hsDlgMarca").getSelectedKey();
            var sTipo    = this.byId("hsDlgTipo").getSelectedKey();
            var sPeriodo = this.byId("hsDlgPeriodo").getSelectedKey();
            var sNewId   = "REQ-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 900000) + 100000);
            var oModel   = this.getView().getModel("handset");
            var aItems   = oModel.getProperty("/items") || [];
            var oNewItem = { reqId: sNewId, titulo: sTitulo, marca: sMarca, periodo: sPeriodo,
                             tipoSolicitud: sTipo, estado: "Registrado", numeroOC: "-", numeroOCDerivada: "-" };
            aItems.unshift(oNewItem);
            oModel.setProperty("/items", aItems);

            // Sync to global model so Detail can find the record
            var oGlobalModel = this.getOwnerComponent().getModel();
            var aReqs = oGlobalModel.getProperty("/requerimientos") || [];
            aReqs.unshift({
                reqId: sNewId, titulo: sTitulo, marca: sMarca, periodo: sPeriodo,
                tipoSolicitud: sTipo, estado: "Registrado", mercado: "local",
                creadoPor: "current.user@claro.com",
                fechaCreacion: new Date().toLocaleDateString("de-DE") + " " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
                ultimaModificacion: new Date().toLocaleDateString("de-DE") + " " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
                validoHasta: "", numeroOC: "-", numeroOCDerivada: "-",
                contributions: { dataSharing: 0, contribucionLogistica: 0, preOrder: 0, fondoSellOut: 0, nuevosCanalesB2B: 0, rebateIncentivo: 0 },
                items: [], aportesVIR: [], flujoAprobacion: [], historialVentas: [], adjuntos: []
            });
            oGlobalModel.setProperty("/requerimientos", aReqs);

            this.byId("dlgCrearHandset").close();
            MessageToast.show("Solicitud " + sNewId + " creada");
        },

        onCancelCrear: function () { this.byId("dlgCrearHandset").close(); },

        onEnviarAprobacion: function () { MessageToast.show("Enviar a Aprobación"); },
        onFinalizarSolicitud: function () { MessageToast.show("Finalizar Solicitud"); },
        onExportarExcel: function () { MessageToast.show("Exportar Excel"); }
    });
});
