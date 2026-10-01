sap.ui.define([
], function () {
    "use strict";

    return {
        percentState: function (percent, status) {
            if (
                status === "FINISHED" &&
                (percent === null ||
                 percent === undefined ||
                 String(percent).toLowerCase() === "null")
            ) {
                return "Success";
            }

            const iPercent = Number(percent);

            if (iPercent === -1) {
                return "None";
            }

            if (iPercent < 70) {
                return "Error";
            }

            if (iPercent <= 90) {
                return "Warning";
            }

            return "Success";
        },

        percentValue: function (percent, status) {
            if (
                status === "FINISHED" &&
                (percent === null ||
                 percent === undefined ||
                 String(percent).toLowerCase() === "null")
            ) {
                return "100";
            }

            if (String(percent) === "-1") {
                return "--";
            }

            return percent;
        },

        percentUnit: function (percent, status) {
            if (
                status === "FINISHED" &&
                (percent === null ||
                 percent === undefined ||
                 String(percent).toLowerCase() === "null")
            ) {
                return "%";
            }

            if (String(percent) === "-1") {
                return "";
            }

            return "%";
        },

        statusFormat: function (status) {
            if (!status) {
                return "Estatus desconocido";
            }

            if (status === "LISTS") {
                return "Pendiente";
            }

            if (status.includes("FETCHING") || status === "RECEIVED") {
                return "En Proceso";
            }

            if (status === "COMPLETED") {
                return "Listo para enviar";
            }

            if (status === "FINISHED") {
                return "Enviado";
            }

            if (status === "FAILED") {
                return "Error";
            }

            return "Estatus desconocido";
        },

        statusColor: function (status) {
            if (!status) {
                return "None";
            }

            if (status === "LISTS") {
                return "None";
            }

            if (status.includes("FETCHING") || status === "RECEIVED") {
                return "Warning";
            }

            if (status === "COMPLETED") {
                return "Information";
            }

            if (status === "FINISHED") {
                return "Success";
            }

            if (status === "FAILED") {
                return "Error";
            }

            return "None";
        }
    };
});