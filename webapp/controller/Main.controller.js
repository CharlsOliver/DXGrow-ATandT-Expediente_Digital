sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "btpexpedientedigital/model/formatter"
], (Controller, MessageBox, Filter, FilterOperator, formatter) => {
    "use strict";

    return Controller.extend("btpexpedientedigital.controller.Main", {

        formatter: formatter,

        onInit() {
            this.onLoadComponents();
            this.onLoadModels();
        },

        onLoadModels: async function () {
            const oComponent = this.getOwnerComponent();
            this.oSFSFModel = oComponent.getModel("SFSF");
            const oUserData = await oComponent.userReady;

            if (!oUserData || !oUserData.userId) {
                console.error("No fue posible obtener el usuario en sesión.");
                return;
            }

            this._filtrarExpedientesUsuario(oUserData.userId);
        },

        onLoadComponents: function () {
            this.inptBuscarUsuario = this.byId("inptBuscarUsuario");
        },

        onSuggest: function (oEvent) {
            const sValue = oEvent.getParameter("suggestValue");
            const oInput = oEvent.getSource();
            const oBinding = oInput.getBinding("suggestionItems");

            if (!sValue) {
                oBinding.filter([]);
                return;
            }

            const oFilter = new Filter({
                filters: [
                    new Filter("userId", FilterOperator.Contains, sValue),
                    new Filter("firstName", FilterOperator.Contains, sValue),
                    new Filter("lastName", FilterOperator.Contains, sValue)
                ],
                and: false
            });

            oBinding.filter(oFilter);
        },

        onSuggestionItemSelected: function (oEvent) {
            const oSelectedItem = oEvent.getParameter("selectedItem");

            if (!oSelectedItem) {
                this._oSelectedUser = null;
                return;
            }

            const oContext = oSelectedItem.getBindingContext("SFSF");

            this._oSelectedUser = oContext.getObject();

            console.log("Usuario seleccionado:", this._oSelectedUser);
        },

        onShowErrorPress: function () {
            MessageBox.error(
                "No fue posible procesar el expediente digital.\n\n" +
                "Detalle del error:\n" +
                "El servicio de validación de documentos devolvió un error al intentar obtener la información del usuario.\n\n" +
                "Código: EXP-5001",
                {
                    title: "Error durante la ejecución"
                }
            );
        },

        onPress: function () {
            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteDetail");
        },

        onAgregarUsuario: async function () {

            if (!this._oSelectedUser) {
                MessageBox.warning("Seleccione un usuario de la lista.");
                return;
            }

            const oComponent = this.getOwnerComponent();
            const oUserModel = oComponent.getModel("User");

            if (!oUserModel) {
                MessageBox.error("No fue posible obtener el usuario en sesión.");
                return;
            }

            const sUsuarioSesion = oUserModel.getProperty("/userId");
            const sEmpleadoSeleccionado = this._oSelectedUser.userId;

            await oComponent._openBusyDialog();

            try {

                // ==========================================
                // 1. Validar si el empleado ya existe
                // ==========================================

                const bUsuarioExiste = await this._validarEmpleadoExistente(
                    sEmpleadoSeleccionado
                );

                if (bUsuarioExiste) {
                    MessageBox.warning(
                        `El empleado ${sEmpleadoSeleccionado} ya se encuentra en la lista.`
                    );
                    return;
                }

                // ==========================================
                // 2. Preparar payload
                // ==========================================

                const oPayload = {
                    __metadata: {
                        uri: "cust_EmployeeFile_Request"
                    },
                    externalCode: sEmpleadoSeleccionado,
                    cust_userId: sUsuarioSesion,
                    cust_progressPercent: "-1",
                    cust_status: "LISTS"
                };

                // ==========================================
                // 3. Realizar UPSERT
                // ==========================================

                const oResultado = await this._upsertExpediente(oPayload);

                console.log("Resultado UPSERT:", oResultado);

                // ==========================================
                // 4. Limpiar selección
                // ==========================================

                this.inptBuscarUsuario.setValue("");
                this._oSelectedUser = null;

                // ==========================================
                // 5. Refrescar SuccessFactors
                // ==========================================

                this.oSFSFModel.refresh(true);

            } catch (oError) {

                console.error(
                    "Error agregando usuario:",
                    oError
                );

                MessageBox.error(
                    "No fue posible agregar el usuario al expediente."
                );

            } finally {

                oComponent._closeBusyDialog();

            }
        },

        onDeletePress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("SFSF");

            if (!oContext) {
                return;
            }

            const oExpediente = oContext.getObject();

            if (oExpediente.cust_status !== "LISTS") {
                MessageBox.warning(
                    "Solo se pueden eliminar expedientes que se encuentren en estatus LISTS."
                );
                return;
            }

            const sEmpleadoId = oExpediente.externalCode;

            MessageBox.confirm(
                `¿Está seguro de eliminar el expediente del empleado ${sEmpleadoId}?`,
                {
                    title: "Eliminar expediente",
                    emphasizedAction: MessageBox.Action.OK,

                    onClose: async (sAction) => {
                        if (sAction !== MessageBox.Action.OK) {
                            return;
                        }

                        const oComponent = this.getOwnerComponent();
                        await oComponent._openBusyDialog();

                        try {
                            await this._eliminarExpediente(sEmpleadoId);

                            this.oSFSFModel.refresh(true);

                            MessageBox.success(
                                `El expediente del empleado ${sEmpleadoId} fue eliminado correctamente.`
                            );

                        } catch (oError) {
                            console.error(
                                `Error eliminando expediente ${sEmpleadoId}:`,
                                oError
                            );

                            MessageBox.error(
                                "No fue posible eliminar el expediente."
                            );

                        } finally {
                            oComponent._closeBusyDialog();
                        }
                    }
                }
            );
        },

        onExecutePress: async function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("SFSF");

            if (!oContext) {
                return;
            }

            const oExpediente = oContext.getObject();
            const sEmpleadoId = oExpediente.externalCode;

            const oComponent = this.getOwnerComponent();
            await oComponent._openBusyDialog();

            try {
                const oResultado = await this._getExpedienteEmpleado(
                    sEmpleadoId
                );

                console.log(
                    `Respuesta ejecución CPI ${sEmpleadoId}:`,
                    oResultado
                );

                if (oResultado.status === "ERROR") {
                    MessageBox.error(
                        oResultado.message ||
                        "Ocurrió un error al crear el expediente."
                    );

                    return;
                }

                // Refrescar información desde SuccessFactors
                this.oSFSFModel.refresh(true);

            } catch (oError) {
                console.error(
                    `Error ejecutando expediente ${sEmpleadoId}:`,
                    oError
                );

                MessageBox.error(
                    "No fue posible iniciar la creación del expediente."
                );

            } finally {
                oComponent._closeBusyDialog();
            }
        },

        onExcecuteAll: async function () {
            const oTable = this.byId("expedienteTable");
            const oBinding = oTable.getBinding("items");

            if (!oBinding) {
                return;
            }

            const aContexts = oBinding.getCurrentContexts();

            const aExpedientesPendientes = aContexts
                .map(oContext => oContext.getObject())
                .filter(oExpediente => oExpediente.cust_status === "LISTS");

            if (aExpedientesPendientes.length === 0) {
                MessageBox.information(
                    "No existen expedientes pendientes por ejecutar."
                );
                return;
            }

            const aUsuariosError = [];

            const oComponent = this.getOwnerComponent();
            await oComponent._openBusyDialog();

            try {
                for (const oExpediente of aExpedientesPendientes) {
                    const sEmpleadoId = oExpediente.externalCode;

                    try {
                        const oResultado = await this._getExpedienteEmpleado(
                            sEmpleadoId
                        );

                        console.log(
                            `Respuesta ejecución CPI ${sEmpleadoId}:`,
                            oResultado
                        );

                        if (oResultado.status === "ERROR") {
                            aUsuariosError.push(sEmpleadoId);
                        }

                    } catch (oError) {
                        console.error(
                            `Error ejecutando expediente ${sEmpleadoId}:`,
                            oError
                        );

                        aUsuariosError.push(sEmpleadoId);
                    }
                }

                // Refrescar información desde SuccessFactors
                this.oSFSFModel.refresh(true);

            } finally {
                oComponent._closeBusyDialog();
            }

            if (aUsuariosError.length > 0) {
                MessageBox.error(
                    "No fue posible ejecutar el expediente para los siguientes empleados:\n\n" +
                    aUsuariosError.join("\n"),
                    {
                        title: "Error durante la ejecución"
                    }
                );
            }
        },

        _filtrarExpedientesUsuario: function (sUserId) {
            const oTable = this.byId("expedienteTable");
            const oBinding = oTable.getBinding("items");

            if (!oBinding || !sUserId) {
                return;
            }

            /*
            oBinding.filter(
                new Filter(
                    "cust_userId",
                    FilterOperator.EQ,
                    sUserId
                )
            );
            */
        },

        _eliminarExpediente: function (sEmpleadoId) {
            return new Promise((resolve, reject) => {

                const sPath = this.oSFSFModel.createKey(
                    "/cust_EmployeeFile_Request",
                    {
                        externalCode: sEmpleadoId
                    }
                );

                this.oSFSFModel.remove(sPath, {
                    refreshAfterChange: false,

                    success: function () {
                        resolve();
                    },

                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        _validarEmpleadoExistente: function (sEmpleadoId) {

            return new Promise((resolve, reject) => {

                this.oSFSFModel.read("/cust_EmployeeFile_Request", {

                    filters: [
                        new Filter(
                            "externalCode",
                            FilterOperator.EQ,
                            sEmpleadoId
                        )
                    ],

                    urlParameters: {
                        "$select": "externalCode",
                        "$top": "1"
                    },

                    success: function (oData) {

                        const bExiste =
                            oData.results &&
                            oData.results.length > 0;

                        resolve(bExiste);
                    },

                    error: function (oError) {

                        console.error(
                            `Error validando empleado ${sEmpleadoId}:`,
                            oError
                        );

                        reject(oError);
                    }
                });

            });
        },

        _getExpedienteEmpleado: async function (sUserId) {
            const sCpiBaseUrl = this.getOwnerComponent()
                .getManifestEntry("/sap.app/dataSources/CPI_SERVICE/uri");

            const sUrl = `${sCpiBaseUrl}http/expediente-baja-empleado`;

            const oResponse = await fetch(sUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "*/*"
                },
                body: JSON.stringify({
                    idEmpleado: Number(sUserId)
                })
            });

            if (!oResponse.ok) {
                throw new Error(
                    `Error consultando expediente ${sUserId}: HTTP ${oResponse.status}`
                );
            }

            return await oResponse.json();
        },

        _upsertExpediente: async function (oPayload) {

            const sSfBaseUrl = this.getOwnerComponent()
                .getManifestEntry("/sap.app/dataSources/SFSF/uri");

            const sUrl = `${sSfBaseUrl}upsert`;

            const oResponse = await fetch(sUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(oPayload)
            });

            if (!oResponse.ok) {

                const sError = await oResponse.text();

                console.error(
                    "Error UPSERT SuccessFactors:",
                    sError
                );

                throw new Error(
                    `Error realizando UPSERT: HTTP ${oResponse.status}`
                );
            }

            return await oResponse.json();
        },
    });
});