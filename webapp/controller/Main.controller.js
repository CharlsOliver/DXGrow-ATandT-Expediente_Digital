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
            this.onLoadModels();
        },

        onLoadModels: function (){
            this.oUsuariosTable = this.getOwnerComponent().getModel("UsuariosTable");
            this.oUsuariosTable.setData([]);
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

            aUsuarios.push({
                ...this._oSelectedUser,
                status: "Pendiente"
            });

            this.oUsuariosTable.setData(aUsuarios);

            this.byId("userInput").setValue("");
            this._oSelectedUser = null;
        }
    });
});