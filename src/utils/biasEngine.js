function binAgeColumn(csvData, col) {
  return csvData.map(row => {
    const val = row[col];
    const num = parseInt(val);
    if (!isNaN(num)) {
      if (num < 20) return { ...row, [col]: "Under 20" };
      if (num < 30) return { ...row, [col]: "20-29" };
      if (num < 40) return { ...row, [col]: "30-39" };
      if (num < 50) return { ...row, [col]: "40-49" };
      if (num < 60) return { ...row, [col]: "50-59" };
      return { ...row, [col]: "60+" };
    }
    return row;
  });
}

export function analyzeBias(csvData, decisionColumn, demographicColumns) {
  const results = { fairnessScore: 0, groupResults: [], intersectionalFlags: [], rawSummary: "" };
  if (!csvData || csvData.length === 0) return results;

  const decisionValues = csvData.map(r => String(r[decisionColumn]).trim().toLowerCase());
  
  const zeroCount = decisionValues.filter(v => v === "0").length;
  const oneCount = decisionValues.filter(v => v === "1").length;
  // If there are more 0s than 1s (like in COMPAS where 0 = no recidivism = good outcome)
  const treatZeroAsPositive = zeroCount > oneCount;

  const positiveValues = treatZeroAsPositive
    ? ["0", "no", "false", "low", "good", "pass"]
    : ["1", "yes", "true", "approved", "granted", "high", "hired"];

  const total = csvData.length;
  const totalApproved = decisionValues.filter(v => positiveValues.includes(v)).length;
  const baseRate = totalApproved / total;

  let allDisparities = [];

  const processedData = csvData;
  const processedColumns = demographicColumns.map(col => {
    const uniqueValues = [...new Set(csvData.map(r => r[col]))];
    if (uniqueValues.length > 10) {
      const firstVal = uniqueValues[0];
      const isNumeric = !isNaN(parseInt(firstVal));
      if (isNumeric) {
        csvData = binAgeColumn(csvData, col);
      } else {
        const valueCounts = {};
        csvData.forEach(r => {
          const v = String(r[col]).trim();
          valueCounts[v] = (valueCounts[v] || 0) + 1;
        });
        const topValues = Object.entries(valueCounts)
          .sort((a,b) => b[1]-a[1])
          .slice(0,8)
          .map(e => e[0]);
        csvData = csvData.map(r => ({
          ...r,
          [col]: topValues.includes(String(r[col]).trim()) 
            ? r[col] 
            : "Other"
        }));
      }
    }
    return col;
  });

  processedColumns.forEach(col => {
    const groups = {};
    csvData.forEach((row, i) => {
      const group = String(row[col]).trim();
      if (!groups[group]) groups[group] = { total: 0, approved: 0 };
      groups[group].total++;
      if (positiveValues.includes(decisionValues[i])) groups[group].approved++;
    });

    const groupStats = Object.entries(groups).map(([name, stats]) => ({
      name, column: col,
      approvalRate: stats.total > 0 ? stats.approved / stats.total : 0,
      count: stats.total
    }));

    const maxRate = Math.max(...groupStats.map(g => g.approvalRate));

    groupStats.forEach(g => {
      const disparity = maxRate > 0 ? ((maxRate - g.approvalRate) / maxRate) * 100 : 0;
      allDisparities.push(disparity);
      results.groupResults.push({
        column: col, group: g.name, approvalRate: Math.round(g.approvalRate * 100),
        disparity: Math.round(disparity), count: g.count,
        riskLevel: disparity > 30 ? "high" : disparity > 15 ? "medium" : "low"
      });
    });
  });

  if (demographicColumns.length >= 2) {
    const col1 = demographicColumns[0];
    const col2 = demographicColumns[1];
    const intersections = {};
    csvData.forEach((row, i) => {
      const key = String(row[col1]).trim() + " + " + String(row[col2]).trim();
      if (!intersections[key]) intersections[key] = { total: 0, approved: 0 };
      intersections[key].total++;
      if (positiveValues.includes(decisionValues[i])) intersections[key].approved++;
    });
    Object.entries(intersections).forEach(([key, stats]) => {
      const rate = stats.total > 0 ? stats.approved / stats.total : 0;
      if (Math.abs(rate - baseRate) / (baseRate || 1) > 0.3) {
        results.intersectionalFlags.push({
          groups: key, approvalRate: Math.round(rate * 100),
          baseRate: Math.round(baseRate * 100),
          disparity: Math.round(Math.abs(rate - baseRate) / (baseRate || 1) * 100)
        });
      }
    });

    results.intersectionalFlags = results.intersectionalFlags
      .sort((a, b) => b.disparity - a.disparity)
      .slice(0, 3);
  }

  const avgDisparity = allDisparities.length > 0
    ? allDisparities.reduce((a, b) => a + b, 0) / allDisparities.length : 0;
  results.fairnessScore = Math.max(0, Math.round(100 - avgDisparity));

  results.metrics = {
    demographicParity: (() => {
      const rates = results.groupResults.map(g => g.approvalRate);
      return Math.round(Math.max(...rates) - Math.min(...rates));
    })(),
    statisticalParityRatio: (() => {
      const rates = results.groupResults.map(g => g.approvalRate);
      const min = Math.min(...rates);
      const max = Math.max(...rates);
      return max > 0 ? Math.round((min / max) * 100) / 100 : 1;
    })(),
    affectedGroups: results.groupResults.filter(g => g.riskLevel !== "low").length,
    totalGroups: results.groupResults.length,
    fourFifthsRule: (() => {
      const rates = results.groupResults.map(g => g.approvalRate);
      const max = Math.max(...rates);
      const violations = results.groupResults.filter(g =>
        max > 0 && (g.approvalRate / max) < 0.8
      );
      return {
        passes: violations.length === 0,
        violations: violations.map(g => g.group)
      };
    })()
  };

  const highRisk = results.groupResults.filter(g => g.riskLevel === "high");
  results.rawSummary = highRisk.length > 0
    ? "High bias detected. Groups affected: " + highRisk.map(g => g.group + " (" + g.column + ")").join(", ") + ". Average disparity: " + Math.round(avgDisparity) + "%."
    : "Low bias detected. Average disparity across all groups is " + Math.round(avgDisparity) + "%.";

  results.groupResults = results.groupResults
    .sort((a, b) => b.disparity - a.disparity)
    .slice(0, 12);

  return results;
}