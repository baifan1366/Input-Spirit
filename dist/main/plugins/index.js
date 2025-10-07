"use strict";
/**
 * Plugin Index
 * Exports all available plugins
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.articleWriterPlugin = exports.translatorPlugin = exports.grammarCheckerPlugin = exports.promptEnhancerPlugin = exports.aiAssistantPlugin = exports.builtInPlugins = void 0;
exports.getPluginByName = getPluginByName;
exports.getEnabledPlugins = getEnabledPlugins;
const aiAssistant_1 = require("./aiAssistant");
Object.defineProperty(exports, "aiAssistantPlugin", { enumerable: true, get: function () { return aiAssistant_1.aiAssistantPlugin; } });
const promptEnhancer_1 = require("./promptEnhancer");
Object.defineProperty(exports, "promptEnhancerPlugin", { enumerable: true, get: function () { return promptEnhancer_1.promptEnhancerPlugin; } });
const grammarChecker_1 = require("./grammarChecker");
Object.defineProperty(exports, "grammarCheckerPlugin", { enumerable: true, get: function () { return grammarChecker_1.grammarCheckerPlugin; } });
const translator_1 = require("./translator");
Object.defineProperty(exports, "translatorPlugin", { enumerable: true, get: function () { return translator_1.translatorPlugin; } });
const articleWriter_1 = require("./articleWriter");
Object.defineProperty(exports, "articleWriterPlugin", { enumerable: true, get: function () { return articleWriter_1.articleWriterPlugin; } });
/**
 * All available plugins
 */
exports.builtInPlugins = [
    aiAssistant_1.aiAssistantPlugin,
    promptEnhancer_1.promptEnhancerPlugin,
    grammarChecker_1.grammarCheckerPlugin,
    translator_1.translatorPlugin,
    articleWriter_1.articleWriterPlugin,
];
/**
 * Get plugin by name
 */
function getPluginByName(name) {
    return exports.builtInPlugins.find(plugin => plugin.metadata.name === name);
}
/**
 * Get enabled plugins
 */
function getEnabledPlugins() {
    return exports.builtInPlugins.filter(plugin => plugin.metadata.enabled);
}
