"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const yaml = __importStar(require("yaml"));
const fs = __importStar(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const github_1 = require("@actions/github");
const catalog_model_1 = require("@backstage/catalog-model");
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const markdown_it_1 = __importDefault(require("markdown-it"));
const md = (0, markdown_it_1.default)({
    html: true,
    linkify: true,
    typographer: true,
});
const isScorecardResponse = (it) => !('checkResults' in it.data);
const isCheckResponse = (it) => 'checkResults' in it.data;
const API_URL = 'https://api.roadie.so/api/tech-insights/v1';
const ACTION_TYPE = 'run-on-demand';
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const repoToken = core.getInput('repo-token', { required: true });
    const checkId = core.getInput('check-id');
    const scorecardId = core.getInput('scorecard-id');
    const catalogInfoPath = (_a = core.getInput('catalog-info-path')) !== null && _a !== void 0 ? _a : './catalog-info.yaml';
    const apiToken = core.getInput('api-token');
    function getEntitySelector(x, base) {
        const parsed = Number.parseInt(x, base);
        if (Number.isNaN(parsed)) {
            return 0;
        }
        return parsed;
    }
    const entitySelector = getEntitySelector(core.getInput('entity-selector'), 10);
    if (!checkId && !scorecardId) {
        core.setFailed(`No 'check-id' or 'scorecard-id' configured.`);
        core.error(`No checkId or scorecardId configured. Cannot continue.`);
        return;
    }
    if (checkId && scorecardId) {
        core.setFailed(`Only one of 'check-id' or 'scorecard-id' can be input.`);
        core.error(`Both checkId and scorecardId configured. Cannot continue.`);
        return;
    }
    if (!apiToken || apiToken === '') {
        core.setFailed(`No api-token input value found.`);
        core.error(`No api-token input value found. Cannot continue.`);
        return;
    }
    const triggerOnDemandRun = (entities) => __awaiter(void 0, void 0, void 0, function* () {
        var _b, _c;
        const entityRef = entities.map(it => (0, catalog_model_1.stringifyEntityRef)(it))[entitySelector];
        const branchRef = (_c = (_b = github_1.context.payload.pull_request) === null || _b === void 0 ? void 0 : _b.head) === null || _c === void 0 ? void 0 : _c.ref;
        const urlPostfix = !(0, isEmpty_1.default)(checkId)
            ? `checks/${checkId}/action`
            : `scorecards/${scorecardId}/action`;
        const url = `${API_URL}/${urlPostfix}`;
        core.info(`Running Tech Insights with parameters:  \nBranch:${branchRef}  \nEntityRef: ${entityRef}  \nCheck Id: ${checkId}  \nScorecard Id: ${scorecardId}.\n\n Calling URL: ${url}`);
        const triggerResponse = yield (0, node_fetch_1.default)(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiToken}`,
                'content-type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                type: ACTION_TYPE,
                payload: {
                    entityRef,
                    branchRef,
                },
            }),
        });
        return (yield triggerResponse.json());
    });
    try {
        const content = fs.readFileSync(catalogInfoPath, 'utf8');
        const roadieManifest = yaml.parseAllDocuments(content);
        if (roadieManifest == null || roadieManifest.length < 1) {
            core.setFailed(`No catalog-info file matching the path ${catalogInfoPath} found`);
            core.error(`No catalog-info file matching the path ${catalogInfoPath} found`);
            return;
        }
        const parsedManifest = roadieManifest.map(yamlDoc => yamlDoc.toJS());
        const onDemandResult = yield triggerOnDemandRun(parsedManifest);
        if (!onDemandResult.data) {
            core.info(`No data received when running on-demand action. Maybe the check or scorecard id doesn't exist or this entity is not part of the applicable entities?`);
            return;
        }
        if (onDemandResult && isScorecardResponse(onDemandResult)) {
            core.debug(JSON.stringify(onDemandResult));
            const checkResults = Object.values(onDemandResult.data.results).flatMap(result => result.checkResults.checkResults.map(checkResult => ({
                result: checkResult.result
                    ? ':white_check_mark:'
                    : ':no_entry_sign:',
                name: checkResult.check.name,
                description: checkResult.check.description,
            })));
            core.debug(JSON.stringify(checkResults));
            const scorecard = onDemandResult.data.scorecard;
            const successfulChecks = checkResults.filter(it => it.result === ':white_check_mark:');
            const scorecardResult = `${successfulChecks.length} / ${checkResults.length}`;
            try {
                yield comment({
                    id: scorecardId,
                    repoToken,
                    content: `
## Scorecard Results
**Scorecard**: ${scorecard.title}\n
**Description**: ${scorecard.description}\n\n

#### Result \n
${successfulChecks.length === checkResults.length
                        ? ':white_check_mark:'
                        : ':no_entry_sign:'}\n
${scorecardResult} checks succeeded.           
          
#### Check Results       
| Check         | Description | Result |
|--------------|-----|:-----------:|
${checkResults
                        .map(it => `| ${it.name} |  ${it.description} | ${it.result} |`)
                        .join('\n')}
          `,
                });
            }
            catch (e) {
                core.error(e.message);
            }
        }
        if (onDemandResult && isCheckResponse(onDemandResult)) {
            core.debug(JSON.stringify(onDemandResult));
            const results = onDemandResult.data;
            if (!results) {
                core.info('Received an empty result for check');
                return;
            }
            const checkResults = results.checkResults.checkResults.map(checkResult => ({
                result: checkResult.result ? ':white_check_mark:' : ':no_entry_sign:',
                name: checkResult.check.name,
                description: checkResult.check.description,
            }));
            const checkResult = checkResults.length > 0
                ? checkResults[0]
                : { name: 'unknown', result: 'unknown', description: '' };
            yield comment({
                repoToken,
                id: checkId,
                content: md.render(`
## Check Result
**Check**: ${checkResult.name}\n
**Description**: ${checkResult.description}\n\n

#### Result \n
${checkResult.result}     
          `),
            });
        }
        return;
    }
    catch (error) {
        core.setFailed(error.message);
    }
});
function comment({ id, repoToken, content, }) {
    var _a, e_1, _b, _c;
    var _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const issue_number = ((_d = github_1.context.payload.pull_request) === null || _d === void 0 ? void 0 : _d.number) || ((_e = github_1.context.payload.issue) === null || _e === void 0 ? void 0 : _e.number);
            const octokit = (0, github_1.getOctokit)(repoToken);
            if (!issue_number) {
                core.setFailed('No issue/pull request in input neither in current context.');
                return;
            }
            const comment_tag_pattern = `<!-- roadie-tech-insights-action-comment-${id} -->`;
            const body = comment_tag_pattern
                ? `${content}\n${comment_tag_pattern}`
                : content;
            if (comment_tag_pattern) {
                let comment;
                try {
                    for (var _f = true, _g = __asyncValues(octokit.paginate.iterator(octokit.rest.issues.listComments, Object.assign(Object.assign({}, github_1.context.repo), { issue_number }))), _h; _h = yield _g.next(), _a = _h.done, !_a; _f = true) {
                        _c = _h.value;
                        _f = false;
                        const { data: comments } = _c;
                        comment = comments.find(comment => { var _a; return (_a = comment === null || comment === void 0 ? void 0 : comment.body) === null || _a === void 0 ? void 0 : _a.includes(comment_tag_pattern); });
                        if (comment)
                            break;
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_f && !_a && (_b = _g.return)) yield _b.call(_g);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                if (comment) {
                    yield octokit.rest.issues.updateComment(Object.assign(Object.assign({}, github_1.context.repo), { comment_id: comment.id, body }));
                    return;
                }
                else {
                    core.info('No comment has been found with asked pattern. Creating a new comment.');
                }
            }
            yield octokit.rest.issues.createComment(Object.assign(Object.assign({}, github_1.context.repo), { issue_number,
                body }));
        }
        catch (error) {
            if (error instanceof Error) {
                core.setFailed(error.message);
            }
        }
    });
}
run();
//# sourceMappingURL=index.js.map