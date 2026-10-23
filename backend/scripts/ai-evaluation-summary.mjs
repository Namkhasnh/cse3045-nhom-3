// DEC-09 measures displayed-result safety and counts ALL attempts for latency/fit.
export function summarizeEvaluation(records) {
  const clear = records.filter(r => r.clear_preference);
  const within = records.filter(r => r.status === 'ok' && r.latency_ms <= 5000).length;
  const preferenceHits = clear.filter(r => r.preference_hit).length;
  const safe = records.every(r => r.status === 'failed' || (r.status === 'ok' && r.valid === true));
  const uniqueCases = new Set(records.map(r => r.case));
  const complete = records.length === 100 && uniqueCases.size === 100 &&
    records.every(r => Number.isInteger(r.case) && r.case >= 1 && r.case <= 100);
  const latencies = records.map(r => r.latency_ms).sort((a, b) => a - b);
  return {
    completed: records.length, total: 100,
    valid: records.filter(r => r.status === 'ok' && r.valid).length,
    displayed_constraints_passed: safe,
    preference_hit: preferenceHits, clear_preference: clear.length,
    baseline_preference_hit: clear.filter(r => r.baseline_hit).length,
    within_5s: within, failed: records.filter(r => r.status !== 'ok').length,
    median_latency_ms: latencies.length ? latencies[Math.ceil(latencies.length / 2) - 1] : null,
    p95_latency_ms: latencies.length ? latencies[Math.ceil(latencies.length * .95) - 1] : null,
    max_latency_ms: latencies.at(-1) ?? null,
    latency_scope: 'provider_generate_including_output_validation',
    known_input_tokens: records.reduce((n, r) => n + (r.input_tokens ?? 0), 0),
    known_output_tokens: records.reduce((n, r) => n + (r.output_tokens ?? 0), 0),
    unknown_usage_requests: records.filter(r => r.input_tokens == null || r.output_tokens == null).length,
    estimated_paid_spend_usd: 0, measured_billed_spend_usd: null,
    provider_billing_basis: 'operator-verified dedicated free-tier project',
    accepted: complete && safe && clear.length > 0 && preferenceHits / clear.length >= .9 && within / records.length >= .95,
  };
}
