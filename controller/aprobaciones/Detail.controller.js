sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/TextArea",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/Avatar",
    "sap/ui/core/Icon",
    "sap/m/CheckBox",
    "sap/ui/core/HTML"
], function (BaseController, JSONModel, MessageBox, MessageToast, Dialog, VBox, HBox, TextArea, Button, Text, Avatar, Icon, CheckBox, HTML) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.aprobaciones.Detail", {

        onInit: function () {
            var oUiModel = new JSONModel({
                esHandset: false, esMC: false,
                esRedMovil: false, esRedFija: false,
                esOM: false, esComprasLocales: false,
                esDirFinanzas: false,
                headerVisible: true,
                reqTitulo: "", reqTipoInversion: "", reqTipoSolicitud: "", reqOrigenArea: "",
                mcCostos: [], mcKpis: [], mcPresentacion: ""
            });
            this.getView().setModel(oUiModel, "ui");
            this.getRouter().getRoute("aprobacionesDetail")
                .attachPatternMatched(this._onRouteMatched, this);
            this.getRouter().getRoute("mcAprobacionesDetail")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sAprId = decodeURIComponent(oEvent.getParameter("arguments").aprId);
            this._bindView(sAprId);
        },

        _bindView: function (sAprId) {
            var oModel = this.getOwnerComponent().getModel("aprobaciones");
            var aApr   = oModel.getProperty("/aprobaciones") || [];
            var iIndex = aApr.findIndex(function (a) { return a.aprId === sAprId; });
            if (iIndex === -1) { this.getRouter().navTo("aprobacionesList"); return; }
            this._iIndex = iIndex;
            this.getView().bindElement({ path: "/aprobaciones/" + iIndex, model: "aprobaciones" });

            var oApr   = oModel.getProperty("/aprobaciones/" + iIndex);
            var sLN    = oApr.lineaNegocio || "";
            var aKnown = ["Handset", "Mercado Corporativo", "Red Movil", "Red Fija", "O&M", "Compras Locales"];
            if (aKnown.indexOf(sLN) === -1) {
                sLN = oApr.mercado === "corporativo" ? "Mercado Corporativo" : "Handset";
            }
            var bHS = (sLN === "Handset");
            var oUi = this.getView().getModel("ui");
            oUi.setProperty("/esHandset",        bHS);
            oUi.setProperty("/esMC",             sLN === "Mercado Corporativo");
            oUi.setProperty("/esRedMovil",       sLN === "Red Movil");
            oUi.setProperty("/esRedFija",        sLN === "Red Fija");
            oUi.setProperty("/esOM",             sLN === "O&M");
            oUi.setProperty("/esComprasLocales", sLN === "Compras Locales");
            oUi.setProperty("/headerVisible", true);
            // Detectar si el usuario logueado es Director de Finanzas
            var oSession = this.getOwnerComponent().getModel("session");
            var sRolSess = oSession ? (oSession.getProperty("/rol") || "") : "";
            oUi.setProperty("/esDirFinanzas", sRolSess === "Director de Finanzas");

            if (bHS) {
                // Cargar datos del requerimiento vinculado
                var sReqId = oApr.reqId || "";
                var oReqModel = this.getOwnerComponent().getModel();
                var aReqs = oReqModel ? (oReqModel.getProperty("/requerimientos") || []) : [];
                var oReq  = aReqs.find(function (r) { return r.reqId === sReqId; }) || {};
                oUi.setProperty("/reqTitulo",        oReq.titulo           || oApr.titulo || "");
                oUi.setProperty("/reqMarca",         oReq.marca            || oApr.marca  || "");
                oUi.setProperty("/reqPeriodo",       oReq.periodo          || oApr.periodo || "");
                oUi.setProperty("/reqProceso",       oReq.proceso          || "Proceso 1 \u2013 Requerimiento de Equipos \u2013 Planificaci\u00f3n de Compras");
                oUi.setProperty("/reqTipoSolicitud", oReq.tipoSolicitud    || oApr.tipoSolicitud || "");
                oUi.setProperty("/reqValidoHasta",   oReq.validoHasta      || "");
                oUi.setProperty("/reqCreadoPor",     oReq.creadoPor        || "current.user@claro.com");
                oUi.setProperty("/reqFechaCreacion", oReq.fechaCreacion    || "");
                oUi.setProperty("/reqUltimaModif",   oReq.ultimaModificacion || "");

                // Cargar planCompras desde el requerimiento si no existe en aprobacion
                var oPlanCompras = oApr.planCompras;
                if (!oPlanCompras || !(oPlanCompras.items || []).length) {
                    var aItems = (oReq.items || []).map(function (it) {
                        var precioNeto = (it.precioFacturacion || 0) - (it.virUnitario || 0);
                        return {
                            modelo: it.modelo, codigo: it.codigo, codigoMaterial: it.codigoMaterial,
                            color: it.color, cantidad: it.cantidad,
                            precioFact: it.precioFacturacion, virFact: it.virUnitario,
                            precioNeto: precioNeto,
                            totalFact: it.totalFacturacion, totalVIR: it.totalVir, totalNeto: it.totalNeto
                        };
                    });
                    var oContrib = oReq.contributions || {};
                    var nTotVIR  = (oReq.aportesVIR || []).reduce(function (a, v) { return a + (v.monto || 0); }, 0);
                    oPlanCompras = {
                        lote: "COMPRA " + (oReq.marca || "").toUpperCase(),
                        tipo: oReq.tipoSolicitud || "",
                        fecha: (oReq.fechaCreacion || "").split(" ")[0],
                        items: aItems,
                        aportes: {
                            vir: nTotVIR,
                            otros: [
                                { concepto: "Data Sharing",         monto: oContrib.dataSharing           || 0, porcentaje: "1.40%" },
                                { concepto: "Aporte Log\u00edstico", monto: oContrib.contribucionLogistica  || 0, porcentaje: "0.00%" },
                                { concepto: "Pre order",            monto: oContrib.preOrder              || 0, porcentaje: "1.20%" },
                                { concepto: "Fondo Sell out",       monto: oContrib.fondoSellOut          || 0, porcentaje: "1.70%" },
                                { concepto: "Nuevos Canales y B2B", monto: oContrib.nuevosCanalesB2B      || 0, porcentaje: "0.15%" },
                                { concepto: "Rebate de Incentivo",  monto: oContrib.rebateIncentivo       || 0, porcentaje: "0.20%" }
                            ]
                        }
                    };
                    oModel.setProperty("/aprobaciones/" + iIndex + "/planCompras", oPlanCompras);
                }

                // Sincronizar adjuntos del requerimiento a la aprobacion
                var oAdjHS = oApr.adjuntos;
                if (!oAdjHS || (!( oAdjHS.acuerdos || []).length && !( oAdjHS.otrosArchivos || []).length)) {
                    var oReqAdj = oReq.adjuntosHS || { acuerdos: [], otrosArchivos: [] };
                    oModel.setProperty("/aprobaciones/" + iIndex + "/adjuntos", {
                        acuerdos:      oReqAdj.acuerdos      || [],
                        otrosArchivos: oReqAdj.otrosArchivos  || []
                    });
                }

                // Garantizar estructura de 4 niveles para Handset no-Derivado
                var aAprs = oApr.aprobadores || [];
                var bDerivadoApr = (oApr.tipoSolicitud || "").indexOf("Derivado") !== -1;
                if (!bDerivadoApr) {
                    var aTemplate = [
                        { nivel: 1, rol: "Jefe de Planificaci\u00f3n Comercial",  nombre: "Gladys Vivar",   estado: "Pendiente", fecha: "", comentario: "" },
                        { nivel: 2, rol: "Gerente Planificaci\u00f3n Comercial",  nombre: "Judith L\u00f3pez", estado: "-",       fecha: "", comentario: "" },
                        { nivel: 3, rol: "Compras",                               nombre: "Compras",         estado: "-",         fecha: "", comentario: "" },
                        { nivel: 4, rol: "Director Mercado Masivo",               nombre: "Hugo Gonzalez",   estado: "-",         fecha: "", comentario: "" }
                    ];
                    // Verificar si ya tiene la estructura correcta de 4 niveles con Compras en nivel 3
                    var bHasCompras = aAprs.some(function (a) { return a.nivel === 3 && (a.rol || "").indexOf("Compras") !== -1; });
                    if (aAprs.length !== 4 || !bHasCompras) {
                        // Merge: conservar datos existentes por nivel, respetar rol del template
                        aAprs = aTemplate.map(function (oTpl) {
                            var oExist = (oApr.aprobadores || []).find(function (a) {
                                return a.nivel === oTpl.nivel && (a.rol || "") === oTpl.rol;
                            });
                            return oExist || oTpl;
                        });
                        oModel.setProperty("/aprobaciones/" + iIndex + "/aprobadores", aAprs);
                    }
                } else if (!aAprs.length) {
                    aAprs = [{ nivel: 1, rol: "Jefe de Planificaci\u00f3n Comercial", nombre: "Gladys Vivar", estado: "Pendiente", fecha: "", comentario: "" }];
                    oModel.setProperty("/aprobaciones/" + iIndex + "/aprobadores", aAprs);
                }

                // Re-dibujar flujo visual (con reintento por si el tab no está activo aún)
                var that = this;
                this._pendingAprIndex = iIndex;
                this._pendingAprAprs  = aAprs;
                setTimeout(function () { that._renderAprFlow(iIndex, aAprs); }, 200);
            } else if (oUi.getProperty("/esMC")) {
                // Cargar datos del requerimiento MC vinculado
                var sMCReqId  = oApr.reqId || "";
                var oMCReqMdl = this.getOwnerComponent().getModel();
                var aMCReqs   = oMCReqMdl ? (oMCReqMdl.getProperty("/requerimientos") || []) : [];
                var oMCReq    = aMCReqs.find(function (r) { return r.reqId === sMCReqId; }) || {};
                oUi.setProperty("/reqTitulo",        oMCReq.titulo        || oApr.titulo        || "");
                oUi.setProperty("/reqTipoInversion", oMCReq.tipoInversion || oApr.tipoInversion || "");
                oUi.setProperty("/reqTipoSolicitud", oMCReq.tipoSolicitud || oApr.tipoSolicitud || "");
                oUi.setProperty("/reqOrigenArea",    oMCReq.origenArea    || oApr.origenArea    || "");
                // Cargar costos, kpis y presentacion explícitamente en el ui model
                // Primero desde el APR, si no desde evaluacionFinanciera del requerimiento
                var aMCCostos = oApr.costos || [];
                var aMCKpis   = oApr.kpis   || [];
                var sMCPres   = oApr.presentacion || "";
                if (!aMCCostos.length) {
                    var oEF = oMCReq.evaluacionFinanciera || {};
                    if (oEF.costos || oEF.ingresos) {
                        aMCCostos = [
                            { tipo: "Total Costos",  descripcion: "Costos del proyecto",  monto: oEF.costos   || 0 },
                            { tipo: "Ingresos",      descripcion: "Ingresos esperados",   monto: oEF.ingresos || 0 }
                        ];
                    } else {
                        aMCCostos = [
                            { tipo: "Costos",   descripcion: "Pendiente de evaluaci\u00f3n financiera", monto: 0 },
                            { tipo: "Ingresos", descripcion: "Pendiente de evaluaci\u00f3n financiera", monto: 0 }
                        ];
                    }
                }
                if (!aMCKpis.length) {
                    var oEF2 = oMCReq.evaluacionFinanciera || {};
                    if (oEF2.costos || oEF2.ingresos) {
                        aMCKpis = [
                            { kpi: "Costos",   valor: oEF2.costos   || 0 },
                            { kpi: "Ingresos", valor: oEF2.ingresos || 0 },
                            { kpi: "Margen %", valor: (oEF2.margen  || 0) + "%" },
                            { kpi: "ROI",      valor: (oEF2.roi     || 0) + "%" }
                        ];
                    } else {
                        aMCKpis = [
                            { kpi: "\u00cdtems planificados", valor: (oMCReq.items || []).length || "-" },
                            { kpi: "Importe estimado",       valor: "US$ " + (oMCReq.importeEstimadoUSD || oApr.valorEstimado || 0) },
                            { kpi: "Estado financiero",      valor: "Pendiente evaluaci\u00f3n" }
                        ];
                    }
                }
                if (!sMCPres && (oMCReq.cliente || oMCReq.areaFuncional || oApr.titulo)) {
                    sMCPres = "<p><strong>Solicitud:</strong> " + (oApr.reqId || oApr.aprId || "") + "</p>" +
                              "<p><strong>T\u00edtulo:</strong> " + (oMCReq.titulo || oApr.titulo || "-") + "</p>" +
                              "<p><strong>Tipo de Solicitud:</strong> " + (oMCReq.tipoSolicitud || oApr.tipoSolicitud || "-") + "</p>" +
                              "<p><strong>Cliente:</strong> " + (oMCReq.cliente || "-") + "</p>" +
                              "<p><strong>\u00c1rea Funcional:</strong> " + (oMCReq.areaFuncional || "-") + "</p>" +
                              "<p><strong>Importe Estimado:</strong> US$ " + (oMCReq.importeEstimadoUSD || oApr.valorEstimado || 0) + "</p>";
                } else if (!sMCPres) {
                    sMCPres = "<p><strong>Solicitud:</strong> " + (oApr.reqId || oApr.aprId || "") + "</p>" +
                              "<p><strong>T\u00edtulo:</strong> " + (oApr.titulo || "-") + "</p>" +
                              "<p><strong>Tipo de Solicitud:</strong> " + (oApr.tipoSolicitud || "-") + "</p>" +
                              "<p><strong>Tipo Inversi\u00f3n:</strong> " + (oApr.tipoInversion || "-") + "</p>";
                }
                oUi.setProperty("/mcCostos",       aMCCostos);
                oUi.setProperty("/mcKpis",         aMCKpis);
                oUi.setProperty("/mcPresentacion",  sMCPres);

                // Garantizar estructura de 4 niveles MC
                var aMCTemplate = [
                    { nivel: 1, rol: "Jefe Mercado Masivo (Comercial)",        nombre: "Miguel Caballero",      estado: "Pendiente", fecha: "", comentario: "" },
                    { nivel: 2, rol: "Gerente Mercado Masivo (Comercial)",      nombre: "Joel Morales",          estado: "-",         fecha: "", comentario: "" },
                    { nivel: 3, rol: "Sub Director Mercado Masivo (Comercial)", nombre: "Viviana Estremadoyro", estado: "-",         fecha: "", comentario: "" },
                    { nivel: 4, rol: "Director Mercado Masivo (Comercial)",     nombre: "Hugo Gonzalez",        estado: "-",         fecha: "", comentario: "" }
                ];
                var aMCCurr = oApr.aprobadores || [];
                var bHasMC  = aMCCurr.length === 4 && aMCCurr.some(function (a) { return (a.rol || "").indexOf("Mercado Masivo") !== -1; });
                if (!bHasMC) {
                    var aMCMerge = aMCTemplate.map(function (oTpl) {
                        var oEx = aMCCurr.find(function (a) { return a.nivel === oTpl.nivel; });
                        return oEx || oTpl;
                    });
                    oModel.setProperty("/aprobaciones/" + iIndex + "/aprobadores", aMCMerge);
                }
                var aMCAprs = oModel.getProperty("/aprobaciones/" + iIndex + "/aprobadores") || [];
                this._pendingMCIndex = iIndex;
                this._pendingMCAprs  = aMCAprs;
                var that2 = this;
                setTimeout(function () { that2._renderMCFlow(iIndex, aMCAprs); }, 200);
            }
        },

        _renderAprFlow: function (iIndex, aAprs) {
            var oDiagram = this.byId("aprFlowDiagram");
            var oCards   = this.byId("aprFlowCards");
            if (!oDiagram || !oCards) { return; }
            oDiagram.destroyItems();
            oCards.destroyItems();
            if (!aAprs || !aAprs.length) { return; }

            var mNombres = {
                "Jefe de Planificaci\u00f3n Comercial":  "Gladys Vivar",
                "Gerente Planificaci\u00f3n Comercial":   "Judith L\u00f3pez",
                "Compras":                              "Compras",
                "Director Mercado Masivo":              "Hugo Gonzalez"
            };

            aAprs.forEach(function (oStep, idx) {
                var sEst = oStep.estado || "Pendiente";
                var sDiagClass = sEst === "Rechazado" ? "reqFlowCircleRejected"
                               : sEst === "Aprobado"  ? "reqFlowCircleApproved"
                               : "reqFlowCirclePending";
                var sRolCorto = (oStep.rol || "")
                    .replace("Planificaci\u00f3n Comercial", "Plan. Comercial")
                    .replace("Gerente", "Gte.")
                    .replace("Director", "Dir.")
                    .replace("Jefe de ", "");

                var oStepBox = new VBox({ alignItems: "Center" }).addStyleClass("reqFlowStep");
                oStepBox.addItem(new Text({ text: sRolCorto, wrapping: true, textAlign: "Center" }).addStyleClass("reqFlowRolLabel"));
                var sInit = (oStep.nombre || oStep.rol || "?").split(" ").map(function (w) { return w[0] || ""; }).join("").toUpperCase().substring(0, 2);
                oStepBox.addItem(new Avatar({ initials: sInit, displaySize: "M" }).addStyleClass("reqFlowCircle " + sDiagClass));
                oDiagram.addItem(oStepBox);

                if (idx < aAprs.length - 1) {
                    var oArrow = new VBox({ justifyContent: "Center", alignItems: "Center" }).addStyleClass("reqFlowArrow");
                    oArrow.addItem(new Text({ text: ">>" }).addStyleClass("reqFlowArrowText"));
                    oDiagram.addItem(oArrow);
                }

                var sNombre   = oStep.nombre || mNombres[oStep.rol] || oStep.rol || "";
                var sInitials = sNombre.split(" ").map(function (w) { return w[0] || ""; }).join("").toUpperCase().substring(0, 2);
                var sAvtClass = sEst === "Rechazado" ? "reqCardAvatarRejected"
                              : sEst === "Aprobado"  ? "reqCardAvatarApproved"
                              : "reqCardAvatarPending";
                var sEstColor = sEst === "Rechazado" ? "#d93025" : sEst === "Aprobado" ? "#107e3e" : "#e76500";
                var sEstIcon  = sEst === "Rechazado" ? "sap-icon://sys-cancel-2"
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
                oCards.addItem(oPersonCard);
            });
        },

        // Re-dibujar flujo al activar el tab "hsFlujo" o "mcFlujo"
        onTabSelect: function (oEvent) {
            var sKey = oEvent.getParameter("key");
            if (sKey === "hsFlujo" && this._pendingAprIndex !== undefined) {
                var oModel = this.getOwnerComponent().getModel("aprobaciones");
                var aAprs  = oModel.getProperty("/aprobaciones/" + this._pendingAprIndex + "/aprobadores") || [];
                this._renderAprFlow(this._pendingAprIndex, aAprs);
            }
            if (sKey === "mcFlujo" && this._pendingMCIndex !== undefined) {
                var oMCModel = this.getOwnerComponent().getModel("aprobaciones");
                var aMCAprs  = oMCModel.getProperty("/aprobaciones/" + this._pendingMCIndex + "/aprobadores") || [];
                this._renderMCFlow(this._pendingMCIndex, aMCAprs);
            }
        },

        onToggleHeader: function () {
            var oUi      = this.getView().getModel("ui");
            var bVisible = oUi.getProperty("/headerVisible");
            oUi.setProperty("/headerVisible", !bVisible);
            var oPanel  = this.byId("aprInfoPanel");
            var oPanel2 = this.byId("aprInfoPanelOther");
            var oPanel3 = this.byId("aprInfoPanelMC");
            if (oPanel)  { oPanel.setVisible(!bVisible); }
            if (oPanel2) { oPanel2.setVisible(!bVisible); }
            if (oPanel3) { oPanel3.setVisible(!bVisible); }
        },

        onApprove: function () {
            var oModel = this.getOwnerComponent().getModel("aprobaciones");
            var oApr   = oModel.getProperty("/aprobaciones/" + this._iIndex);
            var sEstado = oApr.estado || "";
            var oUi    = this.getView().getModel("ui");
            // Paso 6.1: Aprobación Previo a Compras (Director Finanzas)
            if (sEstado === "Enviado a Firma de Acta") {
                this._openActaApproveDialog(oApr);
            } else if (oUi.getProperty("/esMC")) {
                this._openMCApproveDialog(oApr);
            } else if ((oApr.lineaNegocio || "") === "Handset") {
                this._openHandsetApproveDialog(oApr);
            } else {
                this._openSimpleApproveDialog();
            }
        },

        _openHandsetApproveDialog: function (oApr) {
            var that   = this;
            var oModel = this.getOwnerComponent().getModel("aprobaciones");
            var oFirmaCheck = new CheckBox({ text: "Incluir firma manual / imagen (C2: opcional)", selected: false });
            var oFirmaHtml  = new HTML({
                content: '<div id="aprFirmaContainer" style="display:none;margin-top:8px;">' +
                    '<canvas id="aprFirmaCanvas" width="340" height="120" style="border:1px solid #ccc;border-radius:4px;background:#fff;cursor:crosshair;display:block;"></canvas>' +
                    '<div style="margin-top:4px;font-size:0.82rem;">' +
                    '<a id="aprFirmaLimpiarBtn" href="#" style="color:#c62828;">Limpiar</a>' +
                    '</div>' +
                    '<div style="margin-top:6px;font-size:0.82rem;color:#777;">O subir imagen de firma:</div>' +
                    '<input id="aprFirmaUpload" type="file" accept="image/*" style="font-size:0.82rem;margin-top:4px;width:100%;" />' +
                    '</div>'
            });
            oFirmaCheck.attachSelect(function () {
                var bSel = oFirmaCheck.getSelected();
                var elC  = document.getElementById("aprFirmaContainer");
                if (elC) { elC.style.display = bSel ? "block" : "none"; }
                if (bSel) {
                    setTimeout(function () {
                        var canvas = document.getElementById("aprFirmaCanvas");
                        if (canvas && !canvas._drawInit) {
                            canvas._drawInit = true;
                            var ctx = canvas.getContext("2d");
                            var bDraw = false;
                            canvas.addEventListener("mousedown",  function (e) { bDraw = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
                            canvas.addEventListener("mousemove",  function (e) { if (!bDraw) { return; } ctx.lineTo(e.offsetX, e.offsetY); ctx.strokeStyle = "#222"; ctx.lineWidth = 2; ctx.stroke(); });
                            canvas.addEventListener("mouseup",    function ()  { bDraw = false; });
                            canvas.addEventListener("mouseleave", function ()  { bDraw = false; });
                        }
                        var elL = document.getElementById("aprFirmaLimpiarBtn");
                        if (elL && !elL._lSet) {
                            elL._lSet = true;
                            elL.addEventListener("click", function (e) {
                                e.preventDefault();
                                var c = document.getElementById("aprFirmaCanvas");
                                if (c) { c.getContext("2d").clearRect(0, 0, c.width, c.height); }
                            });
                        }
                    }, 150);
                }
            });
            var oTA = new TextArea({ placeholder: "Comentario (opcional)...", width: "100%", rows: 2 });
            var oDialog = new Dialog({
                title: "Aprobar Solicitud " + oApr.aprId,
                contentWidth: "420px",
                content: [
                    new VBox({ items: [
                        new Text({ text: "\u00bfEst\u00e1 seguro que desea aprobar esta solicitud?" }).addStyleClass("sapUiSmallMarginBottom"),
                        oFirmaCheck, oFirmaHtml,
                        new Text({ text: "Comentario:" }).addStyleClass("sapUiSmallMarginTop"), oTA
                    ]}).addStyleClass("sapUiSmallMarginBeginEnd sapUiSmallMarginTopBottom")
                ],
                beginButton: new Button({
                    text: "Aprobar", type: "Emphasized",
                    press: function () {
                        // Leer datos frescos del modelo
                        var oAprNow    = oModel.getProperty("/aprobaciones/" + that._iIndex);
                        var nivelActual = oAprNow.nivelActual || 1;
                        var nivelMax    = oAprNow.nivelMaxAprobacion || 4;
                        var bDerivado  = (oAprNow.tipoSolicitud || "").toLowerCase().indexOf("derivado") !== -1;
                        var nivelFinal = bDerivado ? 1 : nivelMax;
                        var sToday     = new Date().toLocaleString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
                        var iAprIdx    = nivelActual - 1;
                        // Marcar nivel actual como Aprobado
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + iAprIdx + "/estado",     "Aprobado");
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + iAprIdx + "/fecha",      sToday);
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + iAprIdx + "/comentario", oTA.getValue());
                        var nuevoNivel = nivelActual + 1;
                        var sNuevo;
                        if (nivelActual >= nivelFinal) {
                            sNuevo = "Aprobado Final";
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/nivelActual",    nuevoNivel);
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/rolNivelActual", "");
                        } else {
                            // Nivel 3 = Compras: el requerimiento pasa a "Pendiente Aprobaci\u00f3n" (bandeja Compras)
                            var sNextRol = oModel.getProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + (nuevoNivel - 1) + "/rol") || "";
                            var sEstSig  = sNextRol === "Compras" ? "Pendiente Aprobaci\u00f3n" : "En Aprobaci\u00f3n";
                            sNuevo = sEstSig;
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/nivelActual",    nuevoNivel);
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + (nuevoNivel - 1) + "/estado", "En Proceso");
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/rolNivelActual", sNextRol);
                        }
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/estado",              sNuevo);
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobador",           "Oscar Ortiz");
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/comentarioAprobador", oTA.getValue());
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/fechaAprobacion",     sToday);
                        that._syncRequerimientoEstado(nivelActual >= nivelFinal ? "Aprobado" : sNuevo);
                        // Re-dibujar flujo
                        var aAprsNow = oModel.getProperty("/aprobaciones/" + that._iIndex + "/aprobadores") || [];
                        that._renderAprFlow(that._iIndex, aAprsNow);
                        oDialog.close();
                        MessageToast.show(nivelActual >= nivelFinal
                            ? "Solicitud aprobada en nivel final. DocuSign habilitado para env\u00edo de carta."
                            : "Aprobado. Solicitud enviada al siguiente nivel: " + (oModel.getProperty("/aprobaciones/" + that._iIndex + "/rolNivelActual") || "") + ".");
                    }.bind(that)
                }),
                endButton: new Button({ text: "Cancelar", press: function () { oDialog.close(); } })
            });
            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        _openMCApproveDialog: function (oApr) {
            var that   = this;
            var oModel = this.getOwnerComponent().getModel("aprobaciones");
            var oTA    = new TextArea({ placeholder: "Comentario (opcional)...", width: "100%", rows: 2 });
            var oDialog = new Dialog({
                title: "Aprobar Solicitud MC \u2013 " + oApr.aprId,
                contentWidth: "420px",
                content: [
                    new VBox({ items: [
                        new Text({ text: "\u00bfEst\u00e1 seguro que desea aprobar esta solicitud?" }).addStyleClass("sapUiSmallMarginBottom"),
                        new Text({ text: "Comentario:" }).addStyleClass("sapUiSmallMarginTop"), oTA
                    ]}).addStyleClass("sapUiSmallMarginBeginEnd sapUiSmallMarginTopBottom")
                ],
                beginButton: new Button({
                    text: "Aprobar", type: "Emphasized",
                    press: function () {
                        var oAprNow     = oModel.getProperty("/aprobaciones/" + that._iIndex);
                        var nivelActual = oAprNow.nivelActual || 1;
                        var nivelMax    = oAprNow.nivelMaxAprobacion || 4;
                        var sToday      = new Date().toLocaleString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
                        var iAprIdx     = nivelActual - 1;
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + iAprIdx + "/estado",     "Aprobado");
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + iAprIdx + "/fecha",      sToday);
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + iAprIdx + "/comentario", oTA.getValue());
                        var nuevoNivel = nivelActual + 1;
                        var sNuevo;
                        if (nivelActual >= nivelMax) {
                            sNuevo = "Aprobado";
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/nivelActual",    nuevoNivel);
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/rolNivelActual", "");
                        } else {
                            sNuevo = "En Aprobaci\u00f3n";
                            var sNextRol = oModel.getProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + (nuevoNivel - 1) + "/rol") || "";
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/nivelActual",    nuevoNivel);
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + (nuevoNivel - 1) + "/estado", "En Proceso");
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/rolNivelActual", sNextRol);
                        }
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/estado",              sNuevo);
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/comentarioAprobador", oTA.getValue());
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/fechaAprobacion",     sToday);
                        that._syncRequerimientoEstado(sNuevo);
                        var aAprsNow = oModel.getProperty("/aprobaciones/" + that._iIndex + "/aprobadores") || [];
                        that._renderMCFlow(that._iIndex, aAprsNow);
                        oDialog.close();
                        MessageToast.show(nivelActual >= nivelMax
                            ? "Solicitud MC aprobada en nivel final. El requerimiento queda en estado Aprobado."
                            : "Aprobado. Enviado al siguiente nivel: " + (oModel.getProperty("/aprobaciones/" + that._iIndex + "/rolNivelActual") || "") + ".");
                    }
                }),
                endButton: new Button({ text: "Cancelar", press: function () { oDialog.close(); } })
            });
            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        _renderMCFlow: function (iIndex, aAprs) {
            var oDiagram = this.byId("mcFlowDiagram");
            var oCards   = this.byId("mcFlowCards");
            if (!oDiagram || !oCards) { return; }
            oDiagram.destroyItems();
            oCards.destroyItems();
            if (!aAprs || !aAprs.length) { return; }
            aAprs.forEach(function (oStep, idx) {
                var sEst = oStep.estado || "Pendiente";
                if (sEst === "-") { sEst = "Pendiente"; }
                var sDiagClass = sEst === "Rechazado" ? "reqFlowCircleRejected"
                               : sEst === "Aprobado"  ? "reqFlowCircleApproved"
                               : "reqFlowCirclePending";
                var sRolCorto = (oStep.rol || "")
                    .replace("Mercado Masivo (Comercial)", "M.M. Comercial")
                    .replace("Sub Director", "Sub Dir.")
                    .replace("Director", "Dir.")
                    .replace("Gerente", "Gte.");
                var oStepBox = new VBox({ alignItems: "Center" }).addStyleClass("reqFlowStep");
                oStepBox.addItem(new Text({ text: sRolCorto, wrapping: true, textAlign: "Center" }).addStyleClass("reqFlowRolLabel"));
                var sInit = (oStep.nombre || oStep.rol || "?").split(" ").map(function (w) { return w[0] || ""; }).join("").toUpperCase().substring(0, 2);
                oStepBox.addItem(new Avatar({ initials: sInit, displaySize: "M" }).addStyleClass("reqFlowCircle " + sDiagClass));
                oDiagram.addItem(oStepBox);
                if (idx < aAprs.length - 1) {
                    var oArrow = new VBox({ justifyContent: "Center", alignItems: "Center" }).addStyleClass("reqFlowArrow");
                    oArrow.addItem(new Text({ text: ">>" }).addStyleClass("reqFlowArrowText"));
                    oDiagram.addItem(oArrow);
                }
                var sNombre   = oStep.nombre || oStep.rol || "";
                var sInitials = sNombre.split(" ").map(function (w) { return w[0] || ""; }).join("").toUpperCase().substring(0, 2);
                var sAvtClass = sEst === "Rechazado" ? "reqCardAvatarRejected"
                              : sEst === "Aprobado"  ? "reqCardAvatarApproved"
                              : "reqCardAvatarPending";
                var sEstColor = sEst === "Rechazado" ? "#d93025" : sEst === "Aprobado" ? "#107e3e" : "#e76500";
                var sEstIcon  = sEst === "Rechazado" ? "sap-icon://sys-cancel-2"
                              : sEst === "Aprobado"  ? "sap-icon://sys-enter-2"
                              : "sap-icon://pending";
                var oPersonCard = new VBox({ alignItems: "Center" }).addStyleClass("reqPersonCard");
                oPersonCard.addItem(new Avatar({ initials: sInitials, displaySize: "XL" }).addStyleClass("reqPersonAvatar " + sAvtClass));
                oPersonCard.addItem(new Text({ text: sNombre, textAlign: "Center", wrapping: true }).addStyleClass("reqPersonName"));
                oPersonCard.addItem(new Text({ text: oStep.rol || "", textAlign: "Center", wrapping: true }).addStyleClass("reqPersonRol sapUiTinyMarginTop"));
                var oEstRow = new HBox({ alignItems: "Center", justifyContent: "Center" });
                oEstRow.addItem(new Icon({ src: sEstIcon, size: "0.7rem", color: sEstColor }));
                oEstRow.addItem(new Text({ text: " " + sEst }).addStyleClass(
                    sEst === "Rechazado" ? "reqCardStatusError" : sEst === "Aprobado" ? "reqCardStatusSuccess" : "reqCardStatusPending"));
                oPersonCard.addItem(oEstRow);
                oCards.addItem(oPersonCard);
            });
        },

        _openSimpleApproveDialog: function () {
            var that   = this;
            var oModel = this.getOwnerComponent().getModel("aprobaciones");
            var oCtx   = this.getView().getBindingContext("aprobaciones");
            if (!oCtx) { return; }
            var oTA    = new TextArea({ placeholder: "Comentario (opcional)...", width: "100%", rows: 3 });
            var oDialog = new Dialog({
                title: "Aprobar Solicitud " + oCtx.getProperty("aprId"),
                contentWidth: "380px",
                content: [
                    new VBox({ items: [
                        new Text({ text: "\u00bfEst\u00e1 seguro que desea aprobar esta solicitud?" }).addStyleClass("sapUiSmallMarginBottom"),
                        new Text({ text: "Comentario:" }).addStyleClass("sapUiTinyMarginBottom"), oTA
                    ]}).addStyleClass("sapUiSmallMarginBeginEnd sapUiSmallMarginTopBottom")
                ],
                beginButton: new Button({
                    text: "Aprobar", type: "Emphasized",
                    press: function () {
                        var oApr2      = oModel.getProperty("/aprobaciones/" + that._iIndex);
                        var nivelActual = oApr2.nivelActual || 1;
                        var nivelMax    = oApr2.nivelMaxAprobacion || 1;
                        var sToday      = new Date().toISOString().split("T")[0];
                        var iAprIdx     = nivelActual - 1;
                        // Marcar nivel actual como Aprobado
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + iAprIdx + "/estado",     "Aprobado");
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + iAprIdx + "/fecha",      sToday);
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + iAprIdx + "/comentario", oTA.getValue());
                        var nuevoNivel = nivelActual + 1;
                        var sNuevo;
                        if (nivelActual >= nivelMax) {
                            sNuevo = "Aprobado";
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/nivelActual",    nuevoNivel);
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/rolNivelActual", "");
                        } else {
                            sNuevo = "En Aprobaci\u00f3n";
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/nivelActual",    nuevoNivel);
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + (nuevoNivel - 1) + "/estado", "Pendiente");
                            var sNextRol2 = oModel.getProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + (nuevoNivel - 1) + "/rol") || "";
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/rolNivelActual", sNextRol2);
                        }
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/estado",              sNuevo);
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobador",           "Oscar Ortiz");
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/comentarioAprobador", oTA.getValue());
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/fechaAprobacion",     sToday);
                        that._syncRequerimientoEstado(sNuevo);
                        oDialog.close();
                        MessageToast.show(sNuevo === "Aprobado"
                            ? "Solicitud aprobada en nivel final."
                            : "Aprobado. Se env\u00eda al siguiente nivel.");
                    }.bind(that)
                }),
                endButton: new Button({ text: "Cancelar", press: function () { oDialog.close(); } })
            });
            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        onReject: function () {
            var that   = this;
            var oModel = this.getOwnerComponent().getModel("aprobaciones");
            var oCtx   = this.getView().getBindingContext("aprobaciones");
            if (!oCtx) { return; }
            var oTA    = new TextArea({ placeholder: "Motivo del rechazo (obligatorio)...", width: "100%", rows: 3 });
            var oDialog = new Dialog({
                title: "Rechazar Solicitud " + oCtx.getProperty("aprId"),
                contentWidth: "380px",
                content: [
                    new VBox({ items: [
                        new Text({ text: "Por favor, indique el motivo del rechazo." }).addStyleClass("sapUiSmallMarginBottom"),
                        oTA
                    ]}).addStyleClass("sapUiSmallMarginBeginEnd sapUiSmallMarginTopBottom")
                ],
                beginButton: new Button({
                    text: "Rechazar", type: "Reject",
                    press: function () {
                        if (!oTA.getValue().trim()) { MessageToast.show("Ingrese el motivo del rechazo"); return; }
                        var oAprNow = oModel.getProperty("/aprobaciones/" + that._iIndex);
                        var iNivel  = (oAprNow.nivelActual || 1) - 1;
                        var sToday  = new Date().toLocaleString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
                        // Marcar aprobador actual como Rechazado
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + iNivel + "/estado",     "Rechazado");
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + iNivel + "/fecha",      sToday);
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + iNivel + "/comentario", oTA.getValue());
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/estado",              "Rechazado");
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobador",           "Oscar Ortiz");
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/comentarioAprobador", oTA.getValue());
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/fechaAprobacion",     sToday);
                        that._syncRequerimientoEstado("Rechazado");
                        // Re-dibujar flujo
                        var aAprs = oModel.getProperty("/aprobaciones/" + that._iIndex + "/aprobadores") || [];
                        that._renderAprFlow(that._iIndex, aAprs);
                        oDialog.close();
                        MessageToast.show("Solicitud rechazada");
                    }.bind(that)
                }),
                endButton: new Button({ text: "Cancelar", press: function () { oDialog.close(); } })
            });
            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        // -- Paso 6.1: Di�logo Aprobaci�n Acta Aceptaci�n (Director Finanzas) -------------
        _openActaApproveDialog: function (oApr) {
            var that   = this;
            var oModel = this.getOwnerComponent().getModel("aprobaciones");

            var oFirmaCheck = new CheckBox({ text: "Incluir firma manual / imagen", selected: false });
            var oFirmaHtml  = new HTML({
                content: '<div id="actaFirmaContainer" style="display:none;margin-top:8px;">' +
                    '<canvas id="actaFirmaCanvas" width="340" height="120" style="border:1px solid #ccc;border-radius:4px;background:#fff;cursor:crosshair;display:block;"></canvas>' +
                    '<div style="margin-top:4px;font-size:0.82rem;">' +
                    '<a id="actaFirmaLimpiarBtn" href="#" style="color:#c62828;">Limpiar</a>' +
                    '</div>' +
                    '<div style="margin-top:6px;font-size:0.82rem;color:#777;">O subir imagen de firma:</div>' +
                    '<input id="actaFirmaUpload" type="file" accept="image/*" style="font-size:0.82rem;margin-top:4px;width:100%;" />' +
                    '</div>'
            });
            oFirmaCheck.attachSelect(function () {
                var bSel = oFirmaCheck.getSelected();
                var elC  = document.getElementById("actaFirmaContainer");
                if (elC) { elC.style.display = bSel ? "block" : "none"; }
                if (bSel) {
                    setTimeout(function () {
                        var canvas = document.getElementById("actaFirmaCanvas");
                        if (canvas && !canvas._drawInit) {
                            canvas._drawInit = true;
                            var ctx = canvas.getContext("2d");
                            var bDraw = false;
                            canvas.addEventListener("mousedown",  function (e) { bDraw = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
                            canvas.addEventListener("mousemove",  function (e) { if (!bDraw) { return; } ctx.lineTo(e.offsetX, e.offsetY); ctx.strokeStyle = "#222"; ctx.lineWidth = 2; ctx.stroke(); });
                            canvas.addEventListener("mouseup",    function ()  { bDraw = false; });
                            canvas.addEventListener("mouseleave", function ()  { bDraw = false; });
                        }
                        var elL = document.getElementById("actaFirmaLimpiarBtn");
                        if (elL && !elL._lSet) {
                            elL._lSet = true;
                            elL.addEventListener("click", function (e) {
                                e.preventDefault();
                                var c = document.getElementById("actaFirmaCanvas");
                                if (c) { c.getContext("2d").clearRect(0, 0, c.width, c.height); }
                            });
                        }
                    }, 150);
                }
            });

            var oTA = new TextArea({ placeholder: "Comentario (opcional)...", width: "100%", rows: 2 });

            var oDialog = new Dialog({
                title: "Aprobar Carta Aceptaci\u00f3n \u2013 Paso 6.1",
                contentWidth: "440px",
                content: [
                    new VBox({
                        items: [
                            new Text({ text: "\u00bfEst\u00e1 seguro que desea aprobar la Carta de Aceptaci\u00f3n?" }).addStyleClass("sapUiSmallMarginBottom"),
                            new Text({ text: "Al aprobar:\n\u2022 Se avanza con la creaci\u00f3n del pedido en SAP (C1).\n\u2022 Se adjuntan en Ariba la carta de compromiso y necesidad.\n\u2022 Se genera tarea a Compras para cierre del pedido.", wrapping: true }).addStyleClass("sapUiSmallMarginBottom"),
                            oFirmaCheck, oFirmaHtml,
                            new Text({ text: "Comentario:" }).addStyleClass("sapUiSmallMarginTop"),
                            oTA
                        ]
                    }).addStyleClass("sapUiSmallMarginBeginEnd sapUiSmallMarginTopBottom")
                ],
                beginButton: new Button({
                    text: "Aprobar", type: "Emphasized",
                    press: function () {
                        var sNow = new Date().toISOString().split("T")[0];
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/estado",              "Aprobado Director Finanzas");
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobador",           "Carlos Solano Morales");
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/comentarioAprobador", oTA.getValue());
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/fechaAprobacion",     sNow);
                        that._syncRequerimientoEstado("Aprobado Director Finanzas");
                        oDialog.close();
                        MessageToast.show("Carta de Aceptaci\u00f3n aprobada. Se crea tarea en SAP/Ariba para Compras (C1).");
                    }
                }),
                endButton: new Button({ text: "Cancelar", press: function () { oDialog.close(); } })
            });
            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        onNavBack:       function () { this.getRouter().navTo("aprobacionesList"); },
        onExportarExcel: function () { MessageToast.show("Exportando a Excel..."); },
        onDescargarPDF:  function () { MessageToast.show("Descargando PDF..."); },

        // -- Paso 6.1: Descargar PDF del Acta de Aceptaci�n -------------------
        onDescargarActaPDF: function () {
            var oModel = this.getOwnerComponent().getModel("aprobaciones");
            var oApr   = oModel.getProperty("/aprobaciones/" + this._iIndex);
            if (!oApr) { return; }
            var oActa  = oApr.actaAceptacion || {};
            MessageToast.show("Generando PDF del Acta " + (oActa.numeroActa || "") + "...");
        },

        // ------------------------------------------------------------------
        // Bridge aprobaciones ? requerimientos: sincronizar estado
        // ------------------------------------------------------------------
        _syncRequerimientoEstado: function (sNuevoEstado) {
            var oAprModel = this.getOwnerComponent().getModel("aprobaciones");
            var oApr      = oAprModel && oAprModel.getProperty("/aprobaciones/" + this._iIndex);
            var sReqId    = oApr && oApr.reqId;
            if (!sReqId) { return; }

            // 1. Actualizar modelo global de requerimientos
            var oReqModel = this.getOwnerComponent().getModel();
            if (!oReqModel) { return; }
            var aReqs = oReqModel.getProperty("/requerimientos") || [];
            var iIdx  = aReqs.findIndex(function (r) { return r.reqId === sReqId; });
            if (iIdx === -1) { return; }
            var sNow = new Date().toLocaleDateString("de-DE") + " " +
                       new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
            oReqModel.setProperty("/requerimientos/" + iIdx + "/estado", sNuevoEstado);
            oReqModel.setProperty("/requerimientos/" + iIdx + "/ultimaModificacion", sNow);

            // 2. Actualizar tambi�n el modelo local del canal correspondiente
            //    para que la tabla de lista refleje el cambio al volver
            var sLineaN = oApr.lineaNegocio || "";
            var mModelos = {
                "Red Movil":       "redMovil",
                "Red Fija":        "redFija",
                "O&M":             "om",
                "Compras Locales": "comprasLocales",
                "Handset":         "handset"
            };
            var sModelName = mModelos[sLineaN];
            // Los modelos locales viven en las vistas de lista, no en el componente.
            // Los actualizamos en el modelo global que es la fuente de verdad compartida;
            // al regresar a la lista, onItemPress vuelve a sincronizar desde el global.
            // Para Handset tambi�n sincronizamos el modelo "handset" si est� registrado en el componente.
            if (sModelName) {
                var oLocalModel = this.getOwnerComponent().getModel(sModelName);
                if (oLocalModel) {
                    var aLocal = oLocalModel.getProperty("/items") || [];
                    var iLocal = aLocal.findIndex(function (r) { return r.reqId === sReqId; });
                    if (iLocal !== -1) {
                        oLocalModel.setProperty("/items/" + iLocal + "/estado", sNuevoEstado);
                    }
                }
            }
            // 3. Sincronizar flujoAprobacion del requerimiento con los aprobadores actualizados
            //    para que el diagrama de flujo en la vista de requerimiento muestre los estados correctos
            var aAprobadores = oApr.aprobadores || [];
            if (aAprobadores.length > 0) {
                oReqModel.setProperty("/requerimientos/" + iIdx + "/flujoAprobacion", aAprobadores);
            }

            // 4. Si ya hay aprobación final, agregar paso de firma al flujo
            var bFirmaActa = sNuevoEstado === "Enviado a Firma de Acta" || sNuevoEstado === "Aprobado Director Finanzas";
            if (bFirmaActa) {
                var aFlujoActual = oReqModel.getProperty("/requerimientos/" + iIdx + "/flujoAprobacion") || [];
                var yaFirma = aFlujoActual.some(function (s) { return s.nivel === "FIRMA"; });
                if (!yaFirma) {
                    aFlujoActual = aFlujoActual.slice(); // copia
                    aFlujoActual.push({
                        nivel:      "FIRMA",
                        rol:        "Director de Finanzas",
                        nombre:     "Carlos Solano Morales",
                        iniciales:  "DF",
                        estado:     sNuevoEstado === "Aprobado Director Finanzas" ? "Aprobado" : "Pendiente",
                        fecha:      sNuevoEstado === "Aprobado Director Finanzas" ? new Date().toISOString().split("T")[0] : "",
                        comentario: ""
                    });
                    oReqModel.setProperty("/requerimientos/" + iIdx + "/flujoAprobacion", aFlujoActual);
                } else {
                    // Actualizar estado del paso de firma si ya existe
                    var iF = aFlujoActual.findIndex(function (s) { return s.nivel === "FIRMA"; });
                    if (iF !== -1 && sNuevoEstado === "Aprobado Director Finanzas") {
                        oReqModel.setProperty("/requerimientos/" + iIdx + "/flujoAprobacion/" + iF + "/estado", "Aprobado");
                        oReqModel.setProperty("/requerimientos/" + iIdx + "/flujoAprobacion/" + iF + "/fecha",  new Date().toISOString().split("T")[0]);
                    }
                }
            }        }
    });
});