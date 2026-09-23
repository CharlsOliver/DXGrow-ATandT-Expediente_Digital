sap.ui.define([
    "sap/ui/core/UIComponent",
    "btpexpedientedigital/model/models",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox"
], (UIComponent, models, JSONModel, Filter, FilterOperator, Fragment, MessageBox) => {
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

            // Cargar usuario autenticado y posteriormente
            // obtener sus datos desde SuccessFactors
            this.userReady = this._loadBaseUser();
        },

        destroy: function () {
            if (this._oBusyDialog) {
                this._oBusyDialog.destroy();
                this._oBusyDialog = null;
            }

            UIComponent.prototype.destroy.apply(this, arguments);
        },

        _openBusyDialog: async function () {
            if (!this._oBusyDialog) {
                this._oBusyDialog = await Fragment.load({
                    name: "btpexpedientedigital.view.fragments.BusyDialog"
                });
            }

            this._oBusyDialog.open();
        },

        _closeBusyDialog: function () {
            if (this._oBusyDialog) {
                this._oBusyDialog.close();
            }
        },

        _loadBaseUser: async function () {
            let sEmail = "";

            await this._openBusyDialog();

            try {

                // ==========================================
                // 1. Obtener usuario autenticado
                // ==========================================

                try {
                    const oResponse = await fetch("/user-api/currentUser");

                    if (!oResponse.ok) {
                        throw new Error(
                            `User API no disponible - HTTP ${oResponse.status}`
                        );
                    }

                    const oCurrentUser = await oResponse.json();

                    sEmail = oCurrentUser.email || oCurrentUser.name || "";

                    if (!sEmail) {
                        throw new Error(
                            "No fue posible obtener el correo del usuario autenticado"
                        );
                    }

                } catch (oError) {

                    // Ejecución local en BAS
                    console.warn(
                        "User API no disponible. Se utilizará usuario local:",
                        oError
                    );

                    sEmail = "cl8883@mx.att.com";
                }

                // ==========================================
                // 2. Obtener información desde SuccessFactors
                // ==========================================

                const oSFUser = await this._getSuccessFactorsUserByEmail(sEmail);

                if (!oSFUser) {
                    throw new Error(
                        `No se encontró el usuario ${sEmail} en SuccessFactors`
                    );
                }

                // ==========================================
                // 3. Crear modelo global User
                // ==========================================

                const oUserData = {
                    userId: oSFUser.userId || "",
                    email: oSFUser.email || sEmail,
                    name: oSFUser.firstName || "",
                    lastname: oSFUser.lastName || "",
                    title: oSFUser.title || "",
                    source: "SFSF"
                };

                this.setModel(
                    new JSONModel(oUserData),
                    "User"
                );

                console.log("Usuario cargado:", oUserData);

                return oUserData;

            } catch (oError) {

                console.error(
                    "Error obteniendo información del usuario:",
                    oError
                );

                MessageBox.error(
                    "No fue posible obtener la información del usuario en sesión.",
                    {
                        title: "Error al cargar usuario"
                    }
                );

                return null;

            } finally {
                this._closeBusyDialog();
            }
        },

        _getSuccessFactorsUserByEmail: function (sEmail) {
            return new Promise((resolve, reject) => {
                const oSFSFModel = this.getModel("SFSF");

                if (!oSFSFModel) {
                    reject(
                        new Error("Modelo SFSF no disponible")
                    );
                    return;
                }

                oSFSFModel.read("/User", {
                    filters: [
                        new Filter(
                            "email",
                            FilterOperator.EQ,
                            sEmail
                        )
                    ],

                    urlParameters: {
                        "$select": "userId,email,firstName,lastName,title",
                        "$top": "1"
                    },

                    success: function (oData) {
                        const oUser =
                            oData.results && oData.results.length > 0
                                ? oData.results[0]
                                : null;

                        resolve(oUser);
                    },

                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        }
    });
});