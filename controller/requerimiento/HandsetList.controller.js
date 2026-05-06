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
            this.getView().setModel(new JSONModel({ haySeleccion: false, hsMostrarDerivado: false, hsMostrarLineasDerivado: false, hsModoEdicionDerivado: false, esComprasList: false }), "ui");
            this.getView().setModel(new JSONModel({ items: [] }), "hsDerivadoLineas");

            this.getView().setModel(new JSONModel({
                items: [
                    { reqId: "REQ-2026-000005", titulo: "Equipos Honor X5C / X7D \u2013 Q2 2026",            marca: "Honor",    periodo: "2026 Q2", tipoSolicitud: "Handset Original",                      estado: "Pendiente Aprobaci\u00f3n", numeroOC: "-", numeroOCDerivada: "-" },
                    { reqId: "REQ-2026-000002", titulo: "Equipos Apple iPhone 17 - Q1 2026",                 marca: "Apple",    periodo: "2026 Q1", tipoSolicitud: "Handset asociado a Pedido Importacion",  estado: "En Aprobaci\u00f3n",        numeroOC: "-", numeroOCDerivada: "-" },
                    { reqId: "REQ-2026-000001", titulo: "D\u00eda de la Madre - Samsung Galaxy S26",         marca: "Samsung",  periodo: "2026 Q1", tipoSolicitud: "Handset Original",                      estado: "Registrado",                numeroOC: "-", numeroOCDerivada: "-" },
                    { reqId: "REQ-2026-000003", titulo: "Equipos Samsung Galaxy A56 - Q1 2026",              marca: "Samsung",  periodo: "2026 Q1", tipoSolicitud: "Handset asociado a Pedido Directo",     estado: "Aprobado",                  numeroOC: "4500138821", numeroOCDerivada: "-" },
                    { reqId: "REQ-2026-000004", titulo: "Equipos Xiaomi Redmi Note 15 - Q2 2026",           marca: "Xiaomi",   periodo: "2026 Q2", tipoSolicitud: "Handset asociado a Pedido Derivado",    estado: "Registrado",                numeroOC: "-", numeroOCDerivada: "-" }
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
                    { pedidoId: "460000001", descripcion: "Pedido D\u00eda Madre",        lineas: [ { material: "10000001", cantidad: 100 }, { material: "10000002", cantidad: 200 }, { material: "10000003", cantidad: 150 } ] },
                    { pedidoId: "460000002", descripcion: "Pedido Fiestas Patrias",    lineas: [ { material: "10000004", cantidad: 300 }, { material: "10000005", cantidad: 120 } ] },
                    { pedidoId: "460000003", descripcion: "Pedido Promoci\u00f3n Samsung", lineas: [ { material: "10000006", cantidad: 80  }, { material: "10000007", cantidad: 250 } ] }
                ]
            }), "hsPedidosAbiertos");

            this.getRouter()
                .getRoute("handsetList")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._syncFromGlobal();
            this._clearFilters();
            // Si el rol es Compras, pre-filtrar por "Pendiente Aprobación"
            var oSession = this.getOwnerComponent().getModel("session");
            var sRol = oSession ? (oSession.getProperty("/rol") || "") : "";
            var oUi  = this.getView().getModel("ui");
            oUi.setProperty("/esComprasList", sRol === "Compras");
            if (sRol === "Compras") {
                var oFiltroEstado = this.byId("hsFilterEstado");
                if (oFiltroEstado) { oFiltroEstado.setSelectedKey("Pendiente Aprobación"); }
            }
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
            this.getView().getModel("hsDerivadoLineas").setProperty("/items", []);
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
            var bDerivado = sTipo === "Handset asociado a Pedido Derivado";
            var oUi = this.getView().getModel("ui");
            oUi.setProperty("/hsMostrarDerivado", bDerivado);
            if (bDerivado) {
                var aAllLineas = [];
                var aPedidos = this.getView().getModel("hsPedidosAbiertos").getProperty("/items") || [];
                aPedidos.forEach(function (oPedido) {
                    (oPedido.lineas || []).forEach(function (oLinea) {
                        aAllLineas.push({ pedidoId: oPedido.pedidoId, material: oLinea.material, cantidad: oLinea.cantidad });
                    });
                });
                this.getView().getModel("hsDerivadoLineas").setProperty("/items", aAllLineas);
            } else {
                this.getView().getModel("hsDerivadoLineas").setProperty("/items", []);
            }
        },

        formatCantidad: function (vVal) {
            var fVal = parseFloat(vVal);
            if (isNaN(fVal)) { return vVal; }
            return sap.ui.core.format.NumberFormat.getFloatInstance({
                minFractionDigits: 2,
                maxFractionDigits: 2,
                groupingEnabled: true
            }).format(fVal);
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

            // ── Ítems de planificación para solicitud Derivada ───────────────────
            var aItemsPlanif = [];
            var bDerivado = (sTipo === "Handset asociado a Pedido Derivado");
            if (bDerivado) {
                var oTblDerivado = this.byId("hsTblLineasDerivado");
                var aSelItems = oTblDerivado ? oTblDerivado.getSelectedItems() : [];
                // Prefijos de código por marca (inventado pero coherente)
                var mMarcaCodigo = { Samsung: "SM-", Apple: "AAPL-", Motorola: "MOT-", Xiaomi: "MI-" };
                var sPreCod = mMarcaCodigo[sMarca] || "EQ-";
                aSelItems.forEach(function (oItem, iIdx) {
                    var oCtx = oItem.getBindingContext("hsDerivadoLineas");
                    if (!oCtx) { return; }
                    var sMat  = oCtx.getProperty("material");
                    var nCant = oCtx.getProperty("cantidad") || 0;
                    var sPedido = oCtx.getProperty("pedidoId");
                    // Valores inventados coherentes
                    var nPrecio = Math.round((299 + Math.random() * 900) * 100) / 100;
                    var nVIR    = Math.round(nPrecio * 0.08 * 100) / 100;
                    var nNeto   = Math.round((nPrecio - nVIR) * 100) / 100;
                    var aColores = ["Black", "White", "Blue", "Silver", "Gray"];
                    aItemsPlanif.push({
                        no:               iIdx + 1,
                        modelo:           sMarca + " " + sMat,
                        codigo:           sPreCod + sMat,
                        codigoMaterial:   sMat,
                        color:            aColores[iIdx % aColores.length],
                        cantidad:         nCant,
                        precioFacturacion: nPrecio,
                        virUnitario:      nVIR,
                        totalFacturacion: Math.round(nPrecio * nCant * 100) / 100,
                        totalVir:         Math.round(nVIR    * nCant * 100) / 100,
                        totalNeto:        Math.round(nNeto   * nCant * 100) / 100,
                        stockCDVES:       Math.floor(Math.random() * 400) + 50,
                        stockDistribuido: Math.floor(Math.random() * 250) + 30,
                        pedidoAbierto:    sPedido
                    });
                });
            }

            var oModel = this.getView().getModel("handset");
            var aItems = oModel.getProperty("/items") || [];
            aItems.unshift({ reqId: sNewId, titulo: sTitulo, marca: sMarca, periodo: sPeriodo,
                             tipoSolicitud: sTipo, estado: "Registrado", numeroOC: "-", numeroOCDerivada: "-" });
            oModel.setProperty("/items", aItems);

            // Sync to global model so Detail can find the record
            var oGlobalModel = this.getOwnerComponent().getModel();
            var aReqs = oGlobalModel.getProperty("/requerimientos") || [];
            var sFechaHoy = new Date().toLocaleDateString("de-DE") + " " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
            aReqs.unshift({
                reqId: sNewId, titulo: sTitulo, marca: sMarca, periodo: sPeriodo,
                tipoSolicitud: sTipo, estado: "Registrado", mercado: "local",
                creadoPor: "current.user@claro.com",
                fechaCreacion: sFechaHoy, ultimaModificacion: sFechaHoy,
                validoHasta: "", numeroOC: "-", numeroOCDerivada: "-",
                contributions: { dataSharing: 0, contribucionLogistica: 0, preOrder: 0, fondoSellOut: 0, nuevosCanalesB2B: 0, rebateIncentivo: 0 },
                items: aItemsPlanif, aportesVIR: [], flujoAprobacion: [], historialVentas: [], adjuntos: []
            });
            oGlobalModel.setProperty("/requerimientos", aReqs);

            this.byId("dlgCrearHandset").close();
            MessageToast.show("Solicitud " + sNewId + " creada" + (aItemsPlanif.length ? " con " + aItemsPlanif.length + " ítem(s) de planificación" : ""));
        },

        onCancelCrear: function () { this.byId("dlgCrearHandset").close(); },

        onEnviarAprobacion: function () { MessageToast.show("Enviar a Aprobación"); },
        onFinalizarSolicitud: function () { MessageToast.show("Finalizar Solicitud"); },
        onExportarExcel: function () { MessageToast.show("Exportar Excel"); },

        onConfiguraciones: function (oEvent) {
            var oPopover = this.byId("popConfiguraciones");
            oPopover.openBy(oEvent.getSource());
        },

        onConfigProveedores: function () {
            this.byId("popConfiguraciones").close();
            this.getRouter().navTo("mantenimientoMarcaProveedor");
        },

        onConfigCostosMexico: function () {
            this.byId("popConfiguraciones").close();
            this.getRouter().navTo("mantenimientoCostosMC");
        }
    });
});
