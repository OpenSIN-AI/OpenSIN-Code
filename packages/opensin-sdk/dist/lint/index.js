export { LinterAggregator } from "./aggregator.js";
export { AutoFixEngine } from "./autofix.js";
export { RulesManager } from "./rules.js";
export { AutoLintSession } from "./session.js";
import { LinterAggregator } from "./aggregator.js";
import { AutoFixEngine } from "./autofix.js";
import { RulesManager } from "./rules.js";
import { AutoLintSession } from "./session.js";
export function createLinter(config) {
    return new LinterAggregator(config);
}
export function createAutoFixEngine(config, aggregator) {
    return new AutoFixEngine(config, aggregator);
}
export function createRulesManager(rules) {
    return new RulesManager(rules);
}
export function createAutoLintSession(config) {
    return new AutoLintSession(config);
}
//# sourceMappingURL=index.js.map