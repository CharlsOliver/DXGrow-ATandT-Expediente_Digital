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
            var oModel = new JSONModel({
                Usuarios: [
                    {
                        "idUsuario": "100001",
                        "nombres": "Carlos Oliver",
                        "apellidoPaterno": "Hernández",
                        "apellidoMaterno": "Montejano",
                        "correo": "carlos.hernandez@empresa.com",
                        "departamento": "Tecnologías de la Información"
                    },
                    {
                        "idUsuario": "100002",
                        "nombres": "Miguel Andrés",
                        "apellidoPaterno": "Parra",
                        "apellidoMaterno": "Torres",
                        "correo": "miguel.parra@empresa.com",
                        "departamento": "Finanzas"
                    },
                    {
                        "idUsuario": "100003",
                        "nombres": "Fátima",
                        "apellidoPaterno": "Sánchez",
                        "apellidoMaterno": "Serrano",
                        "correo": "fatima.sanchez@empresa.com",
                        "departamento": "Recursos Humanos"
                    },
                    {
                        "idUsuario": "100004",
                        "nombres": "Roberto",
                        "apellidoPaterno": "Frías",
                        "apellidoMaterno": "Barreras",
                        "correo": "roberto.frias@empresa.com",
                        "departamento": "Operaciones"
                    },
                    {
                        "idUsuario": "100005",
                        "nombres": "Ana Sofía",
                        "apellidoPaterno": "Martínez",
                        "apellidoMaterno": "García",
                        "correo": "ana.martinez@empresa.com",
                        "departamento": "Marketing"
                    },
                    {
                        "idUsuario": "100006",
                        "nombres": "José Eduardo",
                        "apellidoPaterno": "Ramírez",
                        "apellidoMaterno": "López",
                        "correo": "jose.ramirez@empresa.com",
                        "departamento": "Ventas"
                    },
                    {
                        "idUsuario": "100007",
                        "nombres": "Daniela",
                        "apellidoPaterno": "González",
                        "apellidoMaterno": "Hernández",
                        "correo": "daniela.gonzalez@empresa.com",
                        "departamento": "Compras"
                    },
                    {
                        "idUsuario": "100008",
                        "nombres": "Luis Fernando",
                        "apellidoPaterno": "Castillo",
                        "apellidoMaterno": "Mendoza",
                        "correo": "luis.castillo@empresa.com",
                        "departamento": "Logística"
                    },
                    {
                        "idUsuario": "100009",
                        "nombres": "Mariana",
                        "apellidoPaterno": "Ramirez",
                        "apellidoMaterno": "Salinas",
                        "correo": "mariana.rodriguez@empresa.com",
                        "departamento": "Jurídico"
                    },
                    {
                        "idUsuario": "100010",
                        "nombres": "Alejandro",
                        "apellidoPaterno": "Garza",
                        "apellidoMaterno": "Sanchez",
                        "correo": "alejandro.garza@empresa.com",
                        "departamento": "Administración"
                    }
                ]
            });

            this.getView().setModel(oModel);
        },

        onSuggest: function (oEvent) {
            const sValue = oEvent.getParameter("suggestValue");
            const oInput = oEvent.getSource();
            const oBinding = oInput.getBinding("suggestionItems");

            const aFilters = [
                new Filter("idUsuario", FilterOperator.Contains, sValue),
                new Filter("nombres", FilterOperator.Contains, sValue),
                new Filter("apellidoPaterno", FilterOperator.Contains, sValue),
                new Filter("apellidoMaterno", FilterOperator.Contains, sValue)
            ];

            const oFilter = new Filter({
                filters: aFilters,
                and: false
            });

            oBinding.filter(oFilter);
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
    });
});