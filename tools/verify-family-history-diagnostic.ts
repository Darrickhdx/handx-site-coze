import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  diagnosticDemoTraces,
  diagnosticQuestions,
  diagnosticTracks,
  familyHistoryDiagnosticContract,
  resolveDiagnosticTrack,
} from '../src/content/family-history-diagnostic';
import { analyticsFreeRoutes, localAnalyticsIsSuppressed } from '../src/lib/analytics-policy';
import auditGraph from '../public/data/graph/audit-graph.json';

function fail(message: string): never {
  throw new Error(message);
}

const allowedTracks = new Set(Object.keys(diagnosticTracks));
const questionIds = new Set<string>();
const optionIds = new Set<string>();

if (diagnosticQuestions.length !== 5 || familyHistoryDiagnosticContract.questionCount !== 5) {
  fail('family-history diagnostic must contain exactly five questions');
}

for (const question of diagnosticQuestions) {
  if (questionIds.has(question.id)) fail(`duplicate diagnostic question ${question.id}`);
  questionIds.add(question.id);
  if (question.options.length !== 4) fail(`${question.id} must contain exactly four options`);
  for (const option of question.options) {
    if (optionIds.has(option.id)) fail(`duplicate diagnostic option ${option.id}`);
    optionIds.add(option.id);
    for (const [trackId, weight] of Object.entries(option.weights)) {
      if (!allowedTracks.has(trackId) || !Number.isFinite(weight) || Number(weight) < 0) {
        fail(`${question.id}/${option.id} contains an invalid track weight`);
      }
    }
  }
}

const contract = familyHistoryDiagnosticContract;
if (
  contract.executionScope !== 'browser_memory_only'
  || contract.storageScope !== 'none_refresh_clears_answers'
  || contract.acceptsFreeText !== false
  || contract.acceptsFiles !== false
  || contract.sendsNetworkRequests !== false
  || contract.persistsAnswers !== false
  || contract.logsAnswerAnalytics !== false
  || contract.callsExternalModels !== false
  || contract.generatesHistoricalClaims !== false
  || contract.serviceStatus !== 'small_scope_interview_only_not_paid_order'
  || contract.mustNotDeploy !== true
) {
  fail('family-history diagnostic privacy or service contract drifted');
}

const tracks = Object.values(diagnosticTracks);
if (tracks.length !== 5) fail(`expected five diagnostic tracks, found ${tracks.length}`);
for (const track of tracks) {
  if (track.actions.length !== 3 || !track.stopGate || !track.exampleHref.startsWith('/')) {
    fail(`${track.id} has an incomplete result contract`);
  }
}
if (diagnosticTracks.privacy_first.interviewEligible !== false) {
  fail('privacy-first result must never open an interview CTA');
}
if (resolveDiagnosticTrack({ privacy: 'living_people' }).id !== 'privacy_first') {
  fail('living-person risk must override every other diagnostic score');
}
if (
  resolveDiagnosticTrack({
    materials: 'organized_evidence',
    problem: 'how_to_tell',
    scale: 'under_20',
    privacy: 'deceased_public_only',
    working_boundary: 'public_locators',
  }).id !== 'narrative_first'
) {
  fail('reviewed low-risk narrative route no longer resolves deterministically');
}

const claimIds = new Set(auditGraph.claims.map((claim) => claim.claim_id));
const sourceIds = new Set(auditGraph.sources.map((source) => source.source_id));
for (const demo of diagnosticDemoTraces) {
  if (demo.publicationStatus !== 'local_review_only') fail(`${demo.id} opened publication status`);
  if (demo.carrierCount < demo.independentSourceCount || demo.independentSourceCount < 1) {
    fail(`${demo.id} contains invalid carrier/source counts`);
  }
  if (
    new Set(demo.independentSourceKeys).size !== demo.independentSourceCount
    || demo.sourceIds.length !== demo.carrierCount
  ) {
    fail(`${demo.id} source-family semantics drifted`);
  }
  demo.claimIds.forEach((claimId) => {
    if (!claimIds.has(claimId)) fail(`${demo.id} references missing claim ${claimId}`);
  });
  demo.sourceIds.forEach((sourceId) => {
    if (!sourceIds.has(sourceId)) fail(`${demo.id} references missing source ${sourceId}`);
  });
}

