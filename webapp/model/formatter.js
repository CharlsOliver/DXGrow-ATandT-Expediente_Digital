sap.ui.define([
], function () {
    "use strict";
    return {
        percentState: function (percent) {
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

        percentValue: function (sPercent) {
            if (String(sPercent) === "-1") {
                return "--";
            }

            return sPercent;
        },

        percentUnit: function (sPercent) {
            if (String(sPercent) === "-1") {
                return "";
            }

            return "%";
        }
    };
});