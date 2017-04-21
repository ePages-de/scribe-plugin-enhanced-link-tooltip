// Pretty much copy and paste from http:/guardian.github.io/scribe
// Search for "Link tooltip plugin"
require({
    paths: {
        'scribe': 'http://guardian.github.io/scribe/bower_components/scribe/scribe',
        'scribe-plugin-blockquote-command': 'http://guardian.github.io/scribe/bower_components/scribe-plugin-blockquote-command/scribe-plugin-blockquote-command',
        'scribe-plugin-code-command': 'http://guardian.github.io/scribe/bower_components/scribe-plugin-code-command/scribe-plugin-code-command',
        'scribe-plugin-curly-quotes': 'http://guardian.github.io/scribe/bower_components/scribe-plugin-curly-quotes/scribe-plugin-curly-quotes',
        'scribe-plugin-formatter-plain-text-convert-new-lines-to-html': 'http://guardian.github.io/scribe/bower_components/scribe-plugin-formatter-plain-text-convert-new-lines-to-html/scribe-plugin-formatter-plain-text-convert-new-lines-to-html',
        'scribe-plugin-heading-command': 'http://guardian.github.io/scribe/bower_components/scribe-plugin-heading-command/scribe-plugin-heading-command',
        'scribe-plugin-intelligent-unlink-command': 'http://guardian.github.io/scribe/bower_components/scribe-plugin-intelligent-unlink-command/scribe-plugin-intelligent-unlink-command',
        'scribe-plugin-keyboard-shortcuts': 'http://guardian.github.io/scribe/bower_components/scribe-plugin-keyboard-shortcuts/scribe-plugin-keyboard-shortcuts',
        'scribe-plugin-link-tooltip-command': './scribe-plugin-link-tooltip',
        'scribe-plugin-sanitizer': 'http://guardian.github.io/scribe/bower_components/scribe-plugin-sanitizer/scribe-plugin-sanitizer',
        'scribe-plugin-smart-lists': 'http://guardian.github.io/scribe/bower_components/scribe-plugin-smart-lists/scribe-plugin-smart-lists',
        'scribe-plugin-toolbar': 'http://guardian.github.io/scribe/bower_components/scribe-plugin-toolbar/scribe-plugin-toolbar'
    }
}, [
    'scribe',
    'scribe-plugin-blockquote-command',
    'scribe-plugin-code-command',
    'scribe-plugin-curly-quotes',
    'scribe-plugin-formatter-plain-text-convert-new-lines-to-html',
    'scribe-plugin-heading-command',
    'scribe-plugin-intelligent-unlink-command',
    'scribe-plugin-keyboard-shortcuts',
    'scribe-plugin-link-tooltip-command',
    'scribe-plugin-sanitizer',
    'scribe-plugin-smart-lists',
    'scribe-plugin-toolbar'
], function (
    Scribe,
    scribePluginBlockquoteCommand,
    scribePluginCodeCommand,
    scribePluginCurlyQuotes,
    scribePluginFormatterPlainTextConvertNewLinesToHtml,
    scribePluginHeadingCommand,
    scribePluginIntelligentUnlinkCommand,
    scribePluginKeyboardShortcuts,
    scribePluginLinkTooltipCommand,
    scribePluginSanitizer,
    scribePluginSmartLists,
    scribePluginToolbar
) {

    'use strict';

    var scribe = new Scribe(document.querySelector('.scribe'), { allowBlockElements: true });

    scribe.on('content-changed', updateHTML);

    function updateHTML() {
        document.querySelector('.scribe-html').value = scribe.getHTML();
    }

    /**
     * Keyboard shortcuts
     */

    var ctrlKey = function (event) { return event.metaKey || event.ctrlKey; };

    var commandsToKeyboardShortcutsMap = Object.freeze({
        bold: function (event) { return event.metaKey && event.keyCode === 66; }, // b
        italic: function (event) { return event.metaKey && event.keyCode === 73; }, // i
        strikeThrough: function (event) { return event.altKey && event.shiftKey && event.keyCode === 83; }, // s
        removeFormat: function (event) { return event.altKey && event.shiftKey && event.keyCode === 65; }, // a
        linkTooltip: function (event) { return event.metaKey && ! event.shiftKey && event.keyCode === 75; }, // k
        unlink: function (event) { return event.metaKey && event.shiftKey && event.keyCode === 75; }, // k,
        insertUnorderedList: function (event) { return event.altKey && event.shiftKey && event.keyCode === 66; }, // b
        insertOrderedList: function (event) { return event.altKey && event.shiftKey && event.keyCode === 78; }, // n
        blockquote: function (event) { return event.altKey && event.shiftKey && event.keyCode === 87; }, // w
        code: function (event) { return event.metaKey && event.shiftKey && event.keyCode === 76; }, // l
        h2: function (event) { return ctrlKey(event) && event.keyCode === 50; } // 2
    });

    /**
     * Plugins
     */

    scribe.use(scribePluginBlockquoteCommand());
    scribe.use(scribePluginCodeCommand());
    scribe.use(scribePluginHeadingCommand(2));
    scribe.use(scribePluginIntelligentUnlinkCommand());
    scribe.use(scribePluginToolbar(document.querySelector('.toolbar')));
    scribe.use(scribePluginSmartLists());
    scribe.use(scribePluginCurlyQuotes());
    scribe.use(scribePluginKeyboardShortcuts(commandsToKeyboardShortcutsMap));

    // Formatters
    scribe.use(scribePluginSanitizer({
        tags: {
            p: {},
            br: {},
            b: {},
            strong: {},
            i: {},
            strike: {},
            blockquote: {},
            code: {},
            ol: {},
            ul: {},
            li: {},
            a: { href: true },
            h2: {},
            u: {}
        }
    }));
    scribe.use(scribePluginFormatterPlainTextConvertNewLinesToHtml());

    if (scribe.allowsBlockElements()) {
        scribe.setContent('<p>Hello, World!</p>');
    } else {
        scribe.setContent('Hello, World!');
    }


    /**
     * Link tooltip plugin
     */

    // Replace with your templating solution of choice
    var scribePluginLinkTooltipTemplate = '' +
        '<div data-scribe-plugin-link-tooltip-role="arrow"></div>' +
        '<a data-scribe-plugin-link-tooltip-role="link"' +
        'class="scribe-plugin-link-tooltip-show-on-view"></a>' +
        '<input data-scribe-plugin-link-tooltip-role="input"' +
        'class="scribe-plugin-link-tooltip-show-on-edit" placeholder="Paste or type a link"/>' +
        '<button data-scribe-plugin-link-tooltip-role="submit" type="submit"' +
        'class="scribe-plugin-link-tooltip-show-on-edit">Apply</button>' +
        '<button data-scribe-plugin-link-tooltip-role="edit" type="button"' +
        'class="scribe-plugin-link-tooltip-show-on-view">Change</button>' +
        '<button data-scribe-plugin-link-tooltip-role="remove" type="button"' +
        'class="scribe-plugin-link-tooltip-show-on-view">Remove</button>';

    scribe.use(scribePluginLinkTooltipCommand({
        innerMarkup: scribePluginLinkTooltipTemplate,
        namespace: 'scribe-plugin-link-tooltip',
        linkSanitizer: function (str) {
            // Try to catch common cases of users forgetting to add "http://" in front,
            // but err on the safe side: if it looks even remotely like a hostname, just stop.
            // Feel free to add your favourite contry's TLD as long as it is not a common file extension.
            return str.match(/^\w[\w\-_\.]+\.(co|uk|com|org|net|gov|biz|info|us|eu|de|fr|it|es|pl|nz)/i) ?
            'http://' + str :
                str;
        }
    }));
});