const sourceFamilyDemo = diagnosticDemoTraces.find((demo) => demo.id === 'DEMO-SOURCE-FAMILY');
const identityDemo = diagnosticDemoTraces.find((demo) => demo.id === 'DEMO-IDENTITY-BRIDGE');
if (!sourceFamilyDemo || !identityDemo) fail('required diagnostic demo trace is missing');

for (const claimId of ['CL-013', 'CL-014']) {
  const claim = auditGraph.claims.find((item) => item.claim_id === claimId);
  if (
    !claim
    || claim.independence_count !== '1'
    || claim.public_tier !== 'P0'
    || !['SRC-002', 'SRC-013'].every((sourceId) => claim.source_ids.includes(sourceId))
  ) {
    fail(`${claimId} no longer proves the same-work source-family demo`);
  }
}
const identityClaim = auditGraph.claims.find((item) => item.claim_id === 'CL-179');
if (
  !identityClaim
  || identityClaim.status !== 'provisional'
  || identityClaim.public_tier !== 'P1'
  || identityClaim.independence_count !== '2'
  || !['SRC-103', 'SRC-104'].every((sourceId) => identityClaim.source_ids.includes(sourceId))
) {
  fail('CL-179 no longer preserves the candidate identity bridge boundary');
}

if (
  analyticsFreeRoutes.length !== 1
  || !localAnalyticsIsSuppressed('/studio/diagnosis')
  || !localAnalyticsIsSuppressed('/studio/diagnosis/example')
  || localAnalyticsIsSuppressed('/studio')
) {
  fail('diagnostic analytics-free route policy drifted');
}

const publicCopy = JSON.stringify({
  contract,
  questions: diagnosticQuestions,
  tracks,
  demos: diagnosticDemoTraces,
});
if (publicCopy.includes('/' + 'Users' + '/') || /private-runtime|absolute_path|family_private/i.test(publicCopy)) {
  fail('diagnostic content leaks a local path or private field');
}

const componentSource = readFileSync(
  resolve(process.cwd(), 'src/components/family-history-diagnostic.tsx'),
  'utf8',
);
const providerSource = readFileSync(
  resolve(process.cwd(), 'src/components/local-analytics-provider.tsx'),
  'utf8',
);
const suppressionChecks = providerSource.match(/localAnalyticsIsSuppressed\(pathname\)/g)?.length ?? 0;
if (suppressionChecks < 3) {
  fail('analytics provider does not suppress page, click, and reading effects on the diagnostic route');
}
const forbiddenComponentPatterns: Array<[RegExp, string]> = [
  [/fetch\s*\(/, 'network request'],
  [/localStorage/, 'localStorage persistence'],
  [/sessionStorage/, 'sessionStorage persistence'],
  [/new\s+FormData|FormData\s*\(/, 'form payload'],
  [/<input\b/i, 'input field'],
  [/<textarea\b/i, 'textarea field'],
  [/type=["']file["']/i, 'file upload'],
  [/data-amplitude|sendLocalAnalytics|analytics\s*\(/i, 'answer analytics'],
];
for (const [pattern, label] of forbiddenComponentPatterns) {
  if (pattern.test(componentSource)) fail(`diagnostic component contains forbidden ${label}`);
}

console.log(JSON.stringify({
  status: 'PASS',
  schema: contract.schemaVersion,
  questions: diagnosticQuestions.length,
  options: optionIds.size,
  result_tracks: tracks.length,
  demo_traces: diagnosticDemoTraces.length,
  answer_storage: contract.storageScope,
  interview_status: contract.serviceStatus,
}, null, 2));
