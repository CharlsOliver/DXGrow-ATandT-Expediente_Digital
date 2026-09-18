sap.ui.define([
], function () {
	"use strict";
	return {
        percentState: function (percent) {
            const iPercent = Number(percent);

            if (iPercent < 70) {
                return "Error";
            }

            if (iPercent <= 90) {
                return "Warning";
            }

            return "Success";
        }
	};
});