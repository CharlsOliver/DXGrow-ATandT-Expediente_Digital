sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (BaseController) => {
    "use strict";

    return BaseController.extend("btpexpedientedigital.controller.App", {

        onInit() {
            const bInsideShell =
                document.documentElement.classList.contains(
                    "sapUiInsideFioriShell"
                );

            const oStandaloneHeader = this.byId("standaloneHeader");

            if (oStandaloneHeader) {
                oStandaloneHeader.setVisible(!bInsideShell);
            }
        }

    });
});