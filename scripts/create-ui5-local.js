require("dotenv").config();

const fs = require("fs");
const path = require("path");

const sTemplatePath = path.resolve("ui5-local.yaml");
const sRuntimePath = path.resolve("ui5-runtime.yaml");

const aRequiredVariables = [
    "SF_USERNAME",
    "SF_PASSWORD",
    "MDF_WORKFLOW_USERNAME",
    "MDF_WORKFLOW_PASSWORD"
];

// Validar variables requeridas
const aMissingVariables = aRequiredVariables.filter(
    sVariable => !process.env[sVariable]
);

if (aMissingVariables.length > 0) {
    console.error(
        `Error: faltan variables de entorno requeridas: ${aMissingVariables.join(", ")}`
    );

    process.exit(1);
}

// Leer plantilla
let sYaml = fs.readFileSync(sTemplatePath, "utf8");

// Escapar los valores como strings válidos para YAML.
// JSON.stringify genera comillas y escapa caracteres especiales.
aRequiredVariables.forEach(sVariable => {
    sYaml = sYaml.replace(
        `\${${sVariable}}`,
        JSON.stringify(process.env[sVariable])
    );
});

// Generar archivo runtime con permisos solo para el usuario actual
fs.writeFileSync(sRuntimePath, sYaml, {
    encoding: "utf8",
    mode: 0o600
});

console.log("ui5-runtime.yaml generado correctamente.");