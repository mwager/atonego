/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Mainfile
 *
 * @author Michael Wager <mail@mwager.de>
 */
(function (window, document, _, $) {
    'use strict';

    var log = function () {
        if(!console || __app_config__.ENV === 'production') {
            return false;
        }

        console.log.apply(console, arguments);
    };

    /**
     * catch global uncaught javascript errors
     */
    window.onerror = function (error, file, line) {
        log('WINDOW ERROR: ' + error + ' in file ' + file + ' on line ' + line);

        // returning true prevents browsers from doing anything
        // on uncaught errors
        return true;
    };

    var app = {};

    // -------------------------------------------------------------------------

    app.fadeOutFlashMessages = function() {
        var flashInfo = $('.flash-info');
        var flashError = $('.flash-error');

        setTimeout(function() {
            flashInfo.fadeOut(1000);
            flashError.fadeOut(1000);
        }, 12000);

        flashInfo.on('click', function() {
            flashInfo.fadeOut(1000);
        });

        flashError.on('click', function() {
            flashError.fadeOut(1000);
        });
    };

    function onDOMReady() {
        app.fadeOutFlashMessages();
    }

    $(document).ready(onDOMReady);

}(window, document, window._, window.jQuery));