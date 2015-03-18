# scribe-plugin-enhanced-link-tooltip

A [Scribe](https://github.com/guardian/scribe) plugin for doing a Medium/Google Docs style tooltip UI instead of a prompt for inserting links.
Inspired by [artsy/scribe-plugin-link-tooltip](https://github.com/artsy/scribe-plugin-link-tooltip), but with a few modifications, namely:
* no jQuery dependency
* custom template (think of l10n)
* custom namespace for CSS classes and events
* pluggable link sanitizer
* tested with multiple Scribe instances

## Usage

See the [source code](https://github.com/ePages-de/scribe-plugin-enhanced-link-tooltip/blob/gh-pages/example.js#L117) of the [demo](http://ePages-de.github.io/scribe-plugin-enhanced-link-tooltip/example.html) (`example.html`, `example.js` in `gh-pages` branch).

Javascript (don't let yourself scare by the template stuff)
````javascript
// Replace with your templating solution of choice
var scribePluginLinkTooltipTemplate = '<a data-scribe-plugin-link-tooltip-role="link"' +
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
````

These few CSS styles are more or less required to make the plugin work:
````css
.scribe-plugin-link-tooltip-hidden {
  visibility: hidden;
}

.scribe-plugin-link-tooltip {
  z-index: 1;
  white-space: nowrap;
}

.scribe-plugin-link-tooltip > * {
  display: inline-block;
}

.scribe-plugin-link-tooltip-state-edit .scribe-plugin-link-tooltip-show-on-view,
.scribe-plugin-link-tooltip-state-view .scribe-plugin-link-tooltip-show-on-edit {
  display: none;
}
````

## Positioning

The tooltip will prepend itself to the scribe element's parent element and use `position: absolute`, `top`, and `left` to position itself close to the text you're highlighting.
Therefore that element will get `position: relative` if (and only if) its current position is `static`.

## TODO

* Tests

# License

MIT
