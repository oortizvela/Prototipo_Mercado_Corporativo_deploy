sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Select",
    "sap/m/Switch",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/ui/core/Item"
], function (BaseController, MessageBox, MessageToast,
             Dialog, Button, Input, Select, Switch, Label, VBox, Item) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.mantenimiento.MarcaProveedor", {

        onInit: function () {
            this.getRouter()
                .getRoute("mantenimientoMarcaProveedor")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var oTable = this.byId("tableMarcas");
            if (oTable && oTable.getBinding("items")) {
                oTable.getBinding("items").refresh();
            }
        },

        onRefresh: function () {
            this._onRouteMatched();
        },

        onAddMarca: function () {
            this._openDialog(null);
        },

        onEditMarca: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("mantenimiento");
            this._openDialog(oCtx);
        },

        onMarcaRowPress: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("mantenimiento");
            if (!oCtx) { return; }
            this._openDialog(oCtx);
        },

        onDeleteMarca: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("mantenimiento");
            var sMarca = oCtx.getProperty("marca");
            MessageBox.confirm("Â¿Desea eliminar la marca '" + sMarca + "'?", {
                title: "Confirmar eliminaciÃ³n",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        var oModel = this.getOwnerComponent().getModel("mantenimiento");
                        var aItems = oModel.getProperty("/marcaProveedor") || [];
                        var iIdx = parseInt(oCtx.getPath().replace("/marcaProveedor/", ""), 10);
                        aItems.splice(iIdx, 1);
                        oModel.setProperty("/marcaProveedor", aItems);
                        MessageToast.show("Marca eliminada");
                    }
                }.bind(this)
            });
        },

        // â”€â”€ Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        _openDialog: function (oCtx) {
            var oModel = this.getOwnerComponent().getModel("mantenimiento");
            var bNew   = !oCtx;
            var oData  = oCtx ? Object.assign({}, oCtx.getObject()) : {
                tipoSolicitud: "", marca: "", prefijo: "", acreedor: "", ruc: "", razonSocial: "", estado: true
            };

            var oTipoSelect = new Select({ width: "100%" });
            [["","(Ninguno)"],["Original","Original"],["Derivado","Derivado"]].forEach(function (a) {
                oTipoSelect.addItem(new Item({ key: a[0], text: a[1] }));
            });
            oTipoSelect.setSelectedKey(oData.tipoSolicitud);

            var oMarcaInput = new Input({
                value: oData.marca,
                placeholder: "Ej: Samsung, Apple, Xiaomi",
                width: "100%",
                required: true
            });

            var oPrefijInput = new Input({
                value: oData.prefijo,
                placeholder: "Ej: SAM, APL",
                maxLength: 10,
                width: "100%"
            });

            var oAcreedorInput = new Input({
                value: oData.acreedor,
                placeholder: "Ej: ACC-0001",
                width: "100%"
            });

            var oRucInput = new Input({
                value: oData.ruc,
                placeholder: "Ej: 20123456789",
                width: "100%",
                required: true
            });

            var oRazonInput = new Input({
                value: oData.razonSocial,
                placeholder: "Nombre legal del proveedor",
                width: "100%",
                required: true
            });

            var oEstadoSwitch = new Switch({ state: oData.estado });

            var fnField = function (oLabel, oControl) {
                return new VBox({ styleClass: "sapUiSmallMarginBottom", items: [ oLabel, oControl ] });
            };

            var oContent = new VBox({
                width: "100%",
                styleClass: "sapUiSmallMarginBeginEnd sapUiSmallMarginTop",
                items: [
                    fnField(new Label({ text: "Tipo Solicitud" }), oTipoSelect),
                    fnField(new Label({ text: "Marca", required: true }), oMarcaInput),
                    fnField(new Label({ text: "Prefijo" }), oPrefijInput),
                    fnField(new Label({ text: "Acreedor" }), oAcreedorInput),
                    fnField(new Label({ text: "RUC", required: true }), oRucInput),
                    fnField(new Label({ text: "Raz\u00f3n Social", required: true }), oRazonInput),
                    fnField(new Label({ text: "Estado" }), oEstadoSwitch)
                ]
            });

            var oDialog = new Dialog({
                title: bNew ? "Agregar Marca Proveedor" : "Editar Marca Proveedor",
                contentWidth: "30rem",
                content: [ oContent ],
                beginButton: new Button({
                    text: bNew ? "Crear" : "Actualizar",
                    icon: "sap-icon://save",
                    type: "Emphasized",
                    press: function () {
                        if (!oMarcaInput.getValue().trim()) {
                            MessageToast.show("El campo Marca es obligatorio");
                            return;
                        }
                        if (!oRucInput.getValue().trim()) {
                            MessageToast.show("El campo RUC es obligatorio");
                            return;
                        }
                        if (!oRazonInput.getValue().trim()) {
                            MessageToast.show("La RazÃ³n Social es obligatoria");
                            return;
                        }
                        if (bNew) {
                            var aItems = oModel.getProperty("/marcaProveedor") || [];
                            aItems.push({
                                id:            Date.now(),
                                tipoSolicitud: oTipoSelect.getSelectedKey(),
                                marca:         oMarcaInput.getValue().trim(),
                                prefijo:       oPrefijInput.getValue().trim(),
                                acreedor:      oAcreedorInput.getValue().trim(),
                                ruc:           oRucInput.getValue().trim(),
                                razonSocial:   oRazonInput.getValue().trim(),
                                estado:        oEstadoSwitch.getState()
                            });
                            oModel.setProperty("/marcaProveedor", aItems);
                            MessageToast.show("Marca Proveedor creada correctamente");
                        } else {
                            var sPath = oCtx.getPath();
                            oModel.setProperty(sPath + "/tipoSolicitud", oTipoSelect.getSelectedKey());
                            oModel.setProperty(sPath + "/marca",         oMarcaInput.getValue().trim());
                            oModel.setProperty(sPath + "/prefijo",       oPrefijInput.getValue().trim());
                            oModel.setProperty(sPath + "/acreedor",      oAcreedorInput.getValue().trim());
                            oModel.setProperty(sPath + "/ruc",           oRucInput.getValue().trim());
                            oModel.setProperty(sPath + "/razonSocial",   oRazonInput.getValue().trim());
                            oModel.setProperty(sPath + "/estado",        oEstadoSwitch.getState());
                            MessageToast.show("Marca Proveedor actualizada correctamente");
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
