/**
 * FairSight Advanced Fairness Metrics Module
 * Based on Hardt et al. (2016) "Equality of Opportunity in Supervised Learning"
 * and Verma & Rubin (2018) "Fairness Definitions Explained"
 */

const POSITIVE_VALUES = new Set([
  "1", "yes", "true", "approved", "granted",
  "low", "good", "pass", "accepted", "hired"
]);

function isPositive(val) {
  if (val === null || val === undefined) return null;
  return POSITIVE_VALUES.has(String(val).trim().toLowerCase());
}

/**
 * Build a confusion matrix for a single group
 * TP = predicted positive AND actually positive
 * FP = predicted positive AND actually negative
 * TN = predicted negative AND actually negative
 * FN = predicted negative AND actually positive
 */
function buildConfusionMatrix(rows, outcomeCol, actualCol) {
  let TP = 0, FP = 0, TN = 0, FN = 0;
  for (const row of rows) {
    const predicted = isPositive(row[outcomeCol]);
    const actual = actualCol ? isPositive(row[actualCol]) : null;
    if (predicted === null) continue;
    if (actual === null) {
      if (predicted) TP++; else TN++;
      continue;
    }
    if (predicted && actual) TP++;
    else if (predicted && !actual) FP++;
    else if (!predicted && actual) FN++;
    else TN++;
  }
  return { TP, FP, TN, FN };
}

/**
 * Compute TPR (True Positive Rate / Recall / Sensitivity)
 * TPR = TP / (TP + FN)
 * Answers: "Of all truly positive cases, what fraction did we correctly identify?"
 */
function computeTPR(cm) {
  const denom = cm.TP + cm.FN;
  return denom > 0 ? cm.TP / denom : null;
}

/**
 * Compute FPR (False Positive Rate / Fall-out)
 * FPR = FP / (FP + TN)
 * Answers: "Of all truly negative cases, what fraction did we incorrectly flag as positive?"
 */
function computeFPR(cm) {
  const denom = cm.FP + cm.TN;
  return denom > 0 ? cm.FP / denom : null;
}

/**
 * Main function: compute group-wise fairness metrics
 * for a single protected attribute column
 */
export function computeGroupMetrics(data, groupCol, outcomeCol, actualCol = null) {
  if (!data || data.length === 0) return { groups: [], warnings: [], equalOpportunityDiff: null, fprParityDiff: null };

  const warnings = [];
  if (!actualCol) {
    warnings.push("Equal opportunity is measured against the decision column itself, not true labels. For more accurate equal opportunity metrics, provide a ground truth column.");
  }

  // Group rows by protected attribute value
  const groupMap = {};
  for (const row of data) {
    const groupVal = row[groupCol];
    if (groupVal === null || groupVal === undefined || String(groupVal).trim() === "") continue;
    const key = String(groupVal).trim();
    if (!groupMap[key]) groupMap[key] = [];
    groupMap[key].push(row);
  }

  // Compute metrics for each group
  const groupResults = [];
  for (const [group, rows] of Object.entries(groupMap)) {
    const positiveCount = rows.filter(r => isPositive(r[outcomeCol])).length;
    const positiveRate = rows.length > 0 ? positiveCount / rows.length : 0;
    const cm = buildConfusionMatrix(rows, outcomeCol, actualCol);
    const tpr = computeTPR(cm);
    const fpr = computeFPR(cm);
    groupResults.push({
      group,
      count: rows.length,
      positiveRate: Math.round(positiveRate * 1000) / 10,
      positiveRateRaw: positiveRate,
      tpr: tpr !== null ? Math.round(tpr * 1000) / 10 : null,
      fpr: fpr !== null ? Math.round(fpr * 1000) / 10 : null,
      tprRaw: tpr,
      fprRaw: fpr,
      confusionMatrix: cm,
      disparity: 0
    });
  }

  if (groupResults.length === 0) return { groups: [], warnings, equalOpportunityDiff: null, fprParityDiff: null };

  // Calculate disparity relative to most favored group
  const maxPositiveRate = Math.max(...groupResults.map(g => g.positiveRateRaw));
  for (const g of groupResults) {
    g.disparity = Math.round((g.positiveRateRaw - maxPositiveRate) * 1000) / 10;
    g.riskLevel = Math.abs(g.disparity) > 30 ? "high" : Math.abs(g.disparity) > 15 ? "medium" : "low";
  }

  // Equal Opportunity Difference = max TPR - min TPR (among groups with valid TPR)
  const validTPRs = groupResults.filter(g => g.tprRaw !== null).map(g => g.tprRaw);
  const equalOpportunityDiff = validTPRs.length >= 2
    ? Math.round((Math.max(...validTPRs) - Math.min(...validTPRs)) * 1000) / 10
    : null;

  // FPR Parity Difference = max FPR - min FPR
  const validFPRs = groupResults.filter(g => g.fprRaw !== null).map(g => g.fprRaw);
  const fprParityDiff = validFPRs.length >= 2
    ? Math.round((Math.max(...validFPRs) - Math.min(...validFPRs)) * 1000) / 10
    : null;

  return {
    groups: groupResults.sort((a, b) => a.disparity - b.disparity),
    warnings,
    equalOpportunityDiff,
    fprParityDiff
  };
}

