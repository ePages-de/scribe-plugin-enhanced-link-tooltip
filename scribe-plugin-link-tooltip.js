/*eslint-env browser */ /* global module, define */

// Google Docs inspired link editing inside tooltip
// Based upon tooltip plugin by Artsy.net (https://github.com/artsy/scribe-plugin-link-tooltip)
(function () {
    'use strict';

    var scribePluginLinkTooltip = function (options) {

        // http://stackoverflow.com/a/25206094/1317451
        function findClosestParent(startElement, fn) {
            var parent = startElement.parentElement;
            if (!parent) {
                return undefined;
            }
            return fn(parent) ? parent : findClosestParent(parent, fn);
        }

        return function (scribe) {
            var nodeName = 'A',
                isEditState = false,

            // setup UI DOM
                namespace = options.namespace || 'scribe-plugin-link-tooltip',
                tooltipNode = (function () {
                    var newTooltip = document.createElement('form'),
                        parentElement = scribe.el.parentNode;
                    newTooltip.className = namespace + ' ' + namespace + '-hidden';
                    newTooltip.style.position = 'absolute';

                    newTooltip.innerHTML = options.innerMarkup;

                    if (getComputedStyle(parentElement).position === 'static') {
                        parentElement.style.position = 'relative';
                    }

                    // prepend in order to preserve collapsing margins at the bottom
                    parentElement.insertBefore(newTooltip, parentElement.firstChild);

                    return newTooltip;
                }()),
                ui = { /* eslint key-spacing:0 */
                    link:      tooltipNode.querySelector('[data-' + namespace + '-role=link]'),
                    linkInput: tooltipNode.querySelector('[data-' + namespace + '-role=input]'),
                    editBtn:   tooltipNode.querySelector('[data-' + namespace + '-role=edit]'),
                    applyBtn:  tooltipNode.querySelector('[data-' + namespace + '-role=submit]'),
                    removeBtn: tooltipNode.querySelector('[data-' + namespace + '-role=remove]')
                },

                linkSanitizer = options.linkSanitizer || function (str) {
                    return str;
                },

            // Extends selection to whole anchor. Returns anchor node or undefined.
                selectAnchorContent = function (selection) {
                    var node, range;

                    // nothing selected?
                    if (typeof selection.range === 'undefined' || selection.range.collapsed) {
                        node = selection.getContaining(function (testNode) {
                            return testNode.nodeName === nodeName;
                        });

                        // are we inside an <a>?
                        if (node) {
                            range = document.createRange();
                            range.selectNode(node);
                            selection.range = range;
                            selection.selection.addRange(range);

                        }
                    }

                    return node;
                },

                showTooltip = function (state, selection, node, val, submitCallback) {
                    var teardown = function () {
                            isEditState = false;
                            tooltipNode.classList.add(namespace + '-hidden');

                            /* eslint no-use-before-define:0 */ // circular references
                            tooltipNode.removeEventListener('submit', link);
                            ui.removeBtn.removeEventListener('click', unlink);
                            document.removeEventListener('mouseup', onBlur);
                            window.removeEventListener('resize', repositionTooltip);
                        },
                        link = function (e) {
                            e.preventDefault();
                            teardown();
                            submitCallback(linkSanitizer(String(ui.linkInput.value).trim()));
                        },
                        unlink = function () {
                            selectAnchorContent(selection);
                            new scribe.api.Command('unlink').execute();

                            getSelection().collapseToEnd();
                            teardown();
                        },
                        onBlur = function (e) {
                            var isSameNode = e.target === node,
                                selfOrParentAnchor = e.target.nodeName === nodeName ?
                                    e.target :
                                    findClosestParent(e.target, function (el) {
                                        return el.nodeName === nodeName;
                                    }),
                                isEditableLink = selfOrParentAnchor && selfOrParentAnchor.isContentEditable;

                            var isTooltipUiElement = findClosestParent(e.target, function (el) {
                                return el === tooltipNode;
                            });

                            if (isSameNode || isTooltipUiElement) {
                                return true; // let blur event pass through
                            }

                            // make seamless switch to any other editable link possible, even across scribe instances
                            if (isEditableLink) {
                                setTimeout(function () {
                                    e.target.dispatchEvent(new Event(namespace + '-query-state', {
                                        bubbles: true
                                    }));
                                }, 0);
                            }

                            teardown();
                        },
                        updateUi = function () {
                            // set visibilities according to state
                            tooltipNode.classList.remove(namespace + '-state-edit');
                            tooltipNode.classList.remove(namespace + '-state-view');
                            tooltipNode.classList.add(namespace + '-state-' + state);
                        },
                        repositionTooltip = function () {
                            // calculate position
                            var selectionRects = (function () {
                                    var rects = selection.range.getClientRects();
                                    if (!rects.length) {
                                        rects = selection.range.startContainer.getClientRects();
                                    }
                                    return rects;
                                }()),
                                scribeParentRect = scribe.el.parentNode.getBoundingClientRect(),
                                biggestSelection = [].reduce.call(selectionRects, function (biggest, rect) {
                                    return rect.width >= biggest.width ? {
                                        rect: rect,
                                        width: rect.width
                                    } : {
                                        rect: biggest.rect,
                                        width: biggest.width
                                    };
                                }, {
                                    width: 0
                                }),
                                left = biggestSelection.rect ? biggestSelection.rect.left : 0,
                                top = selectionRects.length ? selectionRects[selectionRects.length - 1].bottom : 0,
                                tooltipWidth = parseFloat(getComputedStyle(tooltipNode).width),
                                offsetLeft = left - scribeParentRect.left - tooltipWidth / 2;

                            // set position
                            tooltipNode.style.top = top - scribeParentRect.top + 'px';
                            tooltipNode.style.left = offsetLeft + 'px';

                            // show
                            tooltipNode.classList.remove(namespace + '-hidden');
                        };

                    if (state === 'edit') {
                        isEditState = true;
                    }

                    // update link value
                    ui.link.href = ui.link.title = ui.link.innerHTML = ui.linkInput.value = val;
                    updateUi();
                    repositionTooltip();

                    window.addEventListener('resize', repositionTooltip);
                    tooltipNode.addEventListener('submit', link);
                    ui.removeBtn.addEventListener('click', unlink);

                    // On clicking off the tooltip, hide the tooltip.
                    document.addEventListener('mouseup', onBlur);
                },

                executeCommand = function () {
                    var selection = new scribe.api.Selection(),
                        node = selectAnchorContent(selection),
                        content = node && node.getAttribute('href') || ''; // ! not node.href as that would be expanded

                    showTooltip('edit', selection, node, content, function (newHref) {
                        getSelection().removeAllRanges();
                        getSelection().addRange(selection.range);
                        if (newHref === '') {
                            new scribe.api.Command('unlink').execute();
                        } else {
                            scribe.api.SimpleCommand.prototype.execute.call(this, newHref); // this === linkTooltipCommand
                        }
                        scribe.el.focus();
                        getSelection().collapseToEnd();
                    }.bind(this));

                    setTimeout(function () {
                        ui.linkInput.focus();
                    }, 0);
                },

            // Show the tooltip when a link has focus. When submitting change the link.
            // todo hide on esc key (bonus: also when in view state, until link regains focus)
                queryState = function () {
                    var selection = new scribe.api.Selection();
                    return isEditState || selection.getContaining(function (node) {
                        if (node.nodeName === 'A' && !isEditState && scribe.el.contains(node)) {
                            showTooltip('view', selection, node,
                                node.getAttribute('href'), // ! not node.href as that would be expanded
                                function (newHref) {
                                    node.href = newHref;
                                    // scribe (or the browser?) automatically removes the link if newHref is empty
                                });
                        } else {
                            tooltipNode.classList.add(namespace + '-hidden');
                        }

                        return node.nodeName === nodeName;
                    });
                };

            // bind and register
            var unbindAndExecute = function () {
                document.removeEventListener('click', unbindAndExecute);
                executeCommand.call(linkTooltipCommand);
            };

            var linkTooltipCommand = new scribe.api.Command('createLink');
            scribe.commands.linkTooltip = linkTooltipCommand;

            linkTooltipCommand.queryState = queryState;
            linkTooltipCommand.execute = function () {
                // this is needed since scribe toolbar executes the command on mousedown
                // (see https://github.com/guardian/scribe-plugin-toolbar/pull/18)
                document.addEventListener('click', unbindAndExecute);
            };

            ui.editBtn.addEventListener('click', executeCommand);

            // bubbling up when switching from another editable link
            scribe.el.addEventListener(namespace + '-query-state', queryState);
        };
    };

    // Module system magic dance
    if (typeof module !== 'undefined') {
        module.exports = scribePluginLinkTooltip;
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define(function () {
            return scribePluginLinkTooltip;
        });
    } else {
        window.scribePluginLinkTooltip = scribePluginLinkTooltip;
    }
}());
