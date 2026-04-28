sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/TextArea",
    "sap/m/Select",
    "sap/m/Switch",
    "sap/m/Label",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/ui/core/Item"
], function (BaseController, Filter, FilterOperator, MessageBox, MessageToast,
             Dialog, Button, Input, TextArea, Select, Switch, Label, HBox, VBox, Item) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.mantenimiento.Constantes", {

        onInit: function () {
            this.getRouter()
                .getRoute("mantenimientoConstantes")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            // Refresh binding
            var oTable = this.byId("tableConstantes");
            if (oTable && oTable.getBinding("items")) {
                oTable.getBinding("items").refresh();
            }
        },

        onRefresh: function () {
            this._onRouteMatched();
        },

        // â”€â”€ Add â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onAddConstante: function () {
            this._openDialog(null);
        },

        // â”€â”€ Edit (from toolbar button) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onEditConstante: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("mantenimiento");
            this._openDialog(oCtx);
        },

        // â”€â”€ Row press (code link) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onConstanteRowPress: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("mantenimiento");
            if (!oCtx) { return; }
            this._openDialog(oCtx);
        },

        // â”€â”€ Delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onDeleteConstante: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("mantenimiento");
            var sCod = oCtx.getProperty("codigo");
            MessageBox.confirm("Â¿Desea eliminar la constante '" + sCod + "'?", {
                title: "Confirmar eliminaciÃ³n",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        var oModel = this.getOwnerComponent().getModel("mantenimiento");
                        var aItems = oModel.getProperty("/constantes") || [];
                        var iIdx = parseInt(oCtx.getPath().replace("/constantes/", ""), 10);
                        aItems.splice(iIdx, 1);
                        oModel.setProperty("/constantes", aItems);
                        MessageToast.show("Constante eliminada");
                    }
                }.bind(this)
            });
        },

        // â”€â”€ Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        _openDialog: function (oCtx) {
            var oModel  = this.getOwnerComponent().getModel("mantenimiento");
            var bNew    = !oCtx;
            var oData   = oCtx ? Object.assign({}, oCtx.getObject()) : {
                codigo: "", descripcion: "", valorPrincipal: "", valorSecundario: "",
                valorAdicional1: "", valorAdicional2: "", operador: "EQ",
                tipoValor: "TEXTO", categoria: "", estado: true
            };

            // â”€â”€ Fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            var oCodigoInput = new Input({
                value: oData.codigo,
                editable: bNew,
                placeholder: "Ingrese el cÃ³digo Ãºnico",
                required: true,
                width: "100%"
            });

            var oDescTextarea = new TextArea({
                value: oData.descripcion,
                placeholder: "Ingrese la descripciÃ³n",
                rows: 3,
                width: "100%"
            });

            var oValPrincipalInput = new Input({
                value: oData.valorPrincipal,
                placeholder: "Valor principal o FROM",
                width: "100%"
            });

            var oValSecInput = new Input({
                value: oData.valorSecundario,
                placeholder: "Valor secundario o TO",
                width: "100%"
            });

            var oAd1Input = new Input({
                value: oData.valorAdicional1,
                placeholder: "Valor adicional 1",
                width: "100%"
            });

            var oAd2Input = new Input({
                value: oData.valorAdicional2,
                placeholder: "Valor adicional 2",
                width: "100%"
            });

            var oOperadorSelect = new Select({ width: "100%" });
            [["EQ","Igual (EQ)"],["NE","Diferente (NE)"],["GT","Mayor que (GT)"],
             ["GE","Mayor o igual (GE)"],["LT","Menor que (LT)"],["LE","Menor o igual (LE)"],["BT","Entre (BT)"]
            ].forEach(function (a) {
                oOperadorSelect.addItem(new Item({ key: a[0], text: a[1] }));
            });
            oOperadorSelect.setSelectedKey(oData.operador);

            var oTipoValorSelect = new Select({ width: "100%" });
            [["TEXTO","Texto"],["NUMERO","NÃºmero"],["FECHA","Fecha"],["BOOLEANO","Booleano"]
            ].forEach(function (a) {
                oTipoValorSelect.addItem(new Item({ key: a[0], text: a[1] }));
            });
            oTipoValorSelect.setSelectedKey(oData.tipoValor);

            var oCategoriaInput = new Input({
                value: oData.categoria,
                placeholder: "Ingrese la categorÃ­a",
                width: "100%"
            });

            var oEstadoSwitch = new Switch({ state: oData.estado });

            // â”€â”€ Form layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            var oContent = new VBox({
                width: "100%",
                styleClass: "mtnDlgContent",
                items: [
                    new Label({ text: "CÃ³digo", required: true }),
                    oCodigoInput,
                    new Label({ text: "DescripciÃ³n", required: true }),
                    oDescTextarea,
                    new Label({ text: "Valor Principal" }),
                    oValPrincipalInput,
                    new Label({ text: "Valor Secundario" }),
                    oValSecInput,
                    new HBox({
                        width: "100%",
                        items: [
                            new VBox({ width: "50%", items: [ new Label({ text: "Valor Adicional 1" }), oAd1Input ] }),
                            new VBox({ width: "50%", items: [ new Label({ text: "Valor Adicional 2" }), oAd2Input ] })
                        ]
                    }),
                    new Label({ text: "Operador" }),
                    oOperadorSelect,
                    new HBox({
                        width: "100%",
                        items: [
                            new VBox({ width: "50%", items: [ new Label({ text: "Tipo de Valor" }), oTipoValorSelect ] }),
                            new VBox({ width: "50%", items: [ new Label({ text: "CategorÃ­a" }), oCategoriaInput ] })
                        ]
                    }),
                    new Label({ text: "Estado" }),
                    oEstadoSwitch
                ]
            });

            // â”€â”€ Buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            var that = this;
            var oDialog = new Dialog({
                title: bNew ? "Agregar Constantes" : "Editar Constantes",
                contentWidth: "30rem",
                content: [ oContent ],
                beginButton: new Button({
                    text: bNew ? "Crear" : "Actualizar",
                    icon: "sap-icon://save",
                    type: "Emphasized",
                    press: function () {
                        if (!oCodigoInput.getValue().trim() || !oDescTextarea.getValue().trim()) {
                            MessageToast.show("CÃ³digo y DescripciÃ³n son obligatorios");
                            return;
                        }
                        if (bNew) {
                            var aItems = oModel.getProperty("/constantes") || [];
                            aItems.push({
                                id: Date.now(),
                                codigo:          oCodigoInput.getValue().trim(),
                                descripcion:     oDescTextarea.getValue().trim(),
                                valorPrincipal:  oValPrincipalInput.getValue(),
                                valorSecundario: oValSecInput.getValue(),
                                valorAdicional1: oAd1Input.getValue(),
                                valorAdicional2: oAd2Input.getValue(),
                                operador:        oOperadorSelect.getSelectedKey(),
                                tipoValor:       oTipoValorSelect.getSelectedKey(),
                                categoria:       oCategoriaInput.getValue(),
                                estado:          oEstadoSwitch.getState()
                            });
                            oModel.setProperty("/constantes", aItems);
                            MessageToast.show("Constante creada correctamente");
                        } else {
                            var sPath = oCtx.getPath();
                            oModel.setProperty(sPath + "/descripcion",     oDescTextarea.getValue().trim());
                            oModel.setProperty(sPath + "/valorPrincipal",  oValPrincipalInput.getValue());
                            oModel.setProperty(sPath + "/valorSecundario", oValSecInput.getValue());
                            oModel.setProperty(sPath + "/valorAdicional1", oAd1Input.getValue());
                            oModel.setProperty(sPath + "/valorAdicional2", oAd2Input.getValue());
                            oModel.setProperty(sPath + "/operador",        oOperadorSelect.getSelectedKey());
                            oModel.setProperty(sPath + "/tipoValor",       oTipoValorSelect.getSelectedKey());
                            oModel.setProperty(sPath + "/categoria",       oCategoriaInput.getValue());
                            oModel.setProperty(sPath + "/estado",          oEstadoSwitch.getState());
                            MessageToast.show("Constante actualizada correctamente");
                        }
                        oDialog.close();
                        that._updateMainKpi();
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
        },

        // â”€â”€ Update portal KPI counts after changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        _updateMainKpi: function () {
            // The Main controller listens on route; just refresh the binding
            var oTable = this.byId("tableConstantes");
            if (oTable && oTable.getBinding("items")) {
                oTable.getBinding("items").refresh();
            }
        }
    });
});
