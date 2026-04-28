sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/VBox",
    "sap/m/TextArea",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/CheckBox",
    "sap/ui/core/HTML"
], function (BaseController, JSONModel, MessageBox, MessageToast, Dialog, VBox, TextArea, Button, Text, CheckBox, HTML) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.aprobaciones.Detail", {

        onInit: function () {
            var oUiModel = new JSONModel({
                esHandset: false, esMC: false,
                esRedMovil: false, esRedFija: false,
                esOM: false, esComprasLocales: false,
                headerVisible: true
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
            var oUi = this.getView().getModel("ui");
            oUi.setProperty("/esHandset",        sLN === "Handset");
            oUi.setProperty("/esMC",             sLN === "Mercado Corporativo");
            oUi.setProperty("/esRedMovil",       sLN === "Red Movil");
            oUi.setProperty("/esRedFija",        sLN === "Red Fija");
            oUi.setProperty("/esOM",             sLN === "O&M");
            oUi.setProperty("/esComprasLocales", sLN === "Compras Locales");
            oUi.setProperty("/headerVisible", true);
            var oPanel = this.byId("aprInfoPanel");
            if (oPanel) { oPanel.setVisible(true); }
        },

        onToggleHeader: function () {
            var oPanel   = this.byId("aprInfoPanel");
            var oUi      = this.getView().getModel("ui");
            var bVisible = oUi.getProperty("/headerVisible");
            oUi.setProperty("/headerVisible", !bVisible);
            if (oPanel) { oPanel.setVisible(!bVisible); }
        },

        onApprove: function () {
            var oModel = this.getOwnerComponent().getModel("aprobaciones");
            var oApr   = oModel.getProperty("/aprobaciones/" + this._iIndex);
            var sEstado = oApr.estado || "";
            // Paso 6.1: Aprobaci�n Previo a Compras (Director Finanzas)
            if (sEstado === "Enviado a Firma de Acta") {
                this._openActaApproveDialog(oApr);
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
                        var nivelActual = oApr.nivelActual || 1;
                        var nivelMax    = oApr.nivelMaxAprobacion || 3;
                        var bDerivado  = (oApr.tipoSolicitud || "").toLowerCase().indexOf("derivado") !== -1;
                        var nivelFinal = bDerivado ? 1 : nivelMax;
                        var sToday     = new Date().toISOString().split("T")[0];
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
                            sNuevo = "En Aprobaci\u00f3n";
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/nivelActual",    nuevoNivel);
                            // Activar siguiente nivel
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + (nuevoNivel - 1) + "/estado", "Pendiente");
                            var sNextRol = oModel.getProperty("/aprobaciones/" + that._iIndex + "/aprobadores/" + (nuevoNivel - 1) + "/rol") || "";
                            oModel.setProperty("/aprobaciones/" + that._iIndex + "/rolNivelActual", sNextRol);
                        }
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/estado",              sNuevo);
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobador",           "Oscar Ortiz");
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/comentarioAprobador", oTA.getValue());
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/fechaAprobacion",     sToday);
                        that._syncRequerimientoEstado(sNuevo === "Aprobado Final" ? "Aprobado" : "En Aprobaci\u00f3n");
                        oDialog.close();
                        MessageToast.show(sNuevo === "Aprobado Final"
                            ? "Solicitud aprobada en nivel final. DocuSign habilitado para env\u00edo de carta."
                            : "Solicitud aprobada. Se env\u00eda al siguiente nivel de aprobaci\u00f3n.");
                    }.bind(that)
                }),
                endButton: new Button({ text: "Cancelar", press: function () { oDialog.close(); } })
            });
            this.getView().addDependent(oDialog);
            oDialog.open();
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
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/estado",              "Rechazado");
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/aprobador",           "Oscar Ortiz");
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/comentarioAprobador", oTA.getValue());
                        oModel.setProperty("/aprobaciones/" + that._iIndex + "/fechaAprobacion",     new Date().toISOString().split("T")[0]);
                        that._syncRequerimientoEstado("Rechazado");
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