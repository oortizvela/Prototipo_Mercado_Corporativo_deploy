sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    // Estados que cuentan como solicitud pendiente de acción
    var aPendingStates = ["En Aprobación", "Pendiente Aprobación", "En Revisión", "Pendiente", "Enviado a Firma de Acta"];

    return BaseController.extend("com.claro.compras.portal.controller.Portal", {

        onInit: function () {
            // Modelo local del portal para el contador de pendientes
            var oPortalModel = new JSONModel({ pendientes: 0, pendientesCompras: 0 });
            this.getView().setModel(oPortalModel, "portal");

            this.getRouter()
                .getRoute("portal")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var oAprobModel = this.getOwnerComponent().getModel("aprobaciones");
            if (!oAprobModel) { return; }

            var oSession       = this.getOwnerComponent().getModel("session");
            var sRolUsuario    = oSession ? (oSession.getProperty("/rol")       || "") : "";
            var sCategoriaUser = oSession ? (oSession.getProperty("/categoria") || "") : "";

            var aItems = oAprobModel.getProperty("/aprobaciones") || [];
            var nPendientes = aItems.filter(function (item) {
                if (sCategoriaUser !== "Administrador" && sRolUsuario) {
                    if (item.rolNivelActual !== sRolUsuario) { return false; }
                }
                return aPendingStates.indexOf(item.estado) !== -1;
            }).length;
            this.getView().getModel("portal").setProperty("/pendientes", nPendientes);

            // Contar requerimientos pendientes para Compras (nivel 3)
            var oReqModel = this.getOwnerComponent().getModel();
            var nCompras  = 0;
            if (oReqModel) {
                var aReqs = oReqModel.getProperty("/requerimientos") || [];
                nCompras  = aReqs.filter(function (r) {
                    return r.estado === "Pendiente Aprobaci\u00f3n" ||
                           (r.estado === "En Aprobaci\u00f3n" && (r.flujoAprobacion || []).some(function (n) {
                               return n.nivel === "NIVEL 3" && n.estado === "En Proceso";
                           }));
                }).length;
            }
            this.getView().getModel("portal").setProperty("/pendientesCompras", nCompras);
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

        onTileComprasHandsets: function () {
            this.getRouter().navTo("handsetList");
        },

        onTileMcRequerimiento: function () {
            this.getRouter().navTo("mcRequerimientoList");
        },

        onTileMcAprobaciones: function () {
            this.getRouter().navTo("mcAprobacionesList");
        },

        onTileMcMantenimiento: function () {
            this.getRouter().navTo("mcMantenimientoMain");
        }
    });
});
