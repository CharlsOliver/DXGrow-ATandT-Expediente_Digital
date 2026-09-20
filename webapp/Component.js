sap.ui.define([
    "sap/ui/core/UIComponent",
    "btpexpedientedigital/model/models",
    "sap/ui/model/json/JSONModel"
], (UIComponent, models, JSONModel) => {
    "use strict";

    return UIComponent.extend("btpexpedientedigital.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            UIComponent.prototype.init.apply(this, arguments);

            this.setModel(models.createDeviceModel(), "device");

            this.getRouter().initialize();

            // Cargar usuario autenticado
            this.userReady = this._loadBaseUser();
        },

        _loadBaseUser: function () {
            return fetch("/user-api/currentUser")
                .then((oResponse) => {
                    if (!oResponse.ok) {
                        throw new Error("User API no disponible");
                    }

                    return oResponse.json();
                })
                .then((oUser) => {
                    const oUserData = {
                        email: oUser.email || oUser.name || "",
                        name: oUser.firstname || "",
                        lastname: oUser.lastname || "",
                        source: "XSUAA"
                    };

                    this.setModel(
                        new JSONModel(oUserData),
                        "User"
                    );

                    return oUserData;
                })
                .catch(() => {

                    // Usuario para ejecución local en BAS
                    const oUserData = {
                        email: "local@bas.dev",
                        name: "Test User",
                        lastname: "",
                        source: "LOCAL"
                    };

                    this.setModel(
                        new JSONModel(oUserData),
                        "User"
                    );

                    return oUserData;
                });
        }
    });
});