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

        onInit: function () {
            var oUiModel = new JSONModel({ mercadoCorporativo: false });
            this.getView().setModel(oUiModel, "ui");
            this.getRouter().getRoute("requerimientoDetail")
                .attachPatternMatched(this._onRouteMatched.bind(this, false), this);
            this.getRouter().getRoute("mcRequerimientoDetail")
                .attachPatternMatched(this._onRouteMatched.bind(this, true), this);
        },

        _onRouteMatched: function (bMC, oEvent) {
            this.getView().getModel("ui").setProperty("/mercadoCorporativo", !!bMC);
            var sReqId = decodeURIComponent(oEvent.getParameter("arguments").reqId);
            this._bindView(sReqId);
        },

        _bindView: function (sReqId) {
            var oModel = this.getOwnerComponent().getModel();
            var aReqs  = oModel.getProperty("/requerimientos") || [];
            var iIndex = aReqs.findIndex(function (r) { return r.reqId === sReqId; });
            if (iIndex === -1) { this.getRouter().navTo("requerimientoList"); return; }
            this.getView().bindObject({ path: "/requerimientos/" + iIndex });
            this._iIndex = iIndex;
            // Initialize optional arrays if not present
            var oR = oModel.getProperty("/requerimientos/" + iIndex);
            if (!oR.adjuntos)              { oModel.setProperty("/requerimientos/" + iIndex + "/adjuntos", []); }
            if (!oR.stock)                 { oModel.setProperty("/requerimientos/" + iIndex + "/stock", []); }
            if (!oR.materialesSolicitados) { oModel.setProperty("/requerimientos/" + iIndex + "/materialesSolicitados", []); }
            if (!oR.historialFeedback)     { oModel.setProperty("/requerimientos/" + iIndex + "/historialFeedback", []); }
            var that = this;
            setTimeout(function () {
                that._updateCalculatedFields(iIndex);
                that._renderApprovalFlow(iIndex);
                that._updateVentasPromedio(iIndex);
                that._updateVirSectionTitle(iIndex);
            }, 200);
        },

        // ── Calculated fields ─────────────────────────────────────────────────
        _updateCalculatedFields: function (iIndex) {
            var oModel = this.getOwnerComponent().getModel();
            var oReq   = oModel.getProperty("/requerimientos/" + iIndex);
            if (!oReq) { return; }
            var bMC    = oReq.mercado === "corporativo";
            var aItems = oReq.items || [];
            var fmt    = function (n) {
                return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USD";
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
                if (oTC) { oTC.setText("$" + nC.toLocaleString("de-DE", { minimumFractionDigits: 2 })); }
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

        // ── Approval flow renderer ─────────────────────────────────────────────
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

            aFlujo.forEach(function (oStep, idx) {
                var sEst   = oStep.estado || "Pendiente";
                var sIcon  = sEst === "Rechazado" ? "sap-icon://sys-cancel-2"
                           : sEst === "Aprobado"  ? "sap-icon://sys-enter-2"
                           : "sap-icon://status-in-process";
                var sClass = sEst === "Rechazado" ? "reqFlowCircleRejected"
                           : sEst === "Aprobado"  ? "reqFlowCircleApproved"
                           : "reqFlowCirclePending";

                var oStepBox = new VBox({ alignItems: "Center" }).addStyleClass("reqFlowStep");
                oStepBox.addItem(new Text({ text: oStep.rol, wrapping: false }).addStyleClass("reqFlowRolLabel"));
                oStepBox.addItem(new Avatar({ icon: sIcon, displaySize: "L" }).addStyleClass("reqFlowCircle " + sClass));
                oStepBox.addItem(new Text({ text: oStep.nivel }).addStyleClass("reqFlowNivelLabel"));
                oDiagram.addItem(oStepBox);

                if (idx < aFlujo.length - 1) {
                    var oArrow = new VBox({ justifyContent: "Center", alignItems: "Center" }).addStyleClass("reqFlowArrow");
                    oArrow.addItem(new Icon({ src: "sap-icon://arrow-right", size: "1.2rem", color: "#8396a8" }));
                    oDiagram.addItem(oArrow);
                }

                var sAvtClass = sEst === "Rechazado" ? "reqCardAvatarRejected"
                              : sEst === "Aprobado"  ? "reqCardAvatarApproved"
                              : "reqCardAvatarPending";
                var sEstColor = sEst === "Rechazado" ? "#d93025" : sEst === "Aprobado" ? "#107e3e" : "#e76500";
                var sEstIcon  = sEst === "Rechazado" ? "sap-icon://sys-cancel-2"
                              : sEst === "Aprobado"  ? "sap-icon://sys-enter-2"
                              : "sap-icon://pending";

                var oCardDetail = new VBox({ alignItems: "Center" }).addStyleClass("reqCardDetail");
                oCardDetail.addItem(new Avatar({ initials: oStep.iniciales, displaySize: "M" }).addStyleClass("reqCardAvatar " + sAvtClass));
                oCardDetail.addItem(new Text({ text: oStep.rol }).addStyleClass("reqCardTitle"));
                var oEstRow = new HBox({ alignItems: "Center" });
                oEstRow.addItem(new Icon({ src: sEstIcon, size: "0.75rem", color: sEstColor }));
                oEstRow.addItem(new Text({ text: " " + sEst }).addStyleClass(
                    sEst === "Rechazado" ? "reqCardStatusError" : sEst === "Aprobado" ? "reqCardStatusSuccess" : "reqCardStatusPending"));
                oCardDetail.addItem(oEstRow);

                var oCardBody = new VBox().addStyleClass("reqCardBody");
                oCardBody.addItem(new Text({ text: oStep.rol }).addStyleClass("reqCardFullRole"));
                if (oStep.fecha)      { oCardBody.addItem(new Text({ text: oStep.fecha }).addStyleClass("reqCardDate")); }
                if (oStep.comentario) { oCardBody.addItem(new Text({ text: oStep.comentario }).addStyleClass("reqCardComment")); }

                var oCard = new HBox().addStyleClass("reqApprovalCard");
                oCard.addItem(oCardDetail);
                oCard.addItem(oCardBody);
                oCards.addItem(oCard);
            });
        },

        // ── Toggle header ──────────────────────────────────────────────────────
        onToggleHeader: function () {
            var oPanel = this.byId("detailInfoPanel");
            if (!oPanel) { return; }
            var bVis = oPanel.getVisible();
            oPanel.setVisible(!bVis);
            var oBtn = this.byId("btnToggleHeader");
            if (oBtn) { oBtn.setIcon(bVis ? "sap-icon://slim-arrow-right" : "sap-icon://slim-arrow-left"); }
        },

        // ── Editar cabecera MC ─────────────────────────────────────────────────
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

        // ── Enviar a Aprobación ────────────────────────────────────────────────
        onEnviarAprobacion: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var oReq = oCtx.getObject();
            var bMC  = oReq.mercado === "corporativo";
            var that = this;
            var nImp = oReq.importeEstimadoUSD || 0;
            var sMsg = bMC
                ? "\u00bfEnviar necesidad " + oReq.reqId + " a aprobaci\u00f3n?\n\nImporte: USD " +
                  nImp.toLocaleString("de-DE") + "\n\u2192 " +
                  (nImp >= 100000 ? "5 niveles jer\u00e1rquicos (>= 100K USD)" : "2 niveles (< 100K USD)")
                : "\u00bfEnviar esta solicitud a aprobaci\u00f3n?";

            MessageBox.confirm(sMsg, {
                title: "Confirmar Env\u00edo",
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    var oModel    = that.getOwnerComponent().getModel();
                    var sBasePath = oCtx.getPath();
                    oModel.setProperty(sBasePath + "/estado", bMC ? "Pendiente Aprobaci\u00f3n" : "En Aprobaci\u00f3n");
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
                    }
                    MessageToast.show("Solicitud enviada a aprobaci\u00f3n");
                }
            });
        },

        // ── MC Items CRUD ──────────────────────────────────────────────────────
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
            [["UND","UND – Unidad"],["SERV","SERV – Servicio"],["LIC","LIC – Licencia"],
             ["PROY","PROY – Proyecto"],["SESS","SESS – Sesi\u00f3n"],["MES","MES – Mes"]
            ].forEach(function (a) { oUnidSel.addItem(new Item({ key: a[0], text: a[1] })); });
            oUnidSel.setSelectedKey(oData.unidad || "UND");

            var _calcTotal = function () {
                var n = (parseFloat(oCantInput.getValue()) || 0) * (parseFloat(oPrecInput.getValue()) || 0);
                oTotalText.setText("Total: " + n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USD");
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

        // ── Evaluación Financiera ──────────────────────────────────────────────
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
                            new Text({ text: "Total \u00cctems/Servicios: USD " + nTotalUSD.toLocaleString("de-DE", { minimumFractionDigits: 2 }) })
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

        // ── Enviar Propuesta al Cliente ───────────────────────────────────────
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

        // ── Registrar Feedback del Cliente ──────────────────────────────────────
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

        // ── Separar Stock en MM (MB21) ───────────────────────────────────────────
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
        onDescargarExcel:     function () { MessageToast.show("Descargando Excel..."); },
        onCargarExcel:        function () { MessageToast.show("Cargando Excel (en desarrollo)..."); },
        onDescargarNecesidad: function () { MessageToast.show("Generando PDF de Necesidad de Compra..."); },

        // ── Adjuntos ───────────────────────────────────────────────────────────
        onUpload: function () {
            var oModel = this.getOwnerComponent().getModel();
            var sPath  = "/requerimientos/" + this._iIndex + "/adjuntos";
            var aAdj   = oModel.getProperty(sPath) || [];
            var that   = this;

            var oNombreInput = new Input({ width: "100%", placeholder: "Ej. Cotizaci\u00f3n_HP_2026.pdf", required: true });
            var oTipoSel     = new Select({ width: "100%" });
            [["PDF","PDF"],["Excel","Excel"],["Word","Word"],["Imagen","Imagen"],["Otro","Otro"]].forEach(function (a) {
                oTipoSel.addItem(new Item({ key: a[0], text: a[1] }));
            });
            var oDlg = new Dialog({
                title: "Adjuntar Documento",
                contentWidth: "420px",
                content: [
                    new VBox({
                        items: [
                            new Label({ text: "Nombre del archivo", required: true }), oNombreInput,
                            new Label({ text: "Tipo de documento" }), oTipoSel
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
                            aAdj.push({ nombre: oNombreInput.getValue().trim(), tipo: oTipoSel.getSelectedKey(),
                                        fecha: sNow, cargadoPor: "oscar.fabian.ortiz.velayarce@emeal.nttdata.com" });
                            oModel.setProperty(sPath, aAdj);
                            MessageToast.show("Archivo adjuntado correctamente");
                            oDlg.close();
                        }
                    }),
                    new Button({ text: "Cancelar", press: function () { oDlg.close(); } })
                ],
                afterClose: function () { oDlg.destroy(); }
            });
            oDlg.open();
        },

        onDescargarAdjunto: function () {
            MessageToast.show("Descargando archivo...");
        },

        onDeleteAdjunto: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            var that = this;
            MessageBox.confirm("\u00bfEliminar este adjunto?", {
                title: "Confirmar",
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    var oModel = that.getOwnerComponent().getModel();
                    var sPath  = "/requerimientos/" + that._iIndex + "/adjuntos";
                    var aAdj   = oModel.getProperty(sPath) || [];
                    var iIdx   = parseInt(oCtx.getPath().split("/").pop(), 10);
                    aAdj.splice(iIdx, 1);
                    oModel.setProperty(sPath, aAdj);
                    MessageToast.show("Adjunto eliminado");
                }
            });
        },

        // ── Stock ───────────────────────────────────────────────────────────────
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

        // ── Materiales ──────────────────────────────────────────────────────────
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

        // ── Generar Presentación para Cliente ──────────────────────────────────
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

        onNavBack: function () {
            var bMC = this.getView().getModel("ui").getProperty("/mercadoCorporativo");
            this.getRouter().navTo(bMC ? "mcRequerimientoList" : "requerimientoList");
        }
    });
});
