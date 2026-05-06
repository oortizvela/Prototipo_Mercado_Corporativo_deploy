sap.ui.define([
    "com/claro/compras/portal/controller/BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    // Usuarios de referencia del prototipo
    var aUsers = [
        // ── Solicitantes ──────────────────────────────────────────────────────
        { usuario: "solicitante1",   password: "Claro2025!", rol: "Solicitante",                     nombre: "Oscar Ortiz",          categoria: "Solicitante"   },
        { usuario: "solicitante2",   password: "Claro2025!", rol: "Solicitante MC",                  nombre: "Ana Torres",           categoria: "Solicitante"   },
        // ── Aprobadores Handset ───────────────────────────────────────────────
        { usuario: "jefe.planif",    password: "Claro2025!", rol: "Jefe Planificaci\u00f3n Comercial",    nombre: "Carlos Fernandez",     categoria: "Aprobador"     },
        { usuario: "gte.planif",     password: "Claro2025!", rol: "Gerente Planificaci\u00f3n Comercial", nombre: "Roberto Silva",        categoria: "Aprobador"     },
        { usuario: "compras",        password: "Claro2025!", rol: "Compras",                              nombre: "Compras Claro",        categoria: "Aprobador"     },
        { usuario: "dir.masivo",     password: "Claro2025!", rol: "Director Mercado Masivo",         nombre: "Patricia Vega",        categoria: "Aprobador"     },
        // ── Aprobadores Infra (RM / RF / OM / CL) ────────────────────────────
        { usuario: "aprobador.infra",password: "Claro2025!", rol: "Aprobador Infraestructura",       nombre: "Luis Paredes",         categoria: "Aprobador"     },
        // ── Aprobadores MC ────────────────────────────────────────────────────
        { usuario: "aprobador.mc",   password: "Claro2025!", rol: "Analista Compras MC",             nombre: "Sandra Quispe",        categoria: "Aprobador"     },
        { usuario: "dir.finanzas",   password: "Claro2025!", rol: "Director de Finanzas",          nombre: "Carlos Solano Morales",categoria: "Aprobador"     },
        // ── Administrador ─────────────────────────────────────────────────────
        { usuario: "admin1",         password: "Claro2025!", rol: "Administrador",                   nombre: "Administrador Sistema",categoria: "Administrador" }
    ];

    return BaseController.extend("com.claro.compras.portal.controller.Login", {

        onInit: function () {
            // Modelo de usuarios de referencia para la tabla demo
            this.getView().setModel(new JSONModel({ users: aUsers }), "demoUsers");

            // Ruta login
            this.getRouter()
                .getRoute("login")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            // Limpiar campos al volver a la pantalla
            var oView = this.getView();
            if (oView.byId("inputUsuario"))  { oView.byId("inputUsuario").setValue(""); }
            if (oView.byId("inputPassword")) { oView.byId("inputPassword").setValue(""); }
            if (oView.byId("txtLoginError")) { oView.byId("txtLoginError").setVisible(false); }
        },

        onLogin: function () {
            var oView    = this.getView();
            var sUsuario = oView.byId("inputUsuario").getValue().trim();
            var sPassword = oView.byId("inputPassword").getValue();
            var oErrorTxt = oView.byId("txtLoginError");

            // Validar credenciales contra la lista de usuarios
            var oUser = aUsers.find(function (u) {
                return u.usuario === sUsuario && u.password === sPassword;
            });

            if (!oUser) {
                oErrorTxt.setVisible(true);
                oView.byId("inputPassword").setValue("");
                return;
            }

            oErrorTxt.setVisible(false);

            // Guardar usuario en el modelo global del componente
            var oComponent = this.getOwnerComponent();
            var oSessionModel = oComponent.getModel("session");
            if (!oSessionModel) {
                oSessionModel = new JSONModel({});
                oComponent.setModel(oSessionModel, "session");
            }
            oSessionModel.setData({
                usuario:   oUser.usuario,
                nombre:    oUser.nombre,
                rol:       oUser.rol,
                categoria: oUser.categoria,
                loggedIn:  true
            });

            // Actualizar iniciales del avatar en el shell
            var oAppView = this.getOwnerComponent().getRootControl();
            if (oAppView) {
                var oAvatar = oAppView.byId("shellAvatar");
                if (oAvatar) {
                    var aPartes = oUser.nombre.split(" ");
                    var sInitials = aPartes.length >= 2
                        ? aPartes[0].charAt(0) + aPartes[1].charAt(0)
                        : aPartes[0].charAt(0);
                    oAvatar.setInitials(sInitials.toUpperCase());
                }
            }

            // Todos los roles navegan al portal; la visibilidad de tiles controla el acceso
            this.getRouter().navTo("portal");
        },

        // Abrir/cerrar dialog de usuarios demo
        onOpenDemoUsers: function () {
            this.byId("dlgDemoUsers").open();
        },

        onCloseDemoUsers: function () {
            this.byId("dlgDemoUsers").close();
        },

        // Inicio de sesión rápido desde la tabla de referencia
        onQuickLogin: function (oEvent) {
            var oCtx  = oEvent.getSource().getBindingContext("demoUsers");
            var oUser = oCtx.getObject();
            this.byId("dlgDemoUsers").close();
            this.getView().byId("inputUsuario").setValue(oUser.usuario);
            this.getView().byId("inputPassword").setValue(oUser.password);
            this.onLogin();
        }
    });
});
