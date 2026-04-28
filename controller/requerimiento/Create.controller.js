sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (BaseController, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.requerimiento.Create", {

        onInit: function () {
            // Local model para Ã­tems del formulario
            var oItemsModel = new JSONModel({ items: [] });
            this.getView().setModel(oItemsModel);
            this._iItemPos = 0;
        },

        onAddItem: function () {
            this._iItemPos++;
            var oModel = this.getView().getModel();
            var aItems = oModel.getProperty("/items");
            aItems.push({
                pos: this._iItemPos,
                material: "",
                descripcion: "",
                proveedor: "",
                cantidad: 1,
                unidad: "UN",
                precioUnitario: 0,
                total: "0.00"
            });
            oModel.setProperty("/items", aItems);
        },

        onDeleteItem: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var oModel = this.getView().getModel();
            var aItems = oModel.getProperty("/items");
            var iIndex = parseInt(oContext.getPath().replace("/items/", ""), 10);
            aItems.splice(iIndex, 1);
            // Recalculate position numbers
            aItems.forEach(function (oItem, i) { oItem.pos = i + 1; });
            oModel.setProperty("/items", aItems);
            this._iItemPos = aItems.length;
            this._recalcTotal();
        },

        onAmountChange: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            if (!oContext) { return; }
            var oModel = this.getView().getModel();
            var sPath = oContext.getPath();
            var oCurrent = oModel.getProperty(sPath);
            var fTotal = (parseFloat(oCurrent.cantidad) || 0) * (parseFloat(oCurrent.precioUnitario) || 0);
            oModel.setProperty(sPath + "/total", fTotal.toFixed(2));
            this._recalcTotal();
        },

        _recalcTotal: function () {
            var oModel = this.getView().getModel();
            var aItems = oModel.getProperty("/items") || [];
            var fTotal = aItems.reduce(function (acc, item) {
                return acc + (parseFloat(item.total) || 0);
            }, 0);
            var oTotalCtrl = this.byId("totalImporte");
            if (oTotalCtrl) {
                oTotalCtrl.setNumber(fTotal.toFixed(2));
            }
        },

        _validateForm: function () {
            var bValid = true;
            var oDescripcion = this.byId("inputDescripcion");
            var oDatePicker = this.byId("datePicker");
            var aItems = this.getView().getModel().getProperty("/items") || [];

            if (!oDescripcion.getValue().trim()) {
                oDescripcion.setValueState("Error");
                oDescripcion.setValueStateText("Este campo es obligatorio");
                bValid = false;
            } else {
                oDescripcion.setValueState("None");
            }

            if (!oDatePicker.getValue().trim()) {
                oDatePicker.setValueState("Error");
                oDatePicker.setValueStateText("Seleccione una fecha requerida");
                bValid = false;
            } else {
                oDatePicker.setValueState("None");
            }

            if (aItems.length === 0) {
                MessageBox.error("Debe agregar al menos una posiciÃ³n al requerimiento.");
                bValid = false;
            }

            return bValid;
        },

        onSaveDraft: function () {
            this._saveRequerimiento("Borrador");
        },

        onSubmit: function () {
            if (!this._validateForm()) { return; }
            this._saveRequerimiento("En RevisiÃ³n");
        },

        _saveRequerimiento: function (sEstado) {
            var oCompModel = this.getOwnerComponent().getModel();
            var aReqs = oCompModel.getProperty("/requerimientos") || [];
            var oDescripcion = this.byId("inputDescripcion");
            var oCentroCosto = this.byId("selectCentroCosto");
            var oCuentaGL = this.byId("selectCuentaGL");
            var oUrgencia = this.byId("selectUrgencia");
            var oDatePicker = this.byId("datePicker");
            var oObs = this.byId("textAreaObs");
            var aItems = this.getView().getModel().getProperty("/items") || [];

            var fTotal = aItems.reduce(function (acc, item) {
                return acc + (parseFloat(item.total) || 0);
            }, 0);

            var sNewId = "REQ-" + new Date().getFullYear() + "-" + String(aReqs.length + 1).padStart(3, "0");
            var oNewReq = {
                reqId: sNewId,
                descripcion: oDescripcion.getValue(),
                solicitante: "Oscar Ortiz",
                centroCosto: oCentroCosto.getSelectedKey(),
                cuentaGL: oCuentaGL.getSelectedKey(),
                urgencia: oUrgencia.getSelectedKey(),
                fechaRequerida: oDatePicker.getValue(),
                observaciones: oObs.getValue(),
                importeTotal: fTotal,
                moneda: "PEN",
                estado: sEstado,
                fechaCreacion: new Date().toISOString().split("T")[0],
                items: aItems
            };

            aReqs.unshift(oNewReq);
            oCompModel.setProperty("/requerimientos", aReqs);

            MessageToast.show(sEstado === "Borrador"
                ? "Requerimiento guardado como borrador: " + sNewId
                : "Requerimiento " + sNewId + " enviado a aprobaciÃ³n exitosamente");

            this.getRouter().navTo("requerimientoList");
        }
    });
});
