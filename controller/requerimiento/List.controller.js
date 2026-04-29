sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History"
], function (BaseController, Filter, FilterOperator, JSONModel, MessageToast, MessageBox, History) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.requerimiento.List", {

        onInit: function () {
            // Modelo UI para estado de botones y contexto de mercado
            var oUiModel = new JSONModel({
                haySeleccion:            false,
                mercadoCorporativo:      false,
                mostrarSeleccion:        false,
                canalSeleccionado:       "Infraestructura",
                lineaNegocioSeleccionada: "RedMovil",
                mostrarPedidosAbiertos:  false
            });
            this.getView().setModel(oUiModel, "ui");

            // Modelo de planificaciones publicadas (mock – P1: en producción viene de BPC/IBP)
            var aPlanAll = [
                { titulo: "Samsung - 2026Q1",  marca: "Samsung",  periodo: "2026 Q1", publicadoEl: "27.01.2025 19:00" },
                { titulo: "Samsung - 2026Q2",  marca: "Samsung",  periodo: "2026 Q2", publicadoEl: "15.04.2025 10:00" },
                { titulo: "Motorola - 2026Q1", marca: "Motorola", periodo: "2026 Q1", publicadoEl: "27.01.2025 19:00" },
                { titulo: "Apple - 2026Q1",    marca: "Apple",    periodo: "2026 Q1", publicadoEl: "27.01.2025 19:00" },
                { titulo: "Xiaomi - 2026Q1",   marca: "Xiaomi",   periodo: "2026 Q1", publicadoEl: "27.01.2025 19:00" }
            ];
            this._aPlanAll = aPlanAll;
            this.getView().setModel(new JSONModel({ items: aPlanAll }), "planificaciones");

            // Modelo de pedidos abiertos (mock – C2: visible solo para tipo Derivado)
            this.getView().setModel(new JSONModel({
                items: [
                    { pedidoId: "460000001", descripcion: "Pedido Día Madre",        proveedor: "Samsung Electronics", monto: "USD 120,000" },
                    { pedidoId: "460000002", descripcion: "Pedido Fiestas Patrias",   proveedor: "Motorola Solutions",  monto: "USD 85,000"  },
                    { pedidoId: "460000003", descripcion: "Pedido Promoción Samsung", proveedor: "Samsung Electronics", monto: "USD 200,000" }
                ]
            }), "pedidosAbiertos");

            this.getRouter()
                .getRoute("requerimientoList")
                .attachPatternMatched(this._onRouteMatched.bind(this, false), this);

            this.getRouter()
                .getRoute("mcRequerimientoList")
                .attachPatternMatched(this._onRouteMatched.bind(this, true), this);
        },

        _onRouteMatched: function (bMC) {
            var oUi = this.getView().getModel("ui");
            oUi.setProperty("/mercadoCorporativo", !!bMC);

            // Si venimos de una vista de detalle (back desde el detalle de un requerimiento),
            // NO resetear mostrarSeleccion para que se vea directamente la lista
            var sPrev = History.getInstance().getPreviousHash();
            var bFromDetail = sPrev !== undefined &&
                (sPrev.indexOf("requerimiento/") !== -1 ||
                 sPrev.indexOf("mc/requerimiento/") !== -1);

            if (!bFromDetail) {
                oUi.setProperty("/mostrarSeleccion", !bMC);
                oUi.setProperty("/canalSeleccionado", "Infraestructura");
                oUi.setProperty("/lineaNegocioSeleccionada", "RedMovil");
            }

            // Reset filtros al navegar
            this._clearFilters();
            this._applyFilters();

            // Reset selección tabla
            var oTable = this.byId("reqTable");
            if (oTable) { oTable.removeSelections(true); }
            oUi.setProperty("/haySeleccion", false);
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

            // (2.1.1) Filtro por canal cuando es Handset: solo tipoSolicitud que contengan "Handset"
            var sCanal = this.getView().getModel("ui").getProperty("/canalSeleccionado");
            if (!bMC && sCanal === "Handset") {
                aFilters.push(new Filter("tipoSolicitud", FilterOperator.Contains, "Handset"));
            }

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

        /* ──────── PASO 1: Seleccionar Canal / Línea de Negocio (tarjeta inline) ──────── */
        onSelCanalChange: function (oEvent) {
            var sCanal = oEvent.getSource().getSelectedKey();
            this.getView().getModel("ui").setProperty("/canalSeleccionado", sCanal);
            // Resetear línea de negocio si el canal no tiene ninguna (C2)
            if (sCanal !== "Infraestructura") {
                this.getView().getModel("ui").setProperty("/lineaNegocioSeleccionada", "");
            }
        },

        onConfirmTipoRequerimiento: function () {
            var oUi    = this.getView().getModel("ui");
            var sCanal = this.byId("selCanal").getSelectedKey();
            var sLinea = (sCanal === "Infraestructura")
                ? this.byId("selLineaNegocio").getSelectedKey()
                : "";

            oUi.setProperty("/canalSeleccionado", sCanal);
            oUi.setProperty("/lineaNegocioSeleccionada", sLinea);

            // Infra + Mercado Corporativo → vista dedicada
            if (sCanal === "Infraestructura" && sLinea === "MercadoCorporativo") {
                this.getRouter().navTo("infraMCList");
                return;
            }

            // Infra + Red Movil → vista dedicada
            if (sCanal === "Infraestructura" && sLinea === "RedMovil") {
                this.getRouter().navTo("infraRedMovilList");
                return;
            }

            // Infra + Red Fija → vista dedicada
            if (sCanal === "Infraestructura" && sLinea === "RedFija") {
                this.getRouter().navTo("infraRedFijaList");
                return;
            }

            // Infra + O&M → vista dedicada
            if (sCanal === "Infraestructura" && sLinea === "OM") {
                this.getRouter().navTo("infraOMList");
                return;
            }

            // Infra + Compras Locales → vista dedicada
            if (sCanal === "Infraestructura" && sLinea === "ComprasLocales") {
                this.getRouter().navTo("comprasLocalesList");
                return;
            }

            // Handset → vista dedicada
            if (sCanal === "Handset") {
                this.getRouter().navTo("handsetList");
                return;
            }

            oUi.setProperty("/mostrarSeleccion", false);
            this._applyFilters();
        },

        onCancelTipoRequerimiento: function () {
            this.getRouter().navTo("portal");
        },

        /* ──────── CREAR SOLICITUD (Dialog) ──────── */
        onCrearSolicitud: function () {
            var bMC = this.getView().getModel("ui").getProperty("/mercadoCorporativo");
            this._openCrearSolicitudDialog(bMC);
        },

        _openCrearSolicitudDialog: function (bMC) {
            var oUi = this.getView().getModel("ui");
            oUi.setProperty("/mostrarPedidosAbiertos", false);

            // Resetear filtros y selección de planificaciones al abrir
            var oList = this.byId("lstPlanificaciones");
            if (oList) {
                oList.getBinding("items").filter([]);
                oList.removeSelections(true);
            }

            // Resetear selección de pedidos abiertos al abrir
            var oTbl = this.byId("tblPedidosAbiertos");
            if (oTbl) { oTbl.removeSelections(true); }

            if (bMC) {
                this.byId("dlgTituloMC").setValue("");
                this.byId("dlgTipoMC").setSelectedKey("Continuidad Tecnológica y de Servicios");
                this.byId("dlgCliente").setSelectedKey("");
                this.byId("dlgLineaNegocio").setSelectedKey("");
                this.byId("dlgImporteUSD").setValue("");
                this.byId("dlgOportunidadId").setValue("");
            } else {
                this.byId("dlgTitulo").setValue("");
                this.byId("dlgMarca").setSelectedKey("");
                this.byId("dlgTipoSolicitud").setSelectedKey("Handset asociado a Pedido Directo");
                this.byId("dlgPeriodo").setSelectedKey("");
            }
            this.byId("dlgCrearSolicitud").open();
        },

        // C2: pedidos abiertos = solicitudes Derivado no cerradas
        onDlgTipoSolicitudChange: function (oEvent) {
            var sTipo = oEvent.getSource().getSelectedKey();
            var bDerivado = sTipo === "Handset asociado a Pedido Derivado";
            this.getView().getModel("ui").setProperty("/mostrarPedidosAbiertos", bDerivado);
            if (bDerivado) { this._loadPedidosAbiertos(); }
        },

        _loadPedidosAbiertos: function () {
            var aEstadosCerrados = ["Finalizado", "Rechazado", "Cancelado"];
            var aReqs = this.getOwnerComponent().getModel().getProperty("/requerimientos") || [];
            var aPedidos = aReqs
                .filter(function (r) {
                    return r.tipoSolicitud === "Handset asociado a Pedido Derivado"
                        && aEstadosCerrados.indexOf(r.estado) === -1;
                })
                .map(function (r) {
                    return { pedidoId: r.reqId, descripcion: r.titulo };
                });
            this.getView().getModel("pedidosAbiertos").setProperty("/items", aPedidos);
        },

        onPlanSelectionChange: function () {
            // Mantener el filtro activo al seleccionar un item
        },

        onDlgMarcaChange: function () {
            this._filterPlanificaciones();
        },

        onDlgPeriodoChange: function () {
            this._filterPlanificaciones();
        },

        _filterPlanificaciones: function () {
            var sMarca   = this.byId("dlgMarca")   ? this.byId("dlgMarca").getSelectedKey()   : "";
            var sPeriodo = this.byId("dlgPeriodo") ? this.byId("dlgPeriodo").getSelectedKey() : "";
            var aFilters = [];

            if (sMarca) {
                // "Samsung Electronics" debe coincidir con items de marca "Samsung"
                aFilters.push(new Filter({
                    path: "marca",
                    test: function (v) {
                        return v && sMarca.toLowerCase().indexOf(v.toLowerCase()) >= 0;
                    }
                }));
            }
            if (sPeriodo) {
                aFilters.push(new Filter("periodo", FilterOperator.EQ, sPeriodo));
            }

            var oList = this.byId("lstPlanificaciones");
            if (oList) {
                oList.getBinding("items").filter(
                    aFilters.length ? new Filter({ filters: aFilters, and: true }) : []
                );
            }
        },

        onConfirmCrear: function () {
            var bMC     = this.getView().getModel("ui").getProperty("/mercadoCorporativo");
            var sTitulo = bMC
                ? this.byId("dlgTituloMC").getValue().trim()
                : this.byId("dlgTitulo").getValue().trim();
            var bError  = false;

            if (!sTitulo) {
                (bMC ? this.byId("dlgTituloMC") : this.byId("dlgTitulo")).setValueState("Error");
                bError = true;
            } else {
                (bMC ? this.byId("dlgTituloMC") : this.byId("dlgTitulo")).setValueState("None");
            }

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
                    periodo: sPeriodo, tipoSolicitud: sTipo, estado: "Registrado",
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
