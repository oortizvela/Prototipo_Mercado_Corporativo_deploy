sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/ActionSheet",
    "sap/m/Button"
], function (Controller, UIComponent, ActionSheet, Button) {
    "use strict";

    // Map route names â†’ app title shown in the shell header
    var mRouteTitles = {        "login":                   { title: "Iniciar Sesión",               isHome: true  },        "portal":                  { title: "Home",                       isHome: true  },
        "requerimientoList":       { title: "Requerimiento de Compra",    isHome: false },
        "requerimientoCreate":     { title: "Requerimiento de Compra",    isHome: false },
        "requerimientoDetail":     { title: "Requerimiento de Compra",    isHome: false },
        "aprobacionesList":        { title: "Aprobaciones Handset",       isHome: false },
        "aprobacionesDetail":      { title: "Aprobaciones Handset",       isHome: false },
        "mantenimientoMain":       { title: "Mantenimiento de Datos",     isHome: false },
        "mantenimientoConstantes": { title: "Mantenimiento de Datos",     isHome: false },
        "mantenimientoNiveles":    { title: "Mantenimiento de Datos",     isHome: false },
        "mantenimientoMarcaProveedor": { title: "Mantenimiento de Datos", isHome: false },
        "mcRequerimientoList":     { title: "Registro Necesidad – MC",    isHome: false },
        "infraMCList":             { title: "Requerimiento de Compra",    isHome: false },
        "infraRedMovilList":        { title: "Requerimiento de Compra",    isHome: false },
        "infraRedFijaList":         { title: "Requerimiento de Compra",    isHome: false },
        "infraOMList":              { title: "Requerimiento de Compra",    isHome: false },
        "comprasLocalesList":        { title: "Requerimiento de Compra",    isHome: false },
        "handsetList":               { title: "Requerimiento de Compra",    isHome: false },
        "mcRequerimientoCreate":   { title: "Registro Necesidad â€“ MC",    isHome: false },
        "mcRequerimientoDetail":   { title: "Registro Necesidad \u2013 MC",    isHome: false },
        "mcFactibilidadDetail":    { title: "Factibilidad \u2013 MC",           isHome: false },
        "mcComercialDetail":       { title: "Comercial \u2013 MC",              isHome: false },
        "infraRedMovilDetail":     { title: "Necesidad Red M\u00f3vil",          isHome: false },
        "infraRedFijaDetail":      { title: "Necesidad Red Fija",           isHome: false },
        "infraOMDetail":           { title: "Necesidad O\u0026M",              isHome: false },
        "comprasLocalesDetail":    { title: "Necesidad Compras Locales",      isHome: false },
        "mcAprobacionesList":      { title: "Bandeja Aprobaci\u00f3n MC",      isHome: false },
        "mcAprobacionesDetail":    { title: "Bandeja AprobaciÃ³n MC",      isHome: false },
        "mcMantenimientoMain":     { title: "Configuraciones MC",         isHome: false },
        "mcLineasNegocio":         { title: "Configuraciones MC",         isHome: false },
        "mcTiposMC":               { title: "Configuraciones MC",         isHome: false },
        "mcClientesMC":            { title: "Configuraciones MC",         isHome: false }
    };

    return Controller.extend("com.claro.compras.portal.controller.App", {

        onInit: function () {
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.attachRouteMatched(this._onRouteMatched, this);

            // Adjuntar click al logo SAP una sola vez tras el renderizado
            this.getView().addEventDelegate({
                onAfterRendering: function () {
                    var oDom = document.getElementById("sapLogoClickable");
                    if (oDom && !oDom._logoHandlerSet) {
                        oDom.addEventListener("click", this.onLogoPress.bind(this));
                        oDom._logoHandlerSet = true;
                    }
                }.bind(this)
            });
        },

        _onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            var oInfo = mRouteTitles[sRouteName] || { title: sRouteName, isHome: false };

            // Ocultar shell header en la pantalla de login
            var oShellHeader = this.byId("appShellHeader");
            if (oShellHeader) {
                oShellHeader.setVisible(sRouteName !== "login");
            }

            var oBtnTitle = this.byId("btnShellAppTitle");
            var oBtnBack  = this.byId("btnShellBack");

            if (oBtnTitle) {
                oBtnTitle.setText(oInfo.title);
                oBtnTitle.setIcon(oInfo.isHome ? "sap-icon://slim-arrow-down" : "");
            }
            if (oBtnBack) {
                oBtnBack.setVisible(!oInfo.isHome);
            }

            // Actualizar avatar con el usuario de la sesión activa
            if (sRouteName !== "login") {
                var oSessionModel = this.getOwnerComponent().getModel("session");
                if (oSessionModel && oSessionModel.getProperty("/loggedIn")) {
                    var sNombre = oSessionModel.getProperty("/nombre") || "";
                    var aPartes = sNombre.split(" ");
                    var sInitials = aPartes.length >= 2
                        ? aPartes[0].charAt(0) + aPartes[1].charAt(0)
                        : aPartes[0].charAt(0) || "?";
                    var oAvatar = this.byId("shellAvatar");
                    if (oAvatar) { oAvatar.setInitials(sInitials.toUpperCase()); }
                }
            }
        },

        onShellBack: function () {
            window.history.back();
        },

        onLogoPress: function () {
            UIComponent.getRouterFor(this).navTo("portal", {}, true);
        },

        onCerrarSesion: function () {
            var oComponent = this.getOwnerComponent();
            var oSessionModel = oComponent.getModel("session");
            if (oSessionModel) {
                oSessionModel.setData({ loggedIn: false });
            }
            // Resetear avatar
            var oAvatar = this.byId("shellAvatar");
            if (oAvatar) { oAvatar.setInitials(""); }
            if (this._oUserMenu) { this._oUserMenu.close(); }
            UIComponent.getRouterFor(this).navTo("login", {}, true);
        },

        onAvatarPress: function (oEvent) {
            var oSource = oEvent.getSource();
            if (!this._oUserMenu) {
                this._oUserMenu = new ActionSheet({
                    placement: "Bottom",
                    buttons: [
                        new Button({ text: "Mi Perfil",       icon: "sap-icon://person-placeholder" }),
                        new Button({ text: "Configuración",   icon: "sap-icon://settings" }),
                        new Button({ text: "Cerrar Sesión",   icon: "sap-icon://log", press: this.onCerrarSesion.bind(this) })
                    ]
                });
                this.getView().addDependent(this._oUserMenu);
            }
            this._oUserMenu.openBy(oSource);
        }
    });
});
