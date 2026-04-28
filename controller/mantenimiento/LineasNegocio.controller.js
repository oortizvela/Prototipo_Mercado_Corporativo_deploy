sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Select",
    "sap/m/Label",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/m/ColumnListItem",
    "sap/m/Column",
    "sap/m/Text",
    "sap/ui/core/Item",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, MessageBox, MessageToast,
             Dialog, Button, Input, Select, Label, HBox, VBox,
             ColumnListItem, Column, Text, Item, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.mantenimiento.LineasNegocio", {

        onInit: function () {
            this.getRouter()
                .getRoute("mcLineasNegocio")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var oTable = this.byId("tableLineas");
            if (oTable && oTable.getBinding("items")) {
                oTable.getBinding("items").refresh();
            }
        },

        onRefresh: function () {
            this._onRouteMatched();
        },

        // â”€â”€ Search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onSearchLinea: function (oEvent) {
            var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue") || "";
            var oBinding = this.byId("tableLineas").getBinding("items");
            if (sQuery) {
                oBinding.filter(new Filter("text", FilterOperator.Contains, sQuery));
            } else {
                oBinding.filter([]);
            }
        },

        // â”€â”€ Ver Ãreas Funcionales â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onVerAreas: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("lineasNegocio");
            this._openAreasDialog(oCtx);
        },

        onLineaRowPress: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("lineasNegocio");
            if (!oCtx) { return; }
            this._openAreasDialog(oCtx);
        },

        _openAreasDialog: function (oCtx) {
            var oData = oCtx.getObject();
            var oDlg = this.byId("dlgAreas");
            this.byId("dlgAreasTitle").setText(oData.text);

            // Build items for areas table
            var oTable = this.byId("tableAreas");
            oTable.removeAllItems();
            oTable.removeAllColumns();
            oTable.addColumn(new Column({ header: new Text({ text: "Ãrea Funcional" }) }));
            oTable.addColumn(new Column({ width: "16rem", header: new Text({ text: "Segmento" }) }));
            oTable.addColumn(new Column({ width: "12rem", header: new Text({ text: "Responsable" }) }));

            (oData.areasFunc || []).forEach(function (oArea) {
                (oArea.segmentos || [{ key: "", text: "", responsable: "" }]).forEach(function (oSeg) {
                    oTable.addItem(new ColumnListItem({
                        cells: [
                            new Text({ text: oArea.text }),
                            new Text({ text: oSeg.text }),
                            new Text({ text: oSeg.responsable || "â€“" })
                        ]
                    }));
                });
            });

            oDlg.open();
        },

        onCloseAreas: function () {
            this.byId("dlgAreas").close();
        },

        // â”€â”€ Add â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onAddLinea: function () {
            this._openEditDialog(null);
        },

        // â”€â”€ Edit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onEditLinea: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("lineasNegocio");
            this._openEditDialog(oCtx);
        },

        // â”€â”€ Delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onDeleteLinea: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("lineasNegocio");
            var sText = oCtx.getProperty("text");
            MessageBox.confirm("Â¿Desea eliminar la lÃ­nea de negocio '" + sText + "'?", {
                title: "Confirmar eliminaciÃ³n",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        var oModel = this.getOwnerComponent().getModel("lineasNegocio");
                        var aItems = oModel.getProperty("/lineasNegocio") || [];
                        var iIdx = parseInt(oCtx.getPath().replace("/lineasNegocio/", ""), 10);
                        aItems.splice(iIdx, 1);
                        oModel.setProperty("/lineasNegocio", aItems);
                        MessageToast.show("LÃ­nea de negocio eliminada");
                    }
                }.bind(this)
            });
        },

        // â”€â”€ Edit Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        _openEditDialog: function (oCtx) {
            var oModel = this.getOwnerComponent().getModel("lineasNegocio");
            var bNew = !oCtx;
            var oData = oCtx ? Object.assign({}, oCtx.getObject()) : {
                key: "", text: "", tipoSolicitud: "both", areasFunc: [], estado: true
            };

            var oKeyInput = new Input({ value: oData.key, editable: bNew, placeholder: "Clave Ãºnica (sin espacios)", required: true, width: "100%" });
            var oTextInput = new Input({ value: oData.text, placeholder: "Nombre de la lÃ­nea de negocio", required: true, width: "100%" });

            var oTipoSelect = new Select({ width: "100%" });
            [
                { key: "both", text: "Continuidad y Proyectos/RFP" },
                { key: "Continuidad TecnolÃ³gica y de Servicios", text: "Solo Continuidad" },
                { key: "Proyectos / RFP", text: "Solo Proyectos/RFP" }
            ].forEach(function (o) {
                oTipoSelect.addItem(new Item({ key: o.key, text: o.text }));
            });
            oTipoSelect.setSelectedKey(oData.tipoSolicitud);

            var that = this;
            var oDlg = new Dialog({
                title: bNew ? "Nueva LÃ­nea de Negocio" : "Editar LÃ­nea de Negocio",
                contentWidth: "460px",
                content: [
                    new VBox({
                        width: "100%",
                        items: [
                            new Label({ text: "Clave", required: true }),        oKeyInput,
                            new Label({ text: "Nombre", required: true }),       oTextInput,
                            new Label({ text: "Tipo de Solicitud" }),            oTipoSelect
                        ]
                    }).addStyleClass("mtnDlgContent")
                ],
                buttons: [
                    new Button({
                        text: "Guardar", type: "Emphasized",
                        press: function () {
                            var sKey  = oKeyInput.getValue().trim();
                            var sText = oTextInput.getValue().trim();
                            if (!sKey || !sText) { MessageToast.show("Complete los campos obligatorios"); return; }
                            var aItems = oModel.getProperty("/lineasNegocio") || [];
                            if (bNew) {
                                aItems.push({ key: sKey, text: sText, tipoSolicitud: oTipoSelect.getSelectedKey(), areasFunc: [], estado: true });
                            } else {
                                var iIdx = parseInt(oCtx.getPath().replace("/lineasNegocio/", ""), 10);
                                aItems[iIdx].text = sText;
                                aItems[iIdx].tipoSolicitud = oTipoSelect.getSelectedKey();
                            }
                            oModel.setProperty("/lineasNegocio", aItems);
                            MessageToast.show(bNew ? "LÃ­nea de negocio creada" : "LÃ­nea de negocio actualizada");
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
