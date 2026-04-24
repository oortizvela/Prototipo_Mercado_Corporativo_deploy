sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Select",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/ui/core/Item",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, MessageBox, MessageToast,
             Dialog, Button, Input, Select, Label, VBox, Item,
             Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.mantenimiento.ClientesMC", {

        onInit: function () {
            this.getRouter()
                .getRoute("mcClientesMC")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            // Refresh binding in case data was updated
            var oTable = this.byId("clientesTable");
            if (oTable && oTable.getBinding("items")) {
                oTable.getBinding("items").filter([]);
            }
        },

        onNavBack: function () {
            this.getRouter().navTo("mcMantenimientoMain");
        },

        onSearchCliente: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue") || "";
            var oTable = this.byId("clientesTable");
            if (!oTable) { return; }
            var oBinding = oTable.getBinding("items");
            if (sQuery) {
                oBinding.filter([
                    new Filter({
                        filters: [
                            new Filter("text",   FilterOperator.Contains, sQuery),
                            new Filter("ruc",    FilterOperator.Contains, sQuery),
                            new Filter("sector", FilterOperator.Contains, sQuery)
                        ],
                        and: false
                    })
                ]);
            } else {
                oBinding.filter([]);
            }
        },

        onAddCliente: function () {
            this._openClienteDialog(null);
        },

        onEditCliente: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("clientesMC");
            this._openClienteDialog(oCtx);
        },

        onDeleteCliente: function (oEvent) {
            var oCtx  = oEvent.getSource().getBindingContext("clientesMC");
            var sNombre = oCtx.getProperty("text");
            var that  = this;
            MessageBox.confirm("¿Eliminar el cliente \"" + sNombre + "\"?", {
                title: "Confirmar Eliminación",
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    var oModel  = that.getOwnerComponent().getModel("clientesMC");
                    var aItems  = oModel.getProperty("/clientes") || [];
                    var iIdx    = parseInt(oCtx.getPath().split("/").pop(), 10);
                    aItems.splice(iIdx, 1);
                    oModel.setProperty("/clientes", aItems);
                    MessageToast.show("Cliente eliminado");
                }
            });
        },

        _openClienteDialog: function (oCtx) {
            var bNew  = !oCtx;
            var oData = oCtx ? oCtx.getObject() : { text: "", ruc: "", sector: "", estado: "Activo" };
            var that  = this;

            var oNombreInput = new Input({ value: oData.text    || "", width: "100%", required: true,
                                           placeholder: "Nombre completo de la empresa / entidad" });
            var oRucInput    = new Input({ value: oData.ruc     || "", width: "100%",
                                           placeholder: "Ej. 20100047218" });
            var oSectorInput = new Input({ value: oData.sector  || "", width: "100%",
                                           placeholder: "Ej. Banca y Finanzas, Gobierno, Minería..." });
            var oEstadoSel   = new Select({ width: "100%" });
            [["Activo","Activo"],["Inactivo","Inactivo"]].forEach(function (a) {
                oEstadoSel.addItem(new Item({ key: a[0], text: a[1] }));
            });
            oEstadoSel.setSelectedKey(oData.estado || "Activo");

            var oDlg = new Dialog({
                title: bNew ? "Agregar Cliente" : "Editar Cliente",
                contentWidth: "480px",
                content: [
                    new VBox({
                        items: [
                            new Label({ text: "Empresa / Entidad", required: true }), oNombreInput,
                            new Label({ text: "RUC" }),                               oRucInput,
                            new Label({ text: "Sector" }),                            oSectorInput,
                            new Label({ text: "Estado" }),                            oEstadoSel
                        ]
                    }).addStyleClass("mtnDlgContent")
                ],
                buttons: [
                    new Button({
                        text: bNew ? "Agregar" : "Guardar", type: "Emphasized",
                        press: function () {
                            if (!oNombreInput.getValue().trim()) {
                                MessageToast.show("El nombre es obligatorio");
                                return;
                            }
                            var oModel  = that.getOwnerComponent().getModel("clientesMC");
                            var aItems  = oModel.getProperty("/clientes") || [];
                            var sNombre = oNombreInput.getValue().trim();
                            var sKey    = sNombre.toUpperCase().replace(/[^A-Z0-9]/g, "_").substring(0, 20);
                            if (bNew) {
                                aItems.push({
                                    key:    sKey,
                                    text:   sNombre,
                                    ruc:    oRucInput.getValue().trim(),
                                    sector: oSectorInput.getValue().trim(),
                                    estado: oEstadoSel.getSelectedKey()
                                });
                            } else {
                                var iIdx = parseInt(oCtx.getPath().split("/").pop(), 10);
                                Object.assign(aItems[iIdx], {
                                    text:   sNombre,
                                    ruc:    oRucInput.getValue().trim(),
                                    sector: oSectorInput.getValue().trim(),
                                    estado: oEstadoSel.getSelectedKey()
                                });
                            }
                            oModel.setProperty("/clientes", aItems);
                            MessageToast.show(bNew ? "Cliente agregado" : "Cliente actualizado");
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
