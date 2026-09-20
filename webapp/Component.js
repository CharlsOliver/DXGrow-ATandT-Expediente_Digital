sap.ui.define([
    "sap/ui/core/UIComponent",
    "btpexpedientedigital/model/models",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox"
], (
    UIComponent,
    models,
    JSONModel,
    Filter,
    FilterOperator,
    MessageBox
) => {
    "use strict";

    return UIComponent.extend("btpexpedientedigital.Component", {

        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // Call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // Set the device model
            this.setModel(models.createDeviceModel(), "device");

            // Enable routing
            this.getRouter().initialize();

            // Obtener usuario en sesión
            this.userReady = this._loadBaseUser();
        },

        /**
         * Obtiene el usuario autenticado desde XSUAA/User API.
         * En ejecución local utiliza un usuario de prueba.
         */
        _loadBaseUser: function () {
            return new Promise((resolve) => {

                fetch("/user-api/currentUser")
                    .then((oResponse) => {
                        if (!oResponse.ok) {
                            return Promise.reject();
                        }

                        return oResponse.json();
                    })
                    .then((oUser) => {

                        const oBaseUser = {
                            email: oUser.email || oUser.name,
                            name: oUser.firstname,
                            lastname: oUser.lastname,
                            source: "XSUAA"
                        };

                        this.setModel(
                            new JSONModel(oBaseUser),
                            "User"
                        );

                        return this._loadSfUserData(oBaseUser.email);
                    })
                    .then(() => {
                        resolve();
                    })
                    .catch(() => {

                        // Usuario para pruebas locales
                        const oLocalUser = {
                            email: "local@bas.dev",
                            name: "Test User",
                            lastname: "",
                            source: "LOCAL",

                            // Cambiar por el usuario que quieras probar
                            user_id: "1071137"
                        };

                        this.setModel(
                            new JSONModel(oLocalUser),
                            "User"
                        );

                        resolve();
                    });
            });
        },

        /**
         * Busca en SuccessFactors al usuario obtenido desde XSUAA
         * utilizando su correo electrónico.
         */
        _loadSfUserData: function (sEmail) {
            return new Promise((resolve) => {

                const oSFSF = this.getModel("SFSF");
                const oUserModel = this.getModel("User");

                const aFilters = [
                    new Filter(
                        "email",
                        FilterOperator.EQ,
                        sEmail
                    )
                ];

                oSFSF.read("/User", {
                    filters: aFilters,

                    urlParameters: {
                        "$select": "userId,email,firstName,lastName",
                        "$format": "json"
                    },

                    success: (oData) => {

                        if (oData.results.length > 0) {

                            const oSfUser = oData.results[0];

                            oUserModel.setProperty(
                                "/user_id",
                                oSfUser.userId
                            );

                            oUserModel.setProperty(
                                "/firstName",
                                oSfUser.firstName
                            );

                            oUserModel.setProperty(
                                "/lastName",
                                oSfUser.lastName
                            );

                            console.log(
                                "Usuario en sesión:",
                                oUserModel.getData()
                            );

                        } else {

                            MessageBox.warning(
                                `No se encontró el usuario ${sEmail} en SuccessFactors.`
                            );
                        }

                        resolve();
                    },

                    error: (oError) => {
                        console.error(
                            "Error obteniendo usuario de SuccessFactors:",
                            oError
                        );

                        resolve();
                    }
                });
            });
        }

    });
});