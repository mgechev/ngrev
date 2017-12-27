(function () {'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _angular_compiler = require('@angular/compiler');
var path = require('path');
var ngast = require('ngast');
var _angular_core = require('@angular/core');
var fs = require('fs');
var child_process = require('child_process');
var events = require('events');

var SymbolTypes;
(function (SymbolTypes) {
    SymbolTypes[SymbolTypes["Provider"] = 0] = "Provider";
    SymbolTypes[SymbolTypes["HtmlElement"] = 1] = "HtmlElement";
    SymbolTypes[SymbolTypes["HtmlElementWithDirective"] = 2] = "HtmlElementWithDirective";
    SymbolTypes[SymbolTypes["ComponentWithDirective"] = 3] = "ComponentWithDirective";
    SymbolTypes[SymbolTypes["Component"] = 4] = "Component";
    SymbolTypes[SymbolTypes["ComponentOrDirective"] = 5] = "ComponentOrDirective";
    SymbolTypes[SymbolTypes["Pipe"] = 6] = "Pipe";
    SymbolTypes[SymbolTypes["Module"] = 7] = "Module";
    SymbolTypes[SymbolTypes["LazyModule"] = 8] = "LazyModule";
    SymbolTypes[SymbolTypes["Meta"] = 9] = "Meta";
})(SymbolTypes || (SymbolTypes = {}));
var Direction;
(function (Direction) {
    Direction[Direction["From"] = 0] = "From";
    Direction[Direction["To"] = 1] = "To";
    Direction[Direction["Both"] = 2] = "Both";
})(Direction || (Direction = {}));
var Layout;
(function (Layout) {
    Layout[Layout["HierarchicalDirected"] = 0] = "HierarchicalDirected";
    Layout[Layout["Regular"] = 1] = "Regular";
})(Layout || (Layout = {}));
var getId = function (symbol) {
    return symbol.filePath + "#" + symbol.name;
};
var getProviderId = function (provider) {
    if (provider.token.value) {
        return provider.token.value;
    }
    else {
        if (provider.token.identifier) {
            return getId(provider.token.identifier.reference);
        }
        return null;
    }
};
var getProviderName = function (provider) {
    if (provider.token.value) {
        return provider.token.value;
    }
    else {
        if (provider.token.identifier) {
            return provider.token.identifier.reference.name;
        }
        return null;
    }
};
var isAngularSymbol = function (symbol) {
    if (symbol instanceof _angular_compiler.StaticSymbol) {
        return /node_modules\/@angular/.test(symbol.filePath);
    }
    else {
        if (symbol.token.value) {
            // We can't be completely sure since we don't know
            // the filePath but Angular doesn't have any non-reference tokens.
            return false;
        }
        else {
            if (symbol.token.identifier) {
                return isAngularSymbol(symbol.token.identifier.reference);
            }
            return null;
        }
    }
};

var State = /** @class */ (function () {
    function State(symbolId, context) {
        this.symbolId = symbolId;
        this.context = context;
    }
    State.prototype.destroy = function () { };
    Object.defineProperty(State.prototype, "stateSymbolId", {
        get: function () {
            return this.symbolId;
        },
        enumerable: true,
        configurable: true
    });
    return State;
}());

var _changeDetectionToString = function (cd) {
    switch (cd) {
        case _angular_core.ChangeDetectionStrategy.Default:
            return 'Default';
        case _angular_core.ChangeDetectionStrategy.OnPush:
            return 'OnPush';
    }
    return null;
};
var getProviderMetadata = function (provider) {
    var meta = provider.getMetadata();
    var deps = (meta.deps || [])
        .map(function (d) {
        var t = d.token;
        if (t) {
            if (t.identifier) {
                return t.identifier.reference.name;
            }
            return t.value;
        }
        return 'Undefined';
    })
        .join(', ');
    var filePath = null;
    var name = meta.token.value;
    if (meta.token.identifier) {
        filePath = meta.token.identifier.reference.filePath;
        name = meta.token.identifier.reference.name;
    }
    return {
        filePath: filePath,
        properties: [
            { key: 'Name', value: name },
            { key: 'Multiprovider', value: (meta.multi === true).toString() },
            { key: 'Dependencies', value: deps }
        ]
    };
};
var getPipeMetadata = function (pipe) {
    var meta = pipe.getMetadata();
    return {
        filePath: pipe.symbol.filePath,
        properties: [
            { key: 'Name', value: (meta || { name: 'Unknown' }).name },
            { key: 'Pure', value: ((meta || { pure: true }).pure === true).toString() }
        ]
    };
};
var getDirectiveMetadata = function (dir) {
    var meta = dir.getNonResolvedMetadata() || {
        selector: 'Unknown',
        isComponent: false,
        changeDetection: null,
        exportAs: null
    };
    return {
        filePath: dir.symbol.filePath,
        properties: [
            { key: 'Selector', value: meta.selector },
            { key: 'Component', value: meta.isComponent.toString() },
            { key: 'Change Detection', value: _changeDetectionToString(meta.changeDetection) },
            { key: 'Export', value: meta.exportAs }
        ]
    };
};
var getElementMetadata = function (el) {
    return {
        properties: [
            { key: 'Name', value: el.name },
            { key: 'Directives', value: el.directives.map(function (d) { return d.directive.type.reference.name; }).join(', ') },
            { key: 'Attributes', value: el.attrs.map(function (a) { return "[" + a.name + "=" + a.value + "]"; }).join(', ') }
        ]
    };
};
var getModuleMetadata = function (node) {
    return {
        filePath: node.filePath,
        properties: [{ key: 'Name', value: node.name }, { key: 'Members', value: node.members.join('\n') }]
    };
};

var __extends$3 = (undefined && undefined.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var TemplateId$1 = 'template';
var TemplateErrorId$1 = 'template-error';
var TemplateState = /** @class */ (function (_super) {
    __extends$3(TemplateState, _super);
    function TemplateState(context, directive) {
        var _this = _super.call(this, getId(directive.symbol), context) || this;
        _this.directive = directive;
        _this.symbols = {};
        return _this;
    }
    TemplateState.prototype.getMetadata = function (id) {
        var s = this.symbols[id];
        if (s) {
            if (s instanceof _angular_compiler.ElementAst) {
                return getElementMetadata(s);
            }
            else if (s instanceof ngast.DirectiveSymbol) {
                return getDirectiveMetadata(s);
            }
        }
        return null;
    };
    TemplateState.prototype.nextState = function (id) {
        if (id === this.symbolId) {
            return null;
        }
        var symbol = this.symbols[id];
        if (!symbol) {
            return null;
        }
        if (symbol instanceof ngast.DirectiveSymbol) {
            return new DirectiveState(this.context, symbol);
        }
        else {
            return null;
        }
    };
    TemplateState.prototype.getData = function () {
        var s = this.directive.symbol;
        var nodeId = getId(s);
        var label = this.directive.symbol.name + "'s Template";
        var nodes = [
            {
                id: TemplateId$1,
                label: label,
                type: {
                    type: SymbolTypes.Meta,
                    angular: false
                }
            }
        ];
        var edges = [];
        this.addTemplateNodes(nodes, edges);
        return {
            title: label,
            graph: {
                nodes: nodes,
                edges: edges
            }
        };
    };
    TemplateState.prototype.addTemplateNodes = function (resNodes, edges) {
        var _this = this;
        var res = this.directive.getTemplateAst();
        var rootNodes = res.templateAst;
        res.errors = res.errors || [];
        res.parseErrors = res.parseErrors || [];
        if (res.errors.length || res.parseErrors.length) {
            var label = res.parseErrors
                .map(function (e) { return e.msg; })
                .concat(res.errors.map(function (e) { return e.message; }))
                .join('\n');
            resNodes.push({
                id: TemplateErrorId$1,
                label: label
            });
            edges.push({
                from: TemplateId$1,
                to: TemplateErrorId$1
            });
        }
        else {
            var currentNode_1 = 0;
            var dirMap_1 = this.context.getDirectives().reduce(function (p, d) {
                var s = d.symbol;
                p[getId(s)] = d;
                return p;
            }, {});
            var addNodes_1 = function (nodes, parentNodeId) {
                nodes.forEach(function (n) {
                    currentNode_1 += 1;
                    var nodeId = 'el-' + currentNode_1;
                    edges.push({
                        from: parentNodeId,
                        to: nodeId
                    });
                    var node = {
                        id: nodeId,
                        label: n.name,
                        data: n,
                        type: {
                            angular: false,
                            type: n.directives.length ? SymbolTypes.HtmlElementWithDirective : SymbolTypes.HtmlElement
                        }
                    };
                    var component = _this.tryGetMatchingComponent(dirMap_1, n.directives);
                    _this.symbols[nodeId] = n;
                    if (component) {
                        _this.symbols[nodeId] = component;
                        node.type.type = SymbolTypes.Component;
                    }
                    resNodes.push(node);
                    addNodes_1(n.children.filter(function (c) { return c instanceof _angular_compiler.ElementAst; }), nodeId);
                });
            };
            addNodes_1((rootNodes || []).filter(function (c) { return c instanceof _angular_compiler.ElementAst; }), TemplateId$1);
        }
    };
    TemplateState.prototype.tryGetMatchingComponent = function (dirMap, componentDirs) {
        return componentDirs
            .filter(function (d) {
            var ref = d.directive.type.reference;
            var symbol = dirMap[ref.filePath + '#' + ref.name];
            var metadata = symbol.getNonResolvedMetadata();
            if (symbol && metadata && metadata.isComponent) {
                return true;
            }
            return false;
        })
            .map(function (d) { return dirMap[getId(d.directive.type.reference)]; })
            .pop();
    };
    return TemplateState;
}(State));

var __extends$4 = (undefined && undefined.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var SymbolType;
(function (SymbolType) {
    SymbolType[SymbolType["Directive"] = 0] = "Directive";
    SymbolType[SymbolType["Provider"] = 1] = "Provider";
    SymbolType[SymbolType["Meta"] = 2] = "Meta";
})(SymbolType || (SymbolType = {}));
var ProviderState = /** @class */ (function (_super) {
    __extends$4(ProviderState, _super);
    function ProviderState(context, provider) {
        var _this = _super.call(this, getProviderId(provider.getMetadata()), context) || this;
        _this.provider = provider;
        _this.symbols = {};
        return _this;
    }
    ProviderState.prototype.getMetadata = function (id) {
        return getProviderMetadata(this.symbols[id]);
    };
    ProviderState.prototype.nextState = function (nodeId) {
        if (nodeId === this.symbolId) {
            return null;
        }
        var symbol = this.symbols[nodeId];
        if (!symbol) {
            return null;
        }
        return new ProviderState(this.context, symbol);
    };
    ProviderState.prototype.getData = function () {
        var _this = this;
        var metadata = this.provider.getMetadata();
        var existing = {};
        var currentId = getProviderId(metadata);
        var nodes = [
            {
                id: currentId,
                data: this.provider,
                label: getProviderName(metadata),
                type: {
                    angular: isAngularSymbol(metadata),
                    type: SymbolTypes.Provider
                }
            }
        ];
        existing[currentId] = 1;
        (this.provider.getDependencies() || []).forEach(function (p) {
            var dependencyMetadata = p.getMetadata();
            // Handle @SkipSelf()
            var id = getProviderId(dependencyMetadata);
            if (!existing[id]) {
                nodes.push({
                    id: id,
                    data: p,
                    label: getProviderName(dependencyMetadata),
                    type: {
                        angular: isAngularSymbol(p.getMetadata()),
                        type: SymbolTypes.Provider
                    }
                });
            }
            existing[id] = (existing[id] || 0) + 1;
        });
        existing[currentId] -= 1;
        nodes.forEach(function (n) { return n.data && (_this.symbols[n.id] = n.data); });
        var resultEdges = [];
        // Show only a single arrow
        Object.keys(existing).forEach(function (id) {
            if (existing[id] >= 1) {
                resultEdges.push({
                    from: currentId,
                    to: id,
                    direction: Direction.To
                });
            }
        });
        return {
            title: getProviderName(this.provider.getMetadata()),
            layout: Layout.Regular,
            graph: { edges: resultEdges, nodes: nodes }
        };
    };
    return ProviderState;
}(State));

var __extends$2 = (undefined && undefined.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var TemplateId = 'template';
var DependenciesId = 'dependencies';
var ViewProvidersId = 'view-providers';
var ProvidersId$1 = 'providers';
var DirectiveState = /** @class */ (function (_super) {
    __extends$2(DirectiveState, _super);
    function DirectiveState(context, directive) {
        var _this = _super.call(this, getId(directive.symbol), context) || this;
        _this.directive = directive;
        _this.symbols = {};
        return _this;
    }
    DirectiveState.prototype.getMetadata = function (id) {
        var s = this.symbols[id];
        console.log(Object.keys(this.symbols));
        if (s) {
            if (s instanceof _angular_compiler.ElementAst) {
                return getElementMetadata(s);
            }
            else if (s instanceof ngast.DirectiveSymbol) {
                return getDirectiveMetadata(s);
            }
            else if (s instanceof ngast.ProviderSymbol) {
                return getProviderMetadata(s);
            }
        }
        return null;
    };
    DirectiveState.prototype.nextState = function (id) {
        if (id === TemplateId) {
            return new TemplateState(this.context, this.directive);
        }
        if (id === this.symbolId) {
            return null;
        }
        var symbol = this.symbols[id];
        if (symbol instanceof ngast.DirectiveSymbol) {
            return new DirectiveState(this.context, symbol);
        }
        else if (symbol instanceof ngast.ProviderSymbol) {
            return new ProviderState(this.context, symbol);
        }
        else {
            return null;
        }
    };
    DirectiveState.prototype.getData = function () {
        var s = this.directive.symbol;
        var nodeId = getId(s);
        var nodes = [
            {
                id: nodeId,
                label: s.name,
                data: this.directive,
                type: {
                    type: SymbolTypes.Component,
                    angular: isAngularSymbol(s)
                }
            }
        ];
        var edges = [];
        if (this.directive.isComponent()) {
            nodes.push({
                id: TemplateId,
                label: 'Template',
                type: {
                    type: SymbolTypes.Meta,
                    angular: false
                }
            });
            edges.push({
                from: nodeId,
                to: TemplateId
            });
        }
        var addedSymbols = {};
        this.addProviderNodes(nodes, edges, addedSymbols, 'Dependencies', DependenciesId, this.directive.getDependencies());
        this.addProviderNodes(nodes, edges, addedSymbols, 'Providers', ProvidersId$1, this.directive.getProviders());
        this.addProviderNodes(nodes, edges, addedSymbols, 'View Providers', ViewProvidersId, this.directive.getViewProviders());
        return {
            title: this.directive.symbol.name,
            graph: {
                nodes: nodes,
                edges: edges
            }
        };
    };
    DirectiveState.prototype.addProviderNodes = function (nodes, edges, addedSymbols, rootLabel, rootId, providers) {
        var _this = this;
        if (providers.length > 0) {
            nodes.push({
                id: rootId,
                label: rootLabel,
                type: {
                    type: SymbolTypes.Meta,
                    angular: false
                }
            });
            edges.push({
                from: getId(this.directive.symbol),
                to: rootId
            });
        }
        var existing = {};
        var directiveId = getId(this.directive.symbol);
        providers.forEach(function (p) {
            var m = p.getMetadata();
            var id = getProviderId(m);
            existing[id] = (existing[id] || 0) + 1;
            var node = {
                id: id,
                data: p,
                label: getProviderName(m),
                type: {
                    angular: isAngularSymbol(m),
                    type: SymbolTypes.Provider
                }
            };
            // Handle circular references
            if (!addedSymbols[id]) {
                nodes.push(node);
                addedSymbols[id] = true;
            }
        });
        if (existing[directiveId]) {
            edges.push({
                from: rootId,
                to: directiveId,
                direction: Direction.To
            });
        }
        Object.keys(existing).forEach(function (key) {
            edges.push({
                from: rootId,
                to: key,
                direction: Direction.To
            });
        });
        nodes.forEach(function (n) {
            _this.symbols[n.id] = n.data;
        });
    };
    return DirectiveState;
}(State));

var __extends$5 = (undefined && undefined.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var PipeState = /** @class */ (function (_super) {
    __extends$5(PipeState, _super);
    function PipeState(context, pipe) {
        var _this = _super.call(this, getId(pipe.symbol), context) || this;
        _this.pipe = pipe;
        _this.symbols = {};
        return _this;
    }
    PipeState.prototype.getMetadata = function (id) {
        var s = this.symbols[id];
        if (s instanceof ngast.ProviderSymbol) {
            return getProviderMetadata(s);
        }
        else {
            return getPipeMetadata(s);
        }
    };
    PipeState.prototype.nextState = function (nodeId) {
        if (nodeId === this.symbolId) {
            return null;
        }
        var symbol = this.symbols[nodeId];
        if (symbol instanceof ngast.ProviderSymbol) {
            if (!symbol) {
                return null;
            }
            return new ProviderState(this.context, symbol);
        }
        return null;
    };
    PipeState.prototype.getData = function () {
        var _this = this;
        var symbol = this.pipe.symbol;
        var nodes = [
            {
                id: getId(symbol),
                data: this.pipe,
                label: symbol.name,
                type: {
                    angular: isAngularSymbol(symbol),
                    type: SymbolTypes.Pipe
                }
            }
        ];
        (this.pipe.getDependencies() || []).forEach(function (p) {
            var m = p.getMetadata();
            nodes.push({
                id: getProviderId(m),
                data: p,
                label: getProviderName(m),
                type: {
                    angular: isAngularSymbol(m),
                    type: SymbolTypes.Provider
                }
            });
        });
        nodes.forEach(function (n) { return n.data && (_this.symbols[n.id] = n.data); });
        var resultEdges = [];
        var edges = nodes.slice(1, nodes.length).forEach(function (n) {
            var data = n.data;
            if (data) {
                resultEdges.push({
                    from: getId(symbol),
                    to: getProviderId(data.getMetadata()),
                    direction: Direction.To
                });
            }
            else {
                console.warn('No data for ' + symbol.name);
            }
        });
        return {
            title: this.pipe.symbol.name,
            layout: Layout.Regular,
            graph: { edges: resultEdges, nodes: nodes }
        };
    };
    return PipeState;
}(State));

var __extends$1 = (undefined && undefined.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BootstrapId = '$$bootstrap';
var DeclarationsId = '$$declarations';
var ExportsId = '$$exports';
var ProvidersId = '$$providers';
var ModuleState = /** @class */ (function (_super) {
    __extends$1(ModuleState, _super);
    function ModuleState(context, module) {
        var _this = _super.call(this, getId(module.symbol), context) || this;
        _this.module = module;
        return _this;
    }
    ModuleState.prototype.getMetadata = function (id) {
        var data = this.symbols[id].data;
        if (!data) {
            return null;
        }
        if (data.symbol instanceof ngast.DirectiveSymbol) {
            return getDirectiveMetadata(data.symbol);
        }
        else if (data.symbol instanceof ngast.ProviderSymbol) {
            return getProviderMetadata(data.symbol);
        }
        else if (data.symbol instanceof ngast.PipeSymbol) {
            return getPipeMetadata(data.symbol);
        }
        return null;
    };
    ModuleState.prototype.nextState = function (nodeId) {
        if (nodeId === this.symbolId) {
            return null;
        }
        var data = this.symbols[nodeId].data;
        if (!data) {
            return null;
        }
        if (data.symbol instanceof ngast.DirectiveSymbol) {
            return new DirectiveState(this.context, data.symbol);
        }
        else if (data.symbol instanceof ngast.ProviderSymbol) {
            return new ProviderState(this.context, data.symbol);
        }
        else if (data.symbol instanceof ngast.PipeSymbol) {
            return new PipeState(this.context, data.symbol);
        }
        return null;
    };
    ModuleState.prototype.getData = function () {
        var _this = this;
        var currentModuleId = getId(this.module.symbol);
        var nodes = (_a = {},
            _a[currentModuleId] = {
                id: currentModuleId,
                label: this.module.symbol.name,
                data: {
                    symbol: this.module,
                    metadata: null
                },
                type: {
                    angular: isAngularSymbol(this.module.symbol),
                    type: SymbolTypes.Module
                }
            },
            _a);
        var edges = [];
        var bootstrapComponents = this.module.getBootstrapComponents();
        if (bootstrapComponents.length) {
            bootstrapComponents.forEach(function (s) {
                var node = s.symbol;
                _this._appendSet(BootstrapId, s, nodes, SymbolTypes.ComponentOrDirective, edges);
            });
            nodes[BootstrapId] = {
                id: BootstrapId,
                label: 'Bootstrap',
                data: {
                    symbol: null,
                    metadata: null
                },
                type: {
                    angular: false,
                    type: SymbolTypes.Meta
                }
            };
            edges.push({ from: currentModuleId, to: BootstrapId });
        }
        this.module.getDeclaredPipes().forEach(function (s) {
            var node = s.symbol;
            _this._appendSet(DeclarationsId, s, nodes, SymbolTypes.Pipe, edges);
        });
        var declarations = this.module.getDeclaredDirectives();
        this.module.getDeclaredPipes().forEach(function (d) { return declarations.push(d); });
        if (declarations.length) {
            declarations.forEach(function (s) {
                var node = s.symbol;
                if (node instanceof ngast.PipeSymbol) {
                    _this._appendSet(DeclarationsId, s, nodes, SymbolTypes.Pipe, edges);
                }
                else {
                    _this._appendSet(DeclarationsId, s, nodes, SymbolTypes.ComponentOrDirective, edges);
                }
            });
            nodes[DeclarationsId] = {
                id: DeclarationsId,
                label: 'Declarations',
                data: {
                    symbol: null,
                    metadata: null
                },
                type: {
                    angular: false,
                    type: SymbolTypes.Meta
                }
            };
            edges.push({ from: currentModuleId, to: DeclarationsId });
        }
        var exports = this.module.getExportedDirectives();
        this.module.getExportedPipes().forEach(function (d) { return exports.push(d); });
        if (exports.length) {
            this.module.getExportedDirectives().forEach(function (d) {
                var node = d.symbol;
                _this._appendSet(ExportsId, d, nodes, SymbolTypes.ComponentOrDirective, edges);
            });
            this.module.getExportedPipes().forEach(function (d) {
                var node = d.symbol;
                _this._appendSet(ExportsId, d, nodes, SymbolTypes.Pipe, edges);
            });
            nodes[ExportsId] = {
                id: ExportsId,
                label: 'Exports',
                data: {
                    symbol: null,
                    metadata: null
                },
                type: {
                    angular: false,
                    type: SymbolTypes.Meta
                }
            };
            edges.push({ from: currentModuleId, to: ExportsId });
        }
        var providers = this.module.getProviders().reduce(function (prev, p) {
            var id = getProviderId(p.getMetadata());
            prev[id] = p;
            return prev;
        }, {});
        if (Object.keys(providers).length) {
            edges.push({ from: currentModuleId, to: ProvidersId });
            nodes[ProvidersId] = {
                id: ProvidersId,
                label: 'Providers',
                data: {
                    symbol: null,
                    metadata: null
                },
                type: {
                    angular: false,
                    type: SymbolTypes.Meta
                }
            };
        }
        Object.keys(providers).forEach(function (key) {
            _this._appendSet(ProvidersId, providers[key], nodes, SymbolTypes.Provider, edges);
        });
        this.symbols = nodes;
        return {
            title: this.module.symbol.name,
            graph: {
                nodes: Object.keys(nodes).map(function (key) {
                    var node = Object.assign({}, nodes[key]);
                    node.id = key;
                    return node;
                }),
                edges: edges
            }
        };
        var _a;
    };
    ModuleState.prototype._appendSet = function (parentSet, node, nodes, symbolType, edges) {
        var id = '';
        var name = '';
        if (node instanceof ngast.ProviderSymbol) {
            id = getProviderId(node.getMetadata());
            name = getProviderName(node.getMetadata());
        }
        else {
            id = getId(node.symbol);
            name = node.symbol.name;
        }
        nodes[id] = {
            id: id,
            label: name,
            data: {
                symbol: node,
                metadata: null
            },
            type: {
                angular: node instanceof ngast.Symbol ? isAngularSymbol(node.symbol) : isAngularSymbol(node.getMetadata()),
                type: symbolType
            }
        };
        edges.push({
            from: parentSet,
            to: id
        });
    };
    return ModuleState;
}(State));

var Node = /** @class */ (function () {
    function Node() {
        this.children = {};
    }
    return Node;
}());
var defaultSplit = function (str) { return str.split(''); };
var Trie = /** @class */ (function () {
    function Trie(splitFunction) {
        if (splitFunction === void 0) { splitFunction = defaultSplit; }
        this.splitFunction = splitFunction;
        this._root = new Node();
        this._size = 0;
    }
    Object.defineProperty(Trie.prototype, "size", {
        get: function () {
            return this._size;
        },
        enumerable: true,
        configurable: true
    });
    Trie.prototype.insert = function (key, data) {
        var keyParts = this.splitFunction(key);
        var node = this.findNode(key, true);
        node.data = data;
        this._size += 1;
    };
    Trie.prototype.get = function (key) {
        var node = this.findNode(key);
        if (node.data) {
            return node.data;
        }
        return null;
    };
    Trie.prototype.clear = function () {
        this._root = new Node();
        this._size = 0;
    };
    Trie.prototype.findNode = function (key, createIfDoesNotExist) {
        if (createIfDoesNotExist === void 0) { createIfDoesNotExist = false; }
        var parts = this.splitFunction(key);
        var currentNode = this._root;
        for (var i = 0; i < parts.length; i += 1) {
            var child = currentNode.children[parts[i]];
            if (!child) {
                if (createIfDoesNotExist) {
                    child = new Node();
                    currentNode.children[parts[i]] = child;
                }
                else {
                    return currentNode;
                }
            }
            currentNode = child;
        }
        return currentNode;
    };
    return Trie;
}());

var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ModuleIndex = new Trie(function (str) { return str.split(/\/|#/); });
var ModuleTreeState = /** @class */ (function (_super) {
    __extends(ModuleTreeState, _super);
    // Based on the summary find all lazy loaded modules (look for `ROUTES` and `loadChildren`)
    // Based on the content of the `loadChildren` property and the path for the current module
    // find the symbols corresponding to the lazy-loaded modules and add them to the graph.
    function ModuleTreeState(rootContext, module) {
        var _this = _super.call(this, getId(module.symbol), rootContext) || this;
        _this.rootContext = rootContext;
        _this.module = module;
        _this.symbols = {};
        if (!ModuleIndex.size) {
            rootContext.getModules().forEach(function (m) { return ModuleIndex.insert(getId(m.symbol), m); });
        }
        var graph = _this._getModuleGraph(module);
        graph.nodes.forEach(function (n) {
            if (n.data) {
                _this.symbols[n.id] = n.data;
            }
        });
        _this.data = {
            title: module.symbol.name + "'s imports & exports",
            graph: graph,
            layout: Layout.Regular
        };
        return _this;
    }
    ModuleTreeState.prototype.getMetadata = function (id) {
        var m = this.symbols[id];
        if (m && m.symbol) {
            return getModuleMetadata(m.symbol);
        }
        return null;
    };
    ModuleTreeState.prototype.getData = function () {
        return this.data;
    };
    // Switch to binary search if gets too slow.
    ModuleTreeState.prototype.nextState = function (id) {
        var module = this.symbols[id];
        if (module === this.module) {
            return new ModuleState(this.context, module);
        }
        else {
            return new ModuleTreeState(this.context, module);
        }
    };
    ModuleTreeState.prototype.destroy = function () {
        ModuleIndex.clear();
    };
    ModuleTreeState.prototype._getModuleGraph = function (module) {
        var imports = module.getImportedModules();
        var exports = module.getExportedModules();
        var lazyModules = this._getLazyModules();
        var nodes = [
            {
                id: getId(module.symbol),
                label: module.symbol.name,
                data: module,
                type: {
                    angular: isAngularSymbol(module.symbol),
                    type: SymbolTypes.Module
                }
            }
        ]
            .concat(imports.map(function (m) {
            return {
                id: getId(m.symbol),
                label: m.symbol.name,
                data: m,
                type: {
                    angular: isAngularSymbol(module.symbol),
                    type: SymbolTypes.Module
                }
            };
        }))
            .concat(lazyModules.map(function (m) {
            return {
                id: getId(m.symbol),
                label: m.symbol.name,
                data: m,
                type: {
                    angular: isAngularSymbol(module.symbol),
                    type: SymbolTypes.LazyModule
                }
            };
        }));
        var edges = nodes.slice(1, nodes.length).map(function (n, idx) {
            return {
                from: nodes[0].id,
                to: n.id,
                direction: Direction.To,
                dashes: n.type && n.type.type === SymbolTypes.LazyModule
            };
        });
        return {
            nodes: nodes,
            edges: edges
        };
    };
    ModuleTreeState.prototype._loadChildrenToSymbolId = function (moduleUri) {
        var currentPath = this.module.symbol.filePath;
        var moduleUriParts = moduleUri.split('#');
        if (!/\.js|\.ts/.test(moduleUriParts[0])) {
            moduleUriParts[0] = moduleUriParts[0] + '.ts';
        }
        if (!path.isAbsolute(moduleUriParts[0])) {
            var parentParts = currentPath.split('/');
            parentParts.pop();
            var childParts = moduleUriParts[0].split('/');
            var longestMatch = 0;
            console.log(moduleUriParts[0], currentPath);
            var findLongestPrefix = function (a, b, astart, bstart) {
                var max = Math.min(a.length - astart, b.length - bstart);
                var matchLen = 0;
                for (var i = 0; i < max; i += 1) {
                    if (a[i + astart] === b[i + bstart]) {
                        matchLen += 1;
                    }
                    else {
                        return matchLen;
                    }
                }
                return matchLen;
            };
            for (var i = 0; i < parentParts.length; i += 1) {
                for (var j = 0; j < childParts.length; j += 1) {
                    var currentPrefix = findLongestPrefix(parentParts, childParts, i, j);
                    if (currentPrefix > longestMatch) {
                        longestMatch = currentPrefix;
                    }
                }
            }
            var parentPath = parentParts.slice(0, parentParts.length - longestMatch).join('/');
            moduleUriParts[0] = path.normalize(path.join(parentPath, moduleUriParts[0]))
                .split(path.sep)
                .join('/');
        }
        console.log(moduleUriParts[0]);
        return getId({
            name: moduleUriParts[1],
            filePath: moduleUriParts[0]
        });
    };
    ModuleTreeState.prototype._getLazyModules = function () {
        var _this = this;
        var summary = this.module.getModuleSummary();
        if (!summary) {
            return [];
        }
        else {
            var routes = summary.providers.filter(function (s) {
                return s.provider.token.identifier && s.provider.token.identifier.reference.name === 'ROUTES';
            });
            if (!routes) {
                return [];
            }
            var currentDeclarations = routes.pop();
            if (!currentDeclarations) {
                return [];
            }
            else {
                var declarations = currentDeclarations.provider.useValue;
                if (!declarations) {
                    return [];
                }
                else {
                    var result_1 = [];
                    _collectLoadChildren(declarations)
                        .map(function (loadChildren) { return _this._loadChildrenToSymbolId(loadChildren); })
                        .map(function (id) { return ModuleIndex.get(id); })
                        .forEach(function (d) { return d && result_1.push(d); });
                    return result_1;
                }
            }
        }
    };
    return ModuleTreeState;
}(State));
function _collectLoadChildren(routes) {
    return routes.reduce(function (m, r) {
        if (r.loadChildren && typeof r.loadChildren === 'string') {
            return m.concat(r.loadChildren);
        }
        else if (Array.isArray(r)) {
            return m.concat(_collectLoadChildren(r));
        }
        else if (r.children) {
            return m.concat(_collectLoadChildren(r.children));
        }
        else {
            return m;
        }
    }, []);
}

var SymbolIndexImpl = /** @class */ (function () {
    function SymbolIndexImpl() {
    }
    SymbolIndexImpl.prototype.getIndex = function (context) {
        var _this = this;
        if (this.symbolsIndex && this.symbolsIndex.size) {
            return this.symbolsIndex;
        }
        this.symbolsIndex = new Map();
        context.getPipes().forEach(function (symbol) {
            return _this.symbolsIndex.set(getId(symbol.symbol), {
                symbol: symbol,
                stateFactory: function () {
                    return new PipeState(context, symbol);
                }
            });
        });
        context.getModules().forEach(function (symbol) {
            return _this.symbolsIndex.set(getId(symbol.symbol), {
                symbol: symbol,
                stateFactory: function () {
                    return new ModuleTreeState(context, symbol);
                }
            });
        });
        context.getDirectives().forEach(function (symbol) {
            return _this.symbolsIndex.set(getId(symbol.symbol), {
                symbol: symbol,
                stateFactory: function () {
                    return new DirectiveState(context, symbol);
                }
            });
        });
        context.getProviders().forEach(function (symbol) {
            return _this.symbolsIndex.set(getProviderId(symbol.getMetadata()), {
                symbol: symbol,
                stateFactory: function () {
                    return new ProviderState(context, symbol);
                }
            });
        });
        return this.symbolsIndex;
    };
    SymbolIndexImpl.prototype.clear = function () {
        this.symbolsIndex = new Map();
    };
    return SymbolIndexImpl;
}());
var SymbolIndex = new SymbolIndexImpl();

var Message;
(function (Message) {
    Message["LoadProject"] = "load-project";
    Message["PrevState"] = "prev-state";
    Message["GetMetadata"] = "get-metadata";
    Message["GetData"] = "get-data";
    Message["GetSymbols"] = "get-symbols";
    Message["DirectStateTransition"] = "direct-state-transition";
    Message["SaveImage"] = "save-image";
    Message["ImageData"] = "image-data";
    Message["DisableExport"] = "disable-export";
    Message["EnableExport"] = "enable-export";
})(Message || (Message = {}));
var Status;
(function (Status) {
    Status[Status["Failure"] = 0] = "Failure";
    Status[Status["Success"] = 1] = "Success";
})(Status || (Status = {}));

var Project = /** @class */ (function () {
    function Project() {
    }
    Project.prototype.load = function (tsconfig, reporter) {
        this.projectSymbols = new ngast.ProjectSymbols(tsconfig, {
            get: function (name) {
                return new Promise(function (resolve, reject) {
                    fs.readFile(name, function (e, data) {
                        if (e)
                            reject(e);
                        else
                            resolve(data.toString());
                    });
                });
            },
            getSync: function (name) {
                return fs.readFileSync(name, { encoding: 'utf-8' });
            }
        }, reporter);
        return Promise.resolve(this.projectSymbols);
    };
    return Project;
}());

var ParentProcess = /** @class */ (function () {
    function ParentProcess() {
        var _this = this;
        this.emitter = new events.EventEmitter();
        process.on('message', function (request) {
            console.log('Got message from the parent process with topic:', request.topic);
            _this.emitter.emit(request.topic, request, (function (response) {
                process.send(response);
            }));
        });
    }
    ParentProcess.prototype.on = function (topic, cb) {
        this.emitter.on(topic, function (request, responder) {
            try {
                cb(request, responder);
            }
            catch (e) {
                console.log('Error while responding to a message');
                responder({
                    topic: topic
                });
            }
        });
    };
    return ParentProcess;
}());
var SlaveProcess = /** @class */ (function () {
    function SlaveProcess(process, moduleUrl, initArgs) {
        this.process = process;
        this.moduleUrl = moduleUrl;
        this.initArgs = initArgs;
        this.emitter = new events.EventEmitter();
    }
    SlaveProcess.create = function (moduleUrl) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var slaveProcess = child_process.fork(moduleUrl, args);
        var result = new SlaveProcess(slaveProcess, moduleUrl, args);
        slaveProcess.on('error', function (err) {
            console.error(err);
        });
        return result;
    };
    Object.defineProperty(SlaveProcess.prototype, "connected", {
        get: function () {
            return this.process.connected;
        },
        enumerable: true,
        configurable: true
    });
    SlaveProcess.prototype.onReady = function (cb) {
        this.emitter.on('ready', cb);
    };
    SlaveProcess.prototype.send = function (request) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.process.once('message', function (data) {
                console.log('Got message with topic', data.topic);
                resolve(data);
            });
            _this.process.send(request);
        });
    };
    return SlaveProcess;
}());

var BackgroundApp = /** @class */ (function () {
    function BackgroundApp() {
        this.states = [];
        this.parentProcess = new ParentProcess();
    }
    BackgroundApp.prototype.init = function () {
        var _this = this;
        this.parentProcess.on(Message.LoadProject, function (data, responder) {
            _this.states.forEach(function (s) { return s.destroy(); });
            SymbolIndex.clear();
            _this.states = [];
            console.log("Loading project: \"" + data.tsconfig + "\"");
            _this.project = new Project();
            var parseError = null;
            try {
                _this.project.load(data.tsconfig, function (e) { return (parseError = e); });
                var allModules = _this.project.projectSymbols.getModules();
                if (!parseError) {
                    var module_1 = allModules
                        .filter(function (m) {
                        console.log(m.symbol.name);
                        return m.getBootstrapComponents().length;
                    })
                        .pop();
                    if (module_1) {
                        console.log('Project loaded');
                        _this.states.push(new ModuleTreeState(_this.project.projectSymbols, module_1));
                        responder({
                            topic: Message.LoadProject,
                            err: null
                        });
                    }
                    else {
                        responder({
                            topic: Message.LoadProject,
                            err: 'Cannot find the root module of your project.'
                        });
                        return;
                    }
                }
                else {
                    console.log(parseError);
                    responder({
                        topic: Message.LoadProject,
                        err: parseError.message
                    });
                    return;
                }
            }
            catch (exception) {
                console.log(exception);
                var message = exception.message;
                if (parseError) {
                    if (parseError instanceof Error) {
                        parseError = parseError.message;
                    }
                    message = parseError;
                }
                responder({
                    topic: Message.LoadProject,
                    err: message
                });
            }
        });
        this.parentProcess.on(Message.PrevState, function (data, responder) {
            console.log('Going to previous state');
            if (_this.states.length > 1) {
                _this.states.pop();
                console.log('Successfully moved to previous state');
                responder({
                    topic: Message.PrevState,
                    available: true
                });
            }
            else {
                console.log('Unsuccessfully moved to previous state');
                responder({
                    topic: Message.PrevState,
                    available: false
                });
            }
        });
        this.parentProcess.on(Message.DirectStateTransition, function (data, responder) {
            console.log('Direct state transition', data.id);
            var index = SymbolIndex.getIndex(_this.project.projectSymbols);
            var lastState = _this.states[_this.states.length - 1];
            var nextSymbol = index.get(data.id);
            var nextState;
            if (nextSymbol) {
                nextState = nextSymbol.stateFactory();
                if (lastState instanceof nextState.constructor && lastState.stateSymbolId === nextState.stateSymbolId) {
                    nextState = lastState.nextState(data.id);
                }
            }
            else {
                // Used for templates
                nextState = lastState.nextState(data.id);
            }
            if (nextState) {
                _this.states.push(nextState);
                console.log('Found next state');
                responder({
                    topic: Message.DirectStateTransition,
                    available: true
                });
                return;
            }
            console.log('No next state');
            responder({
                topic: Message.DirectStateTransition,
                available: false
            });
        });
        this.parentProcess.on(Message.GetSymbols, function (data, responder) {
            console.log('Get symbols');
            var res = [];
            try {
                var map = SymbolIndex.getIndex(_this.project.projectSymbols);
                map.forEach(function (data, id) {
                    if (data.symbol instanceof ngast.Symbol) {
                        res.push(Object.assign({}, data.symbol.symbol, { id: id }));
                    }
                    else {
                        var staticSymbol = new _angular_compiler.StaticSymbol('', getProviderName(data.symbol.getMetadata()), []);
                        res.push(Object.assign({}, staticSymbol, { id: id }));
                    }
                });
            }
            catch (e) {
                console.error(e);
            }
            responder({
                topic: Message.GetSymbols,
                symbols: res
            });
        });
        this.parentProcess.on(Message.GetMetadata, function (data, responder) {
            console.log('Getting metadata', data.id);
            if (_this.state) {
                responder({
                    topic: Message.GetMetadata,
                    data: _this.state.getMetadata(data.id)
                });
            }
            else {
                responder({
                    topic: Message.GetMetadata,
                    data: null
                });
            }
        });
        this.parentProcess.on(Message.GetData, function (data, responder) {
            console.log('Getting data');
            if (_this.state) {
                responder({
                    topic: Message.GetData,
                    data: _this.state.getData()
                });
            }
            else {
                responder({
                    topic: Message.GetData,
                    data: null
                });
            }
        });
    };
    Object.defineProperty(BackgroundApp.prototype, "state", {
        get: function () {
            return this.states[this.states.length - 1];
        },
        enumerable: true,
        configurable: true
    });
    return BackgroundApp;
}());
new BackgroundApp().init();

exports.BackgroundApp = BackgroundApp;

}());
//# sourceMappingURL=processor.js.map