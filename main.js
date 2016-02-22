/**
 * No Distractions Advanced Extension
 * Extends the "No Distractions" view to display the sidebar when pointing at
 * the left side of the editor and the toolbar when pointing at the right side.
 *
 * @author Martin Holler
 * @version 1.0.1
 * @license MIT
 */

define(function (require, exports, module) {
    'use strict';

    var OFFSETS = {
        left: 20,
        right: 3 // needs to be very low for scrollbars to still be usable
    };
    var MODES = ['overlay', 'push'];

    // imports
    var ExtensionUtils = brackets.getModule('utils/ExtensionUtils');
    var PreferencesManager = brackets.getModule('preferences/PreferencesManager');

    // elements
    var $body = $(document.body);
    var $sidebar = $('#sidebar');
    var $toolbar = $('#main-toolbar');
    var $editor = $('#editor-holder');
    var $mainView = $('.main-view');

    // preferences
    var extensionPrefs = PreferencesManager.getExtensionPrefs('no-distractions-advanced');
    var mode;

    var enable = function () {
        var state = 0; // 0 = closed, 1 = sidebar open, 2 = toolbar open
        var lastState = state;
        var sidebarWidth = $sidebar.width();
        var toolbarWidth = $toolbar.width();

        // add event listeners
        $editor.off('mousemove.NDA').on('mousemove.NDA', function (e) {

            // bail if the mouse is pressed
            if (e.which) {
                return;
            }

            if (e.clientX <= OFFSETS.left) {
                state = 1;
            } else if (e.clientX >= $editor.width() - OFFSETS.right) {
                state = 2;
            } else {
                state = 0;
            }

            // emit events on state change
            if (state !== lastState) {
                $editor.trigger('NDAStateChange', state);
            }

            lastState = state;
        });

        $editor.off('NDAStateChange').on('NDAStateChange', function (e, state) {
            var pushValue = 0;

            $body.removeClass('nda--left nda--right');

            switch (state) {
            case 1:
                pushValue = sidebarWidth;
                $body.addClass('nda--left');
                break;
            case 2:
                pushValue = -toolbarWidth;
                $body.addClass('nda--right');
                break;
            }

            // push mode
            if (mode === 'push') {
                $mainView.css('transform', 'translateX(' + pushValue + 'px)');
            }
        });

        $body.addClass('nda');
    };

    var disable = function () {
        $body.removeClass('nda nda--left nda--right');
        $mainView.removeAttr('style');
        $editor.off('mousemove.NDA NDAStateChange');
    };

    $sidebar.addClass('nda-target nda-target--left');
    $toolbar.addClass('nda-target nda-target--right');

    // load the stylesheet
    ExtensionUtils.loadStyleSheet(module, 'styles.css');

    // watch for preferences changes (this is also called on launch)
    PreferencesManager.on('change', 'noDistractions', function () {

        // enable the extension when the noDistractions is active
        if (PreferencesManager.get('noDistractions')) {
            enable();

        // otherwise, disable it
        } else {
            disable();
        }
    });

    extensionPrefs.definePreference('mode', 'string', MODES[0]).on('change', function () {
        mode = extensionPrefs.get('mode');

        // return to default if value is invalid
        if (MODES.indexOf(mode) === -1) {
            mode = MODES[0];
        }

        // remove style attribute if not in push mode
        if (mode !== 'push') {
            $mainView.removeAttr('style');
        }

        $body.attr('data-nda-mode', mode);
    });

    // exports
    exports.enable = enable;
    exports.disable = disable;
});
