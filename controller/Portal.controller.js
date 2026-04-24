sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/m/ActionSheet",
    "sap/m/Button"
], function (BaseController, ActionSheet, Button) {
    "use strict";

    return BaseController.extend("com.claro.compras.portal.controller.Portal", {

        onInit: function () {
            // Portal home initialisation
        },

        onTileRequerimiento: function () {
            this.getRouter().navTo("requerimientoList");
        },

        onTileAprobaciones: function () {
            this.getRouter().navTo("aprobacionesList");
        },

        onTileMantenimiento: function () {
            this.getRouter().navTo("mantenimientoMain");
        },

        onTileMcRequerimiento: function () {
            this.getRouter().navTo("mcRequerimientoList");
        },

        onTileMcAprobaciones: function () {
            this.getRouter().navTo("mcAprobacionesList");
        },

        onTileMcMantenimiento: function () {
            this.getRouter().navTo("mcMantenimientoMain");
        },

        onAvatarPress: function (oEvent) {
            var oSource = oEvent.getSource();
            if (!this._oUserMenu) {
                this._oUserMenu = new ActionSheet({
                    placement: "Bottom",
                    buttons: [
                        new Button({ text: "Mi Perfil", icon: "sap-icon://person-placeholder" }),
                        new Button({ text: "Configuración", icon: "sap-icon://settings" }),
                        new Button({ text: "Cerrar Sesión", icon: "sap-icon://log" })
                    ]
                });
                this.getView().addDependent(this._oUserMenu);
            }
            this._oUserMenu.openBy(oSource);
        }
    });
});
