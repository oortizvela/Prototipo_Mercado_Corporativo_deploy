sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Avatar",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Text",
    "sap/ui/core/Icon",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/TextArea",
    "sap/m/Select",
    "sap/m/Label",
    "sap/ui/core/Item"
], function (BaseController, JSONModel, MessageBox, MessageToast,
             Avatar, VBox, HBox, Text, Icon,
             Dialog, Button, Input, TextArea, Select, Label, Item) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.requerimiento.Detail", {

        fmtAmt: function (n) {
            if (n === undefined || n === null || n === "") { return ""; }
            return Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        onInit: function () {
            var oUiModel = new JSONModel({ mercadoCorporativo: false, esDerivado: false, factibilidadCompleta: false, esFact: false, esComercial: false, esRedMovil: false, esRedFija: false, esOM: false, esComprasLocales: false, esCompras: false });
            this.getView().setModel(oUiModel, "ui");
            this.getRouter().getRoute("requerimientoDetail")
                .attachPatternMatched(this._onRouteMatched.bind(this, false, false, false, false, false, false, false), this);
            this.getRouter().getRoute("mcRequerimientoDetail")
                .attachPatternMatched(this._onRouteMatched.bind(this, true, false, false, false, false, false, false), this);
            this.getRouter().getRoute("mcFactibilidadDetail")
                .attachPatternMatched(this._onRouteMatched.bind(this, true, true, false, false, false, false, false), this);
            this.getRouter().getRoute("mcComercialDetail")
                .attachPatternMatched(this._onRouteMatched.bind(this, true, false, true, false, false, false, false), this);
            this.getRouter().getRoute("infraRedMovilDetail")
                .attachPatternMatched(this._onRouteMatched.bind(this, false, false, false, true, false, false, false), this);
            this.getRouter().getRoute("infraRedFijaDetail")
                .attachPatternMatched(this._onRouteMatched.bind(this, false, false, false, false, true, false, false), this);
            this.getRouter().getRoute("infraOMDetail")
                .attachPatternMatched(this._onRouteMatched.bind(this, false, false, false, false, false, true, false), this);
            this.getRouter().getRoute("comprasLocalesDetail")
                .attachPatternMatched(this._onRouteMatched.bind(this, false, false, false, false, false, false, true), this);
        },

        _onRouteMatched: function (bMC, bFact, bComercial, bRedMovil, bRedFija, bOM, bCL, oEvent) {
            var oUi = this.getView().getModel("ui");
            oUi.setProperty("/mercadoCorporativo", !!bMC);
            oUi.setProperty("/esFact", !!bFact);
            oUi.setProperty("/esComercial", !!bComercial);
            oUi.setProperty("/esRedMovil", !!bRedMovil);
            oUi.setProperty("/esRedFija", !!bRedFija);
            oUi.setProperty("/esOM", !!bOM);
            oUi.setProperty("/esComprasLocales", !!bCL);
            // Detectar rol Compras desde el session model
            var oSession = this.getOwnerComponent().getModel("session");
            var sRol = oSession ? (oSession.getProperty("/rol") || "") : "";
            oUi.setProperty("/esCompras", sRol === "Compras");
            var sReqId = decodeURIComponent(oEvent.getParameter("arguments").reqId);
            this._bindView(sReqId);
        },

        _bindView: function (sReqId) {
            var oModel = this.getOwnerComponent().getModel();
            var aReqs  = oModel.getProperty("/requerimientos") || [];
            var iIndex = aReqs.findIndex(function (r) { return r.reqId === sReqId; });
            if (iIndex === -1) { window.history.back(); return; }
            this.getView().bindObject({ path: "/requerimientos/" + iIndex });
            this._iIndex = iIndex;
            // Initialize optional arrays if not present
            var oR = oModel.getProperty("/requerimientos/" + iIndex);
            if (!oR.adjuntos)              { oModel.setProperty("/requerimientos/" + iIndex + "/adjuntos", []); }
            if (!oR.adjuntosHS)            { oModel.setProperty("/requerimientos/" + iIndex + "/adjuntosHS", { acuerdos: [], otrosArchivos: [] }); }
            if (!oR.stock)                 { oModel.setProperty("/requerimientos/" + iIndex + "/stock", []); }
            if (!oR.materialesSolicitados) { oModel.setProperty("/requerimientos/" + iIndex + "/materialesSolicitados", []); }
            if (!oR.historialFeedback)     { oModel.setProperty("/requerimientos/" + iIndex + "/historialFeedback", []); }
            if (!oR.pedidosAbiertos)       { oModel.setProperty("/requerimientos/" + iIndex + "/pedidosAbiertos", []); }
            if (!oR.actaAceptacion) {
                var dFecha = new Date();
                var sMeses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
                var sFechaDoc = dFecha.getDate() + " de " + sMeses[dFecha.getMonth()] + " del " + dFecha.getFullYear();
                oModel.setProperty("/requerimientos/" + iIndex + "/actaAceptacion", {
                    numeroActa:     "H" + String(Math.floor(Math.random() * 900) + 100) + "-" + dFecha.getFullYear(),
                    fechaDocumento: "Lima, " + sFechaDoc,
                    proveedor:      (oR.marca || "Proveedor") + " ELECTRONICS PERU S.A.C.",
                    contacto:       "",
                    asunto:         "Confirmaci\u00f3n de compra de equipos " + (oR.marca || ""),
                    estadoDocuSign: ""
                });
            }
            if (!oR.confirmacionCliente) {
                oModel.setProperty("/requerimientos/" + iIndex + "/confirmacionCliente", {
                    fecha:           "",
                    correo:          "",
                    contacto:        "",
                    observaciones:   "",
                    evidenciaNombre: ""
                });
            }
            if (!oR.adjuntosMC) {
                oModel.setProperty("/requerimientos/" + iIndex + "/adjuntosMC", {
                    disenhoSolucion: { nombre: "" },
                    cotizaciones:    { nombre: "" },
                    matrizCosto:     { nombre: "" },
                    infoCliente:     { nombre: "" }
                });
            }
            if (!oR.proyectoFact) {
                oModel.setProperty("/requerimientos/" + iIndex + "/proyectoFact", {
                    plazo: "", moneda: "USD", tipoInversion: "CAPEX", clasificacion: "",
                    centroCosto: "", tipoImputacion: "Proyecto/WBS", codigoProyecto: "", region: "",
                    ejecutivoComercial: "", responsablePreventa: "", areaResponsable: ""
                });
            }
            if (!oR.materialesFact)  { oModel.setProperty("/requerimientos/" + iIndex + "/materialesFact", []); }
            if (!oR.serviciosFact)   { oModel.setProperty("/requerimientos/" + iIndex + "/serviciosFact",  []); }
            if (!oR.documentoSAPSimulado) {
                oModel.setProperty("/requerimientos/" + iIndex + "/documentoSAPSimulado", {
                    tipo: "", numero: "", fecha: "", canal: ""
                });
            }
            if (!oR.costosFact) {
                oModel.setProperty("/requerimientos/" + iIndex + "/costosFact", {
                    descManoObra: "", manoObra: 0,
                    descLogistica: "", logistica: 0,
                    descOtros: "", otros: 0
                });
            }
            if (!oR.comercialData) {
                oModel.setProperty("/requerimientos/" + iIndex + "/comercialData", {
                    ingresos: 0,
                    cliente: "",
                    fecha: new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
                    resumenEjecutivo: "",
                    solucionPropuesta: "",
                    alcance: "",
                    presentacionNombre: ""
                });
            }
            if (!oR.adjuntosRedMovil) {
                oModel.setProperty("/requerimientos/" + iIndex + "/adjuntosRedMovil", {
                    disenhoTecnico: { nombre: "" },
                    otrosArchivos:  { nombre: "" }
                });
            }
            if (!oR.adjuntosRedFija) {
                oModel.setProperty("/requerimientos/" + iIndex + "/adjuntosRedFija", {
                    disenhoTecnico: { nombre: "" },
                    otrosArchivos:  { nombre: "" }
                });
            }
            if (!oR.adjuntosOM) {
                oModel.setProperty("/requerimientos/" + iIndex + "/adjuntosOM", {
                    disenhoTecnico: { nombre: "" },
                    otrosArchivos:  { nombre: "" }
                });
            }
            if (!oR.adjuntosComprasLocales) {
                oModel.setProperty("/requerimientos/" + iIndex + "/adjuntosComprasLocales", {
                    disenhoOperativo: { nombre: "" },
                    otrosArchivos:    { nombre: "" }
                });
            }
            var bDerivado = (oR.tipoSolicitud || "").indexOf("Derivado") !== -1;
            this.getView().getModel("ui").setProperty("/esDerivado", bDerivado);
            var that = this;
            setTimeout(function () {
                that._updateCalculatedFields(iIndex);
                that._renderApprovalFlow(iIndex);
                that._updateVentasPromedio(iIndex);
                that._updateVirSectionTitle(iIndex);
                that._checkFactibilidadCompleta();
                that._updateCostosTab(iIndex);
                that._updateComercialKPIs(iIndex);
            }, 200);
        },

        // â”€â”€ Calculated fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        _updateCalculatedFields: function (iIndex) {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + iIndex);
            if (!oReq) { return; }
            var bMC    = oReq.mercado === "corporativo";
            var aItems = oReq.items || [];
            var fmt    = function (n) {
                return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USD";
            };
            if (bMC) {
                var nTotalUSD = aItems.reduce(function (s, i) { return s + (i.totalUSD || 0); }, 0);
                var oTU = this.byId("totalUSDMC"); if (oTU) { oTU.setText(fmt(nTotalUSD)); }
                var oEF = oReq.evaluacionFinanciera || {};
                var oEC = this.byId("efCostos");   if (oEC) { oEC.setText(fmt(oEF.costos || 0)); }
                var oEI = this.byId("efIngresos"); if (oEI) { oEI.setText(fmt(oEF.ingresos || 0)); }
                var nM  = oEF.margen || 0;
                var oEM = this.byId("efMargen");
                if (oEM) {
                    oEM.setText(nM.toFixed(2) + "%");
                    oEM.removeStyleClass("reqEvalValueNeg reqEvalValueMargen");
                    oEM.addStyleClass(nM < 25 ? "reqEvalValueNeg" : "reqEvalValueMargen");
                }
                var oER = this.byId("efROI"); if (oER) { oER.setText((oEF.roi || 0).toFixed(2) + "%"); }
                // Also populate Propuesta Consolidada tab
                var oPTU = this.byId("propTotalUSD");   if (oPTU) { oPTU.setText(fmt(nTotalUSD)); }
                var oPC  = this.byId("propEfCostos");   if (oPC)  { oPC.setText(fmt(oEF.costos || 0)); }
                var oPI  = this.byId("propEfIngresos"); if (oPI)  { oPI.setText(fmt(oEF.ingresos || 0)); }
                var oPM  = this.byId("propEfMargen");
                if (oPM) { oPM.setText(nM.toFixed(2) + "%"); oPM.removeStyleClass("reqEvalValueNeg reqEvalValueMargen"); oPM.addStyleClass(nM < 25 ? "reqEvalValueNeg" : "reqEvalValueMargen"); }
                var oPR  = this.byId("propEfROI"); if (oPR) { oPR.setText((oEF.roi || 0).toFixed(2) + "%"); }
            } else {
                var nF = aItems.reduce(function (s, i) { return s + (i.totalFacturacion || 0); }, 0);
                var nV = aItems.reduce(function (s, i) { return s + (i.totalVir || 0); }, 0);
                var nN = aItems.reduce(function (s, i) { return s + (i.totalNeto || 0); }, 0);
                var oTF = this.byId("totalFacturacion"); if (oTF) { oTF.setText(fmt(nF)); }
                var oTV = this.byId("totalVir");         if (oTV) { oTV.setText(fmt(nV)); }
                var oTN = this.byId("totalNeto");        if (oTN) { oTN.setText(fmt(nN)); }
                var nC = (oReq.aportesVIR || []).reduce(function (s, a) { return s + (a.monto || 0); }, 0);
                var oTC = this.byId("totalContribuciones");
                if (oTC) { oTC.setText("$" + nC.toLocaleString("en-US", { minimumFractionDigits: 2 })); }
            }
        },

        _updateVirSectionTitle: function (iIndex) {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + iIndex);
            if (!oReq) { return; }
            var oTitle = this.byId("virSectionTitle");
            if (oTitle) { oTitle.setText((oReq.marca || "") + " \u2014 Aportes VIR"); }
        },

        _updateVentasPromedio: function (iIndex) {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + iIndex);
            if (!oReq) { return; }
            var aV   = oReq.historialVentas || [];
            var nProm = aV.length ? Math.round(aV.reduce(function (s, v) { return s + (v.cantidad || 0); }, 0) / aV.length) : 0;
            var oText = this.byId("cantidadPromedio");
            if (oText) { oText.setText(nProm + " unidades"); }
        },

        // â”€â”€ Approval flow renderer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        _renderApprovalFlow: function (iIndex) {
            var oModel   = this.getOwnerComponent().getModel();
            var oReq     = oModel.getProperty("/requerimientos/" + iIndex);
            if (!oReq) { return; }
            var aFlujo   = oReq.flujoAprobacion || [];
            var bMC      = oReq.mercado === "corporativo";
            var sDiagId  = bMC ? "mcApprovalFlowDiagram" : "approvalFlowDiagram";
            var sCardsId = bMC ? "mcApprovalCards"       : "approvalCards";
            var oDiagram = this.byId(sDiagId);
            var oCards   = this.byId(sCardsId);
            if (!oDiagram || !oCards) { return; }
            oDiagram.destroyItems();
            oCards.destroyItems();

            if (!aFlujo.length) {
                oCards.addItem(new Text({ text: "Sin flujo de aprobaci\u00f3n. Presione 'Enviar a Aprobaci\u00f3n' para generar el flujo autom\u00e1ticamente seg\u00fan el importe." })
                    .addStyleClass("reqEmptyText sapUiSmallMargin"));
                return;
            }

            // Mapa rol → nombre de persona
            var mNombres = {
                "Jefe de Planificaci\u00f3n Comercial":  "Gladys Vivar",
                "Gerente Planificaci\u00f3n Comercial":   "Judith L\u00f3pez",
                "Compras":                              "Compras",
                "Director Mercado Masivo":              "Hugo Gonzalez",
                "Jefe de Factibilidad":                 "Ana Mendoza",
                "Gerente T\u00e9cnico":                  "Carlos R\u00edos",
                "Director de Finanzas":                 "Luis Campos",
                "Jefe de Planificaci\u00f3n":             "Marco Salas",
                "Gerente de Compras":                   "Patricia Ramos"
            };

            aFlujo.forEach(function (oStep, idx) {
                var sEst    = oStep.estado || "Pendiente";
                var sDiagClass = sEst === "Rechazado" ? "reqFlowCircleRejected"
                              : sEst === "Aprobado"   ? "reqFlowCircleApproved"
                              : "reqFlowCirclePending";

                // Abreviar rol para la etiqueta del diagrama
                var sRolCorto = (oStep.rol || "")
                    .replace("Planificaci\u00f3n Comercial", "Plan. Comercial")
                    .replace("Planificaci\u00f3n", "Plan.")
                    .replace("Gerente", "Gte.")
                    .replace("Director", "Dir.")
                    .replace("Jefe de ", "");

                // ── Paso del diagrama superior ───────────────────────────────────
                var oStepBox = new VBox({ alignItems: "Center" }).addStyleClass("reqFlowStep");
                oStepBox.addItem(new Text({ text: sRolCorto, wrapping: true, textAlign: "Center" }).addStyleClass("reqFlowRolLabel"));
                oStepBox.addItem(new Avatar({ initials: oStep.iniciales || "?", displaySize: "M" }).addStyleClass("reqFlowCircle " + sDiagClass));
                oDiagram.addItem(oStepBox);

                if (idx < aFlujo.length - 1) {
                    var oArrow = new VBox({ justifyContent: "Center", alignItems: "Center" }).addStyleClass("reqFlowArrow");
                    oArrow.addItem(new Text({ text: ">>" }).addStyleClass("reqFlowArrowText"));
                    oDiagram.addItem(oArrow);
                }

                // ── Tarjeta de persona inferior ──────────────────────────────────
                var sNombre    = oStep.nombre || mNombres[oStep.rol] || oStep.rol || "\u2014";
                var sInitials  = sNombre.split(" ").map(function (w) { return w[0] || ""; }).join("").toUpperCase().substring(0, 2);
                var sAvtClass  = sEst === "Rechazado" ? "reqCardAvatarRejected"
                               : sEst === "Aprobado"  ? "reqCardAvatarApproved"
                               : "reqCardAvatarPending";
                var sEstColor  = sEst === "Rechazado" ? "#d93025" : sEst === "Aprobado" ? "#107e3e" : "#e76500";
                var sEstIcon   = sEst === "Rechazado" ? "sap-icon://sys-cancel-2"
                               : sEst === "Aprobado"  ? "sap-icon://sys-enter-2"
                               : "sap-icon://pending";

                var oPersonCard = new VBox({ alignItems: "Center" }).addStyleClass("reqPersonCard");
                oPersonCard.addItem(new Avatar({ initials: sInitials, displaySize: "XL" }).addStyleClass("reqPersonAvatar " + sAvtClass));
                oPersonCard.addItem(new Text({ text: sNombre, textAlign: "Center", wrapping: true }).addStyleClass("reqPersonName"));
                var oEstRow = new HBox({ alignItems: "Center", justifyContent: "Center" });
                oEstRow.addItem(new Icon({ src: sEstIcon, size: "0.7rem", color: sEstColor }));
                oEstRow.addItem(new Text({ text: " " + sEst }).addStyleClass(
                    sEst === "Rechazado" ? "reqCardStatusError" : sEst === "Aprobado" ? "reqCardStatusSuccess" : "reqCardStatusPending"));
                oPersonCard.addItem(oEstRow);
                if (oStep.fecha) { oPersonCard.addItem(new Text({ text: oStep.fecha }).addStyleClass("reqPersonDate")); }
                if (oStep.comentario) { oPersonCard.addItem(new Text({ text: oStep.comentario, wrapping: true }).addStyleClass("reqPersonComment")); }
                oCards.addItem(oPersonCard);
            });
        },

        // â”€â”€ Toggle header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onToggleHeader: function () {
            var oPanel = this.byId("detailInfoPanel");
            if (!oPanel) { return; }
            var bVis = oPanel.getVisible();
            oPanel.setVisible(!bVis);
            var oBtn = this.byId("btnToggleHeader");
            if (oBtn) { oBtn.setIcon(bVis ? "sap-icon://slim-arrow-right" : "sap-icon://slim-arrow-left"); }
        },

        // â”€â”€ Editar cabecera MC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onEditar: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { return; }
            if (oReq.mercado !== "corporativo") { MessageToast.show("Modo edici\u00f3n (en desarrollo)"); return; }
            this._openMCEditDialog(oReq);
        },

        _openMCEditDialog: function (oReq) {
            var oModel      = this.getOwnerComponent().getModel();
            var oLNModel    = this.getOwnerComponent().getModel("lineasNegocio");
            var oClienteModel = this.getOwnerComponent().getModel("clientesMC");
            var aLineas     = oLNModel ? (oLNModel.getProperty("/lineasNegocio") || []) : [];
            var aClientes   = oClienteModel ? (oClienteModel.getProperty("/clientes") || []) : [];
            var that        = this;

            var oTitulo   = new Input({ value: oReq.titulo, width: "100%", required: true });
            var oOppId    = new Input({ value: oReq.oportunidadId || "", width: "100%", placeholder: "SF-2026-XXXXX" });
            var oImporte  = new Input({ value: String(oReq.importeEstimadoUSD || 0), type: "Number", width: "100%" });
            var oRespons  = new Input({ value: oReq.responsable || "", width: "100%" });
            var oDescArea = new TextArea({ value: oReq.descripcionTecnica || "", rows: 5, width: "100%",
                                           placeholder: "Descripci\u00f3n t\u00e9cnica detallada del proyecto o servicio..." });

            // Cliente: Select from clientesMC model
            var oClienteSel = new Select({ width: "100%", required: true });
            oClienteSel.addItem(new Item({ key: "", text: "(Seleccione Cliente)" }));
            aClientes.forEach(function (c) { oClienteSel.addItem(new Item({ key: c.text, text: c.text })); });
            oClienteSel.setSelectedKey(oReq.cliente || "");

            var oTipoSel = new Select({ width: "100%" });
            ["Continuidad Tecnol\u00f3gica y de Servicios", "Proyectos / RFP"].forEach(function (s) {
                oTipoSel.addItem(new Item({ key: s, text: s }));
            });
            oTipoSel.setSelectedKey(oReq.tipoSolicitud);

            var oLNSel   = new Select({ width: "100%" });
            var oAreaSel = new Select({ width: "100%" });
            var oSegmSel = new Select({ width: "100%" });

            oLNSel.addItem(new Item({ key: "", text: "(Seleccione L\u00ednea)" }));
            aLineas.forEach(function (l) { oLNSel.addItem(new Item({ key: l.text, text: l.text })); });

            var _refreshAreas = function (sLN) {
                oAreaSel.destroyItems(); oSegmSel.destroyItems();
                oAreaSel.addItem(new Item({ key: "", text: "(Seleccione \u00c1rea)" }));
                oSegmSel.addItem(new Item({ key: "", text: "(Seleccione Segmento)" }));
                var oL = aLineas.find(function (l) { return l.text === sLN; });
                if (oL) { (oL.areasFunc || []).forEach(function (a) { oAreaSel.addItem(new Item({ key: a.text, text: a.text })); }); }
            };
            var _refreshSegmentos = function (sLN, sArea) {
                oSegmSel.destroyItems();
                oSegmSel.addItem(new Item({ key: "", text: "(Seleccione Segmento)" }));
                var oL = aLineas.find(function (l) { return l.text === sLN; });
                if (oL) {
                    var oA = (oL.areasFunc || []).find(function (a) { return a.text === sArea; });
                    if (oA) {
                        (oA.segmentos || []).forEach(function (s) { oSegmSel.addItem(new Item({ key: s.text, text: s.text })); });
                        if (oA.segmentos && oA.segmentos[0] && oA.segmentos[0].responsable) {
                            oRespons.setValue(oA.segmentos[0].responsable);
                        }
                    }
                }
            };

            _refreshAreas(oReq.lineaNegocio || "");
            oLNSel.setSelectedKey(oReq.lineaNegocio || "");
            oAreaSel.setSelectedKey(oReq.areaFuncional || "");
            _refreshSegmentos(oReq.lineaNegocio || "", oReq.areaFuncional || "");
            oSegmSel.setSelectedKey(oReq.segmento || "");

            oLNSel.attachChange(function () { _refreshAreas(oLNSel.getSelectedKey()); });
            oAreaSel.attachChange(function () { _refreshSegmentos(oLNSel.getSelectedKey(), oAreaSel.getSelectedKey()); });

            var oDlg = new Dialog({
                title: "Editar Necesidad \u2013 " + oReq.reqId,
                contentWidth: "580px",
                resizable: true,
                content: [
                    new VBox({
                        items: [
                            new Label({ text: "T\u00edtulo",                      required: true }), oTitulo,
                            new Label({ text: "Tipo de Requerimiento" }),                           oTipoSel,
                            new Label({ text: "Cliente",                          required: true }), oClienteSel,
                            new Label({ text: "ID Oportunidad (Salesforce)" }),                     oOppId,
                            new HBox({ items: [
                                new VBox({ width: "50%", items: [ new Label({ text: "L\u00ednea de Negocio", required: true }), oLNSel ] }),
                                new VBox({ width: "50%", items: [ new Label({ text: "\u00c1rea Funcional" }), oAreaSel ] }).addStyleClass("sapUiSmallMarginBegin")
                            ] }),
                            new HBox({ items: [
                                new VBox({ width: "50%", items: [ new Label({ text: "Segmento" }), oSegmSel ] }),
                                new VBox({ width: "50%", items: [ new Label({ text: "Responsable" }), oRespons ] }).addStyleClass("sapUiSmallMarginBegin")
                            ] }),
                            new Label({ text: "Importe Estimado (USD)" }), oImporte,
                            new Label({ text: "Descripci\u00f3n T\u00e9cnica" }), oDescArea
                        ]
                    }).addStyleClass("mtnDlgContent")
                ],
                buttons: [
                    new Button({
                        text: "Guardar", type: "Emphasized",
                        press: function () {
                            if (!oTitulo.getValue().trim())      { MessageToast.show("El título es obligatorio"); return; }
                            if (!oClienteSel.getSelectedKey())   { MessageToast.show("Seleccione un cliente"); return; }
                            if (!oLNSel.getSelectedKey())        { MessageToast.show("Seleccione una Línea de Negocio"); return; }
                            var sPath = "/requerimientos/" + that._iIndex;
                            var sNow  = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                                      + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                            oModel.setProperty(sPath + "/titulo",             oTitulo.getValue().trim());
                            oModel.setProperty(sPath + "/tipoSolicitud",      oTipoSel.getSelectedKey());
                            oModel.setProperty(sPath + "/cliente",            oClienteSel.getSelectedKey());
                            oModel.setProperty(sPath + "/oportunidadId",      oOppId.getValue().trim());
                            oModel.setProperty(sPath + "/lineaNegocio",       oLNSel.getSelectedKey());
                            oModel.setProperty(sPath + "/areaFuncional",      oAreaSel.getSelectedKey());
                            oModel.setProperty(sPath + "/segmento",           oSegmSel.getSelectedKey());
                            oModel.setProperty(sPath + "/responsable",        oRespons.getValue().trim());
                            oModel.setProperty(sPath + "/importeEstimadoUSD", parseFloat(oImporte.getValue()) || 0);
                            oModel.setProperty(sPath + "/descripcionTecnica", oDescArea.getValue().trim());
                            oModel.setProperty(sPath + "/ultimaModificacion", sNow);
                            MessageToast.show("Necesidad actualizada");
                            oDlg.close();
                        }
                    }),
                    new Button({ text: "Cancelar", press: function () { oDlg.close(); } })
                ],
                afterClose: function () { oDlg.destroy(); }
            });
            oDlg.open();
        },

        // â”€â”€ Enviar a Aprobación â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onEnviarAprobacion: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var oReq = oCtx.getObject();
            var bMC  = oReq.mercado === "corporativo";
            var that = this;
            var nImp = oReq.importeEstimadoUSD || 0;
            var sMsg = bMC
                ? "\u00bfEnviar necesidad " + oReq.reqId + " a aprobaci\u00f3n?\n\nImporte: USD " +
                  nImp.toLocaleString("en-US") + "\n\u2192 " +
                  (nImp >= 100000 ? "5 niveles jer\u00e1rquicos (>= 100K USD)" : "2 niveles (< 100K USD)")
                : "\u00bfEnviar esta solicitud a aprobaci\u00f3n?";

            MessageBox.confirm(sMsg, {
                title: "Confirmar Env\u00edo",
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    var oModel    = that.getOwnerComponent().getModel();
                    var sBasePath = oCtx.getPath();
                    oModel.setProperty(sBasePath + "/estado", bMC ? "Pendiente Aprobaci\u00f3n" : "En Aprobaci\u00f3n");
                    that._crearEntradaAprobacion(oReq);
                    if (bMC) {
                        var aFlujo = nImp < 100000
                            ? [
                                { nivel: "NIVEL 1", rol: "Jefe \u00c1rea Usuaria",  iniciales: "J1", estado: "Pendiente", fecha: "", comentario: "" },
                                { nivel: "NIVEL 5", rol: "Analista Compras",         iniciales: "AC", estado: "Pendiente", fecha: "", comentario: "" }
                              ]
                            : [
                                { nivel: "NIVEL 1", rol: "Jefe \u00c1rea Usuaria",        iniciales: "J1", estado: "Pendiente", fecha: "", comentario: "" },
                                { nivel: "NIVEL 2", rol: "Gerencia \u00c1rea Usuaria",    iniciales: "G2", estado: "Pendiente", fecha: "", comentario: "" },
                                { nivel: "NIVEL 3", rol: "Sub Direcci\u00f3n \u00c1rea Usuaria", iniciales: "S3", estado: "Pendiente", fecha: "", comentario: "" },
                                { nivel: "NIVEL 4", rol: "Direcci\u00f3n \u00c1rea Usuaria",  iniciales: "D4", estado: "Pendiente", fecha: "", comentario: "" },
                                { nivel: "NIVEL 5", rol: "Analista Compras",                  iniciales: "AC", estado: "Pendiente", fecha: "", comentario: "" }
                              ];
                        oModel.setProperty(sBasePath + "/flujoAprobacion", aFlujo);
                        that._renderApprovalFlow(that._iIndex);
                        var oTabs = that.byId("detailTabs");
                        if (oTabs) { oTabs.setSelectedKey("mcFlujo"); }
                    } else {
                        // Handset / Local: flujo estándar de 4 niveles
                        var aFlujoHS = [
                            { nivel: "NIVEL 1", rol: "Jefe de Planificaci\u00f3n Comercial",  iniciales: "GV", nombre: "Gladys Vivar",    estado: "En Proceso", fecha: "", comentario: "" },
                            { nivel: "NIVEL 2", rol: "Gerente Planificaci\u00f3n Comercial",  iniciales: "JL", nombre: "Judith L\u00f3pez", estado: "Pendiente",  fecha: "", comentario: "" },
                            { nivel: "NIVEL 3", rol: "Compras",                               iniciales: "CP", nombre: "Compras",          estado: "Pendiente",  fecha: "", comentario: "" },
                            { nivel: "NIVEL 4", rol: "Director Mercado Masivo",               iniciales: "HG", nombre: "Hugo Gonzalez",    estado: "Pendiente",  fecha: "", comentario: "" }
                        ];
                        oModel.setProperty(sBasePath + "/flujoAprobacion", aFlujoHS);
                        that._renderApprovalFlow(that._iIndex);
                        var oTabsHS = that.byId("detailTabs");
                        if (oTabsHS) { oTabsHS.setSelectedKey("flujo"); }
                    }
                    MessageToast.show("Solicitud enviada a aprobaci\u00f3n");
                }
            });
        },

        // â”€â”€ MC Items CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onAddMCItem: function () {
            this._openMCItemDialog(null);
        },

        onEditMCItem: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            this._openMCItemDialog(oCtx);
        },

        onDeleteMCItem: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            var that = this;
            MessageBox.confirm("\u00bfEliminar este \u00edtem?", {
                title: "Confirmar eliminaci\u00f3n",
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    var oModel = that.getOwnerComponent().getModel();
                    var sPath  = "/requerimientos/" + that._iIndex + "/items";
                    var aItems = oModel.getProperty(sPath) || [];
                    var iIdx   = parseInt(oCtx.getPath().split("/").pop(), 10);
                    aItems.splice(iIdx, 1);
                    aItems.forEach(function (it, i) { it.no = i + 1; });
                    oModel.setProperty(sPath, aItems);
                    that._updateCalculatedFields(that._iIndex);
                    that._checkFactibilidadCompleta();
                    MessageToast.show("\u00cdtem eliminado");
                }
            });
        },

        _openMCItemDialog: function (oCtx) {
            var oModel = this.getOwnerComponent().getModel();
            var bNew   = !oCtx;
            var oData  = oCtx ? Object.assign({}, oCtx.getObject())
                              : { descripcion: "", cantidad: 1, unidad: "UND", precioUnitarioUSD: 0, proveedor: "" };
            var that   = this;

            var oDescInput  = new Input({ value: oData.descripcion,            width: "100%", required: true, placeholder: "Descripci\u00f3n del equipo o servicio" });
            var oCantInput  = new Input({ value: String(oData.cantidad || 1),  width: "100%", type: "Number" });
            var oPrecInput  = new Input({ value: String(oData.precioUnitarioUSD || 0), width: "100%", type: "Number", placeholder: "Precio en USD" });
            var oProvInput  = new Input({ value: oData.proveedor || "",        width: "100%", placeholder: "Nombre del proveedor" });
            var oTotalText  = new Text().addStyleClass("reqAmountBold sapUiSmallMarginTop");

            var oUnidSel = new Select({ width: "100%" });
            [["UND","UND â€“ Unidad"],["SERV","SERV â€“ Servicio"],["LIC","LIC â€“ Licencia"],
             ["PROY","PROY â€“ Proyecto"],["SESS","SESS â€“ Sesi\u00f3n"],["MES","MES â€“ Mes"]
            ].forEach(function (a) { oUnidSel.addItem(new Item({ key: a[0], text: a[1] })); });
            oUnidSel.setSelectedKey(oData.unidad || "UND");

            var _calcTotal = function () {
                var n = (parseFloat(oCantInput.getValue()) || 0) * (parseFloat(oPrecInput.getValue()) || 0);
                oTotalText.setText("Total: " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USD");
            };
            oCantInput.attachLiveChange(_calcTotal);
            oPrecInput.attachLiveChange(_calcTotal);
            _calcTotal();

            var oDlg = new Dialog({
                title: bNew ? "Agregar \u00cdtem" : "Editar \u00cdtem",
                contentWidth: "500px",
                content: [
                    new VBox({
                        items: [
                            new Label({ text: "Descripci\u00f3n", required: true }), oDescInput,
                            new HBox({ items: [
                                new VBox({ width: "50%", items: [ new Label({ text: "Cantidad" }), oCantInput ] }),
                                new VBox({ width: "50%", items: [ new Label({ text: "Unidad" }), oUnidSel ] }).addStyleClass("sapUiSmallMarginBegin")
                            ] }),
                            new Label({ text: "Precio Unitario (USD)" }), oPrecInput,
                            oTotalText,
                            new Label({ text: "Proveedor" }), oProvInput
                        ]
                    }).addStyleClass("mtnDlgContent")
                ],
                buttons: [
                    new Button({
                        text: bNew ? "Agregar" : "Guardar", type: "Emphasized",
                        press: function () {
                            if (!oDescInput.getValue().trim()) { MessageToast.show("La descripci\u00f3n es obligatoria"); return; }
                            var nCant   = parseFloat(oCantInput.getValue()) || 1;
                            var nPrecio = parseFloat(oPrecInput.getValue()) || 0;
                            var nTotal  = nCant * nPrecio;
                            var sPath   = "/requerimientos/" + that._iIndex + "/items";
                            var aItems  = oModel.getProperty(sPath) || [];
                            if (bNew) {
                                aItems.push({ no: aItems.length + 1, descripcion: oDescInput.getValue().trim(),
                                    cantidad: nCant, unidad: oUnidSel.getSelectedKey(),
                                    precioUnitarioUSD: nPrecio, totalUSD: nTotal,
                                    proveedor: oProvInput.getValue().trim() });
                            } else {
                                var iIdx = parseInt(oCtx.getPath().split("/").pop(), 10);
                                Object.assign(aItems[iIdx], { descripcion: oDescInput.getValue().trim(),
                                    cantidad: nCant, unidad: oUnidSel.getSelectedKey(),
                                    precioUnitarioUSD: nPrecio, totalUSD: nTotal,
                                    proveedor: oProvInput.getValue().trim() });
                            }
                            oModel.setProperty(sPath, aItems);
                            that._updateCalculatedFields(that._iIndex);
                            that._checkFactibilidadCompleta();
                            MessageToast.show(bNew ? "\u00cdtem agregado" : "\u00cdtem actualizado");
                            oDlg.close();
                        }
                    }),
                    new Button({ text: "Cancelar", press: function () { oDlg.close(); } })
                ],
                afterClose: function () { oDlg.destroy(); }
            });
            oDlg.open();
        },

        // â”€â”€ Evaluación Financiera â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onEditarEvalFin: function () {
            var oModel  = this.getOwnerComponent().getModel();
            var sBase   = "/requerimientos/" + this._iIndex;
            var oEF     = oModel.getProperty(sBase + "/evaluacionFinanciera") || {};
            var nTotalUSD = (oModel.getProperty(sBase + "/items") || []).reduce(function (s, i) { return s + (i.totalUSD || 0); }, 0);
            var that    = this;

            var oCostInput = new Input({ value: String(oEF.costos   || 0), type: "Number", width: "100%" });
            var oIngInput  = new Input({ value: String(oEF.ingresos || 0), type: "Number", width: "100%" });
            var oMargText  = new Text({ text: (oEF.margen || 0).toFixed(2) + "%" }).addStyleClass("reqEvalValueMargen");
            var oROIText   = new Text({ text: (oEF.roi   || 0).toFixed(2) + "%" }).addStyleClass("reqEvalValueROI");

            var _recalc = function () {
                var nC = parseFloat(oCostInput.getValue()) || 0;
                var nI = parseFloat(oIngInput.getValue())  || 0;
                var nM = nI > 0 ? (nI - nC) / nI * 100 : 0;
                var nR = nC > 0 ? (nI - nC) / nC * 100 : 0;
                oMargText.setText(nM.toFixed(2) + "%");
                oROIText.setText(nR.toFixed(2) + "%");
                oMargText.removeStyleClass("reqEvalValueNeg reqEvalValueMargen");
                oMargText.addStyleClass(nM < 25 ? "reqEvalValueNeg" : "reqEvalValueMargen");
            };
            oCostInput.attachLiveChange(_recalc);
            oIngInput.attachLiveChange(_recalc);

            var oDlg = new Dialog({
                title: "Evaluaci\u00f3n Financiera",
                contentWidth: "460px",
                content: [
                    new VBox({
                        items: [
                            new Text({ text: "Total \u00cctems/Servicios: USD " + nTotalUSD.toLocaleString("en-US", { minimumFractionDigits: 2 }) })
                                .addStyleClass("reqAmountBold sapUiSmallMarginBottom"),
                            new Label({ text: "Costos Estimados (USD)", required: true }), oCostInput,
                            new Label({ text: "Ingresos Proyectados (USD)", required: true }), oIngInput,
                            new HBox({ items: [
                                new VBox({ width: "50%", items: [ new Label({ text: "Margen calculado" }), oMargText ] }),
                                new VBox({ width: "50%", items: [ new Label({ text: "ROI calculado" }), oROIText ] }).addStyleClass("sapUiSmallMarginBegin")
                            ] })
                        ]
                    }).addStyleClass("mtnDlgContent")
                ],
                buttons: [
                    new Button({
                        text: "Guardar", type: "Emphasized",
                        press: function () {
                            var nC = parseFloat(oCostInput.getValue()) || 0;
                            var nI = parseFloat(oIngInput.getValue()) || 0;
                            var nM = nI > 0 ? parseFloat(((nI - nC) / nI * 100).toFixed(2)) : 0;
                            var nR = nC > 0 ? parseFloat(((nI - nC) / nC * 100).toFixed(2)) : 0;
                            oModel.setProperty(sBase + "/evaluacionFinanciera",
                                { costos: nC, ingresos: nI, margen: nM, roi: nR });
                            that._updateCalculatedFields(that._iIndex);
                            MessageToast.show("Evaluaci\u00f3n financiera guardada");
                            oDlg.close();
                        }
                    }),
                    new Button({ text: "Cancelar", press: function () { oDlg.close(); } })
                ],
                afterClose: function () { oDlg.destroy(); }
            });
            oDlg.open();
        },

        // â”€â”€ Enviar Propuesta al Cliente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onEnviarPresentacionCliente: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var oReq = oCtx.getObject();
            var that = this;
            var oContactoInput = new Input({ width: "100%", required: true,
                placeholder: "Nombre y cargo del contacto en " + (oReq.cliente || "el cliente") });
            var oMedioSel = new Select({ width: "100%" });
            [["Email","Email"],["Reuni\u00f3n","Reuni\u00f3n presencial"],["Videoconferencia","Videoconferencia"],["Llamada","Llamada telef\u00f3nica"]].forEach(function (a) {
                oMedioSel.addItem(new Item({ key: a[0], text: a[1] }));
            });
            var oNotasArea = new TextArea({ width: "100%", rows: 3, placeholder: "Notas sobre el env\u00edo de la presentaci\u00f3n..." });
            var oDlg = new Dialog({
                title: "Enviar Propuesta al Cliente \u2013 " + oReq.reqId,
                contentWidth: "480px",
                content: [ new VBox({ items: [
                    new Label({ text: "Contacto del Cliente", required: true }), oContactoInput,
                    new Label({ text: "Medio de Env\u00edo" }),                   oMedioSel,
                    new Label({ text: "Notas adicionales" }),                     oNotasArea
                ]}).addStyleClass("mtnDlgContent") ],
                buttons: [
                    new Button({
                        text: "Confirmar Env\u00edo", type: "Emphasized",
                        press: function () {
                            if (!oContactoInput.getValue().trim()) { MessageToast.show("Ingrese el contacto del cliente"); return; }
                            var sNow = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                            var oModel = that.getOwnerComponent().getModel();
                            var sBase  = "/requerimientos/" + that._iIndex;
                            oModel.setProperty(sBase + "/estado", "Presentado al Cliente");
                            oModel.setProperty(sBase + "/ultimaModificacion", sNow);
                            var aFB = oModel.getProperty(sBase + "/historialFeedback") || [];
                            aFB.push({ fecha: sNow, contacto: oContactoInput.getValue().trim(),
                                tipo: oMedioSel.getSelectedKey(), respuesta: "Pendiente",
                                comentario: oNotasArea.getValue().trim() || "Propuesta enviada al cliente para revisi\u00f3n" });
                            oModel.setProperty(sBase + "/historialFeedback", aFB);
                            oDlg.close();
                            MessageToast.show("Propuesta enviada. Estado: Presentado al Cliente");
                            var oTabs = that.byId("detailTabs");
                            if (oTabs) { oTabs.setSelectedKey("mcFeedback"); }
                        }
                    }),
                    new Button({ text: "Cancelar", press: function () { oDlg.close(); } })
                ],
                afterClose: function () { oDlg.destroy(); }
            });
            oDlg.open();
        },

        // â”€â”€ Registrar Feedback del Cliente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onRegistrarFeedback: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var oReq = oCtx.getObject();
            var that = this;
            var oContactoInput = new Input({ width: "100%", required: true,
                placeholder: "Nombre y cargo del contacto en " + (oReq.cliente || "el cliente") });
            var oTipoSel = new Select({ width: "100%" });
            [["Reuni\u00f3n","Reuni\u00f3n de presentaci\u00f3n"],["Email","Email"],["Videoconferencia","Videoconferencia"],["Llamada","Llamada telef\u00f3nica"]].forEach(function (a) {
                oTipoSel.addItem(new Item({ key: a[0], text: a[1] }));
            });
            var oRespSel = new Select({ width: "100%" });
            [["Positivo","Positivo \u2013 Acepta la propuesta"],["Negativo","Negativo \u2013 Rechaza la propuesta"],["Pendiente","Pendiente \u2013 Solicita ajustes / informaci\u00f3n adicional"]].forEach(function (a) {
                oRespSel.addItem(new Item({ key: a[0], text: a[1] }));
            });
            var oComentArea = new TextArea({ width: "100%", rows: 4,
                placeholder: "Detalle el feedback del cliente, observaciones, pr\u00f3ximos pasos..." });
            var oDlg = new Dialog({
                title: "Registrar Feedback del Cliente \u2013 " + oReq.reqId,
                contentWidth: "520px",
                content: [ new VBox({ items: [
                    new Label({ text: "Contacto del Cliente", required: true }), oContactoInput,
                    new Label({ text: "Tipo de Interacci\u00f3n" }),              oTipoSel,
                    new Label({ text: "Respuesta del Cliente", required: true }), oRespSel,
                    new Label({ text: "Comentario / Observaciones" }),           oComentArea
                ]}).addStyleClass("mtnDlgContent") ],
                buttons: [
                    new Button({
                        text: "Registrar", type: "Emphasized",
                        press: function () {
                            if (!oContactoInput.getValue().trim()) { MessageToast.show("Ingrese el contacto del cliente"); return; }
                            var sNow = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                            var oModel   = that.getOwnerComponent().getModel();
                            var sBase    = "/requerimientos/" + that._iIndex;
                            var sResp    = oRespSel.getSelectedKey();
                            var sEstado  = sResp === "Positivo" ? "Confirmado"
                                         : sResp === "Negativo" ? "Rechazado por Cliente"
                                         : "Feedback Recibido";
                            oModel.setProperty(sBase + "/estado", sEstado);
                            oModel.setProperty(sBase + "/ultimaModificacion", sNow);
                            var aFB = oModel.getProperty(sBase + "/historialFeedback") || [];
                            aFB.push({ fecha: sNow, contacto: oContactoInput.getValue().trim(),
                                tipo: oTipoSel.getSelectedKey(), respuesta: sResp,
                                comentario: oComentArea.getValue().trim() });
                            oModel.setProperty(sBase + "/historialFeedback", aFB);
                            oDlg.close();
                            MessageToast.show("Feedback registrado. Estado: " + sEstado);
                            if (sResp === "Negativo") {
                                setTimeout(function () {
                                    MessageBox.warning(
                                        "El cliente rechaz\u00f3 la propuesta.\n\nPr\u00f3ximo paso recomendado: Revisar la propuesta con Document AI (SAP BTP) para recuperar aprobaci\u00f3n o documentar el rechazo definitivo.",
                                        { title: "Propuesta Rechazada por Cliente",
                                          actions: ["Revisar con Document AI", MessageBox.Action.CLOSE],
                                          onClose: function (s) {
                                              if (s === "Revisar con Document AI") {
                                                  MessageToast.show("Iniciando revisi\u00f3n con Document AI en SAP BTP...");
                                              }
                                          }
                                        }
                                    );
                                }, 400);
                            } else if (sResp === "Positivo") {
                                setTimeout(function () {
                                    MessageBox.success(
                                        "\u00a1Propuesta confirmada por el cliente!\n\nPr\u00f3ximo paso: Separar temporalmente el stock en SAP MM (Transacci\u00f3n MB21).",
                                        { title: "Propuesta Confirmada",
                                          actions: ["Separar Stock Ahora", MessageBox.Action.CLOSE],
                                          onClose: function (s) {
                                              if (s === "Separar Stock Ahora") { that.onSepararStock(); }
                                          }
                                        }
                                    );
                                }, 400);
                            }
                        }
                    }),
                    new Button({ text: "Cancelar", press: function () { oDlg.close(); } })
                ],
                afterClose: function () { oDlg.destroy(); }
            });
            oDlg.open();
        },

        // â”€â”€ Separar Stock en MM (MB21) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onSepararStock: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var oReq   = oCtx.getObject();
            var aItems = oReq.items || [];
            var that   = this;
            if (!aItems.length) { MessageToast.show("No hay \u00edtems para separar stock"); return; }
            var sDetalle = aItems.map(function (it) {
                return "\u2022 " + it.descripcion + " (" + it.cantidad + " " + it.unidad + ")";
            }).join("\n");
            MessageBox.confirm(
                "\u00bfSeparar temporalmente el stock en SAP MM?\n\n" + sDetalle,
                { title: "Separar Stock en MM \u2013 MB21",
                  actions: ["Confirmar Reserva", MessageBox.Action.CANCEL],
                  onClose: function (s) {
                      if (s !== "Confirmar Reserva") { return; }
                      var sNow   = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                      var oModel = that.getOwnerComponent().getModel();
                      var sBase  = "/requerimientos/" + that._iIndex;
                      var sDoc   = "4" + Math.floor(Math.random() * 9000000 + 1000000);
                      oModel.setProperty(sBase + "/estado", "Stock Reservado");
                      oModel.setProperty(sBase + "/ultimaModificacion", sNow);
                      oModel.setProperty(sBase + "/documentoReservaMM", sDoc);
                      MessageBox.success(
                          "Stock reservado en SAP MM correctamente.\n\nDoc. Reserva (MB21): " + sDoc + "\n\nPr\u00f3ximo paso: Crear Ariba / Solped.",
                          { title: "Stock Separado \u2013 ERP MB21" }
                      );
                  }
                }
            );
        },

        onDescargarCarta:     function () { MessageToast.show("Descargando Carta de Aceptaci\u00f3n (PDF)..."); },
        onDescargarExcel:     function () { this.onExportarExcel(); },

        // ── MC: Adjuntar documento requerido ──────────────────────────────
        onMCAdjuntar: function (oEvent) {
            var sDocType = oEvent.getSource().data("docType");
            var that     = this;
            var oInput   = document.createElement("input");
            oInput.type  = "file";
            oInput.accept = ".pdf";
            oInput.style.display = "none";
            document.body.appendChild(oInput);
            oInput.onchange = function (oEvt) {
                var oFile = oEvt.target.files && oEvt.target.files[0];
                if (oFile) {
                    var oModel = that.getOwnerComponent().getModel();
                    oModel.setProperty(
                        "/requerimientos/" + that._iIndex + "/adjuntosMC/" + sDocType + "/nombre",
                        oFile.name
                    );
                    MessageToast.show("Archivo adjuntado: " + oFile.name);
                }
                document.body.removeChild(oInput);
            };
            oInput.click();
        },

        // ── MC: Descargar template Excel de planificación ─────────────────
        onMCDescargarTemplate: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { MessageToast.show("Sin datos"); return; }

            var fmt = function (n) { return n ? Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : ""; };
            var sDate = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });

            var aItems = (oReq.items || []).filter(function (i) { return i.materialServicio || i.descripcion; });
            if (!aItems.length) {
                aItems = [
                    { no: 1, materialServicio: "MAT-00001", descripcion: "Servidor HPE ProLiant DL380 Gen10 Plus",          cantidad: 5  },
                    { no: 2, materialServicio: "MAT-00002", descripcion: "Switch Cisco Catalyst 9300 48P PoE+",             cantidad: 10 },
                    { no: 3, materialServicio: "MAT-00003", descripcion: "Almacenamiento NetApp AFF A250 (24 x 3.8TB SSD)", cantidad: 2  }
                ];
            }

            var sBlue  = "background:#2E74B5;font-weight:bold;font-family:Arial;font-size:9pt;text-align:center;border:1px solid #1F5C8E;color:#FFFFFF;";
            var sNorm  = "font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;";
            var sRight = "font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;text-align:right;";
            var sBold  = "font-weight:bold;font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;";

            var sItemRows = "";
            aItems.forEach(function (item) {
                sItemRows +=
                    "<tr>" +
                    "<td style='" + sRight + "'>" + (item.no || "") + "</td>" +
                    "<td style='" + sNorm  + "'>" + (item.materialServicio || "") + "</td>" +
                    "<td style='" + sNorm  + "'>" + (item.descripcion || "") + "</td>" +
                    "<td style='" + sRight + "'>" + (item.cantidad || 0) + "</td>" +
                    "</tr>";
            });
            var nTotCant = aItems.reduce(function (s, i) { return s + (i.cantidad || 0); }, 0);

            var sHtml =
                "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel'>" +
                "<head><meta charset='UTF-8'></head><body>" +
                "<table style='font-family:Arial;font-size:9pt;border-collapse:collapse;'>" +
                "<tr><td colspan='4' style='font-weight:bold;font-family:Arial;font-size:12pt;'>TEMPLATE DE NECESIDAD \u2013 MERCADO CORPORATIVO</td></tr>" +
                "<tr><td style='font-family:Arial;font-size:9pt;'>T\u00edtulo:</td><td colspan='3' style='font-weight:bold;font-family:Arial;font-size:9pt;'>" + (oReq.titulo || "") + "</td></tr>" +
                "<tr><td style='font-family:Arial;font-size:9pt;'>Canal:</td><td style='font-weight:bold;font-family:Arial;font-size:9pt;'>" + (oReq.canal || "") + "</td>" +
                "<td style='font-family:Arial;font-size:9pt;'>L\u00ednea de Negocio:</td><td style='font-weight:bold;font-family:Arial;font-size:9pt;'>" + (oReq.lineaNegocio || "") + "</td></tr>" +
                "<tr><td colspan='4' style='font-family:Arial;font-size:9pt;color:#888;'>" + sDate + "</td></tr>" +
                "<tr><td colspan='4'></td></tr>" +
                "<tr>" +
                "<th style='" + sBlue + "'>No.</th>" +
                "<th style='" + sBlue + "'>Material / Servicio</th>" +
                "<th style='" + sBlue + "'>Descripci\u00f3n</th>" +
                "<th style='" + sBlue + "'>Cantidad</th>" +
                "</tr>" +
                sItemRows +
                "<tr><td colspan='2' style='" + sBold + "'>Total</td>" +
                "<td></td>" +
                "<td style='font-weight:bold;font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;text-align:right;'>" + nTotCant + "</td>" +
                "</tr>" +
                "</table></body></html>";

            var oBlob = new Blob(["\ufeff" + sHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
            var sUrl  = URL.createObjectURL(oBlob);
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = (oReq.reqId || "requerimiento") + "_template_necesidad.xls";
            document.body.appendChild(oLink);
            oLink.click();
            document.body.removeChild(oLink);
            URL.revokeObjectURL(sUrl);
        },

        // ── MC: Cargar template Excel de planificación ────────────────────
        onMCCargarTemplate: function () {
            var that   = this;
            var oInput = document.createElement("input");
            oInput.type   = "file";
            oInput.accept = ".xls,.xlsx";
            oInput.style.display = "none";
            document.body.appendChild(oInput);

            oInput.onchange = function (oEvt) {
                var oFile = oEvt.target.files && oEvt.target.files[0];
                if (!oFile) { document.body.removeChild(oInput); return; }
                var oReader = new FileReader();
                oReader.onload = function (e) {
                    try {
                        var oWB   = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
                        var oWS   = oWB.Sheets[oWB.SheetNames[0]];
                        var aRows = XLSX.utils.sheet_to_json(oWS, { header: 1, defval: "" });

                        var iHeaderRow = -1;
                        var mCols = {};
                        for (var r = 0; r < aRows.length; r++) {
                            var sRow = aRows[r].join("|");
                            if (sRow.indexOf("Material") !== -1 || sRow.indexOf("Descripci") !== -1) {
                                iHeaderRow = r;
                                aRows[r].forEach(function (h, c) { var s = String(h).trim(); if (s) { mCols[s] = c; } });
                                break;
                            }
                        }
                        if (iHeaderRow === -1) {
                            MessageToast.show("No se encontr\u00f3 la fila de encabezados en el archivo");
                            document.body.removeChild(oInput); return;
                        }

                        var parseNum = function (v) {
                            if (!v && v !== 0) { return 0; }
                            if (typeof v === "number") { return v; }
                            var n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
                            return isNaN(n) ? 0 : n;
                        };

                        var aItems = [];
                        var iNo = 1;
                        for (var i = iHeaderRow + 1; i < aRows.length; i++) {
                            var row   = aRows[i];
                            var sCell = String(row[0] || row[1] || "").trim();
                            if (!sCell || sCell.toLowerCase() === "total") { break; }

                            var colMat   = mCols["Material / Servicio"] !== undefined ? mCols["Material / Servicio"] : 1;
                            var colDesc  = mCols["Descripci\u00f3n"]    !== undefined ? mCols["Descripci\u00f3n"]    :
                                           mCols["Descripcion"]         !== undefined ? mCols["Descripcion"]         : 2;
                            var colCant  = mCols["Cantidad"]            !== undefined ? mCols["Cantidad"]            : 3;

                            aItems.push({
                                no: iNo++,
                                materialServicio: String(row[colMat]  || "").trim(),
                                descripcion:      String(row[colDesc] || "").trim(),
                                cantidad:         parseNum(row[colCant]),
                                stockCDVES:       Math.floor(Math.random() * 401) + 50,
                                stockDistribuido: Math.floor(Math.random() * 251) + 30
                            });
                        }

                        if (!aItems.length) {
                            MessageToast.show("No se encontraron \u00edtems en el archivo");
                            document.body.removeChild(oInput); return;
                        }

                        var oModel = that.getOwnerComponent().getModel();
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/items", aItems);
                        that._updateCalculatedFields(that._iIndex);
                        MessageToast.show(aItems.length + " \u00edtem(s) cargado(s) correctamente");
                    } catch (err) {
                        MessageToast.show("Error al procesar el archivo: " + err.message);
                    }
                    document.body.removeChild(oInput);
                };
                oReader.onerror = function () { MessageToast.show("Error al leer el archivo"); document.body.removeChild(oInput); };
                oReader.readAsArrayBuffer(oFile);
            };
            oInput.click();
        },

        onCargarExcel: function () {
            var that   = this;
            var oInput = document.createElement("input");
            oInput.type    = "file";
            oInput.accept  = ".xls,.xlsx";
            oInput.style.display = "none";
            document.body.appendChild(oInput);

            oInput.onchange = function (oEvt) {
                var oFile = oEvt.target.files && oEvt.target.files[0];
                if (!oFile) { document.body.removeChild(oInput); return; }

                var oReader = new FileReader();
                oReader.onload = function (e) {
                    try {
                        /* ── Parse workbook ─────────────────────────────── */
                        var oWB   = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
                        var oWS   = oWB.Sheets[oWB.SheetNames[0]];
                        var aRows = XLSX.utils.sheet_to_json(oWS, { header: 1, defval: "" });

                        /* ── Locate header row (contains "Modelo") ───────── */
                        var iHeaderRow = -1;
                        var mCols      = {};
                        for (var r = 0; r < aRows.length; r++) {
                            var idx = aRows[r].indexOf("Modelo");
                            if (idx !== -1) {
                                iHeaderRow = r;
                                aRows[r].forEach(function (h, c) {
                                    var s = String(h).trim();
                                    if (s) { mCols[s] = c; }
                                });
                                break;
                            }
                        }
                        if (iHeaderRow === -1) {
                            MessageToast.show("No se encontró la fila de encabezados ('Modelo') en el archivo");
                            document.body.removeChild(oInput); return;
                        }

                        /* ── Number parser (handles "$ 1,299.00", "-", etc.) */
                        var parseNum = function (v) {
                            if (v === null || v === undefined || v === "" || String(v).trim() === "-") { return 0; }
                            if (typeof v === "number") { return v; }
                            var n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
                            return isNaN(n) ? 0 : n;
                        };

                        /* ── Read data rows until "Total" / blank / aportes ─ */
                        var aItems = [];
                        var iNo    = 1;
                        for (var i = iHeaderRow + 1; i < aRows.length; i++) {
                            var row   = aRows[i];
                            var sCell = String(row[0] || "").trim();
                            if (!sCell || sCell === "Total" || sCell === "APORTES US$" || sCell.indexOf("COMPRA") === 0) { break; }

                            var nCantidad   = parseNum(row[mCols["Cantidad"]]);
                            var nPrecioFact = parseNum(row[mCols["Precio Facturación US$"]]);
                            var nVirUnit    = parseNum(row[mCols["VIR Unitario US$"]]);
                            var nTotFact    = nCantidad * nPrecioFact;
                            var nTotVir     = nCantidad * nVirUnit;
                            var nTotNeto    = nTotFact - nTotVir;

                        /* ── Stock lookup by modelo ─────────────────────── */
                        var mStock = {
                            "Galaxy S26 Ultra":         { stockCDVES: 320, stockDistribuido: 180 },
                            "Galaxy S26+":              { stockCDVES: 210, stockDistribuido: 140 },
                            "Galaxy S26":               { stockCDVES: 155, stockDistribuido:  95 },
                            "iPhone 17 Pro Max":        { stockCDVES: 280, stockDistribuido: 160 },
                            "iPhone 17 Pro":            { stockCDVES: 190, stockDistribuido: 120 },
                            "iPhone 17":                { stockCDVES: 130, stockDistribuido:  85 },
                            "iPhone 17 Plus":           { stockCDVES: 100, stockDistribuido:  70 },
                            "Motorola Edge 50 Pro":     { stockCDVES: 175, stockDistribuido: 110 },
                            "Motorola Edge 50":         { stockCDVES: 120, stockDistribuido:  75 },
                            "Motorola Edge 50 Fusion":  { stockCDVES:  90, stockDistribuido:  55 },
                            "Xiaomi Redmi Note 15 Pro": { stockCDVES: 145, stockDistribuido:  90 },
                            "Xiaomi Redmi Note 15":     { stockCDVES: 100, stockDistribuido:  65 }
                        };

                        aItems.push({
                            no:               iNo++,
                            modelo:           String(row[mCols["Modelo"]]           || "").trim(),
                            codigo:           String(row[mCols["Código"]]           || "").trim(),
                            codigoMaterial:   String(row[mCols["Código Material"]]  || "").trim(),
                            color:            String(row[mCols["Color"]]            || "").trim(),
                            cantidad:         nCantidad,
                            precioFacturacion:nPrecioFact,
                            virUnitario:      nVirUnit,
                            totalFacturacion: nTotFact,
                            totalVir:         nTotVir,
                            totalNeto:        nTotNeto,
                            stockCDVES:       (mStock[String(row[mCols["Modelo"]] || "").trim()] || {}).stockCDVES       || Math.floor(Math.random() * 200 + 50),
                            stockDistribuido: (mStock[String(row[mCols["Modelo"]] || "").trim()] || {}).stockDistribuido || Math.floor(Math.random() * 150 + 30)
                        });
                        }

                        if (!aItems.length) {
                            MessageToast.show("No se encontraron ítems en el archivo");
                            document.body.removeChild(oInput); return;
                        }

                        var oModel = that.getOwnerComponent().getModel();
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/items", aItems);
                        that._updateCalculatedFields(that._iIndex);
                        MessageToast.show(aItems.length + " ítem(s) cargado(s) correctamente");
                    } catch (err) {
                        MessageToast.show("Error al procesar el archivo: " + err.message);
                    }
                    document.body.removeChild(oInput);
                };
                oReader.onerror = function () {
                    MessageToast.show("Error al leer el archivo");
                    document.body.removeChild(oInput);
                };
                oReader.readAsArrayBuffer(oFile);
            };

            oInput.click();
        },
        onDescargarNecesidad: function () {
            var oModel   = this.getOwnerComponent().getModel();
            var oReq     = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { return; }

            if (!window.jspdf || !window.jspdf.jsPDF) {
                MessageToast.show("La librer\xeda PDF no est\xe1 disponible a\xfan, intente de nuevo en un momento.");
                return;
            }

            var bDerivado = (oReq.tipoSolicitud || "").indexOf("Derivado") !== -1;
            var sMarca    = oReq.marca   || "";
            var sPeriodo  = oReq.periodo || "";
            var sFecha    = oReq.fechaCreacion ? oReq.fechaCreacion.split(" ")[0] : new Date().toLocaleDateString("es-PE");
            var aItems    = oReq.items          || [];
            var oContrib  = oReq.contributions  || {};
            var aVIR      = oReq.aportesVIR     || [];
            var aFlujo    = oReq.flujoAprobacion || [];

            var fmt = function (n) {
                if (!n) { return "-"; }
                return "$ " + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };

            var doc    = new window.jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
            var nPageW = doc.internal.pageSize.getWidth();
            var nTotFact = 0, nTotVIR = 0, nTotNeto = 0, nTotCant = 0;
            var aBodyRows, nStartY;

            if (bDerivado) {
                // ── Título centrado ──────────────────────────────────────────────
                doc.setFont("helvetica", "bold");
                doc.setFontSize(12);
                doc.text("CONFORMIDAD DE COMPRA", nPageW / 2, 12, { align: "center" });

                // ── Marca / Periodo (esquina superior izquierda) ─────────────────
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.text("Marca",   14, 20);
                doc.text("Periodo", 14, 25);
                doc.setFont("helvetica", "bold");
                doc.text(sMarca.toUpperCase(), 35, 20);
                doc.text(sPeriodo.replace(/^.*\s/, ""), 35, 25);   // solo "Q1", "Q2", etc.

                // ── Filas de la tabla derivado ───────────────────────────────────
                aBodyRows = aItems.map(function (it, iIdx) {
                    nTotFact += (it.totalFacturacion || 0);
                    nTotVIR  += (it.totalVir         || 0);
                    nTotNeto += (it.totalNeto         || 0);
                    nTotCant += (it.cantidad          || 0);
                    var precioNeto = (it.precioFacturacion || 0) - (it.virUnitario || 0);
                    // Familia: inventada como "MARCA CODIGOMATERIAL 128GB"
                    var sFamilia = sMarca.toUpperCase() + " " + (it.codigoMaterial || (it.modelo || "")).toUpperCase() + " 128GB";
                    return [
                        it.modelo         || "",
                        sFamilia,
                        it.codigo         || "",
                        it.codigoMaterial || "",
                        it.color          || "",
                        it.cantidad       || 0,
                        fmt(it.precioFacturacion),
                        fmt(it.virUnitario),
                        fmt(precioNeto),
                        fmt(it.totalFacturacion),
                        fmt(it.totalVir),
                        fmt(it.totalNeto),
                        { content: it.pedidoAbierto || "-",      styles: { fillColor: [255, 255, 153], halign: "center" } },
                        { content: String((iIdx + 1) * 10),      styles: { fillColor: [255, 255, 153], halign: "right"  } }
                    ];
                });
                // Fila total
                aBodyRows.push([
                    { content: "Total", colSpan: 5, styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
                    { content: nTotCant, styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
                    { content: "", styles: { fillColor: [240, 240, 240] } },
                    { content: "", styles: { fillColor: [240, 240, 240] } },
                    { content: "", styles: { fillColor: [240, 240, 240] } },
                    { content: fmt(nTotFact), styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
                    { content: fmt(nTotVIR),  styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
                    { content: fmt(nTotNeto), styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
                    { content: "", styles: { fillColor: [240, 240, 240] } },
                    { content: "", styles: { fillColor: [240, 240, 240] } }
                ]);

                nStartY = 30;
                doc.autoTable({
                    startY: nStartY,
                    head: [["Modelo", "Familia", "C\xf3digo", "C\xf3digo\nMaterial", "Color\n(Atributo 1)",
                            "Cantidad", "Precio\nFacturaci\xf3n\nUS$", "VIR\nUnitario\nUS$", "Precio\nNeto\nUS$",
                            "Total\nFacturaci\xf3n\nUS$", "Total\nVIR\nUS$", "Total\nNeto\nUS$", "PA", "Posici\xf3n"]],
                    body: aBodyRows,
                    theme: "grid",
                    styles:    { fontSize: 6.5, cellPadding: 1.5, halign: "center", valign: "middle" },
                    headStyles: { fillColor: [0, 176, 240], textColor: [0, 0, 0], fontStyle: "bold" },
                    didParseCell: function (data) {
                        // Columnas PA (12) y Posición (13) con cabecera amarilla
                        if (data.section === "head" && (data.column.index === 12 || data.column.index === 13)) {
                            data.cell.styles.fillColor = [255, 215, 0];
                        }
                    },
                    columnStyles: {
                        0:  { halign: "left",   cellWidth: 24 },
                        1:  { halign: "left",   cellWidth: 30 },
                        2:  { halign: "center", cellWidth: 22 },
                        3:  { halign: "center", cellWidth: 18 },
                        4:  { halign: "left",   cellWidth: 20 },
                        5:  { halign: "right",  cellWidth: 13 },
                        6:  { halign: "right",  cellWidth: 20 },
                        7:  { halign: "right",  cellWidth: 18 },
                        8:  { halign: "right",  cellWidth: 18 },
                        9:  { halign: "right",  cellWidth: 22 },
                        10: { halign: "right",  cellWidth: 17 },
                        11: { halign: "right",  cellWidth: 17 },
                        12: { halign: "center", cellWidth: 20 },
                        13: { halign: "right",  cellWidth: 14 }
                    }
                });

            } else {
                // ── COMPRA NORMAL ────────────────────────────────────────────────
                doc.setFont("helvetica", "bold");
                doc.setFontSize(13);
                doc.text("COMPRA " + sMarca.toUpperCase(), 14, 15);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.text("Compra " + sPeriodo, 14, 22);
                doc.text(sFecha, 14, 28);

                aBodyRows = aItems.map(function (it) {
                    nTotFact += (it.totalFacturacion || 0);
                    nTotVIR  += (it.totalVir         || 0);
                    nTotNeto += (it.totalNeto         || 0);
                    nTotCant += (it.cantidad          || 0);
                    var precioNeto = (it.precioFacturacion || 0) - (it.virUnitario || 0);
                    return [
                        it.modelo || "", it.codigo || "", it.codigoMaterial || "", it.color || "",
                        it.cantidad || 0,
                        fmt(it.precioFacturacion), fmt(it.virUnitario), fmt(precioNeto),
                        fmt(it.totalFacturacion), fmt(it.totalVir), fmt(it.totalNeto)
                    ];
                });
                aBodyRows.push([
                    { content: "Total", colSpan: 4, styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
                    { content: nTotCant, styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
                    { content: "", styles: { fillColor: [240, 240, 240] } },
                    { content: "", styles: { fillColor: [240, 240, 240] } },
                    { content: "", styles: { fillColor: [240, 240, 240] } },
                    { content: fmt(nTotFact), styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
                    { content: fmt(nTotVIR),  styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
                    { content: fmt(nTotNeto), styles: { fontStyle: "bold", fillColor: [240, 240, 240] } }
                ]);

                nStartY = 33;
                doc.autoTable({
                    startY: nStartY,
                    head: [["Modelo", "C\xf3digo", "C\xf3digo\nMaterial", "Color",
                            "Cantidad", "Precio\nFacturaci\xf3n US$", "VIR\nUnitario US$", "Precio\nNeto US$",
                            "Total\nFacturaci\xf3n US$", "Total\nVIR US$", "Total\nNeto US$"]],
                    body: aBodyRows,
                    theme: "grid",
                    styles:     { fontSize: 7.5, cellPadding: 2, halign: "center", valign: "middle" },
                    headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0], fontStyle: "bold", halign: "center" },
                    columnStyles: {
                        0: { halign: "left",  cellWidth: 32 }, 1: { halign: "left",   cellWidth: 26 },
                        2: { halign: "center",cellWidth: 22 }, 3: { halign: "left",   cellWidth: 24 },
                        4: { halign: "right", cellWidth: 16 }, 5: { halign: "right",  cellWidth: 24 },
                        6: { halign: "right", cellWidth: 22 }, 7: { halign: "right",  cellWidth: 22 },
                        8: { halign: "right", cellWidth: 26 }, 9: { halign: "right",  cellWidth: 22 },
                        10:{ halign: "right", cellWidth: 24 }
                    }
                });
            }

            var nY = doc.lastAutoTable.finalY + 8;

            // ── Aportes US$ ──────────────────────────────────────────────────────
            var nTotalVIR = aVIR.reduce(function (acc, v) { return acc + (v.monto || 0); }, 0);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text("APORTES US$", 14, nY);
            nY += 5;
            doc.autoTable({
                startY: nY,
                body: [["VIR", fmt(nTotalVIR)]],
                theme: "plain",
                styles: { fontSize: 8, cellPadding: 1 },
                columnStyles: { 0: { cellWidth: 60 }, 1: { halign: "right", cellWidth: 40 } }
            });
            nY = doc.lastAutoTable.finalY + 5;

            // ── Otros aportes ────────────────────────────────────────────────────
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text("Otros aportes US$:", 14, nY);
            nY += 4;
            var aOtros = [
                ["Data Sharing",         oContrib.dataSharing           || 0],
                ["Aporte Log\xedstico",  oContrib.contribucionLogistica  || 0],
                ["Pre order",            oContrib.preOrder              || 0],
                ["Fondo Sell out",       oContrib.fondoSellOut          || 0],
                ["Nuevos Canales y B2B", oContrib.nuevosCanalesB2B      || 0],
                ["Rebate de Incentivo",  oContrib.rebateIncentivo       || 0]
            ];
            var nTotalOtros = aOtros.reduce(function (acc, r) { return acc + r[1]; }, 0);
            var aOtrosBody  = aOtros.map(function (r) { return [r[0], fmt(r[1])]; });
            aOtrosBody.push([{ content: "Total", styles: { fontStyle: "bold" } }, { content: fmt(nTotalOtros), styles: { fontStyle: "bold" } }]);
            doc.autoTable({
                startY: nY,
                body: aOtrosBody,
                theme: "plain",
                styles: { fontSize: 8, cellPadding: 1 },
                columnStyles: { 0: { cellWidth: 60 }, 1: { halign: "right", cellWidth: 40 } }
            });
            nY = doc.lastAutoTable.finalY + 14;

            // ── Firmantes ────────────────────────────────────────────────────────
            if (aFlujo.length > 0) {
                var aFirmantes = aFlujo.slice(0, 3);
                var nColW      = (nPageW - 28) / aFirmantes.length;
                aFirmantes.forEach(function (f, i) {
                    var nX     = 14 + i * nColW + nColW * 0.1;
                    var nLineW = nColW * 0.8;
                    doc.setDrawColor(0);
                    doc.line(nX, nY, nX + nLineW, nY);
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(8);
                    doc.text(f.rol || "", nX + nLineW / 2, nY + 5, { align: "center", maxWidth: nLineW });
                });
            }

            // ── Guardar ──────────────────────────────────────────────────────────
            var sPrefix = bDerivado ? "ConformidadCompra_" : "Compra_";
            doc.save(sPrefix + sMarca + "_" + sPeriodo.replace(/\s/g, "_") + ".pdf");
        },

        // ── Aprobación Compras (Nivel 3) ──────────────────────────────────────
        onConformeCompras: function () {
            var that   = this;
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { return; }

            MessageBox.confirm(
                "\u00bfConfirmar la aprobaci\u00f3n de Compras para la solicitud " + oReq.reqId + "?\n\n" +
                "Al confirmar, la solicitud avanzar\u00e1 al nivel 4 (Director Mercado Masivo) para su aprobaci\u00f3n final.", {
                title: "Conforme \u2013 Aprobaci\u00f3n Compras",
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    var sNow = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                             + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                    var sPath  = "/requerimientos/" + that._iIndex + "/flujoAprobacion";
                    var aFlujo = oModel.getProperty(sPath) || [];
                    var iNiv3  = aFlujo.findIndex(function (n) { return n.rol === "Compras"; });
                    if (iNiv3 !== -1) {
                        aFlujo[iNiv3].estado     = "Aprobado";
                        aFlujo[iNiv3].fecha      = sNow;
                        aFlujo[iNiv3].comentario = "Conforme";
                    }
                    var iNiv4 = aFlujo.findIndex(function (n) { return n.rol === "Director Mercado Masivo"; });
                    if (iNiv4 !== -1) { aFlujo[iNiv4].estado = "En Proceso"; }
                    oModel.setProperty(sPath, aFlujo);
                    // Mantener estado "En Aprobaci\u00f3n" hasta que Director apruebe
                    oModel.setProperty("/requerimientos/" + that._iIndex + "/estado", "En Aprobaci\u00f3n");
                    that._renderApprovalFlow(that._iIndex);
                    // Sincronizar en aprobaciones model
                    that._sincronizarFlujoEnAprobacion(oReq.reqId, aFlujo);
                    MessageToast.show("Aprobado por Compras. Pendiente aprobaci\u00f3n Director Mercado Masivo.");
                    var oTabs = that.byId("detailTabs");
                    if (oTabs) { oTabs.setSelectedKey("flujo"); }
                }
            });
        },

        onRechazarCompras: function () {
            var that   = this;
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { return; }

            var oTextArea = new TextArea({ rows: 3, width: "100%", placeholder: "Motivo del rechazo..." });
            var oDlg = new Dialog({
                title: "Rechazar Solicitud \u2013 Compras",
                contentWidth: "420px",
                content: [
                    new VBox({ items: [
                        new Label({ text: "Motivo del rechazo", required: true }),
                        oTextArea
                    ]}).addStyleClass("mtnDlgContent")
                ],
                buttons: [
                    new Button({
                        text: "Rechazar", type: "Reject",
                        press: function () {
                            if (!oTextArea.getValue().trim()) {
                                MessageToast.show("Ingrese el motivo del rechazo");
                                return;
                            }
                            var sNow = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                                     + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                            var sPath  = "/requerimientos/" + that._iIndex + "/flujoAprobacion";
                            var aFlujo = oModel.getProperty(sPath) || [];
                            var iNiv3  = aFlujo.findIndex(function (n) { return n.rol === "Compras"; });
                            if (iNiv3 !== -1) {
                                aFlujo[iNiv3].estado     = "Rechazado";
                                aFlujo[iNiv3].fecha      = sNow;
                                aFlujo[iNiv3].comentario = oTextArea.getValue().trim();
                            }
                            oModel.setProperty(sPath, aFlujo);
                            oModel.setProperty("/requerimientos/" + that._iIndex + "/estado", "Rechazado");
                            that._renderApprovalFlow(that._iIndex);
                            that._sincronizarFlujoEnAprobacion(oReq.reqId, aFlujo);
                            MessageToast.show("Solicitud rechazada por Compras.");
                            oDlg.close();
                        }
                    }),
                    new Button({ text: "Cancelar", press: function () { oDlg.close(); } })
                ],
                afterClose: function () { oDlg.destroy(); }
            });
            oDlg.open();
        },

        _sincronizarFlujoEnAprobacion: function (sReqId, aFlujo) {
            var oAprModel = this.getOwnerComponent().getModel("aprobaciones");
            if (!oAprModel || !sReqId) { return; }
            var aAprs = oAprModel.getProperty("/aprobaciones") || [];
            var iIdx  = aAprs.findIndex(function (a) { return a.reqId === sReqId; });
            if (iIdx === -1) { return; }
            // Sincronizar aprobadores en la bandeja
            var aAprobadores = aFlujo.map(function (n, i) {
                return { nivel: i + 1, rol: n.rol, nombre: n.nombre || n.rol, estado: n.estado, fecha: n.fecha || "", comentario: n.comentario || "" };
            });
            oAprModel.setProperty("/aprobaciones/" + iIdx + "/aprobadores", aAprobadores);
            // Actualizar nivelActual al primer nivel pendiente/en proceso
            var iNivelActual = aAprobadores.findIndex(function (a) { return a.estado !== "Aprobado" && a.estado !== "Rechazado"; });
            oAprModel.setProperty("/aprobaciones/" + iIdx + "/nivelActual", iNivelActual === -1 ? aAprobadores.length + 1 : iNivelActual + 1);
            var sRolActual = iNivelActual !== -1 ? (aAprobadores[iNivelActual].rol || "") : "";
            oAprModel.setProperty("/aprobaciones/" + iIdx + "/rolNivelActual", sRolActual);
            // Si Compras aprob\u00f3, el max nivel para el bandeja ahora es 4 (Director lo cierra all\u00ed)
            oAprModel.setProperty("/aprobaciones/" + iIdx + "/nivelMaxAprobacion", 4);
        },

        // ── Paso 5.1 – Enviar a Firma de Acta (DocuSign) ─────────────────────────
        onEnviarFirmaActa: function () {
            var that = this;
            var oModel   = this.getOwnerComponent().getModel();
            var oReq     = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { return; }

            MessageBox.confirm(
                "Se enviará el Acta de Aceptación a DocuSign para firma del Director de Finanzas y del proveedor (" + (oReq.actaAceptacion && oReq.actaAceptacion.proveedor || oReq.marca || "") + ").\n\n" +
                "(C1) Se generará una tarea de aprobación al Director de Finanzas.\n" +
                "(C1) Se enviará un correo DocuSign al proveedor.\n\n" +
                "¿Confirmar el envío?",
                {
                    title: "Enviar a Firma de Acta – Paso 5.1",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction !== MessageBox.Action.OK) { return; }
                        var sBase = "/requerimientos/" + that._iIndex;
                        oModel.setProperty(sBase + "/estado", "Enviado a Firma de Acta");
                        oModel.setProperty(sBase + "/actaAceptacion/estadoDocuSign", "Enviado a DocuSign");

                        // Actualizar la entrada de aprobaciones: asignar al Director de Finanzas
                        var oAprModel = that.getOwnerComponent().getModel("aprobaciones");
                        if (oAprModel) {
                            var aApr = oAprModel.getProperty("/aprobaciones") || [];
                            var iAprIdx = aApr.findIndex(function (a) { return a.reqId === oReq.reqId; });
                            if (iAprIdx !== -1) {
                                oAprModel.setProperty("/aprobaciones/" + iAprIdx + "/estado",        "Enviado a Firma de Acta");
                                oAprModel.setProperty("/aprobaciones/" + iAprIdx + "/rolNivelActual", "Director de Finanzas");
                                // Marcar aprobador Director de Finanzas como En Proceso
                                var aAprsActa = oAprModel.getProperty("/aprobaciones/" + iAprIdx + "/aprobadores") || [];
                                var iDirFin = aAprsActa.findIndex(function (a) { return (a.rol || "").indexOf("Director") !== -1; });
                                if (iDirFin !== -1) {
                                    oAprModel.setProperty("/aprobaciones/" + iAprIdx + "/aprobadores/" + iDirFin + "/estado", "En Proceso");
                                } else {
                                    oAprModel.setProperty("/aprobaciones/" + iAprIdx + "/aprobadores", [{ nivel: 1, rol: "Director de Finanzas", nombre: "Carlos Solano Morales", estado: "En Proceso", fecha: "", comentario: "" }]);
                                }
                                // Sincronizar campos del acta desde el requerimiento
                                var oActaReq = oModel.getProperty(sBase + "/actaAceptacion") || {};
                                var sAprBase = "/aprobaciones/" + iAprIdx + "/actaAceptacion";
                                if (oActaReq.proveedor)      { oAprModel.setProperty(sAprBase + "/proveedor",      oActaReq.proveedor); }
                                if (oActaReq.contacto)       { oAprModel.setProperty(sAprBase + "/contacto",       oActaReq.contacto); }
                                if (oActaReq.asunto)         { oAprModel.setProperty(sAprBase + "/asunto",         oActaReq.asunto); }
                                if (oActaReq.numeroActa)     { oAprModel.setProperty(sAprBase + "/numeroActa",     oActaReq.numeroActa); }
                                if (oActaReq.fechaDocumento) { oAprModel.setProperty(sAprBase + "/fechaDocumento", oActaReq.fechaDocumento); }
                                // Copiar ítems del plan de compras al acta si aún está vacío
                                var oActaApr = oAprModel.getProperty(sAprBase) || {};
                                if (!oActaApr.items || oActaApr.items.length === 0) {
                                    var aPIApr = (oAprModel.getProperty("/aprobaciones/" + iAprIdx + "/planCompras/items") || []).map(function (it) {
                                        return { modelo: it.modelo || "", color: it.color || "", cantidad: it.cantidad || 0, precioFact: it.precioFact || 0, totalFact: it.totalFact || 0 };
                                    });
                                    oAprModel.setProperty(sAprBase + "/items", aPIApr);
                                }
                            }
                        }

                        MessageToast.show("Solicitud enviada a firma de acta v\u00eda DocuSign");
                        var oTabs = that.byId("detailTabs");
                        if (oTabs) { oTabs.setSelectedKey("actaAceptacion"); }
                    }
                }
            );
        },

        // ── Paso 8: Finalizar Solicitud – Gestión SAP (simulación) ───────
        onFinalizarSolicitud: function () {
            var that   = this;
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + this._iIndex);
            var oUi    = this.getView().getModel("ui");
            if (!oReq) { return; }

            var bMC  = oUi.getProperty("/mercadoCorporativo");
            var bRM  = oUi.getProperty("/esRedMovil");
            var bRF  = oUi.getProperty("/esRedFija");
            var bOM  = oUi.getProperty("/esOM");
            var bCL  = oUi.getProperty("/esComprasLocales");
            var bHS  = !bMC && !bRM && !bRF && !bOM && !bCL;

            // Determinar tipo de documento SAP y tipo de OC (solo Handset)
            var sTipo     = oReq.tipoSolicitud || "";
            var sDocType  = "SOLPED";  // default para todos menos Handset
            var sOCTipo   = "";
            var sDocLabel = "Solicitud de Pedido (SOLPED)";
            var sPaso     = "8.2";

            if (bHS) {
                sPaso = "8.1";
                sDocType = "OC";
                if (sTipo.indexOf("Importacion") !== -1 || sTipo.indexOf("Importaci") !== -1) {
                    sOCTipo = "OC Importaci\u00f3n";
                } else if (sTipo.indexOf("Abierto") !== -1) {
                    sOCTipo = "OC Pedido Abierto";
                } else if (sTipo.indexOf("Derivado") !== -1) {
                    sOCTipo = "OC Derivado";
                } else {
                    sOCTipo = "OC Est\u00e1ndar";
                }
                sDocLabel = sOCTipo;
            } else if (bCL) {
                sPaso = "8.3";
            }

            // Número de documento simulado
            var sAnio   = new Date().getFullYear();
            var sNumDoc = sDocType === "OC"
                ? "4500" + String(Math.floor(Math.random() * 900000) + 100000)
                : "1000" + String(Math.floor(Math.random() * 900000) + 100000);

            // Construir detalle según canal
            var sDetalleCanal = "";
            var sConsideraciones = "";
            if (bHS) {
                var aItems = oReq.items || [];
                var nTotal = aItems.reduce(function (s, i) { return s + (i.totalFacturacion || 0); }, 0);
                sDetalleCanal =
                    "\u2022 Tipo de Solicitud: " + sTipo + "\n" +
                    "\u2022 Documento a crear: " + sDocLabel + "\n" +
                    "\u2022 N\u00famero simulado: " + sNumDoc + "\n" +
                    "\u2022 \u00cdtems: " + aItems.length + " l\u00edneas\n" +
                    "\u2022 Total Facturaci\u00f3n: USD " + nTotal.toLocaleString("en-US", { minimumFractionDigits: 2 });
                sConsideraciones =
                    "(C1) Se notifica a los involucrados.\n" +
                    "(C2) Se adjuntan documentos en el pedido SAP:\n" +
                    "     \u2022 Carta de aceptaci\u00f3n firmada\n" +
                    "     \u2022 Necesidad de Compras\n" +
                    "     \u2022 Archivos de adjuntos (archivo de importaci\u00f3n)";
            } else if (bMC) {
                sDetalleCanal =
                    "\u2022 Tipo de Solicitud: " + sTipo + "\n" +
                    "\u2022 Documento a crear: Solicitud de Pedido (SOLPED)\n" +
                    "\u2022 N\u00famero simulado: " + sNumDoc + "\n" +
                    "\u2022 L\u00ednea de Negocio: Mercado Corporativo";
                sConsideraciones =
                    "(C1) Una vez finalizado no es posible realizar ediciones.\n" +
                    "(C2) Job valida que el Ariba est\u00e9 cerrado antes de habilitar este bot\u00f3n.";
            } else if (bRM) {
                sDetalleCanal =
                    "\u2022 Tipo de Solicitud: " + sTipo + "\n" +
                    "\u2022 Documento a crear: Solicitud de Pedido (SOLPED)\n" +
                    "\u2022 N\u00famero simulado: " + sNumDoc + "\n" +
                    "\u2022 L\u00ednea de Negocio: Red M\u00f3vil";
                sConsideraciones =
                    "(C1) Una vez finalizado no es posible realizar ediciones.\n" +
                    "(C2) Job valida que el Ariba est\u00e9 cerrado antes de habilitar este bot\u00f3n.";
            } else if (bRF) {
                sDetalleCanal =
                    "\u2022 Tipo de Solicitud: " + sTipo + "\n" +
                    "\u2022 Documento a crear: Solicitud de Pedido (SOLPED)\n" +
                    "\u2022 N\u00famero simulado: " + sNumDoc + "\n" +
                    "\u2022 L\u00ednea de Negocio: Red Fija";
                sConsideraciones =
                    "(C1) Una vez finalizado no es posible realizar ediciones.\n" +
                    "(C2) Job valida que el Ariba est\u00e9 cerrado antes de habilitar este bot\u00f3n.";
            } else if (bOM) {
                sDetalleCanal =
                    "\u2022 Tipo de Solicitud: " + sTipo + "\n" +
                    "\u2022 Documento a crear: Solicitud de Pedido (SOLPED)\n" +
                    "\u2022 N\u00famero simulado: " + sNumDoc + "\n" +
                    "\u2022 L\u00ednea de Negocio: O&M";
                sConsideraciones =
                    "(C1) Una vez finalizado no es posible realizar ediciones.\n" +
                    "(C2) Job valida que el Ariba est\u00e9 cerrado antes de habilitar este bot\u00f3n.";
            } else if (bCL) {
                sDetalleCanal =
                    "\u2022 Tipo de Solicitud: " + sTipo + "\n" +
                    "\u2022 Documento a crear: Solicitud de Pedido (SOLPED)\n" +
                    "\u2022 N\u00famero simulado: " + sNumDoc + "\n" +
                    "\u2022 L\u00ednea de Negocio: Compras Locales";
                sConsideraciones =
                    "(C1) Una vez finalizado no es posible realizar ediciones.\n" +
                    "(C2) Job valida que el Ariba est\u00e9 cerrado antes de habilitar este bot\u00f3n.";
            }

            MessageBox.confirm(
                "Paso " + sPaso + " \u2013 \u00bfDesea finalizar la solicitud " + oReq.reqId + "?\n\n" +
                sDetalleCanal + "\n\n" + sConsideraciones,
                {
                    title: "Finalizar Solicitud \u2013 Gesti\u00f3n SAP (Simulaci\u00f3n)",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction !== MessageBox.Action.OK) { return; }
                        var sNow  = new Date().toLocaleDateString("de-DE") + " " +
                                    new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
                        var sBase = "/requerimientos/" + that._iIndex;
                        oModel.setProperty(sBase + "/estado", "Finalizado");
                        oModel.setProperty(sBase + "/ultimaModificacion", sNow);
                        if (sDocType === "OC") {
                            oModel.setProperty(sBase + "/numeroOC", sNumDoc);
                            oModel.setProperty(sBase + "/tipoOCSAP", sOCTipo);
                        } else {
                            oModel.setProperty(sBase + "/numeroSolped", sNumDoc);
                        }
                        oModel.setProperty(sBase + "/fechaFinalizacion", sNow);
                        oModel.setProperty(sBase + "/documentoSAPSimulado", {
                            tipo:   sDocType,
                            numero: sNumDoc,
                            fecha:  sNow,
                            canal:  bHS ? "Handset" : bMC ? "MC" : bRM ? "RedMovil" : bRF ? "RedFija" : bOM ? "OM" : "CL"
                        });
                        MessageToast.show(
                            sDocType === "OC"
                                ? sOCTipo + " " + sNumDoc + " creado en SAP (simulaci\u00f3n)"
                                : "SOLPED " + sNumDoc + " creada en SAP (simulaci\u00f3n)"
                        );
                    }
                }
            );
        },

        // ══════════════════════════════════════════════════════════════════
        // Helpers – Bridge requerimientos ↔ aprobaciones (Pasos 4 / 7)
        // ══════════════════════════════════════════════════════════════════

        _crearEntradaAprobacion: function (oReq) {
            var oAprModel = this.getOwnerComponent().getModel("aprobaciones");
            if (!oAprModel) { return; }
            var aApr = oAprModel.getProperty("/aprobaciones") || [];
            // No duplicar si ya existe entrada para este REQ
            if (aApr.some(function (a) { return a.reqId === oReq.reqId; })) { return; }

            var oUi = this.getView().getModel("ui");
            var sLN;
            if (oUi.getProperty("/esRedMovil"))             { sLN = "Red Movil"; }
            else if (oUi.getProperty("/esRedFija"))          { sLN = "Red Fija"; }
            else if (oUi.getProperty("/esOM"))               { sLN = "O&M"; }
            else if (oUi.getProperty("/esComprasLocales"))   { sLN = "Compras Locales"; }
            else if (oUi.getProperty("/mercadoCorporativo")) { sLN = "Mercado Corporativo"; }
            else                                             { sLN = "Handset"; }

            var sNow = new Date().toLocaleDateString("de-DE") + " " +
                       new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
            var nImp      = oReq.importeEstimadoUSD || 0;
            var nNivelMax = sLN === "Handset" ? 3 :
                            sLN === "Mercado Corporativo" ? 4 : 3;
            var sEstado   = sLN === "Mercado Corporativo" ? "Pendiente Aprobaci\u00f3n" : "En Aprobaci\u00f3n";
            var sAprId    = "APR-" + new Date().getFullYear() + "-" +
                            String(Math.floor(Math.random() * 900000) + 100000);

            // Mapear items del requerimiento al formato esperado por la vista de aprobaciones
            var aReqItems = oReq.items || [];
            var aPlanItems = aReqItems.map(function (it) {
                return {
                    modelo:         it.modelo         || "",
                    codigo:         it.codigo         || "",
                    codigoMaterial: it.codigoMaterial || "",
                    color:          it.color          || "",
                    cantidad:       it.cantidad       || 0,
                    precioFact:     it.precioFacturacion != null ? it.precioFacturacion : (it.precioFact || 0),
                    virFact:        it.virUnitario     != null ? it.virUnitario        : (it.virFact   || 0),
                    precioNeto:     it.precioNeto      != null ? it.precioNeto         : ((it.precioFacturacion || 0) - (it.virUnitario || 0)),
                    totalFact:      it.totalFacturacion != null ? it.totalFacturacion  : (it.totalFact || 0),
                    totalVIR:       it.totalVir        != null ? it.totalVir           : (it.totalVIR  || 0),
                    totalNeto:      it.totalNeto       || 0
                };
            });

            // Calcular total VIR
            var nVirTotal = aPlanItems.reduce(function (t, it) { return t + (it.totalVIR || 0); }, 0);

            // Mapear aportes VIR al formato esperado por la vista
            var aAportesOtros = (oReq.aportesVIR || []).map(function (a) {
                return {
                    concepto:   a.nombre || a.concepto || "",
                    monto:      a.monto  || 0,
                    porcentaje: a.porcentaje || ""
                };
            });

            var aAprobadores = this._buildAprobadores(sLN, nNivelMax);
            aApr.unshift({
                aprId:                sAprId,
                titulo:               oReq.titulo || "",
                tipoSolicitud:        oReq.tipoSolicitud || "",
                lineaNegocio:         sLN,
                mercado:              oReq.mercado || "local",
                canal:                sLN,
                estado:               sEstado,
                reqId:                oReq.reqId,
                valorEstimado:        nImp,
                periodo:              oReq.periodo || "",
                creadoPor:            oReq.creadoPor || "",
                fechaSolicitud:       sNow,
                ultimaModificacion:   sNow,
                nivelActual:          1,
                nivelMaxAprobacion:   nNivelMax,
                rolNivelActual:       aAprobadores.length > 0 ? aAprobadores[0].rol : "",
                aprobador:            null,
                fechaAprobacion:      null,
                comentarioAprobador:  null,
                aprobadores:          aAprobadores,
                flujoAprobacion:      aAprobadores,
                // Datos del plan de compras (copiados del requerimiento)
                planCompras: {
                    lote:  oReq.titulo        || "",
                    tipo:  oReq.tipoSolicitud || "",
                    fecha: sNow,
                    items: aPlanItems,
                    aportes: {
                        vir:   nVirTotal,
                        otros: aAportesOtros
                    }
                },
                // Acta de Aceptación – copiada del requerimiento con ítems del plan de compras
                actaAceptacion: {
                    numeroActa:            (oReq.actaAceptacion && oReq.actaAceptacion.numeroActa)       || ("H" + String(Math.floor(Math.random() * 900) + 100) + "-" + new Date().getFullYear()),
                    fechaDocumento:        (oReq.actaAceptacion && oReq.actaAceptacion.fechaDocumento)   || sNow,
                    proveedor:             (oReq.actaAceptacion && oReq.actaAceptacion.proveedor)        || ((oReq.marca || "Proveedor") + " ELECTRONICS PERU S.A.C."),
                    contacto:              (oReq.actaAceptacion && oReq.actaAceptacion.contacto)         || "",
                    asunto:                (oReq.actaAceptacion && oReq.actaAceptacion.asunto)           || ("Confirmaci\u00f3n de compra de equipos " + (oReq.marca || "")),
                    firmaDirectorFinanzas: "Carlos Solano Morales",
                    rolDirectorFinanzas:   "Director de Finanzas",
                    empresaDirector:       "Am\u00e9rica M\u00f3vil Per\u00fa S.A.C.",
                    firmaProveedor:        (oReq.actaAceptacion && oReq.actaAceptacion.firmaProveedor)   || "",
                    rolProveedor:          (oReq.actaAceptacion && oReq.actaAceptacion.rolProveedor)     || "",
                    empresaProveedor:      (oReq.actaAceptacion && oReq.actaAceptacion.empresaProveedor) || "",
                    docuSignUrl:           "",
                    items: aPlanItems.map(function (it) {
                        return { modelo: it.modelo || "", color: it.color || "", cantidad: it.cantidad || 0, precioFact: it.precioFact || 0, totalFact: it.totalFact || 0 };
                    })
                },
                // Ítems de infra / MC para otros canales
                items: aReqItems,
                // Campos específicos Mercado Corporativo
                tipoInversion:  oReq.tipoInversion  || "",
                origenArea:     oReq.origenArea      || "",
                costos: (function () {
                    var oEF = oReq.evaluacionFinanciera || {};
                    if (oEF.costos || oEF.ingresos) {
                        return [
                            { tipo: "Total Costos",  descripcion: "Costos del proyecto",  monto: oEF.costos   || 0 },
                            { tipo: "Ingresos",      descripcion: "Ingresos esperados",   monto: oEF.ingresos || 0 }
                        ];
                    }
                    // Construir desde ítems si hay, o usar placeholders
                    var aIt = oReq.items || [];
                    if (aIt.length) {
                        return aIt.map(function (it, i) {
                            return { tipo: "Ítem " + (i + 1), descripcion: it.descripcion || it.materialServicio || "", monto: (it.cantidad || 0) };
                        });
                    }
                    return [
                        { tipo: "Costos",   descripcion: "Pendiente de evaluación financiera", monto: 0 },
                        { tipo: "Ingresos", descripcion: "Pendiente de evaluación financiera", monto: 0 }
                    ];
                }()),
                kpis: (function () {
                    var oEF = oReq.evaluacionFinanciera || {};
                    if (oEF.costos || oEF.ingresos) {
                        return [
                            { kpi: "Costos",   valor: oEF.costos   || 0 },
                            { kpi: "Ingresos", valor: oEF.ingresos || 0 },
                            { kpi: "Margen %", valor: (oEF.margen  || 0) + "%" },
                            { kpi: "ROI",      valor: (oEF.roi     || 0) + "%" }
                        ];
                    }
                    return [
                        { kpi: "Ítems planificados", valor: (oReq.items || []).length },
                        { kpi: "Importe estimado",   valor: "US$ " + (oReq.importeEstimadoUSD || 0) },
                        { kpi: "Estado financiero",  valor: "Pendiente evaluación" }
                    ];
                }()),
                presentacion: oReq.presentacion || (
                    "<p><strong>Solicitud:</strong> " + (oReq.reqId || "") + "</p>" +
                    "<p><strong>Título:</strong> " + (oReq.titulo || "-") + "</p>" +
                    "<p><strong>Tipo de Solicitud:</strong> " + (oReq.tipoSolicitud || "-") + "</p>" +
                    "<p><strong>Tipo Inversión:</strong> " + (oReq.tipoInversion || "-") + "</p>" +
                    "<p><strong>Cliente:</strong> " + (oReq.cliente || "-") + "</p>" +
                    "<p><strong>Área Funcional:</strong> " + (oReq.areaFuncional || "-") + "</p>" +
                    "<p><strong>Importe Estimado:</strong> US$ " + (oReq.importeEstimadoUSD || 0) + "</p>" +
                    ((oReq.items || []).length ? "<p><strong>Ítems:</strong> " + (oReq.items || []).length + " ítem(s) cargado(s)</p>" : "")
                )
            });
            oAprModel.setProperty("/aprobaciones", aApr);
            var nPend = oAprModel.getProperty("/summary/totalPendientes") || 0;
            oAprModel.setProperty("/summary/totalPendientes", nPend + 1);
        },

        _buildAprobadores: function (sLN, nNivelMax) {
            var mRoles = {
                "Handset": [
                    { nivel: 1, rol: "Jefe Planificaci\u00f3n Comercial",   iniciales: "JP" },
                    { nivel: 2, rol: "Gerente Planificaci\u00f3n Comercial", iniciales: "GP" },
                    { nivel: 3, rol: "Director Mercado Masivo",              iniciales: "DM" }
                ],
                "Mercado Corporativo": [
                    { nivel: 1, rol: "Jefe Mercado Masivo (Comercial)",        iniciales: "JM" },
                    { nivel: 2, rol: "Gerente Mercado Masivo (Comercial)",      iniciales: "GM" },
                    { nivel: 3, rol: "Sub Director Mercado Masivo (Comercial)", iniciales: "SM" },
                    { nivel: 4, rol: "Director Mercado Masivo",                 iniciales: "DM" }
                ],
                "Red Movil": [
                    { nivel: 1, rol: "Jefe Ingenier\u00eda Red M\u00f3vil", iniciales: "JR" },
                    { nivel: 2, rol: "Gerente Ingenier\u00eda Red",         iniciales: "GR" },
                    { nivel: 3, rol: "Sub Director Infraestructura",         iniciales: "SD" }
                ],
                "Red Fija": [
                    { nivel: 1, rol: "Jefe Ingenier\u00eda Red Fija",       iniciales: "JF" },
                    { nivel: 2, rol: "Gerente Ingenier\u00eda Red",         iniciales: "GR" },
                    { nivel: 3, rol: "Sub Director Infraestructura",         iniciales: "SD" }
                ],
                "O&M": [
                    { nivel: 1, rol: "Jefe O&M",                iniciales: "JM" },
                    { nivel: 2, rol: "Gerente Operaciones",     iniciales: "GO" },
                    { nivel: 3, rol: "Sub Director Operaciones", iniciales: "SO" }
                ],
                "Compras Locales": [
                    { nivel: 1, rol: "Jefe \u00c1rea Usuaria",          iniciales: "JU" },
                    { nivel: 2, rol: "Gerente \u00c1rea Usuaria",        iniciales: "GU" },
                    { nivel: 3, rol: "Sub Director \u00c1rea Usuaria",   iniciales: "SU" }
                ]
            };
            var aRolesLN = mRoles[sLN] || mRoles["Handset"];
            return aRolesLN.slice(0, nNivelMax).map(function (r, idx) {
                return { nivel: "NIVEL " + r.nivel, rol: r.rol, nombre: r.rol,
                         iniciales: r.iniciales, estado: idx === 0 ? "Pendiente" : "En Espera", fecha: "", comentario: "" };
            });
        },

        // ── Paso 7.1 – Simular creación en Ariba ──────────────────────────
        onSimularAriba: function () {
            var that   = this;
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { return; }
            var sAribaId = "AR-" + new Date().getFullYear() + "-" +
                           String(Math.floor(Math.random() * 900000) + 100000);
            var sNow = new Date().toLocaleDateString("de-DE") + " " +
                       new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
            MessageBox.confirm(
                "Paso 7.1 \u2013 Creaci\u00f3n Ariba Sourcing (Simulaci\u00f3n)\n\n" +
                "\u2022 Solicitud: " + oReq.reqId + "\n" +
                "\u2022 T\u00edtulo: " + (oReq.titulo || "") + "\n" +
                "\u2022 ID Ariba simulado: " + sAribaId + "\n\n" +
                "El Ariba se genera autom\u00e1ticamente por API.\n" +
                "Para MC: lo gatilla la confirmaci\u00f3n del cliente por Compras.\n" +
                "Para el resto: se crea al finalizar el \u00faltimo nivel de aprobaci\u00f3n.",
                {
                    title: "Gesti\u00f3n Ariba \u2013 Sourcing (Paso 7.1)",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction !== MessageBox.Action.OK) { return; }
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/estado", "Ariba Creado");
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/aribaId", sAribaId);
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/fechaAriba", sNow);
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/ultimaModificacion", sNow);
                        var oAprModel = that.getOwnerComponent().getModel("aprobaciones");
                        if (oAprModel) {
                            var aApr    = oAprModel.getProperty("/aprobaciones") || [];
                            var iAprIdx = aApr.findIndex(function (a) { return a.reqId === oReq.reqId; });
                            if (iAprIdx !== -1) {
                                oAprModel.setProperty("/aprobaciones/" + iAprIdx + "/aribaId",     sAribaId);
                                oAprModel.setProperty("/aprobaciones/" + iAprIdx + "/estadoAriba", "Creado");
                            }
                        }
                        MessageToast.show("Ariba " + sAribaId + " creado en Sourcing (simulaci\u00f3n)");
                    }
                }
            );
        },

        onExportarExcel: function () {
            var oModel  = this.getOwnerComponent().getModel();
            var oReq    = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { MessageToast.show("Sin datos para exportar"); return; }

            var fmt = function (n) {
                if (n === 0 || n === undefined || n === null) { return "-"; }
                return Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };
            var fmtPct = function (n, total) {
                if (!total) { return "0.00%"; }
                return (n / total * 100).toFixed(2) + "%";
            };

            var aItems   = oReq.items || [];

            // ── Si no hay ítems, usar plantilla según marca ──
            if (!aItems.length) {
                var mTpl = {
                    "Samsung": [
                        { no: 1, modelo: "Galaxy S26 Ultra", codigo: "SM-S938BZKDLTP", codigoMaterial: "MAT-SAM-001", color: "Phantom Black", cantidad: 200, precioFacturacion: 1299.00, virUnitario: 130.00, totalFacturacion: 259800.00, totalVir: 26000.00, totalNeto: 233800.00, stockCDVES: 320, stockDistribuido: 180 },
                        { no: 2, modelo: "Galaxy S26+",      codigo: "SM-S936BZWDLTP", codigoMaterial: "MAT-SAM-002", color: "Cream White",   cantidad: 150, precioFacturacion:  999.00, virUnitario: 100.00, totalFacturacion: 149850.00, totalVir: 15000.00, totalNeto: 134850.00, stockCDVES: 210, stockDistribuido: 140 },
                        { no: 3, modelo: "Galaxy S26",       codigo: "SM-S931BZKDLTP", codigoMaterial: "MAT-SAM-003", color: "Marble Gray",   cantidad: 100, precioFacturacion:  799.00, virUnitario:  80.00, totalFacturacion:  79900.00, totalVir:  8000.00, totalNeto:  71900.00, stockCDVES: 155, stockDistribuido:  95 }
                    ],
                    "Apple": [
                        { no: 1, modelo: "iPhone 17 Pro Max", codigo: "AAPL-MYV83LL", codigoMaterial: "MAT-APL-001", color: "Desert Titanium", cantidad: 200, precioFacturacion: 1199.00, virUnitario: 120.00, totalFacturacion: 239800.00, totalVir: 24000.00, totalNeto: 215800.00, stockCDVES: 280, stockDistribuido: 160 },
                        { no: 2, modelo: "iPhone 17 Pro",     codigo: "AAPL-MYV73LL", codigoMaterial: "MAT-APL-002", color: "Black Titanium",  cantidad: 150, precioFacturacion:  999.00, virUnitario: 100.00, totalFacturacion: 149850.00, totalVir: 15000.00, totalNeto: 134850.00, stockCDVES: 190, stockDistribuido: 120 },
                        { no: 3, modelo: "iPhone 17",         codigo: "AAPL-MYV63LL", codigoMaterial: "MAT-APL-003", color: "Ultramarine",     cantidad: 100, precioFacturacion:  799.00, virUnitario:  80.00, totalFacturacion:  79900.00, totalVir:  8000.00, totalNeto:  71900.00, stockCDVES: 130, stockDistribuido:  85 }
                    ],
                    "Motorola": [
                        { no: 1, modelo: "Motorola Edge 50 Pro",    codigo: "MOTO-XT2321-1", codigoMaterial: "MAT-MOT-001", color: "Black Beauty", cantidad: 150, precioFacturacion: 499.00, virUnitario: 50.00, totalFacturacion:  74850.00, totalVir:  7500.00, totalNeto:  67350.00, stockCDVES: 175, stockDistribuido: 110 },
                        { no: 2, modelo: "Motorola Edge 50",        codigo: "MOTO-XT2321-2", codigoMaterial: "MAT-MOT-002", color: "Peach Fuzz",   cantidad: 100, precioFacturacion: 399.00, virUnitario: 40.00, totalFacturacion:  39900.00, totalVir:  4000.00, totalNeto:  35900.00, stockCDVES: 120, stockDistribuido:  75 },
                        { no: 3, modelo: "Motorola Edge 50 Fusion", codigo: "MOTO-XT2321-3", codigoMaterial: "MAT-MOT-003", color: "Forest Blue",  cantidad: 100, precioFacturacion: 329.00, virUnitario: 33.00, totalFacturacion:  32900.00, totalVir:  3300.00, totalNeto:  29600.00, stockCDVES:  90, stockDistribuido:  55 }
                    ],
                    "Xiaomi": [
                        { no: 1, modelo: "Xiaomi Redmi Note 15 Pro", codigo: "XM-RN15P-BLK", codigoMaterial: "MAT-XIA-001", color: "Midnight Black", cantidad: 200, precioFacturacion: 349.00, virUnitario: 0, totalFacturacion: 69800.00, totalVir: 0, totalNeto: 69800.00, stockCDVES: 145, stockDistribuido:  90 },
                        { no: 2, modelo: "Xiaomi Redmi Note 15",     codigo: "XM-RN15-GRN",  codigoMaterial: "MAT-XIA-002", color: "Forest Green",  cantidad: 150, precioFacturacion: 279.00, virUnitario: 0, totalFacturacion: 41850.00, totalVir: 0, totalNeto: 41850.00, stockCDVES: 100, stockDistribuido:  65 }
                    ]
                };
                aItems = mTpl[oReq.marca] || [
                    { no: 1, modelo: "", codigo: "", codigoMaterial: "", color: "", cantidad: 0, precioFacturacion: 0, virUnitario: 0, totalFacturacion: 0, totalVir: 0, totalNeto: 0 }
                ];
            }

            var nTotFact = aItems.reduce(function (s, i) { return s + (i.totalFacturacion || 0); }, 0);
            var nTotVir  = aItems.reduce(function (s, i) { return s + (i.totalVir        || 0); }, 0);
            var nTotNeto = aItems.reduce(function (s, i) { return s + (i.totalNeto       || 0); }, 0);
            var nTotCant = aItems.reduce(function (s, i) { return s + (i.cantidad        || 0); }, 0);
            var oContrib = oReq.contributions || {};

            var nDataSharing       = oContrib.dataSharing         || 0;
            var nAporteLogistico   = oContrib.contribucionLogistica|| 0;
            var nPreOrder          = oContrib.preOrder             || 0;
            var nFondoSellOut      = oContrib.fondoSellOut         || 0;
            var nNuevosCanales     = oContrib.nuevosCanalesB2B     || 0;
            var nRebateIncentivo   = oContrib.rebateIncentivo      || 0;
            var nTotalAportes      = nDataSharing + nAporteLogistico + nPreOrder + nFondoSellOut + nNuevosCanales + nRebateIncentivo;

            var bDerivado = (oReq.tipoSolicitud || "").toLowerCase().indexOf("derivado") !== -1;
            var sDate     = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
            var sHtml;

            if (bDerivado) {
                // ── DERIVADO: "CONFORMIDAD DE COMPRA" — blue headers, Familia + PA cols ──
                var sBlue   = "background:#2E74B5;font-weight:bold;font-family:Arial;font-size:9pt;text-align:center;border:1px solid #1F5C8E;color:#FFFFFF;";
                var sBoldD  = "font-weight:bold;font-family:Arial;font-size:9pt;border:1px solid #999;";
                var sNormD  = "font-family:Arial;font-size:9pt;border:1px solid #999;";
                var sRightD = "font-family:Arial;font-size:9pt;border:1px solid #999;text-align:right;";
                var sBoldRD = "font-weight:bold;font-family:Arial;font-size:9pt;border:1px solid #999;text-align:right;";
                var sNoBD   = "font-family:Arial;font-size:9pt;";

                var sItemRowsD = "";
                aItems.forEach(function (item) {
                    var nPrecioNeto = (item.precioFacturacion || 0) - (item.virUnitario || 0);
                    sItemRowsD += "<tr>" +
                        "<td style='" + sNormD  + "'>" + (item.modelo || "") + "</td>" +
                        "<td style='" + sNormD  + "'>" + (item.familia || ((oReq.marca || "").toUpperCase() + " " + (item.modelo || "").toUpperCase())) + "</td>" +
                        "<td style='" + sNormD  + "'>" + (item.codigo || "") + "</td>" +
                        "<td style='" + sNormD  + "'>" + (item.codigoMaterial || "") + "</td>" +
                        "<td style='" + sNormD  + "'>" + (item.color || "") + "</td>" +
                        "<td style='" + sRightD + "'>" + (item.cantidad || 0) + "</td>" +
                        "<td style='" + sRightD + "'>$ " + fmt(item.precioFacturacion) + "</td>" +
                        "<td style='" + sRightD + "'>$ " + fmt(item.virUnitario)       + "</td>" +
                        "<td style='" + sRightD + "'>$ " + fmt(nPrecioNeto)            + "</td>" +
                        "<td style='" + sRightD + "'>$ " + fmt(item.totalFacturacion)  + "</td>" +
                        "<td style='" + sRightD + "'>$ " + fmt(item.totalVir)          + "</td>" +
                        "<td style='" + sRightD + "'>$ " + fmt(item.totalNeto)         + "</td>" +
                        "<td style='" + sNormD  + "'>"  + (item.pedidoAbierto || "-")  + "</td>" +
                    "</tr>";
                });

                var contribRowD = function (sLabel, nVal, nBase) {
                    return "<tr>" +
                        "<td style='" + sNormD  + "'>" + sLabel + "</td>" +
                        "<td style='" + sRightD + "'>$</td>" +
                        "<td style='" + sRightD + "'>" + (nVal ? fmt(nVal) : "-") + "</td>" +
                        "<td style='" + sRightD + "'>" + fmtPct(nVal, nBase) + "</td>" +
                        "<td colspan='9' style='" + sNoBD + "'></td>" +
                    "</tr>";
                };

                sHtml =
                    "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel'>" +
                    "<head><meta charset='UTF-8'></head><body>" +
                    "<table style='font-family:Arial;font-size:9pt;border-collapse:collapse;'>" +

                    "<tr>" +
                    "<td colspan='9' style='font-weight:bold;font-family:Arial;font-size:13pt;text-align:center;'>CONFORMIDAD DE COMPRA</td>" +
                    "<td style='" + sNoBD + "'>Marca</td><td style='font-weight:bold;font-family:Arial;font-size:9pt;'>" + (oReq.marca || "").toUpperCase() + "</td>" +
                    "<td colspan='2' style='" + sNoBD + "'></td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td colspan='9' style='" + sNoBD + "'></td>" +
                    "<td style='" + sNoBD + "'>Periodo</td><td style='font-weight:bold;font-family:Arial;font-size:9pt;'>" + (oReq.periodo || "") + "</td>" +
                    "<td colspan='2' style='" + sNoBD + "'></td>" +
                    "</tr>" +
                    "<tr><td colspan='13'></td></tr>" +

                    "<tr>" +
                    "<th style='" + sBlue + "'>Modelo</th>" +
                    "<th style='" + sBlue + "'>Familia</th>" +
                    "<th style='" + sBlue + "'>Código</th>" +
                    "<th style='" + sBlue + "'>Código Material</th>" +
                    "<th style='" + sBlue + "'>Color (Atributo 1)</th>" +
                    "<th style='" + sBlue + "'>Cantidad</th>" +
                    "<th style='" + sBlue + "'>Precio Facturación US$</th>" +
                    "<th style='" + sBlue + "'>VIR Unitario US$</th>" +
                    "<th style='" + sBlue + "'>Precio Neto US$</th>" +
                    "<th style='" + sBlue + "'>Total Facturación US$</th>" +
                    "<th style='" + sBlue + "'>Total VIR US$</th>" +
                    "<th style='" + sBlue + "'>Total Neto US$</th>" +
                    "<th style='" + sBlue + "'>PA</th>" +
                    "</tr>" +

                    sItemRowsD +

                    "<tr>" +
                    "<td style='" + sBoldD + "'>Total</td>" +
                    "<td style='" + sNormD + "'></td><td style='" + sNormD + "'></td><td style='" + sNormD + "'></td><td style='" + sNormD + "'></td>" +
                    "<td style='" + sBoldRD + "'>" + nTotCant + "</td>" +
                    "<td style='" + sNormD + "'></td><td style='" + sNormD + "'></td><td style='" + sNormD + "'></td>" +
                    "<td style='" + sBoldRD + "'>$ " + fmt(nTotFact) + "</td>" +
                    "<td style='" + sBoldRD + "'>$ " + fmt(nTotVir)  + "</td>" +
                    "<td style='" + sBoldRD + "'>$ " + fmt(nTotNeto) + "</td>" +
                    "<td style='" + sNormD + "'></td>" +
                    "</tr>" +

                    "<tr><td colspan='13'></td></tr>" +
                    "<tr><td colspan='13' style='font-weight:bold;font-family:Arial;font-size:9pt;'>APORTES US$</td></tr>" +
                    "<tr>" +
                    "<td style='" + sNormD + "'>VIR</td>" +
                    "<td style='" + sRightD + "'>$</td>" +
                    "<td style='" + sRightD + "'>" + fmt(nTotVir) + "</td>" +
                    "<td colspan='10' style='" + sNoBD + "'></td>" +
                    "</tr>" +
                    "<tr><td colspan='13'></td></tr>" +

                    "<tr><td colspan='13' style='font-weight:bold;font-family:Arial;text-decoration:underline;font-size:9pt;'>Otros aportes US$:</td></tr>" +
                    contribRowD("Data Sharing",         nDataSharing,     nTotNeto) +
                    contribRowD("Aporte Logístico",     nAporteLogistico, nTotNeto) +
                    contribRowD("Pre order",            nPreOrder,        nTotNeto) +
                    contribRowD("Fondo Sell out",       nFondoSellOut,    nTotNeto) +
                    contribRowD("Nuevos Canales y B2B", nNuevosCanales,   nTotNeto) +
                    contribRowD("Rebate de Incentivo",  nRebateIncentivo, nTotNeto) +

                    "<tr>" +
                    "<td style='" + sBoldD + "'>Total</td>" +
                    "<td style='" + sBoldRD + "'>$</td>" +
                    "<td style='" + sBoldRD + "'>" + fmt(nTotalAportes) + "</td>" +
                    "<td colspan='10' style='" + sNoBD + "'></td>" +
                    "</tr>" +

                    "<tr><td colspan='13'></td></tr>" +
                    "<tr><td colspan='13'></td></tr>" +
                    "<tr><td colspan='13'></td></tr>" +

                    "<tr>" +
                    "<td colspan='3' style='text-align:center;font-family:Arial;font-size:9pt;border-top:1px solid #000;'>Gladys Vivar</td>" +
                    "<td colspan='3' style='" + sNoBD + "'></td>" +
                    "<td colspan='4' style='text-align:center;font-family:Arial;font-size:9pt;border-top:1px solid #000;'>Judith López Huamán</td>" +
                    "<td colspan='3' style='text-align:center;font-family:Arial;font-size:9pt;border-top:1px solid #000;'>Hugo Gonzalez</td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td colspan='3' style='text-align:center;font-family:Arial;font-size:9pt;'>Jefe de Planificación Comercial</td>" +
                    "<td colspan='3' style='" + sNoBD + "'></td>" +
                    "<td colspan='4' style='text-align:center;font-family:Arial;font-size:9pt;'>Gerente Planificación Comercial</td>" +
                    "<td colspan='3' style='text-align:center;font-family:Arial;font-size:9pt;'>Director Mercado Masivo</td>" +
                    "</tr>" +

                    "</table></body></html>";

            } else {
                // ── ESTÁNDAR: "COMPRA [MARCA]" — yellow headers, 11 cols ──
                var sYellow = "background:#FFD700;font-weight:bold;font-family:Arial;font-size:9pt;text-align:center;border:1px solid #999;";
                var sBold   = "font-weight:bold;font-family:Arial;font-size:9pt;border:1px solid #999;";
                var sNorm   = "font-family:Arial;font-size:9pt;border:1px solid #999;";
                var sRight  = "font-family:Arial;font-size:9pt;border:1px solid #999;text-align:right;";
                var sBoldR  = "font-weight:bold;font-family:Arial;font-size:9pt;border:1px solid #999;text-align:right;";
                var sNoB    = "font-family:Arial;font-size:9pt;";

                var sItemRows = "";
                aItems.forEach(function (item) {
                    var nPrecioNeto = (item.precioFacturacion || 0) - (item.virUnitario || 0);
                    sItemRows += "<tr>" +
                        "<td style='" + sNorm  + "'>" + (item.modelo         || "") + "</td>" +
                        "<td style='" + sNorm  + "'>" + (item.codigo         || "") + "</td>" +
                        "<td style='" + sNorm  + "'>" + (item.codigoMaterial || "") + "</td>" +
                        "<td style='" + sNorm  + "'>" + (item.color          || "") + "</td>" +
                        "<td style='" + sRight + "'>" + (item.cantidad       || 0)  + "</td>" +
                        "<td style='" + sRight + "'>$ " + fmt(item.precioFacturacion) + "</td>" +
                        "<td style='" + sRight + "'>$ " + fmt(item.virUnitario)       + "</td>" +
                        "<td style='" + sRight + "'>$ " + fmt(nPrecioNeto)            + "</td>" +
                        "<td style='" + sRight + "'>$ " + fmt(item.totalFacturacion)  + "</td>" +
                        "<td style='" + sRight + "'>$ " + fmt(item.totalVir)          + "</td>" +
                        "<td style='" + sRight + "'>$ " + fmt(item.totalNeto)         + "</td>" +
                    "</tr>";
                });

                var contribRow = function (sLabel, nVal, nBase) {
                    return "<tr>" +
                        "<td style='" + sNorm  + "'>" + sLabel + "</td>" +
                        "<td style='" + sRight + "'>$</td>" +
                        "<td style='" + sRight + "'>" + (nVal ? fmt(nVal) : "-") + "</td>" +
                        "<td style='" + sRight + "'>" + fmtPct(nVal, nBase) + "</td>" +
                        "<td colspan='7' style='" + sNoB + "'></td>" +
                    "</tr>";
                };

                sHtml =
                    "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel'>" +
                    "<head><meta charset='UTF-8'></head><body>" +
                    "<table style='font-family:Arial;font-size:9pt;border-collapse:collapse;'>" +

                    "<tr><td colspan='11' style='font-weight:bold;font-family:Arial;font-size:11pt;'>COMPRA " + (oReq.marca || "").toUpperCase() + "</td></tr>" +
                    "<tr><td colspan='11' style='font-family:Arial;font-size:9pt;'>Compra " + (oReq.periodo || "") + "</td></tr>" +
                    "<tr><td colspan='11' style='font-family:Arial;font-size:9pt;'>" + sDate + "</td></tr>" +
                    "<tr><td colspan='11'></td></tr>" +

                    "<tr>" +
                    "<th style='" + sYellow + "'>Modelo</th>" +
                    "<th style='" + sYellow + "'>Código</th>" +
                    "<th style='" + sYellow + "'>Código Material</th>" +
                    "<th style='" + sYellow + "'>Color</th>" +
                    "<th style='" + sYellow + "'>Cantidad</th>" +
                    "<th style='" + sYellow + "'>Precio Facturación US$</th>" +
                    "<th style='" + sYellow + "'>VIR Unitario US$</th>" +
                    "<th style='" + sYellow + "'>Precio Neto US$</th>" +
                    "<th style='" + sYellow + "'>Total Facturación US$</th>" +
                    "<th style='" + sYellow + "'>Total VIR US$</th>" +
                    "<th style='" + sYellow + "'>Total Neto US$</th>" +
                    "</tr>" +

                    sItemRows +

                    "<tr>" +
                    "<td style='" + sBold + "'>Total</td>" +
                    "<td style='" + sNorm + "'></td><td style='" + sNorm + "'></td><td style='" + sNorm + "'></td>" +
                    "<td style='" + sBoldR + "'>" + nTotCant + "</td>" +
                    "<td style='" + sNorm + "'></td><td style='" + sNorm + "'></td><td style='" + sNorm + "'></td>" +
                    "<td style='" + sBoldR + "'>$ " + fmt(nTotFact) + "</td>" +
                    "<td style='" + sBoldR + "'>$ " + fmt(nTotVir)  + "</td>" +
                    "<td style='" + sBoldR + "'>$ " + fmt(nTotNeto) + "</td>" +
                    "</tr>" +

                    "<tr><td colspan='11'></td></tr>" +
                    "<tr><td colspan='11' style='font-weight:bold;font-family:Arial;font-size:9pt;'>APORTES US$</td></tr>" +
                    "<tr>" +
                    "<td style='" + sNorm + "'>VIR</td>" +
                    "<td style='" + sRight + "'>$</td>" +
                    "<td style='" + sRight + "'>" + fmt(nTotVir) + "</td>" +
                    "<td colspan='8' style='" + sNoB + "'></td>" +
                    "</tr>" +
                    "<tr><td colspan='11'></td></tr>" +

                    "<tr><td colspan='11' style='font-weight:bold;font-family:Arial;text-decoration:underline;font-size:9pt;'>Otros aportes US$:</td></tr>" +
                    contribRow("Data Sharing",         nDataSharing,     nTotNeto) +
                    contribRow("Aporte Logístico",     nAporteLogistico, nTotNeto) +
                    contribRow("Pre order",            nPreOrder,        nTotNeto) +
                    contribRow("Fondo Sell out",       nFondoSellOut,    nTotNeto) +
                    contribRow("Nuevos Canales y B2B", nNuevosCanales,   nTotNeto) +
                    contribRow("Rebate de Incentivo",  nRebateIncentivo, nTotNeto) +

                    "<tr>" +
                    "<td style='" + sBold + "'>Total</td>" +
                    "<td style='" + sBoldR + "'>$</td>" +
                    "<td style='" + sBoldR + "'>" + fmt(nTotalAportes) + "</td>" +
                    "<td colspan='8' style='" + sNoB + "'></td>" +
                    "</tr>" +

                    "<tr><td colspan='11'></td></tr>" +
                    "<tr><td colspan='11'></td></tr>" +
                    "<tr><td colspan='11'></td></tr>" +

                    "<tr>" +
                    "<td colspan='3' style='text-align:center;font-family:Arial;font-size:9pt;border-top:1px solid #000;'>Gladys Vivar</td>" +
                    "<td colspan='2' style='" + sNoB + "'></td>" +
                    "<td colspan='3' style='text-align:center;font-family:Arial;font-size:9pt;border-top:1px solid #000;'>Judith López Huamán</td>" +
                    "<td colspan='3' style='text-align:center;font-family:Arial;font-size:9pt;border-top:1px solid #000;'>Hugo Gonzalez</td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td colspan='3' style='text-align:center;font-family:Arial;font-size:9pt;'>Jefe de Planificación Comercial</td>" +
                    "<td colspan='2' style='" + sNoB + "'></td>" +
                    "<td colspan='3' style='text-align:center;font-family:Arial;font-size:9pt;'>Gerente Planificación Comercial</td>" +
                    "<td colspan='3' style='text-align:center;font-family:Arial;font-size:9pt;'>Director Mercado Masivo</td>" +
                    "</tr>" +

                    "</table></body></html>";
            }

            var oBlob = new Blob(["\ufeff" + sHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
            var sUrl  = URL.createObjectURL(oBlob);
            var oLink = document.createElement("a");
            oLink.href     = sUrl;
            oLink.download = (oReq.reqId || "requerimiento") + "_necesidad.xls";
            document.body.appendChild(oLink);
            oLink.click();
            document.body.removeChild(oLink);
            URL.revokeObjectURL(sUrl);
        },

        onPedidoAbiertoPress: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            var sPedidoId = oCtx ? oCtx.getProperty("pedidoId") : "";
            MessageToast.show("Pedido Abierto: " + sPedidoId + " (detalle en desarrollo)");
        },

        // â”€â”€ Adjuntos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // ── Adjuntos ──────────────────────────────────────────────────────────
        _openAdjuntoDlg: function (sSeccion, aTipos, sPath) {
            var oModel = this.getOwnerComponent().getModel();
            var that   = this;
            var oNombreInput = new Input({ width: "100%", placeholder: "Ej. Acuerdo_Samsung_Q1.eml" });
            var oTipoSel     = new Select({ width: "100%" });
            aTipos.forEach(function (t) { oTipoSel.addItem(new Item({ key: t, text: t })); });
            var oDlg = new Dialog({
                title: "Adjuntar \u2013 " + sSeccion,
                contentWidth: "420px",
                content: [
                    new VBox({
                        items: [
                            new Label({ text: "Nombre del archivo", required: true }), oNombreInput,
                            new Label({ text: "Tipo" }), oTipoSel
                        ]
                    }).addStyleClass("mtnDlgContent")
                ],
                buttons: [
                    new Button({
                        text: "Adjuntar", type: "Emphasized",
                        press: function () {
                            if (!oNombreInput.getValue().trim()) { MessageToast.show("Ingrese el nombre del archivo"); return; }
                            var sNow = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                                     + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                            var aList = oModel.getProperty(sPath) || [];
                            aList.push({ nombre: oNombreInput.getValue().trim(), tipo: oTipoSel.getSelectedKey(),
                                         fecha: sNow, cargadoPor: "oscar.fabian.ortiz.velayarce@emeal.nttdata.com" });
                            oModel.setProperty(sPath, aList);
                            MessageToast.show("Archivo adjuntado");
                            oDlg.close();
                        }
                    }),
                    new Button({ text: "Cancelar", press: function () { oDlg.close(); } })
                ],
                afterClose: function () { oDlg.destroy(); }
            });
            oDlg.open();
        },

        onUploadAcuerdo: function () {
            this._openAdjuntoDlg("Acuerdos con Proveedor", ["EML", "MSG"],
                "/requerimientos/" + this._iIndex + "/adjuntosHS/acuerdos");
        },

        onUploadOtroArchivo: function () {
            this._openAdjuntoDlg("Otros Archivos", ["DOC", "DOCX"],
                "/requerimientos/" + this._iIndex + "/adjuntosHS/otrosArchivos");
        },

        onDeleteAcuerdo: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            var that = this;
            MessageBox.confirm("\u00bfEliminar este acuerdo adjunto?", {
                title: "Confirmar",
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    var oModel = that.getOwnerComponent().getModel();
                    var sPath  = "/requerimientos/" + that._iIndex + "/adjuntosHS/acuerdos";
                    var aList  = oModel.getProperty(sPath) || [];
                    var iIdx   = parseInt(oCtx.getPath().split("/").pop(), 10);
                    aList.splice(iIdx, 1);
                    oModel.setProperty(sPath, aList);
                    MessageToast.show("Acuerdo eliminado");
                }
            });
        },

        onDeleteOtroArchivo: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            var that = this;
            MessageBox.confirm("\u00bfEliminar este archivo adjunto?", {
                title: "Confirmar",
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    var oModel = that.getOwnerComponent().getModel();
                    var sPath  = "/requerimientos/" + that._iIndex + "/adjuntosHS/otrosArchivos";
                    var aList  = oModel.getProperty(sPath) || [];
                    var iIdx   = parseInt(oCtx.getPath().split("/").pop(), 10);
                    aList.splice(iIdx, 1);
                    oModel.setProperty(sPath, aList);
                    MessageToast.show("Archivo eliminado");
                }
            });
        },

        onUpload: function () { this.onUploadAcuerdo(); },
        onDescargarAdjunto: function () { MessageToast.show("Descargando archivo..."); },
        onDeleteAdjunto: function (oEvent) { this.onDeleteAcuerdo(oEvent); },

        // â”€â”€ Stock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onConsultarStock: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { return; }
            var aItems = oReq.items || [];
            if (!aItems.length) { MessageToast.show("Agregue \u00edtems antes de consultar stock"); return; }
            var aStock = aItems.map(function (it) {
                // Mock: 70% chance full stock, 20% partial, 10% no stock
                var nRand  = Math.random();
                var nStock = nRand > 0.7 ? it.cantidad : nRand > 0.1 ? Math.floor(it.cantidad * 0.4) : 0;
                return {
                    descripcion:      it.descripcion,
                    cantRequerida:    it.cantidad,
                    stockDisponible:  nStock,
                    estadoStock:      nStock >= it.cantidad ? "Disponible" : nStock > 0 ? "Stock Parcial" : "Sin Stock",
                    proveedorSugerido: it.proveedor || "Por definir"
                };
            });
            oModel.setProperty("/requerimientos/" + this._iIndex + "/stock", aStock);
            var nFull    = aStock.filter(function (s) { return s.estadoStock === "Disponible"; }).length;
            var nPartial = aStock.filter(function (s) { return s.estadoStock === "Stock Parcial"; }).length;
            var nNone    = aStock.filter(function (s) { return s.estadoStock === "Sin Stock"; }).length;
            MessageToast.show("Stock consultado: " + nFull + " disponible(s), " + nPartial + " parcial(es), " + nNone + " sin stock");
        },

        // â”€â”€ Materiales â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onSolicitarMaterial: function () {
            var oModel = this.getOwnerComponent().getModel();
            var that   = this;
            var sPath  = "/requerimientos/" + this._iIndex + "/materialesSolicitados";
            var aMat   = oModel.getProperty(sPath) || [];

            var oDescInput = new Input({ width: "100%", required: true, placeholder: "Descripci\u00f3n del material" });
            var oUnidSel   = new Select({ width: "100%" });
            [["UND","UND \u2013 Unidad"],["SERV","SERV \u2013 Servicio"],["LIC","LIC \u2013 Licencia"],
             ["KG","KG \u2013 Kilogramo"],["M","M \u2013 Metro"],["HR","HR \u2013 Hora"]
            ].forEach(function (a) { oUnidSel.addItem(new Item({ key: a[0], text: a[1] })); });
            var oEspecArea = new TextArea({ width: "100%", rows: 4,
                placeholder: "Especificaciones t\u00e9cnicas: marca, modelo, versi\u00f3n, capacidad, certificaciones requeridas..." });

            var oDlg = new Dialog({
                title: "Solicitar Creaci\u00f3n de Material en SAP MM",
                contentWidth: "520px",
                content: [
                    new VBox({
                        items: [
                            new Label({ text: "Descripci\u00f3n del Material", required: true }), oDescInput,
                            new Label({ text: "Unidad de Medida" }),                               oUnidSel,
                            new Label({ text: "Especificaciones T\u00e9cnicas" }),                 oEspecArea
                        ]
                    }).addStyleClass("mtnDlgContent")
                ],
                buttons: [
                    new Button({
                        text: "Enviar Solicitud", type: "Emphasized",
                        press: function () {
                            if (!oDescInput.getValue().trim()) { MessageToast.show("La descripci\u00f3n es obligatoria"); return; }
                            aMat.push({ descripcion: oDescInput.getValue().trim(),
                                        unidad: oUnidSel.getSelectedKey(),
                                        especificaciones: oEspecArea.getValue().trim(),
                                        estado: "Pendiente" });
                            oModel.setProperty(sPath, aMat);
                            MessageToast.show("Solicitud de creaci\u00f3n de material enviada al \u00e1rea de Maestro de Datos");
                            oDlg.close();
                        }
                    }),
                    new Button({ text: "Cancelar", press: function () { oDlg.close(); } })
                ],
                afterClose: function () { oDlg.destroy(); }
            });
            oDlg.open();
        },

        onDeleteMaterial: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            var that = this;
            MessageBox.confirm("\u00bfEliminar esta solicitud de material?", {
                title: "Confirmar",
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    var oModel = that.getOwnerComponent().getModel();
                    var sPath  = "/requerimientos/" + that._iIndex + "/materialesSolicitados";
                    var aMat   = oModel.getProperty(sPath) || [];
                    var iIdx   = parseInt(oCtx.getPath().split("/").pop(), 10);
                    aMat.splice(iIdx, 1);
                    oModel.setProperty(sPath, aMat);
                    MessageToast.show("Solicitud eliminada");
                }
            });
        },

        // â”€â”€ Generar Presentación para Cliente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onGenerarPresentacion: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var oReq = oCtx.getObject();

            var oDestinatario = new Input({ width: "100%", value: oReq.cliente || "",
                placeholder: "Nombre del contacto del cliente" });
            var oFormatoSel   = new Select({ width: "100%" });
            [["PPT","PowerPoint (.pptx)"],["PDF","PDF (.pdf)"],["WORD","Word (.docx)"]].forEach(function (a) {
                oFormatoSel.addItem(new Item({ key: a[0], text: a[1] }));
            });
            var oIdiomasSel = new Select({ width: "100%" });
            [["ES","Espa\u00f1ol"],["EN","English"],["PT","Portugu\u00eas"]].forEach(function (a) {
                oIdiomasSel.addItem(new Item({ key: a[0], text: a[1] }));
            });

            var oDlg = new Dialog({
                title: "Generar Presentaci\u00f3n para Cliente",
                contentWidth: "480px",
                content: [
                    new VBox({
                        items: [
                            new Label({ text: "Cliente / Destinatario" }), oDestinatario,
                            new Label({ text: "Formato de salida" }),       oFormatoSel,
                            new Label({ text: "Idioma" }),                  oIdiomasSel
                        ]
                    }).addStyleClass("mtnDlgContent")
                ],
                buttons: [
                    new Button({
                        text: "Generar", type: "Emphasized",
                        press: function () {
                            var sFmt = oFormatoSel.getSelectedKey();
                            var sDst = oDestinatario.getValue() || oReq.cliente;
                            oDlg.close();
                            MessageToast.show("Generando presentaci\u00f3n " + sFmt + " para " + sDst + "...");
                            setTimeout(function () {
                                MessageBox.success(
                                    "La presentaci\u00f3n ha sido generada.\n\nArchivo: Presentaci\u00f3n_" + oReq.reqId + "." + sFmt.toLowerCase() + "\nCliente: " + sDst,
                                    { title: "Presentaci\u00f3n Generada" }
                                );
                            }, 1500);
                        }
                    }),
                    new Button({ text: "Cancelar", press: function () { oDlg.close(); } })
                ],
                afterClose: function () { oDlg.destroy(); }
            });
            oDlg.open();
        },

        // ── Enviar Factibilidad (3.2.1 / C1) ───────────────────────────────────────
        onEnviarFactibilidad: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var oReq = oCtx.getObject();
            var that = this;
            MessageBox.confirm(
                "¿Enviar la necesidad " + oReq.reqId + " a factibilidad?\n\nSe notificará al área técnica para evaluar la viabilidad del requerimiento.",
                {
                    title: "Confirmar Envío a Factibilidad",
                    onClose: function (sAction) {
                        if (sAction !== MessageBox.Action.OK) { return; }
                        var oModel = that.getOwnerComponent().getModel();
                        var sBase  = "/requerimientos/" + that._iIndex;
                        var sNow   = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                                   + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                        oModel.setProperty(sBase + "/estado", "Enviado a Factibilidad");
                        oModel.setProperty(sBase + "/ultimaModificacion", sNow);
                        MessageToast.show("Necesidad enviada a factibilidad correctamente");
                        that.getRouter().navTo("mcFactibilidadDetail", { reqId: encodeURIComponent(oReq.reqId) });
                    }
                }
            );
        },

        onNavBack: function () {
            var oUi      = this.getView().getModel("ui");
            var bMC      = oUi.getProperty("/mercadoCorporativo");
            var bFact    = oUi.getProperty("/esFact");
            var bCom     = oUi.getProperty("/esComercial");
            var bRM      = oUi.getProperty("/esRedMovil");
            var bRF      = oUi.getProperty("/esRedFija");
            var bOM      = oUi.getProperty("/esOM");
            var bCL      = oUi.getProperty("/esComprasLocales");
            var sReqId   = encodeURIComponent(this.getView().getBindingContext().getProperty("reqId"));
            if (bRM) {
                this.getRouter().navTo("infraRedMovilList");
            } else if (bRF) {
                this.getRouter().navTo("infraRedFijaList");
            } else if (bOM) {
                this.getRouter().navTo("infraOMList");
            } else if (bCL) {
                this.getRouter().navTo("comprasLocalesList");
            } else if (bCom) {
                this.getRouter().navTo("mcFactibilidadDetail", { reqId: sReqId });
            } else if (bFact) {
                this.getRouter().navTo("mcRequerimientoDetail", { reqId: sReqId });
            } else {
                this.getRouter().navTo(bMC ? "mcRequerimientoList" : "requerimientoList");
            }
        },

        // ── Factibilidad: Costos ──────────────────────────────────────────
        _updateCostosTab: function (iIndex) {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + iIndex);
            if (!oReq) { return; }
            var fmt = function (n) {
                return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };
            var nEquipos   = (oReq.materialesFact || []).reduce(function (s, m) { return s + (m.subtotal || 0); }, 0);
            var nServicios = (oReq.serviciosFact  || []).reduce(function (s, v) { return s + (v.subtotal || 0); }, 0);
            var oCF        = oReq.costosFact || {};
            var nManoObra  = parseFloat(oCF.manoObra  || 0) || 0;
            var nLogistica = parseFloat(oCF.logistica || 0) || 0;
            var nOtros     = parseFloat(oCF.otros     || 0) || 0;
            var nTotal     = nEquipos + nServicios + nManoObra + nLogistica + nOtros;
            var oE = this.byId("factCostosEquipos");   if (oE) { oE.setText(fmt(nEquipos)); }
            var oS = this.byId("factCostosServicios"); if (oS) { oS.setText(fmt(nServicios)); }
            var oT = this.byId("factCostosTotal");     if (oT) { oT.setText(fmt(nTotal)); }
            var oTM = this.byId("factTotalMateriales"); if (oTM) { oTM.setText(fmt(nEquipos)); }
            var oTS = this.byId("factTotalServicios");  if (oTS) { oTS.setText(fmt(nServicios)); }
            // Also refresh Comercial KPIs if the view is already bound
            this._updateComercialKPIs(iIndex);
        },

        onFactCostosChange: function () {
            this._updateCostosTab(this._iIndex);
        },

        // ── Factibilidad: Análisis Rentable ───────────────────────────────
        onAnalisisRentable: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var oReq = oCtx.getObject();
            var that = this;
            var oCF        = oReq.costosFact || {};
            var nEquipos   = (oReq.materialesFact || []).reduce(function (s, m) { return s + (m.subtotal || 0); }, 0);
            var nServicios = (oReq.serviciosFact  || []).reduce(function (s, v) { return s + (v.subtotal || 0); }, 0);
            var nManoObra  = parseFloat(oCF.manoObra  || 0) || 0;
            var nLogistica = parseFloat(oCF.logistica || 0) || 0;
            var nOtros     = parseFloat(oCF.otros     || 0) || 0;
            var nTotal     = nEquipos + nServicios + nManoObra + nLogistica + nOtros;
            var fmt = function (n) {
                return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };
            MessageBox.show(
                "An\u00e1lisis Rentable \u2013 " + oReq.reqId + "\n\n" +
                "Equipos:        USD " + fmt(nEquipos)   + "\n" +
                "Servicios:      USD " + fmt(nServicios)  + "\n" +
                "Mano de Obra:   USD " + fmt(nManoObra)   + "\n" +
                "Log\u00edstica:       USD " + fmt(nLogistica)  + "\n" +
                "Otros:          USD " + fmt(nOtros)      + "\n" +
                "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n" +
                "TOTAL PROYECTO: USD " + fmt(nTotal)      + "\n\n" +
                "Notificaci\u00f3n enviada al equipo Comercial.",
                {
                    title: "An\u00e1lisis Rentable",
                    icon: MessageBox.Icon.INFORMATION,
                    actions: [MessageBox.Action.CLOSE],
                    onClose: function () {
                        var oModel = that.getOwnerComponent().getModel();
                        var sNow   = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                                   + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/estado", "An\u00e1lisis Enviado");
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/ultimaModificacion", sNow);
                        MessageToast.show("An\u00e1lisis enviado al equipo Comercial");
                        that.getRouter().navTo("mcComercialDetail", { reqId: encodeURIComponent(oReq.reqId) });
                    }
                }
            );
        },

        // ── Compras Locales: Descarga/Carga template ─────────────────────
        onCLDescargarTemplate: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { MessageToast.show("Sin datos"); return; }
            var sDate  = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
            var aItems = (oReq.items || []);
            if (!aItems.length) {
                aItems = [
                    { no: 1, tipoItem: "Material", descripcion: "Bater\u00eda UPS 12V",                  categoria: "Energ\u00eda",    motivo: "Falla",      cantidad: 10, unidad: "UND",     ubicacion: "Lima", proveedor: "Proveedor Local", stockCDVES: 2,   stockDist: 2,   observacion: "Reemplazo urgente" },
                    { no: 2, tipoItem: "Material", descripcion: "Cable UTP Cat6",                         categoria: "Cableado",       motivo: "Reposici\u00f3n", cantidad: 100, unidad: "M", ubicacion: "Lima", proveedor: "Proveedor Local", stockCDVES: 50,  stockDist: 30,  observacion: "Stock bajo" },
                    { no: 3, tipoItem: "Material", descripcion: "Herramientas de instalaci\u00f3n",       categoria: "Herramienta",    motivo: "Operativo",  cantidad: 5,  unidad: "UND",     ubicacion: "Lima", proveedor: "Proveedor Local", stockCDVES: 0,   stockDist: 0,   observacion: "Compra directa" },
                    { no: 4, tipoItem: "Servicio", descripcion: "Servicio t\u00e9cnico el\u00e9ctrico",  categoria: "Servicio",       motivo: "Urgente",    cantidad: 1,  unidad: "Servicio", ubicacion: "Lima", proveedor: "T\u00e9cnico Local", stockCDVES: "-", stockDist: "-", observacion: "Instalaci\u00f3n inmediata" }
                ];
            }
            var sBlue = "background:#2E74B5;font-weight:bold;font-family:Arial;font-size:9pt;text-align:center;border:1px solid #1F5C8E;color:#FFFFFF;";
            var sNorm = "font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;";
            var sRgt  = "font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;text-align:right;";
            var sRows = "";
            aItems.forEach(function (m) {
                sRows += "<tr><td style='" + sRgt  + "'>" + (m.no||"") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.tipoItem||"") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.descripcion||"") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.categoria||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.motivo||"-") + "</td>" +
                    "<td style='" + sRgt  + "'>" + (m.cantidad||0) + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.unidad||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.ubicacion||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.proveedor||"-") + "</td>" +
                    "<td style='" + sRgt  + "'>" + (m.stockCDVES||"-") + "</td>" +
                    "<td style='" + sRgt  + "'>" + (m.stockDist||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.observacion||"") + "</td></tr>";
            });
            var sHtml =
                "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel'>" +
                "<head><meta charset='UTF-8'></head><body><table style='font-family:Arial;font-size:9pt;border-collapse:collapse;'>" +
                "<tr><td colspan='12' style='font-weight:bold;font-family:Arial;font-size:12pt;'>TEMPLATE NECESIDAD COMPRAS \u2013 COMPRAS LOCALES</td></tr>" +
                "<tr><td>T\u00edtulo:</td><td colspan='11' style='font-weight:bold;'>" + (oReq.titulo||"") + "</td></tr>" +
                "<tr><td>Canal:</td><td colspan='5' style='font-weight:bold;'>" + (oReq.canal||"Infraestructura") + "</td>" +
                "<td>L\u00ednea de Negocio:</td><td colspan='5' style='font-weight:bold;'>" + (oReq.lineaNegocio||"Compras Locales") + "</td></tr>" +
                "<tr><td colspan='12' style='color:#888;'>" + sDate + "</td></tr><tr><td colspan='12'></td></tr>" +
                "<tr><th style='" + sBlue + "'>N\u00b0</th><th style='" + sBlue + "'>Tipo \u00cdtem</th>" +
                "<th style='" + sBlue + "'>Descripci\u00f3n</th><th style='" + sBlue + "'>Categor\u00eda</th>" +
                "<th style='" + sBlue + "'>Motivo</th><th style='" + sBlue + "'>Cantidad</th>" +
                "<th style='" + sBlue + "'>Unidad</th><th style='" + sBlue + "'>Ubicaci\u00f3n</th>" +
                "<th style='" + sBlue + "'>Proveedor</th>" +
                "<th style='" + sBlue + "'>Stock CD VES al DD.MM</th>" +
                "<th style='" + sBlue + "'>Distribuido al DD.MM</th>" +
                "<th style='" + sBlue + "'>Observaci\u00f3n</th></tr>" +
                sRows +
                "</table></body></html>";
            var oBlob = new Blob(["\ufeff" + sHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
            var sUrl  = URL.createObjectURL(oBlob);
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = (oReq.reqId||"req") + "_template_cl.xls";
            document.body.appendChild(oLink); oLink.click();
            document.body.removeChild(oLink); URL.revokeObjectURL(sUrl);
        },

        onCLCargarTemplate: function () {
            var that   = this;
            var oInput = document.createElement("input");
            oInput.type = "file"; oInput.accept = ".xls,.xlsx"; oInput.style.display = "none";
            document.body.appendChild(oInput);
            oInput.onchange = function (oEvt) {
                var oFile = oEvt.target.files && oEvt.target.files[0];
                if (!oFile) { document.body.removeChild(oInput); return; }
                var oReader = new FileReader();
                oReader.onload = function (e) {
                    try {
                        var oWB   = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
                        var oWS   = oWB.Sheets[oWB.SheetNames[0]];
                        var aRows = XLSX.utils.sheet_to_json(oWS, { header: 1, defval: "" });
                        var iHdr = -1; var mC = {};
                        for (var r = 0; r < aRows.length; r++) {
                            var sRow = aRows[r].join("|");
                            if (sRow.indexOf("Descripci") !== -1 && sRow.indexOf("Cantidad") !== -1) {
                                iHdr = r;
                                aRows[r].forEach(function (h, c) { var s = String(h).trim(); if (s) { mC[s] = c; } });
                                break;
                            }
                        }
                        if (iHdr === -1) { MessageToast.show("No se encontr\u00f3 la fila de encabezados"); document.body.removeChild(oInput); return; }
                        var pN = function (v) { if (!v && v !== 0) { return 0; } if (typeof v === "number") { return v; } var n = parseFloat(String(v).replace(/[^0-9.\-]/g,"")); return isNaN(n) ? 0 : n; };
                        var aItems = []; var iNo = 1;
                        for (var i = iHdr + 1; i < aRows.length; i++) {
                            var row = aRows[i]; var sC = String(row[0]||row[1]||"").trim();
                            if (!sC) { break; }
                            var cTI  = mC["Tipo \u00cdtem"]          !== undefined ? mC["Tipo \u00cdtem"]          : mC["Tipo Item"]    !== undefined ? mC["Tipo Item"]    : 1;
                            var cD   = mC["Descripci\u00f3n"]        !== undefined ? mC["Descripci\u00f3n"]        : mC["Descripcion"] !== undefined ? mC["Descripcion"] : 2;
                            var cCat = mC["Categor\u00eda"]          !== undefined ? mC["Categor\u00eda"]          : mC["Categoria"]   !== undefined ? mC["Categoria"]   : 3;
                            var cMo  = mC["Motivo"]                 !== undefined ? mC["Motivo"]                 : 4;
                            var cCa  = mC["Cantidad"]               !== undefined ? mC["Cantidad"]               : 5;
                            var cUn  = mC["Unidad"]                 !== undefined ? mC["Unidad"]                 : 6;
                            var cUb  = mC["Ubicaci\u00f3n"]          !== undefined ? mC["Ubicaci\u00f3n"]          : mC["Ubicacion"]   !== undefined ? mC["Ubicacion"]   : 7;
                            var cPr  = mC["Proveedor"]              !== undefined ? mC["Proveedor"]              : 8;
                            var cSC  = mC["Stock CD VES al DD.MM"]  !== undefined ? mC["Stock CD VES al DD.MM"]  : 9;
                            var cSD  = mC["Distribuido al DD.MM"]   !== undefined ? mC["Distribuido al DD.MM"]   : 10;
                            var cOb  = mC["Observaci\u00f3n"]        !== undefined ? mC["Observaci\u00f3n"]        : mC["Observacion"] !== undefined ? mC["Observacion"] : 11;
                            var vSC = row[cSC]; var vSD = row[cSD];
                            aItems.push({
                                no: iNo++,
                                tipoItem:   String(row[cTI] ||"").trim(),
                                descripcion: String(row[cD]  ||"").trim(),
                                categoria:  String(row[cCat] ||"-").trim(),
                                motivo:     String(row[cMo]  ||"-").trim(),
                                cantidad:   pN(row[cCa]),
                                unidad:     String(row[cUn]  ||"-").trim(),
                                ubicacion:  String(row[cUb]  ||"-").trim(),
                                proveedor:  String(row[cPr]  ||"-").trim(),
                                stockCDVES: (vSC !== "" && vSC !== undefined) ? String(vSC) : String(Math.floor(Math.random()*400)+50),
                                stockDist:  (vSD !== "" && vSD !== undefined) ? String(vSD) : String(Math.floor(Math.random()*250)+30),
                                observacion: String(row[cOb] ||"").trim()
                            });
                        }
                        if (!aItems.length) { MessageToast.show("No se encontraron \u00edtems"); document.body.removeChild(oInput); return; }
                        that.getOwnerComponent().getModel().setProperty("/requerimientos/" + that._iIndex + "/items", aItems);
                        MessageToast.show(aItems.length + " \u00edte(s) cargado(s) correctamente");
                    } catch (err) { MessageToast.show("Error al procesar el archivo: " + err.message); }
                    document.body.removeChild(oInput);
                };
                oReader.onerror = function () { MessageToast.show("Error al leer el archivo"); document.body.removeChild(oInput); };
                oReader.readAsArrayBuffer(oFile);
            };
            oInput.click();
        },

        onEnviarAprobacionCL: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var oReq = oCtx.getObject();
            var that = this;
            var oItems = oReq.items || [];
            var oAdj   = oReq.adjuntosComprasLocales || {};
            var bAdj   = (oAdj.disenhoOperativo && oAdj.disenhoOperativo.nombre);
            if (!oItems.length) {
                MessageBox.warning("Debe cargar al menos un \u00edtem en la pesta\u00f1a Planificaci\u00f3n antes de enviar.");
                return;
            }
            if (!bAdj) {
                MessageBox.warning("Debe adjuntar el Dise\u00f1o Operativo antes de enviar a aprobaci\u00f3n.");
                return;
            }
            MessageBox.confirm(
                "\u00bfEnviar el requerimiento " + oReq.reqId + " a aprobaci\u00f3n del Jefe \u00c1rea Usuaria?\n\nSe notificar\u00e1 por correo.",
                {
                    title: "Confirmar Env\u00edo",
                    onClose: function (sAction) {
                        if (sAction !== MessageBox.Action.OK) { return; }
                        var oModel = that.getOwnerComponent().getModel();
                        var sNow   = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                                   + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/estado", "En Aprobaci\u00f3n");
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/ultimaModificacion", sNow);
                        that._crearEntradaAprobacion(oReq);
                        MessageToast.show("Necesidad enviada a aprobaci\u00f3n del Jefe \u00c1rea Usuaria");
                    }
                }
            );
        },

        onCLAdjuntar: function (oEvent) {
            var sDocType = oEvent.getSource().data("docType");
            if (!sDocType) { return; }
            var that   = this;
            var oInput = document.createElement("input");
            oInput.type = "file"; oInput.accept = ".pdf,.pptx,.xlsx,.docx,.zip"; oInput.style.display = "none";
            document.body.appendChild(oInput);
            oInput.onchange = function (oEvt) {
                var oFile = oEvt.target.files && oEvt.target.files[0];
                if (!oFile) { document.body.removeChild(oInput); return; }
                that.getOwnerComponent().getModel()
                    .setProperty("/requerimientos/" + that._iIndex + "/adjuntosComprasLocales/" + sDocType + "/nombre", oFile.name);
                MessageToast.show("Archivo adjuntado: " + oFile.name);
                document.body.removeChild(oInput);
            };
            oInput.click();
        },

        // ── O&M: Descarga/Carga template ─────────────────────────────────
        onOMDescargarTemplate: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { MessageToast.show("Sin datos"); return; }
            var sDate  = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
            var aItems = (oReq.items || []);
            if (!aItems.length) {
                aItems = [
                    { no: 1, tipoItem: "Equipo",   descripcion: "Router Cisco ISR 4331",  tipoEquipo: "Router",     motivo: "Falla",      cantidad: 2, tipoIntervencion: "Reposici\u00f3n", ubicacion: "Lima",   proveedor: "Cisco",     stockCDVES: 5,  stockDist: 3,  observacion: "Equipo da\u00f1ado" },
                    { no: 2, tipoItem: "Equipo",   descripcion: "Tarjeta de red",          tipoEquipo: "Componente", motivo: "Falla",      cantidad: 4, tipoIntervencion: "Reposici\u00f3n", ubicacion: "Lima",   proveedor: "Huawei",    stockCDVES: 10, stockDist: 7,  observacion: "Repuesto cr\u00edtico" },
                    { no: 3, tipoItem: "Servicio", descripcion: "Reparaci\u00f3n de equipo", tipoEquipo: "Soporte",  motivo: "Falla",      cantidad: 1, tipoIntervencion: "Correctivo",      ubicacion: "Lima",   proveedor: "Partner X", stockCDVES: "-", stockDist: "-", observacion: "Diagn\u00f3stico incluido" },
                    { no: 4, tipoItem: "Servicio", descripcion: "Mantenimiento preventivo", tipoEquipo: "Soporte",  motivo: "Preventivo", cantidad: 1, tipoIntervencion: "Preventivo",      ubicacion: "Lima",   proveedor: "Partner X", stockCDVES: "-", stockDist: "-", observacion: "Revisi\u00f3n peri\u00f3dica" }
                ];
            }
            var sBlue = "background:#2E74B5;font-weight:bold;font-family:Arial;font-size:9pt;text-align:center;border:1px solid #1F5C8E;color:#FFFFFF;";
            var sNorm = "font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;";
            var sRgt  = "font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;text-align:right;";
            var sRows = "";
            aItems.forEach(function (m) {
                sRows += "<tr><td style='" + sRgt  + "'>" + (m.no||"") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.tipoItem||"") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.descripcion||"") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.tipoEquipo||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.motivo||"-") + "</td>" +
                    "<td style='" + sRgt  + "'>" + (m.cantidad||0) + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.tipoIntervencion||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.ubicacion||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.proveedor||"-") + "</td>" +
                    "<td style='" + sRgt  + "'>" + (m.stockCDVES||"-") + "</td>" +
                    "<td style='" + sRgt  + "'>" + (m.stockDist||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.observacion||"") + "</td></tr>";
            });
            var sHtml =
                "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel'>" +
                "<head><meta charset='UTF-8'></head><body><table style='font-family:Arial;font-size:9pt;border-collapse:collapse;'>" +
                "<tr><td colspan='12' style='font-weight:bold;font-family:Arial;font-size:12pt;'>TEMPLATE NECESIDAD COMPRAS \u2013 O&amp;M</td></tr>" +
                "<tr><td>T\u00edtulo:</td><td colspan='11' style='font-weight:bold;'>" + (oReq.titulo||"") + "</td></tr>" +
                "<tr><td>Canal:</td><td colspan='5' style='font-weight:bold;'>" + (oReq.canal||"Infraestructura") + "</td>" +
                "<td>L\u00ednea de Negocio:</td><td colspan='5' style='font-weight:bold;'>" + (oReq.lineaNegocio||"O&M") + "</td></tr>" +
                "<tr><td colspan='12' style='color:#888;'>" + sDate + "</td></tr><tr><td colspan='12'></td></tr>" +
                "<tr><th style='" + sBlue + "'>N\u00b0</th><th style='" + sBlue + "'>Tipo \u00cdtem</th>" +
                "<th style='" + sBlue + "'>Descripci\u00f3n</th><th style='" + sBlue + "'>Tipo Equipo</th>" +
                "<th style='" + sBlue + "'>Motivo</th><th style='" + sBlue + "'>Cantidad</th>" +
                "<th style='" + sBlue + "'>Tipo Intervenci\u00f3n</th><th style='" + sBlue + "'>Ubicaci\u00f3n</th>" +
                "<th style='" + sBlue + "'>Proveedor</th>" +
                "<th style='" + sBlue + "'>Stock CD VES al DD.MM</th>" +
                "<th style='" + sBlue + "'>Distribuido al DD.MM</th>" +
                "<th style='" + sBlue + "'>Observaci\u00f3n</th></tr>" +
                sRows +
                "</table></body></html>";
            var oBlob = new Blob(["\ufeff" + sHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
            var sUrl  = URL.createObjectURL(oBlob);
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = (oReq.reqId||"req") + "_template_om.xls";
            document.body.appendChild(oLink); oLink.click();
            document.body.removeChild(oLink); URL.revokeObjectURL(sUrl);
        },

        onOMCargarTemplate: function () {
            var that   = this;
            var oInput = document.createElement("input");
            oInput.type = "file"; oInput.accept = ".xls,.xlsx"; oInput.style.display = "none";
            document.body.appendChild(oInput);
            oInput.onchange = function (oEvt) {
                var oFile = oEvt.target.files && oEvt.target.files[0];
                if (!oFile) { document.body.removeChild(oInput); return; }
                var oReader = new FileReader();
                oReader.onload = function (e) {
                    try {
                        var oWB   = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
                        var oWS   = oWB.Sheets[oWB.SheetNames[0]];
                        var aRows = XLSX.utils.sheet_to_json(oWS, { header: 1, defval: "" });
                        var iHdr = -1; var mC = {};
                        for (var r = 0; r < aRows.length; r++) {
                            var sRow = aRows[r].join("|");
                            if (sRow.indexOf("Descripci") !== -1 && sRow.indexOf("Cantidad") !== -1) {
                                iHdr = r;
                                aRows[r].forEach(function (h, c) { var s = String(h).trim(); if (s) { mC[s] = c; } });
                                break;
                            }
                        }
                        if (iHdr === -1) { MessageToast.show("No se encontr\u00f3 la fila de encabezados"); document.body.removeChild(oInput); return; }
                        var pN = function (v) { if (!v && v !== 0) { return 0; } if (typeof v === "number") { return v; } var n = parseFloat(String(v).replace(/[^0-9.\-]/g,"")); return isNaN(n) ? 0 : n; };
                        var aItems = []; var iNo = 1;
                        for (var i = iHdr + 1; i < aRows.length; i++) {
                            var row = aRows[i]; var sC = String(row[0]||row[1]||"").trim();
                            if (!sC) { break; }
                            var cTI  = mC["Tipo \u00cdtem"]          !== undefined ? mC["Tipo \u00cdtem"]          : mC["Tipo Item"]          !== undefined ? mC["Tipo Item"]          : 1;
                            var cD   = mC["Descripci\u00f3n"]        !== undefined ? mC["Descripci\u00f3n"]        : mC["Descripcion"]        !== undefined ? mC["Descripcion"]        : 2;
                            var cTE  = mC["Tipo Equipo"]            !== undefined ? mC["Tipo Equipo"]            : 3;
                            var cMo  = mC["Motivo"]                 !== undefined ? mC["Motivo"]                 : 4;
                            var cCa  = mC["Cantidad"]               !== undefined ? mC["Cantidad"]               : 5;
                            var cTIn = mC["Tipo Intervenci\u00f3n"] !== undefined ? mC["Tipo Intervenci\u00f3n"] : mC["Tipo Intervencion"] !== undefined ? mC["Tipo Intervencion"] : 6;
                            var cUb  = mC["Ubicaci\u00f3n"]          !== undefined ? mC["Ubicaci\u00f3n"]          : mC["Ubicacion"]          !== undefined ? mC["Ubicacion"]          : 7;
                            var cPr  = mC["Proveedor"]              !== undefined ? mC["Proveedor"]              : 8;
                            var cSC  = mC["Stock CD VES al DD.MM"]  !== undefined ? mC["Stock CD VES al DD.MM"]  : 9;
                            var cSD  = mC["Distribuido al DD.MM"]   !== undefined ? mC["Distribuido al DD.MM"]   : 10;
                            var cOb  = mC["Observaci\u00f3n"]        !== undefined ? mC["Observaci\u00f3n"]        : mC["Observacion"]        !== undefined ? mC["Observacion"]        : 11;
                            var vSC = row[cSC]; var vSD = row[cSD];
                            aItems.push({
                                no: iNo++,
                                tipoItem:         String(row[cTI] ||"").trim(),
                                descripcion:      String(row[cD]  ||"").trim(),
                                tipoEquipo:       String(row[cTE] ||"-").trim(),
                                motivo:           String(row[cMo] ||"-").trim(),
                                cantidad:         pN(row[cCa]),
                                tipoIntervencion: String(row[cTIn]||"-").trim(),
                                ubicacion:        String(row[cUb] ||"-").trim(),
                                proveedor:        String(row[cPr] ||"-").trim(),
                                stockCDVES:       (vSC !== "" && vSC !== undefined) ? String(vSC) : String(Math.floor(Math.random()*400)+50),
                                stockDist:        (vSD !== "" && vSD !== undefined) ? String(vSD) : String(Math.floor(Math.random()*250)+30),
                                observacion:      String(row[cOb] ||"").trim()
                            });
                        }
                        if (!aItems.length) { MessageToast.show("No se encontraron \u00edtems"); document.body.removeChild(oInput); return; }
                        that.getOwnerComponent().getModel().setProperty("/requerimientos/" + that._iIndex + "/items", aItems);
                        MessageToast.show(aItems.length + " \u00edte(s) cargado(s) correctamente");
                    } catch (err) { MessageToast.show("Error al procesar el archivo: " + err.message); }
                    document.body.removeChild(oInput);
                };
                oReader.onerror = function () { MessageToast.show("Error al leer el archivo"); document.body.removeChild(oInput); };
                oReader.readAsArrayBuffer(oFile);
            };
            oInput.click();
        },

        onEnviarAprobacionOM: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var oReq = oCtx.getObject();
            var that = this;
            var oItems = oReq.items || [];
            var oAdj   = oReq.adjuntosOM || {};
            var bAdj   = (oAdj.disenhoTecnico && oAdj.disenhoTecnico.nombre);
            if (!oItems.length) {
                MessageBox.warning("Debe cargar al menos un \u00edtem en la pesta\u00f1a Planificaci\u00f3n antes de enviar.");
                return;
            }
            if (!bAdj) {
                MessageBox.warning("Debe adjuntar el Dise\u00f1o T\u00e9cnico antes de enviar a aprobaci\u00f3n.");
                return;
            }
            MessageBox.confirm(
                "\u00bfEnviar el requerimiento " + oReq.reqId + " a aprobaci\u00f3n del Jefe O&M?\n\nSe notificar\u00e1 por correo.",
                {
                    title: "Confirmar Env\u00edo",
                    onClose: function (sAction) {
                        if (sAction !== MessageBox.Action.OK) { return; }
                        var oModel = that.getOwnerComponent().getModel();
                        var sNow   = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                                   + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/estado", "En Aprobaci\u00f3n");
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/ultimaModificacion", sNow);
                        that._crearEntradaAprobacion(oReq);
                        MessageToast.show("Necesidad enviada a aprobaci\u00f3n del Jefe O&M");
                    }
                }
            );
        },

        onOMAdjuntar: function (oEvent) {
            var sDocType = oEvent.getSource().data("docType");
            if (!sDocType) { return; }
            var that   = this;
            var oInput = document.createElement("input");
            oInput.type = "file"; oInput.accept = ".pdf,.pptx,.xlsx,.docx,.zip"; oInput.style.display = "none";
            document.body.appendChild(oInput);
            oInput.onchange = function (oEvt) {
                var oFile = oEvt.target.files && oEvt.target.files[0];
                if (!oFile) { document.body.removeChild(oInput); return; }
                that.getOwnerComponent().getModel()
                    .setProperty("/requerimientos/" + that._iIndex + "/adjuntosOM/" + sDocType + "/nombre", oFile.name);
                MessageToast.show("Archivo adjuntado: " + oFile.name);
                document.body.removeChild(oInput);
            };
            oInput.click();
        },

        // ── Red Fija: Descarga/Carga template ────────────────────────────
        onRFDescargarTemplate: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { MessageToast.show("Sin datos"); return; }
            var sDate  = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
            var aItems = (oReq.items || []);
            if (!aItems.length) {
                aItems = [
                    { no: 1, tipoItem: "Equipo",   descripcion: "Cable Fibra \u00d3ptica", tipoRed: "FO", capacidad: "48 hilos",   cantidad: 500, tipoInstalacion: "Subterr\u00e1neo", ubicacion: "Callao", proveedor: "Proveedor Local", stockCDVES: 200, stockDist: 150, observacion: "Nueva red" },
                    { no: 2, tipoItem: "Equipo",   descripcion: "ODF (Distribuidor)",    tipoRed: "FO", capacidad: "24 puertos", cantidad: 5,   tipoInstalacion: "Nodo",          ubicacion: "Callao", proveedor: "Huawei",          stockCDVES: 10,  stockDist: 8,   observacion: "Ampliaci\u00f3n" },
                    { no: 3, tipoItem: "Equipo",   descripcion: "Switch de Acceso",      tipoRed: "IP", capacidad: "1 Gbps",    cantidad: 10,  tipoInstalacion: "Sala t\u00e9cnica",  ubicacion: "Callao", proveedor: "Cisco",           stockCDVES: 15,  stockDist: 10,  observacion: "Integraci\u00f3n red" },
                    { no: 4, tipoItem: "Servicio", descripcion: "Instalaci\u00f3n fibra",     tipoRed: "FO", capacidad: "-",         cantidad: 1,   tipoInstalacion: "Campo",         ubicacion: "Callao", proveedor: "Partner X",       stockCDVES: "-", stockDist: "-", observacion: "Incluye tendido" },
                    { no: 5, tipoItem: "Servicio", descripcion: "Configuraci\u00f3n",          tipoRed: "IP", capacidad: "-",         cantidad: 1,   tipoInstalacion: "Remoto",        ubicacion: "Callao", proveedor: "Partner X",       stockCDVES: "-", stockDist: "-", observacion: "Configuraci\u00f3n final" }
                ];
            }
            var sBlue = "background:#2E74B5;font-weight:bold;font-family:Arial;font-size:9pt;text-align:center;border:1px solid #1F5C8E;color:#FFFFFF;";
            var sNorm = "font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;";
            var sRgt  = "font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;text-align:right;";
            var sRows = "";
            aItems.forEach(function (m) {
                sRows += "<tr><td style='" + sRgt  + "'>" + (m.no||"") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.tipoItem||"") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.descripcion||"") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.tipoRed||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.capacidad||"-") + "</td>" +
                    "<td style='" + sRgt  + "'>" + (m.cantidad||0) + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.tipoInstalacion||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.ubicacion||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.proveedor||"-") + "</td>" +
                    "<td style='" + sRgt  + "'>" + (m.stockCDVES||"-") + "</td>" +
                    "<td style='" + sRgt  + "'>" + (m.stockDist||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.observacion||"") + "</td></tr>";
            });
            var sHtml =
                "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel'>" +
                "<head><meta charset='UTF-8'></head><body><table style='font-family:Arial;font-size:9pt;border-collapse:collapse;'>" +
                "<tr><td colspan='12' style='font-weight:bold;font-family:Arial;font-size:12pt;'>TEMPLATE NECESIDAD COMPRAS \u2013 RED FIJA</td></tr>" +
                "<tr><td>T\u00edtulo:</td><td colspan='11' style='font-weight:bold;'>" + (oReq.titulo||"") + "</td></tr>" +
                "<tr><td>Canal:</td><td colspan='5' style='font-weight:bold;'>" + (oReq.canal||"Infraestructura") + "</td>" +
                "<td>L\u00ednea de Negocio:</td><td colspan='5' style='font-weight:bold;'>" + (oReq.lineaNegocio||"Red Fija") + "</td></tr>" +
                "<tr><td colspan='12' style='color:#888;'>" + sDate + "</td></tr><tr><td colspan='12'></td></tr>" +
                "<tr><th style='" + sBlue + "'>N\u00b0</th><th style='" + sBlue + "'>Tipo \u00cdtem</th>" +
                "<th style='" + sBlue + "'>Descripci\u00f3n</th><th style='" + sBlue + "'>Tipo Red</th>" +
                "<th style='" + sBlue + "'>Capacidad</th><th style='" + sBlue + "'>Cantidad</th>" +
                "<th style='" + sBlue + "'>Tipo Instalaci\u00f3n</th><th style='" + sBlue + "'>Ubicaci\u00f3n</th>" +
                "<th style='" + sBlue + "'>Proveedor</th>" +
                "<th style='" + sBlue + "'>Stock CD VES al DD.MM</th>" +
                "<th style='" + sBlue + "'>Distribuido al DD.MM</th>" +
                "<th style='" + sBlue + "'>Observaci\u00f3n</th></tr>" +
                sRows +
                "</table></body></html>";
            var oBlob = new Blob(["\ufeff" + sHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
            var sUrl  = URL.createObjectURL(oBlob);
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = (oReq.reqId||"req") + "_template_red_fija.xls";
            document.body.appendChild(oLink); oLink.click();
            document.body.removeChild(oLink); URL.revokeObjectURL(sUrl);
        },

        onRFCargarTemplate: function () {
            var that   = this;
            var oInput = document.createElement("input");
            oInput.type = "file"; oInput.accept = ".xls,.xlsx"; oInput.style.display = "none";
            document.body.appendChild(oInput);
            oInput.onchange = function (oEvt) {
                var oFile = oEvt.target.files && oEvt.target.files[0];
                if (!oFile) { document.body.removeChild(oInput); return; }
                var oReader = new FileReader();
                oReader.onload = function (e) {
                    try {
                        var oWB   = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
                        var oWS   = oWB.Sheets[oWB.SheetNames[0]];
                        var aRows = XLSX.utils.sheet_to_json(oWS, { header: 1, defval: "" });
                        var iHdr = -1; var mC = {};
                        for (var r = 0; r < aRows.length; r++) {
                            var sRow = aRows[r].join("|");
                            if (sRow.indexOf("Descripci") !== -1 && sRow.indexOf("Cantidad") !== -1) {
                                iHdr = r;
                                aRows[r].forEach(function (h, c) { var s = String(h).trim(); if (s) { mC[s] = c; } });
                                break;
                            }
                        }
                        if (iHdr === -1) { MessageToast.show("No se encontr\u00f3 la fila de encabezados"); document.body.removeChild(oInput); return; }
                        var pN = function (v) { if (!v && v !== 0) { return 0; } if (typeof v === "number") { return v; } var n = parseFloat(String(v).replace(/[^0-9.\-]/g,"")); return isNaN(n) ? 0 : n; };
                        var aItems = []; var iNo = 1;
                        for (var i = iHdr + 1; i < aRows.length; i++) {
                            var row = aRows[i]; var sC = String(row[0]||row[1]||"").trim();
                            if (!sC) { break; }
                            var cTI = mC["Tipo \u00cdtem"]         !== undefined ? mC["Tipo \u00cdtem"]         : mC["Tipo Item"]         !== undefined ? mC["Tipo Item"]         : 1;
                            var cD  = mC["Descripci\u00f3n"]       !== undefined ? mC["Descripci\u00f3n"]       : mC["Descripcion"]       !== undefined ? mC["Descripcion"]       : 2;
                            var cTR = mC["Tipo Red"]              !== undefined ? mC["Tipo Red"]              : 3;
                            var cCp = mC["Capacidad"]             !== undefined ? mC["Capacidad"]             : 4;
                            var cCa = mC["Cantidad"]              !== undefined ? mC["Cantidad"]              : 5;
                            var cTI2= mC["Tipo Instalaci\u00f3n"] !== undefined ? mC["Tipo Instalaci\u00f3n"] : mC["Tipo Instalacion"]  !== undefined ? mC["Tipo Instalacion"]  : 6;
                            var cUb = mC["Ubicaci\u00f3n"]         !== undefined ? mC["Ubicaci\u00f3n"]         : mC["Ubicacion"]         !== undefined ? mC["Ubicacion"]         : 7;
                            var cPr = mC["Proveedor"]             !== undefined ? mC["Proveedor"]             : 8;
                            var cSC = mC["Stock CD VES al DD.MM"] !== undefined ? mC["Stock CD VES al DD.MM"] : 9;
                            var cSD = mC["Distribuido al DD.MM"]  !== undefined ? mC["Distribuido al DD.MM"]  : 10;
                            var cOb = mC["Observaci\u00f3n"]       !== undefined ? mC["Observaci\u00f3n"]       : mC["Observacion"]       !== undefined ? mC["Observacion"]       : 11;
                            var vSC = row[cSC]; var vSD = row[cSD];
                            aItems.push({
                                no: iNo++,
                                tipoItem:        String(row[cTI] ||"").trim(),
                                descripcion:     String(row[cD]  ||"").trim(),
                                tipoRed:         String(row[cTR] ||"-").trim(),
                                capacidad:       String(row[cCp] ||"-").trim(),
                                cantidad:        pN(row[cCa]),
                                tipoInstalacion: String(row[cTI2]||"-").trim(),
                                ubicacion:       String(row[cUb] ||"-").trim(),
                                proveedor:       String(row[cPr] ||"-").trim(),
                                stockCDVES:      (vSC !== "" && vSC !== undefined) ? String(vSC) : String(Math.floor(Math.random()*400)+50),
                                stockDist:       (vSD !== "" && vSD !== undefined) ? String(vSD) : String(Math.floor(Math.random()*250)+30),
                                observacion:     String(row[cOb] ||"").trim()
                            });
                        }
                        if (!aItems.length) { MessageToast.show("No se encontraron \u00edtems"); document.body.removeChild(oInput); return; }
                        that.getOwnerComponent().getModel().setProperty("/requerimientos/" + that._iIndex + "/items", aItems);
                        MessageToast.show(aItems.length + " \u00edte(s) cargado(s) correctamente");
                    } catch (err) { MessageToast.show("Error al procesar el archivo: " + err.message); }
                    document.body.removeChild(oInput);
                };
                oReader.onerror = function () { MessageToast.show("Error al leer el archivo"); document.body.removeChild(oInput); };
                oReader.readAsArrayBuffer(oFile);
            };
            oInput.click();
        },

        onEnviarAprobacionRedFija: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var oReq = oCtx.getObject();
            var that = this;
            var oItems = oReq.items || [];
            var oAdj   = oReq.adjuntosRedFija || {};
            var bAdj   = (oAdj.disenhoTecnico && oAdj.disenhoTecnico.nombre);
            if (!oItems.length) {
                MessageBox.warning("Debe cargar al menos un \u00edtem en la pesta\u00f1a Planificaci\u00f3n antes de enviar.");
                return;
            }
            if (!bAdj) {
                MessageBox.warning("Debe adjuntar el Dise\u00f1o T\u00e9cnico antes de enviar a aprobaci\u00f3n.");
                return;
            }
            MessageBox.confirm(
                "\u00bfEnviar el requerimiento " + oReq.reqId + " a aprobaci\u00f3n del Jefe de Ingenier\u00eda Red Fija?\n\nSe notificar\u00e1 por correo.",
                {
                    title: "Confirmar Env\u00edo",
                    onClose: function (sAction) {
                        if (sAction !== MessageBox.Action.OK) { return; }
                        var oModel = that.getOwnerComponent().getModel();
                        var sNow   = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                                   + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/estado", "En Aprobaci\u00f3n");
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/ultimaModificacion", sNow);
                        that._crearEntradaAprobacion(oReq);
                        MessageToast.show("Necesidad enviada a aprobaci\u00f3n del Jefe Red Fija");
                    }
                }
            );
        },

        onRFAdjuntar: function (oEvent) {
            var sDocType = oEvent.getSource().data("docType");
            if (!sDocType) { return; }
            var that   = this;
            var oInput = document.createElement("input");
            oInput.type = "file"; oInput.accept = ".pdf,.pptx,.xlsx,.docx,.zip"; oInput.style.display = "none";
            document.body.appendChild(oInput);
            oInput.onchange = function (oEvt) {
                var oFile = oEvt.target.files && oEvt.target.files[0];
                if (!oFile) { document.body.removeChild(oInput); return; }
                that.getOwnerComponent().getModel()
                    .setProperty("/requerimientos/" + that._iIndex + "/adjuntosRedFija/" + sDocType + "/nombre", oFile.name);
                MessageToast.show("Archivo adjuntado: " + oFile.name);
                document.body.removeChild(oInput);
            };
            oInput.click();
        },

        // ── Red Movil: Descarga/Carga template ───────────────────────────
        onRMDescargarTemplate: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { MessageToast.show("Sin datos"); return; }
            var sDate  = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
            var aItems = (oReq.items || []);
            if (!aItems.length) {
                aItems = [
                    { no: 1, tipoItem: "Equipo",   descripcion: "Radio Base Huawei",  tecnologia: "4G", banda: "700 MHz",  cantidad: 3, tipoSitio: "Torre",  ubicacion: "Piura",    proveedor: "Huawei",    stockCDVES: 10, stockDist: 5,  observacion: "Nueva cobertura" },
                    { no: 2, tipoItem: "Equipo",   descripcion: "Antena Sectorial",   tecnologia: "4G", banda: "1800 MHz", cantidad: 6, tipoSitio: "Torre",  ubicacion: "Piura",    proveedor: "Huawei",    stockCDVES: 20, stockDist: 12, observacion: "Ampliaci\u00f3n" },
                    { no: 3, tipoItem: "Servicio", descripcion: "Instalaci\u00f3n sitio", tecnologia: "-",  banda: "-",        cantidad: 1, tipoSitio: "Torre",  ubicacion: "Piura",    proveedor: "Partner X", stockCDVES: "-", stockDist: "-", observacion: "Incluye montaje" },
                    { no: 4, tipoItem: "Servicio", descripcion: "Configuraci\u00f3n",    tecnologia: "4G", banda: "-",        cantidad: 1, tipoSitio: "N/A",   ubicacion: "Remoto",   proveedor: "Partner X", stockCDVES: "-", stockDist: "-", observacion: "Integraci\u00f3n core" }
                ];
            }
            var sBlue = "background:#2E74B5;font-weight:bold;font-family:Arial;font-size:9pt;text-align:center;border:1px solid #1F5C8E;color:#FFFFFF;";
            var sNorm = "font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;";
            var sRgt  = "font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;text-align:right;";
            var sRows = "";
            aItems.forEach(function (m) {
                sRows += "<tr><td style='" + sRgt  + "'>" + (m.no||"") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.tipoItem||"") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.descripcion||"") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.tecnologia||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.banda||"-") + "</td>" +
                    "<td style='" + sRgt  + "'>" + (m.cantidad||0) + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.tipoSitio||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.ubicacion||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.proveedor||"-") + "</td>" +
                    "<td style='" + sRgt  + "'>" + (m.stockCDVES||"-") + "</td>" +
                    "<td style='" + sRgt  + "'>" + (m.stockDist||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.observacion||"") + "</td></tr>";
            });
            var sHtml =
                "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel'>" +
                "<head><meta charset='UTF-8'></head><body><table style='font-family:Arial;font-size:9pt;border-collapse:collapse;'>" +
                "<tr><td colspan='12' style='font-weight:bold;font-family:Arial;font-size:12pt;'>TEMPLATE NECESIDAD COMPRAS \u2013 RED M\u00d3VIL</td></tr>" +
                "<tr><td>T\u00edtulo:</td><td colspan='11' style='font-weight:bold;'>" + (oReq.titulo||"") + "</td></tr>" +
                "<tr><td>Canal:</td><td colspan='5' style='font-weight:bold;'>" + (oReq.canal||"Infraestructura") + "</td>" +
                "<td>L\u00ednea de Negocio:</td><td colspan='5' style='font-weight:bold;'>" + (oReq.lineaNegocio||"Red Movil") + "</td></tr>" +
                "<tr><td colspan='12' style='color:#888;'>" + sDate + "</td></tr><tr><td colspan='12'></td></tr>" +
                "<tr><th style='" + sBlue + "'>N\u00b0</th><th style='" + sBlue + "'>Tipo \u00cdtem</th>" +
                "<th style='" + sBlue + "'>Descripci\u00f3n</th><th style='" + sBlue + "'>Tecnolog\u00eda</th>" +
                "<th style='" + sBlue + "'>Banda</th><th style='" + sBlue + "'>Cantidad</th>" +
                "<th style='" + sBlue + "'>Tipo Sitio</th><th style='" + sBlue + "'>Ubicaci\u00f3n</th>" +
                "<th style='" + sBlue + "'>Proveedor</th>" +
                "<th style='" + sBlue + "'>Stock CD VES al DD.MM</th>" +
                "<th style='" + sBlue + "'>Distribuido al DD.MM</th>" +
                "<th style='" + sBlue + "'>Observaci\u00f3n</th></tr>" +
                sRows +
                "</table></body></html>";
            var oBlob = new Blob(["\ufeff" + sHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
            var sUrl  = URL.createObjectURL(oBlob);
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = (oReq.reqId||"req") + "_template_red_movil.xls";
            document.body.appendChild(oLink); oLink.click();
            document.body.removeChild(oLink); URL.revokeObjectURL(sUrl);
        },

        onRMCargarTemplate: function () {
            var that   = this;
            var oInput = document.createElement("input");
            oInput.type = "file"; oInput.accept = ".xls,.xlsx"; oInput.style.display = "none";
            document.body.appendChild(oInput);
            oInput.onchange = function (oEvt) {
                var oFile = oEvt.target.files && oEvt.target.files[0];
                if (!oFile) { document.body.removeChild(oInput); return; }
                var oReader = new FileReader();
                oReader.onload = function (e) {
                    try {
                        var oWB   = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
                        var oWS   = oWB.Sheets[oWB.SheetNames[0]];
                        var aRows = XLSX.utils.sheet_to_json(oWS, { header: 1, defval: "" });
                        var iHdr = -1; var mC = {};
                        for (var r = 0; r < aRows.length; r++) {
                            var sRow = aRows[r].join("|");
                            if (sRow.indexOf("Descripci") !== -1 && sRow.indexOf("Cantidad") !== -1) {
                                iHdr = r;
                                aRows[r].forEach(function (h, c) { var s = String(h).trim(); if (s) { mC[s] = c; } });
                                break;
                            }
                        }
                        if (iHdr === -1) { MessageToast.show("No se encontr\u00f3 la fila de encabezados"); document.body.removeChild(oInput); return; }
                        var pN = function (v) { if (!v && v !== 0) { return 0; } if (typeof v === "number") { return v; } var n = parseFloat(String(v).replace(/[^0-9.\-]/g,"")); return isNaN(n) ? 0 : n; };
                        var aItems = []; var iNo = 1;
                        for (var i = iHdr + 1; i < aRows.length; i++) {
                            var row = aRows[i]; var sC = String(row[0]||row[1]||"").trim();
                            if (!sC) { break; }
                            var cTI = mC["Tipo \u00cdtem"]   !== undefined ? mC["Tipo \u00cdtem"]   : mC["Tipo Item"]  !== undefined ? mC["Tipo Item"]  : 1;
                            var cD  = mC["Descripci\u00f3n"] !== undefined ? mC["Descripci\u00f3n"] : mC["Descripcion"] !== undefined ? mC["Descripcion"] : 2;
                            var cTc = mC["Tecnolog\u00eda"]  !== undefined ? mC["Tecnolog\u00eda"]  : mC["Tecnologia"]  !== undefined ? mC["Tecnologia"]  : 3;
                            var cBa = mC["Banda"]           !== undefined ? mC["Banda"]           : 4;
                            var cCa = mC["Cantidad"]        !== undefined ? mC["Cantidad"]        : 5;
                            var cTS = mC["Tipo Sitio"]      !== undefined ? mC["Tipo Sitio"]      : 6;
                            var cUb = mC["Ubicaci\u00f3n"]  !== undefined ? mC["Ubicaci\u00f3n"]  : mC["Ubicacion"]  !== undefined ? mC["Ubicacion"]  : 7;
                            var cPr = mC["Proveedor"]       !== undefined ? mC["Proveedor"]       : 8;
                            var cSC = mC["Stock CD VES al DD.MM"] !== undefined ? mC["Stock CD VES al DD.MM"] : 9;
                            var cSD = mC["Distribuido al DD.MM"]  !== undefined ? mC["Distribuido al DD.MM"]  : 10;
                            var cOb = mC["Observaci\u00f3n"] !== undefined ? mC["Observaci\u00f3n"] : mC["Observacion"] !== undefined ? mC["Observacion"] : 11;
                            var vSC = row[cSC]; var vSD = row[cSD];
                            aItems.push({
                                no: iNo++,
                                tipoItem:    String(row[cTI]||"").trim(),
                                descripcion: String(row[cD] ||"").trim(),
                                tecnologia:  String(row[cTc]||"-").trim(),
                                banda:       String(row[cBa]||"-").trim(),
                                cantidad:    pN(row[cCa]),
                                tipoSitio:   String(row[cTS]||"-").trim(),
                                ubicacion:   String(row[cUb]||"-").trim(),
                                proveedor:   String(row[cPr]||"-").trim(),
                                stockCDVES:  (vSC !== "" && vSC !== undefined) ? String(vSC) : String(Math.floor(Math.random()*400)+50),
                                stockDist:   (vSD !== "" && vSD !== undefined) ? String(vSD) : String(Math.floor(Math.random()*250)+30),
                                observacion: String(row[cOb]||"").trim()
                            });
                        }
                        if (!aItems.length) { MessageToast.show("No se encontraron \u00edtems"); document.body.removeChild(oInput); return; }
                        that.getOwnerComponent().getModel().setProperty("/requerimientos/" + that._iIndex + "/items", aItems);
                        MessageToast.show(aItems.length + " \u00edte(s) cargado(s) correctamente");
                    } catch (err) { MessageToast.show("Error al procesar el archivo: " + err.message); }
                    document.body.removeChild(oInput);
                };
                oReader.onerror = function () { MessageToast.show("Error al leer el archivo"); document.body.removeChild(oInput); };
                oReader.readAsArrayBuffer(oFile);
            };
            oInput.click();
        },

        onEnviarAprobacionRedMovil: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var oReq = oCtx.getObject();
            var that = this;
            var oItems = oReq.items || [];
            var oAdj   = oReq.adjuntosRedMovil || {};
            var bAdj   = (oAdj.disenhoTecnico && oAdj.disenhoTecnico.nombre);
            if (!oItems.length) {
                MessageBox.warning("Debe cargar al menos un \u00edtem en la pesta\u00f1a Planificaci\u00f3n antes de enviar.");
                return;
            }
            if (!bAdj) {
                MessageBox.warning("Debe adjuntar el Dise\u00f1o T\u00e9cnico antes de enviar a aprobaci\u00f3n.");
                return;
            }
            MessageBox.confirm(
                "\u00bfEnviar el requerimiento " + oReq.reqId + " a aprobaci\u00f3n del Jefe de Ingenier\u00eda Red M\u00f3vil?\n\nSe notificar\u00e1 por correo.",
                {
                    title: "Confirmar Env\u00edo",
                    onClose: function (sAction) {
                        if (sAction !== MessageBox.Action.OK) { return; }
                        var oModel = that.getOwnerComponent().getModel();
                        var sNow   = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                                   + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/estado", "En Aprobaci\u00f3n");
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/ultimaModificacion", sNow);
                        that._crearEntradaAprobacion(oReq);
                        MessageToast.show("Necesidad enviada a aprobaci\u00f3n del Jefe Red M\u00f3vil");
                    }
                }
            );
        },

        onRMAdjuntar: function (oEvent) {
            var sDocType = oEvent.getSource().data("docType");
            if (!sDocType) { return; }
            var that   = this;
            var oInput = document.createElement("input");
            oInput.type = "file"; oInput.accept = ".pdf,.pptx,.xlsx,.docx,.zip"; oInput.style.display = "none";
            document.body.appendChild(oInput);
            oInput.onchange = function (oEvt) {
                var oFile = oEvt.target.files && oEvt.target.files[0];
                if (!oFile) { document.body.removeChild(oInput); return; }
                that.getOwnerComponent().getModel()
                    .setProperty("/requerimientos/" + that._iIndex + "/adjuntosRedMovil/" + sDocType + "/nombre", oFile.name);
                MessageToast.show("Archivo adjuntado: " + oFile.name);
                document.body.removeChild(oInput);
            };
            oInput.click();
        },

        // ── Comercial: KPI & Costos computation ───────────────────────────
        _updateComercialKPIs: function (iIndex) {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + iIndex);
            if (!oReq) { return; }
            var fmt  = function (n) { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
            var fmtP = function (n) { return n.toFixed(1) + "%"; };
            var nEquipos   = (oReq.materialesFact || []).reduce(function (s, m) { return s + (m.subtotal || 0); }, 0);
            var nServicios = (oReq.serviciosFact  || []).reduce(function (s, v) { return s + (v.subtotal || 0); }, 0);
            var oCF        = oReq.costosFact || {};
            var nManoObra  = parseFloat(oCF.manoObra || 0) || 0;
            var nTotalCost = nEquipos + nServicios + nManoObra;
            var oCD        = oReq.comercialData || {};
            var nIngresos  = parseFloat(oCD.ingresos || 0) || 0;
            var nMargen    = nIngresos - nTotalCost;
            var nRent      = nIngresos > 0 ? (nMargen / nIngresos) * 100 : 0;
            var nROI       = nTotalCost > 0 ? (nMargen / nTotalCost) * 100 : 0;
            // Update Costos & Ingresos tab
            var oE = this.byId("comCostosEquipos");   if (oE) { oE.setText(fmt(nEquipos)); }
            var oS = this.byId("comCostosServicios"); if (oS) { oS.setText(fmt(nServicios)); }
            var oT = this.byId("comCostosTotal");     if (oT) { oT.setText(fmt(nTotalCost)); }
            // Update KPIs tab
            var oKM  = this.byId("kpiMargen");        if (oKM) { oKM.setText(fmt(nMargen)); }
            var oKR  = this.byId("kpiRentabilidad");  if (oKR) { oKR.setText(fmtP(nRent)); }
            var oKI  = this.byId("kpiROI");           if (oKI) { oKI.setText(fmtP(nROI)); }
            var oKC  = this.byId("kpiCostos");        if (oKC) { oKC.setText(fmt(nTotalCost)); }
            var oKIn = this.byId("kpiIngresos");      if (oKIn) { oKIn.setText(fmt(nIngresos)); }
        },

        onComCostosChange: function () {
            this._updateComercialKPIs(this._iIndex);
        },

        // ── Comercial: Enviar Aprobación Necesidad ────────────────────────
        onEnviarAprobacionNecesidad: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var oReq = oCtx.getObject();
            var that = this;
            MessageBox.confirm(
                "\u00bfEnviar el requerimiento " + oReq.reqId + " para aprobaci\u00f3n del Jefe Comercial?\n\nSe notificar\u00e1 por correo al Jefe Comercial.",
                {
                    title: "Confirmar Env\u00edo",
                    onClose: function (sAction) {
                        if (sAction !== MessageBox.Action.OK) { return; }
                        var oModel = that.getOwnerComponent().getModel();
                        var sNow   = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                                   + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/estado", "Pendiente Aprobaci\u00f3n");
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/ultimaModificacion", sNow);
                        that._crearEntradaAprobacion(oReq);
                        MessageToast.show("Necesidad enviada para aprobaci\u00f3n al Jefe Comercial");
                    }
                }
            );
        },

        // ── Paso 5.2 – Confirmación Aprobación del Cliente ───────────────
        onConfirmacionCliente: function () {
            var that   = this;
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { return; }

            var oEmailInput = new Input({
                placeholder: "correo@empresa.com",
                width: "100%",
                type: "Email"
            });
            var oContactoInput = new Input({
                placeholder: "Nombre del contacto del cliente",
                width: "100%"
            });
            var oObsTextArea = new TextArea({
                placeholder: "Ingrese el texto del correo o notas adicionales...",
                rows: 4,
                width: "100%"
            });
            var oEvidenciaNombreText = new Text({ text: "" }).addStyleClass("sapUiSmallMarginBegin");
            var oAdjuntarBtn = new Button({
                text: "Adjuntar correo",
                icon: "sap-icon://attachment",
                type: "Transparent",
                press: function () {
                    var oFileInput = document.createElement("input");
                    oFileInput.type = "file";
                    oFileInput.accept = ".pdf,.eml,.msg,.png,.jpg";
                    oFileInput.style.display = "none";
                    document.body.appendChild(oFileInput);
                    oFileInput.onchange = function (oEvt) {
                        var oFile = oEvt.target.files && oEvt.target.files[0];
                        if (oFile) { oEvidenciaNombreText.setText(oFile.name); }
                        document.body.removeChild(oFileInput);
                    };
                    oFileInput.click();
                }
            });

            var oDlg = new Dialog({
                title: "Confirmaci\u00f3n de Aprobaci\u00f3n del Cliente \u2013 Paso 5.2",
                contentWidth: "480px",
                content: [
                    new VBox({
                        items: [
                            new Label({ text: "Correo del cliente (evidencia)", required: true }),
                            oEmailInput,
                            new Label({ text: "Nombre / Contacto del cliente", required: true }).addStyleClass("sapUiSmallMarginTop"),
                            oContactoInput,
                            new Label({ text: "Observaciones" }).addStyleClass("sapUiSmallMarginTop"),
                            oObsTextArea,
                            new Label({ text: "Archivo de evidencia (correo)" }).addStyleClass("sapUiSmallMarginTop"),
                            new HBox({ items: [oAdjuntarBtn, oEvidenciaNombreText], alignItems: "Center" }),
                            new MessageStrip({
                                text: "Al confirmar se registrará la aceptaci\u00f3n del cliente y el requerimiento quedar\u00e1 en estado 'Confirmado por Cliente'.",
                                type: "Information",
                                showIcon: true
                            }).addStyleClass("sapUiSmallMarginTop")
                        ]
                    }).addStyleClass("mtnDlgContent")
                ],
                buttons: [
                    new Button({
                        text: "Confirmar",
                        type: "Emphasized",
                        press: function () {
                            var sEmail    = oEmailInput.getValue().trim();
                            var sContacto = oContactoInput.getValue().trim();
                            if (!sEmail) {
                                oEmailInput.setValueState("Error");
                                oEmailInput.setValueStateText("El correo del cliente es obligatorio");
                                return;
                            }
                            if (!sContacto) {
                                oContactoInput.setValueState("Error");
                                oContactoInput.setValueStateText("El nombre del contacto es obligatorio");
                                return;
                            }
                            oEmailInput.setValueState("None");
                            oContactoInput.setValueState("None");
                            var sNow = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                                     + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                            var sBase = "/requerimientos/" + that._iIndex;
                            oModel.setProperty(sBase + "/estado", "Confirmado por Cliente");
                            oModel.setProperty(sBase + "/ultimaModificacion", sNow);
                            oModel.setProperty(sBase + "/confirmacionCliente", {
                                fecha:           sNow,
                                correo:          sEmail,
                                contacto:        sContacto,
                                observaciones:   oObsTextArea.getValue(),
                                evidenciaNombre: oEvidenciaNombreText.getText()
                            });
                            oDlg.close();
                            var oTabs = that.byId("detailTabs");
                            if (oTabs) { oTabs.setSelectedKey("comercialPresentacion"); }
                            MessageToast.show("Confirmaci\u00f3n del cliente registrada correctamente");
                        }
                    }),
                    new Button({ text: "Cancelar", press: function () { oDlg.close(); } })
                ]
            });
            this.getView().addDependent(oDlg);
            oDlg.open();
        },

        onConfirmacionClienteMC: function () {
            var that   = this;
            var oModel = this.getOwnerComponent().getModel();
            MessageBox.confirm("\u00bfConfirmar la aceptaci\u00f3n del cliente para esta solicitud?", {
                title: "Confirmaci\u00f3n Cliente",
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    var sNow = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                             + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                    oModel.setProperty("/requerimientos/" + that._iIndex + "/estado", "Confirmado por Cliente");
                    oModel.setProperty("/requerimientos/" + that._iIndex + "/ultimaModificacion", sNow);
                    MessageToast.show("Confirmaci\u00f3n registrada. Se habilit\u00f3 el bot\u00f3n Finalizar Solicitud.");
                }
            });
        },

        onFinalizarSolicitudMC: function () {
            var that   = this;
            var oModel = this.getOwnerComponent().getModel();
            MessageBox.confirm("\u00bfEst\u00e1 seguro que desea finalizar esta solicitud? Esta acci\u00f3n no podr\u00e1 deshacerse.", {
                title: "Finalizar Solicitud",
                icon: MessageBox.Icon.WARNING,
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    var sNow = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                             + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                    oModel.setProperty("/requerimientos/" + that._iIndex + "/estado", "Finalizado");
                    oModel.setProperty("/requerimientos/" + that._iIndex + "/ultimaModificacion", sNow);
                    MessageToast.show("Solicitud finalizada correctamente.");
                }
            });
        },

        onComercialDescargarTemplate: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { MessageToast.show("Sin datos"); return; }
            var oCF   = oReq.costosFact || {};
            var oCD   = oReq.comercialData || {};
            var nEq   = (oReq.materialesFact || []).reduce(function (s, m) { return s + (m.subtotal || 0); }, 0);
            var nSrv  = (oReq.serviciosFact  || []).reduce(function (s, v) { return s + (v.subtotal || 0); }, 0);
            var nMO   = parseFloat(oCF.manoObra || 0) || 0;
            var nTot  = nEq + nSrv + nMO;
            var nIng  = parseFloat(oCD.ingresos || 0) || 0;
            var nMar  = nIng - nTot;
            var nRent = nIng > 0 ? (nMar / nIng * 100).toFixed(1) : "0.0";
            var nROI  = nTot > 0 ? (nMar / nTot * 100).toFixed(1) : "0.0";
            var fmt   = function (n) { return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
            var sBlue = "background:#2E74B5;font-weight:bold;font-family:Arial;font-size:9pt;text-align:center;border:1px solid #1F5C8E;color:#FFFFFF;";
            var sNorm = "font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;";
            var sRgt  = "font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;text-align:right;";
            var sBold = "font-weight:bold;font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;";
            var sTot  = "font-weight:bold;font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;background:#DEEAF1;";
            var sHtml =
                "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel'>" +
                "<head><meta charset='UTF-8'></head><body>" +
                "<table style='font-family:Arial;font-size:9pt;border-collapse:collapse;'>" +
                "<tr><td colspan='3' style='font-weight:bold;font-family:Arial;font-size:13pt;'>" +
                "AN\u00c1LISIS RENTABLE \u2013 MERCADO CORPORATIVO</td></tr>" +
                "<tr><td>T\u00edtulo:</td><td colspan='2' style='font-weight:bold;'>" + (oReq.titulo||"") + "</td></tr>" +
                "<tr><td>Canal:</td><td colspan='2'>" + (oReq.canal||"") + "</td></tr>" +
                "<tr><td>L\u00ednea de Negocio:</td><td colspan='2'>" + (oReq.lineaNegocio||"") + "</td></tr>" +
                "<tr><td colspan='3'></td></tr>" +
                "<tr><th style='" + sBlue + "'>Tipo</th><th style='" + sBlue + "'>Descripci\u00f3n</th><th style='" + sBlue + "'>Monto (USD)</th></tr>" +
                "<tr><td style='" + sNorm + "'>Equipos</td><td style='" + sNorm + "'>Materiales</td><td style='" + sRgt + "'>" + fmt(nEq) + "</td></tr>" +
                "<tr><td style='" + sNorm + "'>Servicios</td><td style='" + sNorm + "'>Implementaci\u00f3n</td><td style='" + sRgt + "'>" + fmt(nSrv) + "</td></tr>" +
                "<tr><td style='" + sNorm + "'>Costos Internos</td><td style='" + sNorm + "'>Mano de obra</td><td style='" + sRgt + "'>" + fmt(nMO) + "</td></tr>" +
                "<tr><td style='" + sTot + "'>Total Costos</td><td style='" + sTot + "'></td><td style='" + sTot + "text-align:right;'>" + fmt(nTot) + "</td></tr>" +
                "<tr><td style='" + sBold + "'>Ingresos</td><td style='" + sBold + "'>Precio de venta</td><td style='font-weight:bold;" + sRgt + "'>" + fmt(nIng) + "</td></tr>" +
                "<tr><td colspan='3'></td></tr>" +
                "<tr><th style='" + sBlue + "'>KPI</th><th colspan='2' style='" + sBlue + "'>Valor</th></tr>" +
                "<tr><td style='" + sNorm + "'>Margen</td><td colspan='2' style='" + sRgt + "'>" + fmt(nMar) + "</td></tr>" +
                "<tr><td style='" + sNorm + "'>Rentabilidad</td><td colspan='2' style='" + sRgt + "'>" + nRent + "%</td></tr>" +
                "<tr><td style='" + sNorm + "'>ROI</td><td colspan='2' style='" + sRgt + "'>" + nROI + "%</td></tr>" +
                "</table></body></html>";
            var oBlob = new Blob(["\ufeff" + sHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
            var sUrl  = URL.createObjectURL(oBlob);
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = (oReq.reqId||"req") + "_analisis_rentable.xls";
            document.body.appendChild(oLink); oLink.click();
            document.body.removeChild(oLink); URL.revokeObjectURL(sUrl);
        },

        onComercialCargarTemplate: function () {
            var that   = this;
            var oInput = document.createElement("input");
            oInput.type = "file"; oInput.accept = ".xls,.xlsx"; oInput.style.display = "none";
            document.body.appendChild(oInput);
            oInput.onchange = function (oEvt) {
                var oFile = oEvt.target.files && oEvt.target.files[0];
                if (!oFile) { document.body.removeChild(oInput); return; }
                var oReader = new FileReader();
                oReader.onload = function (e) {
                    try {
                        var oWB  = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
                        var oWS  = oWB.Sheets[oWB.SheetNames[0]];
                        var aR   = XLSX.utils.sheet_to_json(oWS, { header: 1, defval: "" });
                        var oModel = that.getOwnerComponent().getModel();
                        // Look for Ingresos row
                        for (var i = 0; i < aR.length; i++) {
                            var sR = String(aR[i][0] || "").toLowerCase();
                            if (sR.indexOf("ingreso") !== -1) {
                                var nIng = parseFloat(String(aR[i][2]||"").replace(/[^0-9.\-]/g,"")) || 0;
                                if (nIng) { oModel.setProperty("/requerimientos/" + that._iIndex + "/comercialData/ingresos", nIng); }
                            }
                            if (sR.indexOf("costos interno") !== -1 || sR.indexOf("mano de") !== -1) {
                                var nMO = parseFloat(String(aR[i][2]||"").replace(/[^0-9.\-]/g,"")) || 0;
                                if (nMO) { oModel.setProperty("/requerimientos/" + that._iIndex + "/costosFact/manoObra", nMO); }
                            }
                        }
                        that._updateComercialKPIs(that._iIndex);
                        MessageToast.show("Template cargado correctamente");
                    } catch (err) { MessageToast.show("Error al procesar: " + err.message); }
                    document.body.removeChild(oInput);
                };
                oReader.onerror = function () { MessageToast.show("Error al leer el archivo"); document.body.removeChild(oInput); };
                oReader.readAsArrayBuffer(oFile);
            };
            oInput.click();
        },

        // ── Comercial: Presentación Cliente ──────────────────────────────
        onComercialCargarPresentacion: function () {
            var that   = this;
            var oInput = document.createElement("input");
            oInput.type = "file"; oInput.accept = ".ppt,.pptx,.pdf"; oInput.style.display = "none";
            document.body.appendChild(oInput);
            oInput.onchange = function (oEvt) {
                var oFile = oEvt.target.files && oEvt.target.files[0];
                if (!oFile) { document.body.removeChild(oInput); return; }
                var oModel = that.getOwnerComponent().getModel();
                oModel.setProperty("/requerimientos/" + that._iIndex + "/comercialData/presentacionNombre", oFile.name);
                MessageToast.show("Presentaci\u00f3n cargada: " + oFile.name);
                document.body.removeChild(oInput);
            };
            oInput.click();
        },

        onComercialGenerarPresentacion: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { return; }
            var oCD    = oReq.comercialData || {};
            // Auto-populate preview fields if empty
            if (!oCD.resumenEjecutivo) {
                oModel.setProperty("/requerimientos/" + this._iIndex + "/comercialData/resumenEjecutivo",
                    "Se propone la implementaci\u00f3n de una soluci\u00f3n de red corporativa para " +
                    (oCD.cliente || "el cliente") + ", orientada a garantizar conectividad segura y alta disponibilidad.");
            }
            if (!oCD.solucionPropuesta) {
                oModel.setProperty("/requerimientos/" + this._iIndex + "/comercialData/solucionPropuesta",
                    "La soluci\u00f3n contempla: Implementaci\u00f3n de infraestructura de red, integraci\u00f3n con red existente, " +
                    "configuraci\u00f3n de equipos de comunicaci\u00f3n y monitoreo y soporte.");
            }
            if (!oCD.alcance) {
                oModel.setProperty("/requerimientos/" + this._iIndex + "/comercialData/alcance",
                    "Incluye: Suministro de equipos (routers, switches), Instalaci\u00f3n y configuraci\u00f3n, " +
                    "Pruebas de funcionamiento y Capacitaci\u00f3n al personal.");
            }
            MessageToast.show("Presentaci\u00f3n generada correctamente");
        },

        // ── Factibilidad: Descarga/Carga template materiales ─────────────
        onMCFactDescargarTemplate: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + this._iIndex);
            if (!oReq) { MessageToast.show("Sin datos"); return; }
            var sDate  = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
            var aMat   = (oReq.materialesFact || []);
            if (!aMat.length) {
                aMat = [
                    { no: 1, descripcion: "Router Cisco ISR 4331",      codigoSAP: "MAT-ROUT-001", cantidad: 20,  fuente: "Compra", almacen: "-",      proveedor: "Cisco",          costoUnitario: 1000, subtotal: 20000 },
                    { no: 2, descripcion: "Switch Huawei S5700",         codigoSAP: "MAT-SW-002",   cantidad: 10,  fuente: "Stock",  almacen: "Lima-01", proveedor: "Huawei",         costoUnitario: 0,    subtotal: 0     },
                    { no: 3, descripcion: "Rack de Comunicaciones",      codigoSAP: "MAT-RACK-004", cantidad: 5,   fuente: "Compra", almacen: "-",      proveedor: "Partner X",       costoUnitario: 800,  subtotal: 4000  }
                ];
            }
            var sBlue = "background:#2E74B5;font-weight:bold;font-family:Arial;font-size:9pt;text-align:center;border:1px solid #1F5C8E;color:#FFFFFF;";
            var sNorm = "font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;";
            var sRgt  = "font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;text-align:right;";
            var sBold = "font-weight:bold;font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;";
            var fmt   = function (n) { return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
            var sRows = "";
            aMat.forEach(function (m) {
                sRows += "<tr><td style='" + sRgt + "'>" + (m.no||"") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.descripcion||"") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.codigoSAP||"") + "</td>" +
                    "<td style='" + sRgt  + "'>" + (m.cantidad||0) + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.fuente||"") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.almacen||"-") + "</td>" +
                    "<td style='" + sNorm + "'>" + (m.proveedor||"") + "</td>" +
                    "<td style='" + sRgt  + "'>" + fmt(m.costoUnitario) + "</td>" +
                    "<td style='" + sRgt  + "'>" + fmt(m.subtotal) + "</td></tr>";
            });
            var nTot = aMat.reduce(function (s, m) { return s + (m.subtotal || 0); }, 0);
            var sHtml =
                "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel'>" +
                "<head><meta charset='UTF-8'></head><body><table style='font-family:Arial;font-size:9pt;border-collapse:collapse;'>" +
                "<tr><td colspan='9' style='font-weight:bold;font-family:Arial;font-size:12pt;'>TEMPLATE NECESIDAD PROYECTOS \u2013 MERCADO CORPORATIVO</td></tr>" +
                "<tr><td>T\u00edtulo:</td><td colspan='8' style='font-weight:bold;'>" + (oReq.titulo||"") + "</td></tr>" +
                "<tr><td>Canal:</td><td colspan='3' style='font-weight:bold;'>" + (oReq.canal||"") + "</td>" +
                "<td>L\u00ednea de Negocio:</td><td colspan='4' style='font-weight:bold;'>" + (oReq.lineaNegocio||"") + "</td></tr>" +
                "<tr><td colspan='9' style='color:#888;'>" + sDate + "</td></tr><tr><td colspan='9'></td></tr>" +
                "<tr><th style='" + sBlue + "'>No.</th><th style='" + sBlue + "'>Descripci\u00f3n</th>" +
                "<th style='" + sBlue + "'>C\u00f3digo SAP</th><th style='" + sBlue + "'>Cantidad</th>" +
                "<th style='" + sBlue + "'>Fuente</th><th style='" + sBlue + "'>Almac\u00e9n</th>" +
                "<th style='" + sBlue + "'>Proveedor</th><th style='" + sBlue + "'>Costo Unitario</th>" +
                "<th style='" + sBlue + "'>Subtotal</th></tr>" +
                sRows +
                "<tr><td colspan='7' style='" + sBold + "'>Total Materiales</td><td></td>" +
                "<td style='font-weight:bold;font-family:Arial;font-size:9pt;border:1px solid #BDD7EE;text-align:right;'>" + fmt(nTot) + "</td></tr>" +
                "</table></body></html>";
            var oBlob = new Blob(["\ufeff" + sHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
            var sUrl  = URL.createObjectURL(oBlob);
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = (oReq.reqId||"req") + "_template_proyecto_materiales.xls";
            document.body.appendChild(oLink); oLink.click();
            document.body.removeChild(oLink); URL.revokeObjectURL(sUrl);
        },

        onMCFactCargarTemplate: function () {
            var that   = this;
            var oInput = document.createElement("input");
            oInput.type = "file"; oInput.accept = ".xls,.xlsx"; oInput.style.display = "none";
            document.body.appendChild(oInput);
            oInput.onchange = function (oEvt) {
                var oFile = oEvt.target.files && oEvt.target.files[0];
                if (!oFile) { document.body.removeChild(oInput); return; }
                var oReader = new FileReader();
                oReader.onload = function (e) {
                    try {
                        var oWB   = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
                        var oWS   = oWB.Sheets[oWB.SheetNames[0]];
                        var aRows = XLSX.utils.sheet_to_json(oWS, { header: 1, defval: "" });
                        var iHdr = -1; var mC = {};
                        for (var r = 0; r < aRows.length; r++) {
                            var sRow = aRows[r].join("|");
                            if (sRow.indexOf("Descripci") !== -1 && sRow.indexOf("Cantidad") !== -1) {
                                iHdr = r;
                                aRows[r].forEach(function (h, c) { var s = String(h).trim(); if (s) { mC[s] = c; } });
                                break;
                            }
                        }
                        if (iHdr === -1) { MessageToast.show("No se encontr\u00f3 la fila de encabezados"); document.body.removeChild(oInput); return; }
                        var pN = function (v) { if (!v && v !== 0) { return 0; } if (typeof v === "number") { return v; } var n = parseFloat(String(v).replace(/[^0-9.\-]/g,"")); return isNaN(n) ? 0 : n; };
                        var aItems = []; var iNo = 1;
                        for (var i = iHdr + 1; i < aRows.length; i++) {
                            var row = aRows[i]; var sC = String(row[0]||row[1]||"").trim();
                            if (!sC || sC.toLowerCase().indexOf("total") !== -1) { break; }
                            var cD  = mC["Descripci\u00f3n"] !== undefined ? mC["Descripci\u00f3n"] : mC["Descripcion"] !== undefined ? mC["Descripcion"] : 1;
                            var cSA = mC["C\u00f3digo SAP"]  !== undefined ? mC["C\u00f3digo SAP"]  : mC["Codigo SAP"]  !== undefined ? mC["Codigo SAP"]  : 2;
                            var cCa = mC["Cantidad"]        !== undefined ? mC["Cantidad"]        : 3;
                            var cFu = mC["Fuente"]          !== undefined ? mC["Fuente"]          : 4;
                            var cAl = mC["Almac\u00e9n"]    !== undefined ? mC["Almac\u00e9n"]    : mC["Almacen"] !== undefined ? mC["Almacen"] : 5;
                            var cPr = mC["Proveedor"]       !== undefined ? mC["Proveedor"]       : 6;
                            var cCU = mC["Costo Unitario"]  !== undefined ? mC["Costo Unitario"]  : 7;
                            var nCa = pN(row[cCa]); var nCU = pN(row[cCU]);
                            aItems.push({ no: iNo++, descripcion: String(row[cD]||"").trim(), codigoSAP: String(row[cSA]||"").trim(),
                                cantidad: nCa, fuente: String(row[cFu]||"").trim(), almacen: String(row[cAl]||"-").trim(),
                                proveedor: String(row[cPr]||"").trim(), costoUnitario: nCU, subtotal: nCa * nCU });
                        }
                        if (!aItems.length) { MessageToast.show("No se encontraron \u00edtems"); document.body.removeChild(oInput); return; }
                        var oModel = that.getOwnerComponent().getModel();
                        oModel.setProperty("/requerimientos/" + that._iIndex + "/materialesFact", aItems);
                        that._updateCostosTab(that._iIndex);
                        MessageToast.show(aItems.length + " material(es) cargado(s) correctamente");
                    } catch (err) { MessageToast.show("Error al procesar el archivo: " + err.message); }
                    document.body.removeChild(oInput);
                };
                oReader.onerror = function () { MessageToast.show("Error al leer el archivo"); document.body.removeChild(oInput); };
                oReader.readAsArrayBuffer(oFile);
            };
            oInput.click();
        },

        // ── Factibilidad: Materiales CRUD ─────────────────────────────────
        onAddFactMaterial:    function ()       { this._openFactMaterialDlg(null); },
        onEditFactMaterial:   function (oEvent) { this._openFactMaterialDlg(oEvent.getSource().getBindingContext()); },
        onDeleteFactMaterial: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext(); var that = this;
            MessageBox.confirm("\u00bfEliminar este material?", { title: "Confirmar",
                onClose: function (s) {
                    if (s !== MessageBox.Action.OK) { return; }
                    var oModel = that.getOwnerComponent().getModel();
                    var sPath  = "/requerimientos/" + that._iIndex + "/materialesFact";
                    var aItems = oModel.getProperty(sPath) || [];
                    aItems.splice(parseInt(oCtx.getPath().split("/").pop(), 10), 1);
                    aItems.forEach(function (it, i) { it.no = i + 1; });
                    oModel.setProperty(sPath, aItems); that._updateCostosTab(that._iIndex);
                    MessageToast.show("Material eliminado");
                }
            });
        },
        _openFactMaterialDlg: function (oCtx) {
            var oModel = this.getOwnerComponent().getModel();
            var bNew   = !oCtx;
            var oData  = oCtx ? Object.assign({}, oCtx.getObject()) : { descripcion: "", codigoSAP: "", cantidad: 1, fuente: "Compra", almacen: "-", proveedor: "", costoUnitario: 0 };
            var that   = this;
            var oDI = new Input({ value: oData.descripcion, width: "100%", required: true });
            var oSI = new Input({ value: oData.codigoSAP || "", width: "100%", placeholder: "ej. MAT-001" });
            var oCI = new Input({ value: String(oData.cantidad || 1), width: "100%", type: "Number" });
            var oAI = new Input({ value: oData.almacen || "-", width: "100%" });
            var oPI = new Input({ value: oData.proveedor || "", width: "100%" });
            var oCU = new Input({ value: String(oData.costoUnitario || 0), width: "100%", type: "Number" });
            var oTT = new Text().addStyleClass("reqAmountBold sapUiSmallMarginTop");
            var oFS = new Select({ width: "100%" });
            ["Compra","Stock","Alquiler","Otros"].forEach(function (s) { oFS.addItem(new Item({ key: s, text: s })); });
            oFS.setSelectedKey(oData.fuente || "Compra");
            var _c = function () { var n = (parseFloat(oCI.getValue())||0)*(parseFloat(oCU.getValue())||0); oTT.setText("Subtotal: " + n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) + " USD"); };
            oCI.attachLiveChange(_c); oCU.attachLiveChange(_c); _c();
            var oDlg = new Dialog({ title: bNew ? "Agregar Material" : "Editar Material", contentWidth: "500px",
                content: [ new VBox({ items: [
                    new Label({ text: "Descripci\u00f3n", required: true }), oDI,
                    new Label({ text: "C\u00f3digo SAP" }), oSI,
                    new HBox({ items: [
                        new VBox({ width: "50%", items: [ new Label({ text: "Cantidad" }), oCI ] }),
                        new VBox({ width: "50%", items: [ new Label({ text: "Fuente" }), oFS ] }).addStyleClass("sapUiSmallMarginBegin")
                    ] }),
                    new Label({ text: "Almac\u00e9n" }), oAI, new Label({ text: "Proveedor" }), oPI,
                    new Label({ text: "Costo Unitario (USD)" }), oCU, oTT
                ] }).addStyleClass("mtnDlgContent") ],
                buttons: [ new Button({ text: bNew ? "Agregar" : "Guardar", type: "Emphasized", press: function () {
                    if (!oDI.getValue().trim()) { MessageToast.show("La descripci\u00f3n es obligatoria"); return; }
                    var nCa = parseFloat(oCI.getValue())||1; var nCU2 = parseFloat(oCU.getValue())||0;
                    var sPath = "/requerimientos/" + that._iIndex + "/materialesFact";
                    var aItems = oModel.getProperty(sPath) || [];
                    var oItem = { descripcion: oDI.getValue().trim(), codigoSAP: oSI.getValue().trim(), cantidad: nCa,
                        fuente: oFS.getSelectedKey(), almacen: oAI.getValue().trim()||"-", proveedor: oPI.getValue().trim(),
                        costoUnitario: nCU2, subtotal: nCa * nCU2 };
                    if (bNew) { oItem.no = aItems.length + 1; aItems.push(oItem); }
                    else { var iI = parseInt(oCtx.getPath().split("/").pop(),10); Object.assign(aItems[iI], oItem); }
                    oModel.setProperty(sPath, aItems); that._updateCostosTab(that._iIndex);
                    MessageToast.show(bNew ? "\u00cdtem agregado" : "\u00cdtem actualizado"); oDlg.close();
                } }), new Button({ text: "Cancelar", press: function () { oDlg.close(); } }) ],
                afterClose: function () { oDlg.destroy(); }
            }); oDlg.open();
        },

        // ── Factibilidad: Servicios CRUD ──────────────────────────────────
        onAddFactServicio:    function ()       { this._openFactServicioDlg(null); },
        onEditFactServicio:   function (oEvent) { this._openFactServicioDlg(oEvent.getSource().getBindingContext()); },
        onDeleteFactServicio: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext(); var that = this;
            MessageBox.confirm("\u00bfEliminar este servicio?", { title: "Confirmar",
                onClose: function (s) {
                    if (s !== MessageBox.Action.OK) { return; }
                    var oModel = that.getOwnerComponent().getModel();
                    var sPath  = "/requerimientos/" + that._iIndex + "/serviciosFact";
                    var aItems = oModel.getProperty(sPath) || [];
                    aItems.splice(parseInt(oCtx.getPath().split("/").pop(), 10), 1);
                    aItems.forEach(function (it, i) { it.no = i + 1; });
                    oModel.setProperty(sPath, aItems); that._updateCostosTab(that._iIndex);
                    MessageToast.show("Servicio eliminado");
                }
            });
        },
        _openFactServicioDlg: function (oCtx) {
            var oModel = this.getOwnerComponent().getModel();
            var bNew   = !oCtx;
            var oData  = oCtx ? Object.assign({}, oCtx.getObject()) : { tipoServicio: "Instalaci\u00f3n", descripcion: "", cantidad: 1, unidad: "Proyecto", proveedor: "", costoUnitario: 0 };
            var that   = this;
            var oTS = new Select({ width: "100%" });
            ["Instalaci\u00f3n","Configuraci\u00f3n","Soporte","Transporte","Mantenimiento","Consultor\u00eda","Otros"].forEach(function (s) { oTS.addItem(new Item({ key: s, text: s })); });
            oTS.setSelectedKey(oData.tipoServicio || "Instalaci\u00f3n");
            var oDI = new Input({ value: oData.descripcion, width: "100%", required: true });
            var oCI = new Input({ value: String(oData.cantidad || 1), width: "100%", type: "Number" });
            var oPI = new Input({ value: oData.proveedor || "", width: "100%" });
            var oCU = new Input({ value: String(oData.costoUnitario || 0), width: "100%", type: "Number" });
            var oTT = new Text().addStyleClass("reqAmountBold sapUiSmallMarginTop");
            var oUS = new Select({ width: "100%" });
            ["Proyecto","Servicio","Mes","Hora","D\u00eda","UND"].forEach(function (s) { oUS.addItem(new Item({ key: s, text: s })); });
            oUS.setSelectedKey(oData.unidad || "Proyecto");
            var _c = function () { var n = (parseFloat(oCI.getValue())||0)*(parseFloat(oCU.getValue())||0); oTT.setText("Subtotal: " + n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) + " USD"); };
            oCI.attachLiveChange(_c); oCU.attachLiveChange(_c); _c();
            var oDlg = new Dialog({ title: bNew ? "Agregar Servicio" : "Editar Servicio", contentWidth: "480px",
                content: [ new VBox({ items: [
                    new Label({ text: "Tipo de Servicio" }), oTS,
                    new Label({ text: "Descripci\u00f3n", required: true }), oDI,
                    new HBox({ items: [
                        new VBox({ width: "50%", items: [ new Label({ text: "Cantidad" }), oCI ] }),
                        new VBox({ width: "50%", items: [ new Label({ text: "Unidad" }), oUS ] }).addStyleClass("sapUiSmallMarginBegin")
                    ] }),
                    new Label({ text: "Proveedor" }), oPI, new Label({ text: "Costo Unitario (USD)" }), oCU, oTT
                ] }).addStyleClass("mtnDlgContent") ],
                buttons: [ new Button({ text: bNew ? "Agregar" : "Guardar", type: "Emphasized", press: function () {
                    if (!oDI.getValue().trim()) { MessageToast.show("La descripci\u00f3n es obligatoria"); return; }
                    var nCa = parseFloat(oCI.getValue())||1; var nCU2 = parseFloat(oCU.getValue())||0;
                    var sPath = "/requerimientos/" + that._iIndex + "/serviciosFact";
                    var aItems = oModel.getProperty(sPath) || [];
                    var oItem = { tipoServicio: oTS.getSelectedKey(), descripcion: oDI.getValue().trim(), cantidad: nCa,
                        unidad: oUS.getSelectedKey(), proveedor: oPI.getValue().trim(),
                        costoUnitario: nCU2, subtotal: nCa * nCU2 };
                    if (bNew) { oItem.no = aItems.length + 1; aItems.push(oItem); }
                    else { var iI = parseInt(oCtx.getPath().split("/").pop(),10); Object.assign(aItems[iI], oItem); }
                    oModel.setProperty(sPath, aItems); that._updateCostosTab(that._iIndex);
                    MessageToast.show(bNew ? "Servicio agregado" : "Servicio actualizado"); oDlg.close();
                } }), new Button({ text: "Cancelar", press: function () { oDlg.close(); } }) ],
                afterClose: function () { oDlg.destroy(); }
            }); oDlg.open();
        }
    });
});
