sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, Filter, FilterOperator, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.requerimiento.List", {

        onInit: function () {
            // Modelo UI para estado de botones y contexto de mercado
            var oUiModel = new JSONModel({ haySeleccion: false, mercadoCorporativo: false });
            this.getView().setModel(oUiModel, "ui");

            this.getRouter()
                .getRoute("requerimientoList")
                .attachPatternMatched(this._onRouteMatched.bind(this, false), this);

            this.getRouter()
                .getRoute("mcRequerimientoList")
                .attachPatternMatched(this._onRouteMatched.bind(this, true), this);
        },

        _onRouteMatched: function (bMC) {
            this.getView().getModel("ui").setProperty("/mercadoCorporativo", !!bMC);
            // Reset filtros al navegar
            this._clearFilters();
            this._applyFilters();

            // Reset selecciÃ³n
            var oTable = this.byId("reqTable");
            if (oTable) { oTable.removeSelections(true); }
            this.getView().getModel("ui").setProperty("/haySeleccion", false);
        },

        /* â”€â”€â”€â”€â”€â”€â”€â”€ FILTROS â”€â”€â”€â”€â”€â”€â”€â”€ */
        onFilterChange: function () {
            this._applyFilters();
        },

        onClearFilters: function () {
            this._clearFilters();
            this._applyFilters();
        },

        onToggleFilters: function () {
            var oFilterBar = this.byId("filterNumSolicitud") && this.byId("filterNumSolicitud").getParent().getParent();
            // Simple toggle visibility on the filter container
            MessageToast.show("Filtros contraÃ­dos/expandidos");
        },

        _clearFilters: function () {
            var v = this.getView();
            if (v.byId("filterNumSolicitud")) { v.byId("filterNumSolicitud").setValue(""); }
            if (v.byId("inpFilterTitulo")) { v.byId("inpFilterTitulo").setValue(""); }
            if (v.byId("filterEstado")) { v.byId("filterEstado").setSelectedKey(""); }
            if (v.byId("selFilterPeriodo")) { v.byId("selFilterPeriodo").setSelectedKey(""); }
            if (v.byId("filterMarca")) { v.byId("filterMarca").setSelectedKey(""); }
            if (v.byId("filterLineaNegocio")) { v.byId("filterLineaNegocio").setSelectedKey(""); }
        },

        _applyFilters: function () {
            var oTable = this.byId("reqTable");
            if (!oTable) { return; }

            var aFilters = [];
            var bMC = this.getView().getModel("ui").getProperty("/mercadoCorporativo");
            var v = this.getView();
            var sNum    = (v.byId("filterNumSolicitud") && v.byId("filterNumSolicitud").getValue()) || "";
            var sTitulo = (v.byId("inpFilterTitulo") && v.byId("inpFilterTitulo").getValue()) || "";
            var sEstado = (v.byId("filterEstado") && v.byId("filterEstado").getSelectedKey()) || "";
            var sPeriodo= (v.byId("selFilterPeriodo") && v.byId("selFilterPeriodo").getSelectedKey()) || "";
            var sMarca  = (v.byId("filterMarca") && v.byId("filterMarca").getSelectedKey()) || "";

            // Filtro por mercado (local vs corporativo)
            aFilters.push(new Filter("mercado", FilterOperator.EQ, bMC ? "corporativo" : "local"));

            if (sNum.trim())    { aFilters.push(new Filter("reqId",   FilterOperator.Contains, sNum)); }
            if (sTitulo.trim()) { aFilters.push(new Filter("titulo",  FilterOperator.Contains, sTitulo)); }
            if (sEstado)        { aFilters.push(new Filter("estado",  FilterOperator.EQ, sEstado)); }
            if (!bMC && sPeriodo) { aFilters.push(new Filter("periodo", FilterOperator.EQ, sPeriodo)); }
            if (!bMC && sMarca)   { aFilters.push(new Filter("marca",   FilterOperator.EQ, sMarca)); }
            var sLN = (v.byId("filterLineaNegocio") && v.byId("filterLineaNegocio").getSelectedKey()) || "";
            if (bMC && sLN) { aFilters.push(new Filter("lineaNegocio", FilterOperator.EQ, sLN)); }

            oTable.getBinding("items").filter(new Filter({ filters: aFilters, and: true }));
        },

        /* â”€â”€â”€â”€â”€â”€â”€â”€ SELECCIÃ“N â”€â”€â”€â”€â”€â”€â”€â”€ */
        onSelectionChange: function () {
            var oTable = this.byId("reqTable");
            var bHay = oTable && oTable.getSelectedItems().length > 0;
            this.getView().getModel("ui").setProperty("/haySeleccion", bHay);
        },

        /* ———————— CREAR SOLICITUD (Dialog) ———————— */
        onCrearSolicitud: function () {
            var bMC = this.getView().getModel("ui").getProperty("/mercadoCorporativo");
            this.byId("dlgTitulo").setValue("");
            if (bMC) {
                this.byId("dlgTipoMC").setSelectedKey("Continuidad Tecnológica y de Servicios");
                this.byId("dlgCliente").setSelectedKey("");
                this.byId("dlgLineaNegocio").setSelectedKey("");
                this.byId("dlgImporteUSD").setValue("");
                this.byId("dlgOportunidadId").setValue("");
            } else {
                this.byId("dlgTipoSolicitud").setSelectedKey("Handset Original");
                this.byId("dlgMarca").setSelectedKey("");
                this.byId("dlgPeriodo").setSelectedKey("");
            }
            this.byId("dlgCrearSolicitud").open();
        },

        onConfirmCrear: function () {
            var bMC     = this.getView().getModel("ui").getProperty("/mercadoCorporativo");
            var sTitulo = this.byId("dlgTitulo").getValue().trim();
            var bError  = false;

            if (!sTitulo) { this.byId("dlgTitulo").setValueState("Error"); bError = true; }
            else          { this.byId("dlgTitulo").setValueState("None"); }

            var oModel = this.getOwnerComponent().getModel();
            var aReqs  = oModel.getProperty("/requerimientos") || [];
            var sNow   = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                         + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
            var oNew;

            if (bMC) {
                var sTipoMC   = this.byId("dlgTipoMC").getSelectedKey();
                var sCliente  = this.byId("dlgCliente").getSelectedKey();
                var sLN       = this.byId("dlgLineaNegocio").getSelectedKey();
                var sImporte  = this.byId("dlgImporteUSD").getValue().trim();
                var sOppId    = this.byId("dlgOportunidadId").getValue().trim();

                if (!sCliente) { this.byId("dlgCliente").setValueState("Error");      bError = true; }
                else           { this.byId("dlgCliente").setValueState("None"); }
                if (!sLN)      { this.byId("dlgLineaNegocio").setValueState("Error"); bError = true; }
                else           { this.byId("dlgLineaNegocio").setValueState("None"); }

                if (bError) { return; }

                var sNewId = "REQ-MC-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 900000) + 100000);
                oNew = {
                    reqId: sNewId, mercado: "corporativo", titulo: sTitulo,
                    tipoSolicitud: sTipoMC, cliente: sCliente, lineaNegocio: sLN,
                    importeEstimadoUSD: parseFloat(sImporte) || 0, oportunidadId: sOppId,
                    moneda: "USD", estado: "Borrador",
                    creadoPor: "oscar.fabian.ortiz.velayarce@emeal.nttdata.com",
                    fechaCreacion: sNow, ultimaModificacion: sNow, descripcionTecnica: "",
                    items: [], evaluacionFinanciera: { costos: 0, ingresos: 0, margen: 0, roi: 0 },
                    flujoAprobacion: []
                };
                aReqs.unshift(oNew);
                oModel.setProperty("/requerimientos", aReqs);
                this.byId("dlgCrearSolicitud").close();
                MessageToast.show("Necesidad " + sNewId + " creada");
                this.getRouter().navTo("mcRequerimientoDetail", { reqId: encodeURIComponent(sNewId) });
            } else {
                var sTipo    = this.byId("dlgTipoSolicitud").getSelectedKey();
                var sMarca   = this.byId("dlgMarca").getSelectedKey();
                var sPeriodo = this.byId("dlgPeriodo").getSelectedKey();

                if (!sMarca)   { this.byId("dlgMarca").setValueState("Error");   bError = true; }
                else           { this.byId("dlgMarca").setValueState("None"); }
                if (!sPeriodo) { this.byId("dlgPeriodo").setValueState("Error"); bError = true; }
                else           { this.byId("dlgPeriodo").setValueState("None"); }

                if (bError) { return; }

                var sNewIdL = "REQ-2026-" + String(Math.floor(Math.random() * 900000) + 100000);
                oNew = {
                    reqId: sNewIdL, mercado: "local", titulo: sTitulo, marca: sMarca,
                    periodo: sPeriodo, tipoSolicitud: sTipo, estado: "Borrador",
                    numeroOC: "-", numeroOCDerivada: "-",
                    creadoPor: "oscar.fabian.ortiz.velayarce@emeal.nttdata.com",
                    fechaCreacion: sNow, ultimaModificacion: sNow, validoHasta: "",
                    items: [], aportesVIR: [], flujoAprobacion: [], historialVentas: []
                };
                aReqs.unshift(oNew);
                oModel.setProperty("/requerimientos", aReqs);
                this.byId("dlgCrearSolicitud").close();
                MessageToast.show("Solicitud " + sNewIdL + " creada");
                this.getRouter().navTo("requerimientoDetail", { reqId: encodeURIComponent(sNewIdL) });
            }
        },

        onCancelCrear: function () {
            this.byId("dlgCrearSolicitud").close();
        },

        /* ———————— NAVEGACIÓN ———————— */
        onItemPress: function (oEvent) {
            var sReqId = oEvent.getSource().getBindingContext().getProperty("reqId");
            var bMC = this.getView().getModel("ui").getProperty("/mercadoCorporativo");
            this.getRouter().navTo(
                bMC ? "mcRequerimientoDetail" : "requerimientoDetail",
                { reqId: encodeURIComponent(sReqId) }
            );
        },

        /* â”€â”€â”€â”€â”€â”€â”€â”€ ACCIONES DE TOOLBAR â”€â”€â”€â”€â”€â”€â”€â”€ */
        onEnviarAprobacion: function () {
            var oTable = this.byId("reqTable");
            var aItems = oTable.getSelectedItems();
            if (!aItems.length) { return; }

            MessageBox.confirm("Â¿Enviar " + aItems.length + " solicitud(es) a aprobaciÃ³n?", {
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    var oModel = this.getOwnerComponent().getModel();
                    aItems.forEach(function (oItem) {
                        var sPath = oItem.getBindingContext().getPath();
                        var sEstado = oModel.getProperty(sPath + "/estado");
                        if (sEstado === "Borrador") {
                            oModel.setProperty(sPath + "/estado", "En Aprobaci\u00f3n");
                        }
                    });
                    oTable.removeSelections(true);
                    this.getView().getModel("ui").setProperty("/haySeleccion", false);
                    MessageToast.show("Enviado a aprobaci\u00f3n");
                }.bind(this)
            });
        },

        onEnviarCarta: function () {
            MessageToast.show("Enviar a Aprobaci\u00f3n Carta Aceptaci\u00f3n (en desarrollo)");
        },

        onFinalizarSolicitud: function () {
            MessageToast.show("Finalizar Solicitud (en desarrollo)");
        },

        onExportarExcel: function () {
            MessageToast.show("Exportando a Excel...");
        }
    });
});
