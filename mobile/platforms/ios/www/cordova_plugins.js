cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/org.apache.cordova.core.device/www/device.js",
        "id": "org.apache.cordova.core.device.device",
        "clobbers": [
            "device"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.core.network-information/www/network.js",
        "id": "org.apache.cordova.core.network-information.network",
        "clobbers": [
            "navigator.connection",
            "navigator.network.connection"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.core.network-information/www/Connection.js",
        "id": "org.apache.cordova.core.network-information.Connection",
        "clobbers": [
            "Connection"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.core.vibration/www/vibration.js",
        "id": "org.apache.cordova.core.vibration.notification",
        "merges": [
            "navigator.notification"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.core.splashscreen/www/splashscreen.js",
        "id": "org.apache.cordova.core.splashscreen.SplashScreen",
        "clobbers": [
            "navigator.splashscreen"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.core.console/www/console-via-logger.js",
        "id": "org.apache.cordova.core.console.console",
        "clobbers": [
            "console"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.core.console/www/logger.js",
        "id": "org.apache.cordova.core.console.logger",
        "clobbers": [
            "cordova.logger"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.core.dialogs/www/notification.js",
        "id": "org.apache.cordova.core.dialogs.notification",
        "merges": [
            "navigator.notification"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.core.globalization/www/GlobalizationError.js",
        "id": "org.apache.cordova.core.globalization.GlobalizationError",
        "clobbers": [
            "window.GlobalizationError"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.core.globalization/www/globalization.js",
        "id": "org.apache.cordova.core.globalization.globalization",
        "clobbers": [
            "navigator.globalization"
        ]
    }
]
});