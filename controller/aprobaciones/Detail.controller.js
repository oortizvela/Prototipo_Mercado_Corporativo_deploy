sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/TextArea",
    "sap/m/Button",
    "sap/m/Text"
], function (BaseController, JSONModel, MessageBox, MessageToast, Dialog, TextArea, Button, Text) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.aprobaciones.Detail", {

        onInit: function () {
            var oUiModel = new JSONModel({ mercadoCorporativo: false });
            this.getView().setModel(oUiModel, "ui");

            this.getRouter()
                .getRoute("aprobacionesDetail")
                .attachPatternMatched(this._onRouteMatched.bind(this, false), this);

            this.getRouter()
                .getRoute("mcAprobacionesDetail")
                .attachPatternMatched(this._onRouteMatched.bind(this, true), this);
        },

        _onRouteMatched: function (bMC, oEvent) {
            this.getView().getModel("ui").setProperty("/mercadoCorporativo", !!bMC);
            var sAprId = decodeURIComponent(oEvent.getParameter("arguments").aprId);
            this._bindView(sAprId);
        },

        _bindView: function (sAprId) {
            var oModel = this.getOwnerComponent().getModel("aprobaciones");
            var aApr = oModel.getProperty("/aprobaciones") || [];
            var iIndex = aApr.findIndex(function (a) { return a.aprId === sAprId; });

            if (iIndex === -1) {
                this.getRouter().navTo("aprobacionesList");
                return;
            }

            this.getView().bindElement({
                path: "/aprobaciones/" + iIndex,
                model: "aprobaciones"
            });
        },

        onApprove: function () {
            this._openActionDialog("Aprobar");
        },

        onReject: function () {
            this._openActionDialog("Rechazar");
        },

        onReassign: function () {
            MessageToast.show("Reasignación en desarrollo");
        },

        _openActionDialog: function (sAction) {
            var oTextArea = new TextArea({ placeholder: "Ingrese su comentario...", width: "100%", rows: 4 });
            var oView = this.getView();
            var oContext = oView.getBindingContext("aprobaciones");
            if (!oContext) { return; }

            var bMC = oView.getModel("ui") && oView.getModel("ui").getProperty("/mercadoCorporativo");
            var sInfo = bMC
                ? ("Cliente: " + (oContext.getProperty("cliente") || "–") + "   |   Importe: USD " + (oContext.getProperty("importeEstimadoUSD") || "–"))
                : ("Dispositivo: " + oContext.getProperty("dispositivo") + " " + oContext.getProperty("modelo") + "   |   Empleado: " + oContext.getProperty("empleado"));

            var oDialog = new Dialog({
                title: sAction + ": " + oContext.getProperty("aprId"),
                contentWidth: "420px",
                content: [
                    new VBox({
                        styleClass: "aprDlgContent",
                        items: [
                            new Text({ text: sInfo }).addStyleClass("sapUiSmallMarginBottom"),
                            new Text({ text: "Comentario:" }).addStyleClass("sapUiTinyMarginBottom"),
                            oTextArea
                        ]
                    })
                ],
                beginButton: new Button({
                    text: sAction,
                    type: sAction === "Aprobar" ? "Emphasized" : "Reject",
                    press: function () {
                        var oModel = this.getOwnerComponent().getModel("aprobaciones");
                        var sPath = oContext.getPath();
                        var sEstado = sAction === "Aprobar" ? "Aprobado" : "Rechazado";
                        oModel.setProperty(sPath + "/estado", sEstado);
                        oModel.setProperty(sPath + "/aprobador", "Omar Ortiz");
                        oModel.setProperty(sPath + "/comentarioAprobador", oTextArea.getValue());
                        oModel.setProperty(sPath + "/fechaAprobacion", new Date().toISOString().split("T")[0]);
                        oDialog.close();
                        MessageToast.show("Solicitud " + sEstado.toLowerCase() + " correctamente");
                    }.bind(this)
                }),
                endButton: new Button({ text: "Cancelar", press: function () { oDialog.close(); } })
            });
            oView.addDependent(oDialog);
            oDialog.open();
        }
    });
});
