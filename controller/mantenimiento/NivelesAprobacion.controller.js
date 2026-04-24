sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Select",
    "sap/m/Switch",
    "sap/m/CheckBox",
    "sap/m/Label",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/ui/core/Item"
], function (BaseController, MessageBox, MessageToast,
             Dialog, Button, Input, Select, Switch, CheckBox, Label, HBox, VBox, Item) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.mantenimiento.NivelesAprobacion", {

        onInit: function () {
            this.getRouter()
                .getRoute("mantenimientoNiveles")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var oTable = this.byId("tableNiveles");
            if (oTable && oTable.getBinding("items")) {
                oTable.getBinding("items").refresh();
            }
        },

        onRefresh: function () {
            this._onRouteMatched();
        },

        onAddNivel: function () {
            this._openDialog(null);
        },

        onEditNivel: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("mantenimiento");
            this._openDialog(oCtx);
        },

        onNivelRowPress: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("mantenimiento");
            if (!oCtx) { return; }
            this._openDialog(oCtx);
        },

        onDeleteNivel: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("mantenimiento");
            var sNivel = oCtx.getProperty("nivel");
            MessageBox.confirm("¿Desea eliminar el nivel " + sNivel + "?", {
                title: "Confirmar eliminación",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        var oModel = this.getOwnerComponent().getModel("mantenimiento");
                        var aItems = oModel.getProperty("/nivelesAprobacion") || [];
                        var iIdx = parseInt(oCtx.getPath().replace("/nivelesAprobacion/", ""), 10);
                        aItems.splice(iIdx, 1);
                        oModel.setProperty("/nivelesAprobacion", aItems);
                        MessageToast.show("Nivel de aprobación eliminado");
                    }
                }.bind(this)
            });
        },

        // ── Dialog ────────────────────────────────────────────────────────────
        _openDialog: function (oCtx) {
            var oModel = this.getOwnerComponent().getModel("mantenimiento");
            var bNew   = !oCtx;
            var aExisting = oModel.getProperty("/nivelesAprobacion") || [];
            var nextNivel = aExisting.length
                ? Math.max.apply(null, aExisting.map(function(i){ return i.nivel; })) + 1
                : 1;

            var oData = oCtx ? Object.assign({}, oCtx.getObject()) : {
                nivel: nextNivel, orden: "", descripcion: "",
                flujo: "Aprobación de Necesidad", tipoAprobador: "Constante",
                constanteAprobadora: "", nombreGrupoIAS: "",
                notifica: true, tiposSolicitud: "", estado: true
            };

            // Parse tiposSolicitud to booleans
            var bOriginal = (oData.tiposSolicitud || "").indexOf("Original") >= 0;
            var bDerivado = (oData.tiposSolicitud || "").indexOf("Derivado") >= 0;

            // ── Fields ────────────────────────────────────────────────────────
            var oNivelInput = new Input({
                value: String(oData.nivel),
                editable: false,
                width: "100%"
            });

            var oOrdenInput = new Input({
                value: oData.orden ? String(oData.orden) : "",
                placeholder: "Auto si vacío",
                width: "100%",
                type: "Number"
            });

            var oDescInput = new Input({
                value: oData.descripcion,
                placeholder: "Ej: Gerente, Director de Área",
                width: "100%",
                required: true
            });

            var oFlujoSelect = new Select({ width: "100%" });
            [["Aprobación de Necesidad","Aprobación de Necesidad"],
             ["Aprob. Carta Acept.","Aprob. Carta Acept."]
            ].forEach(function (a) {
                oFlujoSelect.addItem(new Item({ key: a[0], text: a[1] }));
            });
            oFlujoSelect.setSelectedKey(oData.flujo);

            var oTipoAprobSelect = new Select({ width: "100%" });
            [["Constante","Constante"],["Grupo IAS","Grupo IAS"]].forEach(function (a) {
                oTipoAprobSelect.addItem(new Item({ key: a[0], text: a[1] }));
            });
            oTipoAprobSelect.setSelectedKey(oData.tipoAprobador);

            // Dynamic field: Constante Aprobadora (shown when tipoAprobador = "Constante")
            var aConstantes = oModel.getProperty("/constantes") || [];
            var oConstanteSelect = new Select({ width: "100%" });
            aConstantes.forEach(function (c) {
                oConstanteSelect.addItem(new Item({ key: c.codigo, text: c.codigo + " — " + c.descripcion }));
            });
            oConstanteSelect.setSelectedKey(oData.constanteAprobadora);

            var oGrupoIASInput = new Input({
                value: oData.nombreGrupoIAS,
                placeholder: "Ej: GRP_GH_DP_APROBACION",
                width: "100%"
            });

            // Conditional VBox shown/hidden based on tipoAprobador
            var oConstanteBox = new VBox({ visible: oData.tipoAprobador === "Constante",
                items: [ new Label({ text: "Constante Aprobadora", required: true }), oConstanteSelect ]
            });
            var oGrupoIASBox = new VBox({ visible: oData.tipoAprobador === "Grupo IAS",
                items: [ new Label({ text: "Nombre Grupo IAS", required: true }), oGrupoIASInput ]
            });

            oTipoAprobSelect.attachChange(function () {
                var sKey = oTipoAprobSelect.getSelectedKey();
                oConstanteBox.setVisible(sKey === "Constante");
                oGrupoIASBox.setVisible(sKey === "Grupo IAS");
            });

            var oNotificaCheck  = new CheckBox({ selected: oData.notifica,  text: "Notifica" });
            var oOriginalCheck  = new CheckBox({ selected: bOriginal,        text: "Original" });
            var oDerivadoCheck  = new CheckBox({ selected: bDerivado,        text: "Derivado" });
            var oEstadoSwitch   = new Switch({ state: oData.estado });

            var oContent = new VBox({
                width: "100%",
                styleClass: "mtnDlgContent",
                items: [
                    new HBox({
                        width: "100%",
                        items: [
                            new VBox({ width: "50%", items: [ new Label({ text: "Nivel", required: true }), oNivelInput ] }),
                            new VBox({ width: "50%", items: [ new Label({ text: "Orden Ejecución" }), oOrdenInput ] })
                        ]
                    }),
                    new Label({ text: "Descripción", required: true }),
                    oDescInput,
                    new Label({ text: "Flujo de Aprobación", required: true }),
                    oFlujoSelect,
                    new Label({ text: "Tipo de Aprobador", required: true }),
                    oTipoAprobSelect,
                    oConstanteBox,
                    oGrupoIASBox,
                    new Label({ text: "Configuración" }),
                    oNotificaCheck,
                    new Label({ text: "Tipos de Solicitud Aplicables" }),
                    new HBox({ items: [ oOriginalCheck, oDerivadoCheck ] }),
                    new Label({ text: "Sin selección = aplica para todos", design: "Standard" }),
                    new Label({ text: "Estado" }),
                    oEstadoSwitch
                ]
            });

            var that = this;
            var oDialog = new Dialog({
                title: bNew ? "Agregar Niveles de Aprobación" : "Editar Niveles de Aprobación",
                contentWidth: "30rem",
                content: [ oContent ],
                beginButton: new Button({
                    text: bNew ? "Crear" : "Actualizar",
                    icon: "sap-icon://save",
                    type: "Emphasized",
                    press: function () {
                        if (!oDescInput.getValue().trim()) {
                            MessageToast.show("La Descripción es obligatoria");
                            return;
                        }
                        var sTipo = oTipoAprobSelect.getSelectedKey();
                        if (sTipo === "Constante" && !oConstanteSelect.getSelectedKey()) {
                            MessageToast.show("Seleccione una Constante Aprobadora");
                            return;
                        }
                        if (sTipo === "Grupo IAS" && !oGrupoIASInput.getValue().trim()) {
                            MessageToast.show("Ingrese el Nombre del Grupo IAS");
                            return;
                        }

                        var aTS = [];
                        if (oOriginalCheck.getSelected()) { aTS.push("Original"); }
                        if (oDerivadoCheck.getSelected())  { aTS.push("Derivado"); }
                        var sOrden = oOrdenInput.getValue().trim() || oNivelInput.getValue();

                        if (bNew) {
                            var aItems = oModel.getProperty("/nivelesAprobacion") || [];
                            aItems.push({
                                id: Date.now(),
                                nivel:               parseInt(oNivelInput.getValue(), 10),
                                flujo:               oFlujoSelect.getSelectedKey(),
                                descripcion:         oDescInput.getValue().trim(),
                                tipoAprobador:       sTipo,
                                constanteAprobadora: sTipo === "Constante" ? oConstanteSelect.getSelectedKey() : "",
                                nombreGrupoIAS:      sTipo === "Grupo IAS"  ? oGrupoIASInput.getValue().trim()  : "",
                                notifica:            oNotificaCheck.getSelected(),
                                tiposSolicitud:      aTS.join(", "),
                                orden:               parseInt(sOrden, 10) || 0,
                                estado:              oEstadoSwitch.getState()
                            });
                            oModel.setProperty("/nivelesAprobacion", aItems);
                            MessageToast.show("Nivel de aprobación creado");
                        } else {
                            var sPath = oCtx.getPath();
                            oModel.setProperty(sPath + "/flujo",               oFlujoSelect.getSelectedKey());
                            oModel.setProperty(sPath + "/descripcion",         oDescInput.getValue().trim());
                            oModel.setProperty(sPath + "/tipoAprobador",       sTipo);
                            oModel.setProperty(sPath + "/constanteAprobadora", sTipo === "Constante" ? oConstanteSelect.getSelectedKey() : "");
                            oModel.setProperty(sPath + "/nombreGrupoIAS",      sTipo === "Grupo IAS"  ? oGrupoIASInput.getValue().trim()  : "");
                            oModel.setProperty(sPath + "/notifica",            oNotificaCheck.getSelected());
                            oModel.setProperty(sPath + "/tiposSolicitud",      aTS.join(", "));
                            oModel.setProperty(sPath + "/orden",               parseInt(sOrden, 10) || 0);
                            oModel.setProperty(sPath + "/estado",              oEstadoSwitch.getState());
                            MessageToast.show("Nivel de aprobación actualizado");
                        }
                        oDialog.close();
                    }
                }),
                endButton: new Button({
                    text: "Cancelar",
                    press: function () { oDialog.close(); }
                }),
                afterClose: function () { oDialog.destroy(); }
            });

            this.getView().addDependent(oDialog);
            oDialog.open();
        }
    });
});
