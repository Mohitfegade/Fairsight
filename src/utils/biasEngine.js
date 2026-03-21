
export function analyzeBias(csvData, decisionColumn, demographicColumns) {
  const results = { fairnessScore: 0, groupResults: [], intersectionalFlags: [], rawSummary: "" };
  if (!csvData || csvData.length === 0) return results;

  const decisionValues = csvData.map(r => String(r[decisionColumn]).trim().toLowerCase());
  const positiveValues = ["1", "yes", "true", "approved", "granted", "low", "good"];
  const total = csvData.length;
  const totalApproved = decisionValues.filter(v => positiveValues.includes(v)).length;
  const baseRate = totalApproved / total;

  let allDisparities = [];

  demographicColumns.forEach(col => {
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
  }

  const avgDisparity = allDisparities.length > 0
    ? allDisparities.reduce((a, b) => a + b, 0) / allDisparities.length : 0;
  results.fairnessScore = Math.max(0, Math.round(100 - avgDisparity));

  const highRisk = results.groupResults.filter(g => g.riskLevel === "high");
  results.rawSummary = highRisk.length > 0
    ? "High bias detected. Groups affected: " + highRisk.map(g => g.group + " (" + g.column + ")").join(", ") + ". Average disparity: " + Math.round(avgDisparity) + "%."
    : "Low bias detected. Average disparity across all groups is " + Math.round(avgDisparity) + "%.";

  return results;
}