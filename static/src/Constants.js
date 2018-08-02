require('./Shared')
function define(name, value) {
    Object.defineProperty(exports, name, {
        value: value,
        enumerable: true
    });
}

define("PRD_URL", 'http://35.233.61.182');
define("DEV_URL", 'http://localhost:8000');
define("roadTypes", window.roadTypes)
define("cities", global.cities) //either global or window
define("COLORS_DREAM", [
    '#89bdd3', '#9ad3de', '#e3e3e3', '#c9c9c9'
])
define("COLORS_QUAY", [
    '#22264b', '#b56969', '#e6cf8b', '#e8edf3'
])
define("Accra_CENTER", [5.6037168, -0.1869644]);
define("Kathmandu_CENTER", [27.7172453, 85.3239605]);
define("FLOWS", window.flows);
define("MONTH_NAME", ["January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December"
]);