/**
 * Compute intersectional bias across multiple protected attribute columns
 * Checks every combination of values across groupCols
 */
export function computeIntersectionalMetrics(data, groupCols, outcomeCol, topN = 5) {
  if (!data || data.length === 0 || groupCols.length === 0) return [];

  // Build intersection map
  const intersectionMap = {};
  for (const row of data) {
    const keyParts = [];
    let skip = false;
    for (const col of groupCols) {
      const val = row[col];
      if (val === null || val === undefined || String(val).trim() === "") {
        skip = true; break;
      }
      keyParts.push(String(val).trim());
    }
    if (skip) continue;
    const key = keyParts.join(" + ");
    if (!intersectionMap[key]) intersectionMap[key] = [];
    intersectionMap[key].push(row);
  }

  const intersectionResults = [];
  for (const [intersection, rows] of Object.entries(intersectionMap)) {
    if (rows.length < 5) continue; // Skip very small groups
    const positiveCount = rows.filter(r => isPositive(r[outcomeCol])).length;
    const positiveRate = positiveCount / rows.length;
    intersectionResults.push({
      intersection,
      count: rows.length,
      positiveRate: Math.round(positiveRate * 1000) / 10,
      positiveRateRaw: positiveRate,
      disparity: 0
    });
  }

  if (intersectionResults.length === 0) return [];

  const maxRate = Math.max(...intersectionResults.map(r => r.positiveRateRaw));
  const baseline = intersectionResults.reduce((a, b) =>
    a.positiveRateRaw > b.positiveRateRaw ? a : b
  );

  for (const r of intersectionResults) {
    r.disparity = Math.round((r.positiveRateRaw - maxRate) * 1000) / 10;
    r.baselineGroup = baseline.intersection;
    r.baselineRate = baseline.positiveRate;
  }

  return intersectionResults
    .sort((a, b) => a.disparity - b.disparity)
    .slice(0, topN);
}

/**
 * Compute a composite fairness score incorporating multiple metrics
 * Weights: demographic parity 40%, equal opportunity 35%, FPR parity 25%
 */
export function computeCompositeFairnessScore(groupResults, equalOpportunityDiff, fprParityDiff) {
  const avgDisparity = groupResults.length > 0
    ? groupResults.reduce((sum, g) => sum + Math.abs(g.disparity), 0) / groupResults.length
    : 0;

  const demographicParityScore = Math.max(0, 100 - avgDisparity);

  const equalOpportunityScore = equalOpportunityDiff !== null
    ? Math.max(0, 100 - equalOpportunityDiff)
    : demographicParityScore;

  const fprParityScore = fprParityDiff !== null
    ? Math.max(0, 100 - fprParityDiff)
    : demographicParityScore;

  const composite = Math.round(
    demographicParityScore * 0.40 +
    equalOpportunityScore * 0.35 +
    fprParityScore * 0.25
  );

  return {
    composite,
    breakdown: {
      demographicParity: Math.round(demographicParityScore),
      equalOpportunity: Math.round(equalOpportunityScore),
      fprParity: Math.round(fprParityScore)
    }
  };
}

/**
 * Master function — runs all metrics for all demographic columns
 */
export function runFullFairnessAudit(data, outcomeCol, demographicCols, actualCol = null) {
  const results = {
    byColumn: {},
    intersectional: [],
    compositeScore: null,
    warnings: []
  };

  let allGroupResults = [];

  for (const col of demographicCols) {
    const colResult = computeGroupMetrics(data, col, outcomeCol, actualCol);
    results.byColumn[col] = colResult;
    results.warnings.push(...colResult.warnings);
    allGroupResults = allGroupResults.concat(colResult.groups);
  }

  if (demographicCols.length >= 2) {
    results.intersectional = computeIntersectionalMetrics(
      data, demographicCols, outcomeCol, 5
    );
  }

  const firstCol = results.byColumn[demographicCols[0]];
  const scoreResult = computeCompositeFairnessScore(
    allGroupResults,
    firstCol?.equalOpportunityDiff,
    firstCol?.fprParityDiff
  );
  results.compositeScore = scoreResult;

  return results;
}
