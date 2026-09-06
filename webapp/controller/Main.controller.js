sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, MessageBox, JSONModel, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("btpexpedientedigital.controller.Main", {
        onInit() {
            this.onLoadComponents();
            this.onLoadModels();
        },

        onLoadModels: function () {
            const aUsuariosGuardados = this.cargarUsuariosLocalStorage();

            this.oUsuariosTable = this.getOwnerComponent().getModel("UsuariosTable");
            this.oUsuariosTable.setData(aUsuariosGuardados);
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

        onAgregarUsuario: function () {
            if (!this._oSelectedUser) {
                MessageBox.warning("Seleccione un usuario de la lista.");
                return;
            }

            const aUsuarios = this.oUsuariosTable.getData();

            const bUsuarioExiste = aUsuarios.some(
                oUsuario => oUsuario.userId === this._oSelectedUser.userId
            );

            if (bUsuarioExiste) {
                MessageBox.warning("El usuario seleccionado ya fue agregado.");
                this.inptBuscarUsuario.setValue("");
                return;
            }

            aUsuarios.push({
                ...this._oSelectedUser,
                status: "Pendiente"
            });

            this.oUsuariosTable.setData(aUsuarios);

            // Guardar el estado actualizado
            this.guardarUsuariosLocalStorage();

            this.inptBuscarUsuario.setValue("");
            this._oSelectedUser = null;
        },

        onDeletePress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("UsuariosTable");
            const sPath = oContext.getPath();
            const iIndex = parseInt(sPath.substring(1), 10);

            const aUsuarios = this.oUsuariosTable.getData();

            aUsuarios.splice(iIndex, 1);

            this.oUsuariosTable.setData(aUsuarios);
            this.guardarUsuariosLocalStorage();
        },

        onLimpiarTodo: function () {
            MessageBox.confirm(
                "¿Deseas eliminar todos los usuarios de la tabla?",
                {
                    title: "Limpiar tabla",
                    actions: [
                        MessageBox.Action.YES,
                        MessageBox.Action.NO
                    ],
                    emphasizedAction: MessageBox.Action.YES,

                    onClose: (sAction) => {
                        if (sAction === MessageBox.Action.YES) {
                            this.oUsuariosTable.setData([]);
                            this.guardarUsuariosLocalStorage();
                        }
                    }
                }
            );
        },

        guardarUsuariosLocalStorage: function () {
            const oModel = this.getView().getModel("UsuariosTable");
            const aUsuarios = oModel.getData();

            localStorage.setItem(
                "expedienteDigitalUsuarios",
                JSON.stringify(aUsuarios)
            );
        },

        cargarUsuariosLocalStorage: function () {
            const sUsuarios = localStorage.getItem("expedienteDigitalUsuarios");

            if (sUsuarios) {
                return JSON.parse(sUsuarios);
            }

            return [];
        }
    });
});