sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/TextArea",
    "sap/m/CheckBox",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/m/HBox"
], function (BaseController, MessageBox, MessageToast,
             Dialog, Button, Input, TextArea, CheckBox, Label, VBox, HBox) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.mantenimiento.TiposMC", {

        onInit: function () {
            this.getRouter()
                .getRoute("mcTiposMC")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var aTableIds = ["tableContinuidadSimple", "tableContinuidadCompleta", "tableProyectosSimple", "tableProyectosCompleta"];
            aTableIds.forEach(function (sId) {
                var oTable = this.byId(sId);
                if (oTable && oTable.getBinding("items")) {
                    oTable.getBinding("items").refresh();
                }
            }.bind(this));
        },

        // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        _getCustomData: function (oSource, sKey) {
            var aData = oSource.getCustomData ? oSource.getCustomData() : [];
            var oFound = aData.filter(function (d) { return d.getKey() === sKey; })[0];
            return oFound ? oFound.getValue() : null;
        },

        _getFlujoPath: function (sTipo, sFlujo) {
            return "/tiposMC/" + sTipo + "/aprobacion" + (sFlujo === "simple" ? "Simple" : "Completa") + "/niveles";
        },

        // â”€â”€ Editar descripciÃ³n del tipo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onEditTipo: function (oEvent) {
            var oModel = this.getOwnerComponent().getModel("tiposMC");
            var iIdx = parseInt(this._getCustomData(oEvent.getSource(), "idx"), 10);
            var sPath = "/tiposMC/" + iIdx;
            var oData = oModel.getProperty(sPath);

            var oTextInput = new Input({ value: oData.text, width: "100%", required: true });
            var oDescArea  = new TextArea({ value: oData.descripcion, rows: 4, width: "100%",
                                            placeholder: "DescripciÃ³n del tipo de requerimiento" });
            var oUmbralInput = new Input({ value: String(oData.umbralUSD || 100000), type: "Number", width: "100%" });

            var oDlg = new Dialog({
                title: "Editar Tipo de Requerimiento",
                contentWidth: "460px",
                content: [
                    new VBox({
                        items: [
                            new Label({ text: "Nombre", required: true }),
                            oTextInput,
                            new Label({ text: "DescripciÃ³n" }),
                            oDescArea,
                            new Label({ text: "Umbral de aprobaciÃ³n (USD)" }),
                            oUmbralInput
                        ]
                    }).addStyleClass("mtnDlgContent")
                ],
                buttons: [
                    new Button({
                        text: "Guardar", type: "Emphasized",
                        press: function () {
                            if (!oTextInput.getValue().trim()) {
                                MessageToast.show("El nombre es obligatorio");
                                return;
                            }
                            oModel.setProperty(sPath + "/text",        oTextInput.getValue().trim());
                            oModel.setProperty(sPath + "/descripcion",  oDescArea.getValue().trim());
                            oModel.setProperty(sPath + "/umbralUSD",    parseFloat(oUmbralInput.getValue()) || 100000);
                            MessageToast.show("Tipo de requerimiento actualizado");
                            oDlg.close();
                        }
                    }),
                    new Button({ text: "Cancelar", press: function () { oDlg.close(); } })
                ],
                afterClose: function () { oDlg.destroy(); }
            });
            oDlg.open();
        },

        // â”€â”€ Agregar nivel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onAddNivel: function (oEvent) {
            var oSrc   = oEvent.getSource();
            var sTipo  = this._getCustomData(oSrc, "tipo");
            var sFlujo = this._getCustomData(oSrc, "flujo");
            this._openNivelDialog(null, sTipo, sFlujo);
        },

        // â”€â”€ Editar nivel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onEditNivel: function (oEvent) {
            var oSrc   = oEvent.getSource();
            var sTipo  = this._getCustomData(oSrc, "tipo");
            var sFlujo = this._getCustomData(oSrc, "flujo");
            var oCtx   = oSrc.getBindingContext("tiposMC");
            this._openNivelDialog(oCtx, sTipo, sFlujo);
        },

        // â”€â”€ Eliminar nivel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onDeleteNivel: function (oEvent) {
            var oSrc   = oEvent.getSource();
            var sTipo  = this._getCustomData(oSrc, "tipo");
            var sFlujo = this._getCustomData(oSrc, "flujo");
            var oCtx   = oSrc.getBindingContext("tiposMC");
            var sNivel = oCtx.getProperty("nivel");

            MessageBox.confirm("Â¿Eliminar el Nivel " + sNivel + "?", {
                title: "Confirmar eliminaciÃ³n",
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    var oModel = this.getOwnerComponent().getModel("tiposMC");
                    var sArrayPath = this._getFlujoPath(sTipo, sFlujo);
                    var aNiveles = oModel.getProperty(sArrayPath) || [];
                    var iIdx = parseInt(oCtx.getPath().split("/").pop(), 10);
                    aNiveles.splice(iIdx, 1);
                    oModel.setProperty(sArrayPath, aNiveles);
                    MessageToast.show("Nivel eliminado");
                }.bind(this)
            });
        },

        // â”€â”€ Dialog editar / crear nivel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        _openNivelDialog: function (oCtx, sTipo, sFlujo) {
            var oModel     = this.getOwnerComponent().getModel("tiposMC");
            var sArrayPath = this._getFlujoPath(sTipo, sFlujo);
            var bNew       = !oCtx;
            var aNiveles   = oModel.getProperty(sArrayPath) || [];
            var oData      = oCtx ? Object.assign({}, oCtx.getObject())
                                  : { nivel: aNiveles.length ? Math.max.apply(null, aNiveles.map(function(n){ return n.nivel; })) + 1 : 1,
                                      codigo: "", cargo: "", obligatorio: true };

            var oNivelInput  = new Input({ value: String(oData.nivel), type: "Number", width: "100%", required: true });
            var oCodigoInput = new Input({ value: oData.codigo, placeholder: "Ej: N1, N2, N5", width: "100%" });
            var oCargoInput  = new Input({ value: oData.cargo, placeholder: "Ej: Jefe Ãrea Usuaria", width: "100%", required: true });
            var oObligCheck  = new CheckBox({ selected: oData.obligatorio !== false, text: "Obligatorio" });

            var sDlgTitle    = (bNew ? "Agregar" : "Editar") + " Nivel â€“ " + (sFlujo === "simple" ? "Flujo Simple" : "Flujo Completo");

            var oDlg = new Dialog({
                title: sDlgTitle,
                contentWidth: "400px",
                content: [
                    new VBox({
                        items: [
                            new HBox({ items: [
                                new VBox({ width: "50%", items: [ new Label({ text: "Nivel", required: true }), oNivelInput ] }),
                                new VBox({ width: "50%", items: [ new Label({ text: "CÃ³digo" }), oCodigoInput ] }).addStyleClass("sapUiSmallMarginBegin")
                            ]}),
                            new Label({ text: "Cargo / Rol", required: true }),
                            oCargoInput,
                            oObligCheck
                        ]
                    }).addStyleClass("mtnDlgContent")
                ],
                buttons: [
                    new Button({
                        text: bNew ? "Agregar" : "Guardar",
                        type: "Emphasized",
                        press: function () {
                            if (!oCargoInput.getValue().trim()) {
                                MessageToast.show("El Cargo / Rol es obligatorio");
                                return;
                            }
                            if (bNew) {
                                aNiveles.push({
                                    nivel:       parseInt(oNivelInput.getValue(), 10) || aNiveles.length + 1,
                                    codigo:      oCodigoInput.getValue().trim(),
                                    cargo:       oCargoInput.getValue().trim(),
                                    obligatorio: oObligCheck.getSelected()
                                });
                                // sort by nivel
                                aNiveles.sort(function (a, b) { return a.nivel - b.nivel; });
                                oModel.setProperty(sArrayPath, aNiveles);
                                MessageToast.show("Nivel agregado");
                            } else {
                                var iIdx = parseInt(oCtx.getPath().split("/").pop(), 10);
                                aNiveles[iIdx].nivel       = parseInt(oNivelInput.getValue(), 10) || aNiveles[iIdx].nivel;
                                aNiveles[iIdx].codigo      = oCodigoInput.getValue().trim();
                                aNiveles[iIdx].cargo       = oCargoInput.getValue().trim();
                                aNiveles[iIdx].obligatorio = oObligCheck.getSelected();
                                oModel.setProperty(sArrayPath, aNiveles);
                                MessageToast.show("Nivel actualizado");
                            }
                            oDlg.close();
                        }
                    }),
                    new Button({ text: "Cancelar", press: function () { oDlg.close(); } })
                ],
                afterClose: function () { oDlg.destroy(); }
            });
            oDlg.open();
        }
    });
});

