/*
 * Moleawiz K6 Reporter - Custom HTML Report Generator
 * Version: 3.1.0 (Stable with Explanations & Print Function)
 */

// Helper to safely get a metric's value
function getMetricValue(metrics, metricName, valueKey = 'p(95)') {
  if (!metrics || !metrics[metricName] || !metrics[metricName].values) {
    return 0;
  }
  return metrics[metricName].values[valueKey] || 0;
}

// Helper to format duration
function formatDuration(ms) {
  if (ms === undefined || ms === null) return '-';
  if (ms === 0) return '0ms';
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

// Helper to calculate check pass rate safely
function getChecks(rootGroup) {
    let checks = {};
    let total = 0;
    let passes = 0;

    function traverse(group) {
        if (group.checks) {
            group.checks.forEach(c => {
                total++;
                if (c.passes) passes++;
                checks[c.name] = {
                    passes: c.passes,
                    fails: c.fails,
                    passRate: (c.passes / (c.passes + c.fails)) * 100
                };
            });
        }
        if (group.groups) {
            group.groups.forEach(traverse);
        }
    }

    if (rootGroup) {
        traverse(rootGroup);
    }

    return {
        checks,
        total,
        passes,
        passRate: total > 0 ? (passes / total) * 100 : 100
    };
}

// Main function to generate the HTML report
export function customHtmlReport(data) {
  try {
      const title = data.options && data.options.summaryTrendStats ? data.options.summaryTrendStats.join(', ') : 'K6 Performance Test Report';
      const timestamp = new Date().toLocaleString();

      const metrics = data.metrics || {};

      const reqDuration = getMetricValue(metrics, 'http_req_duration', 'p(95)');
      const reqsPerSecond = getMetricValue(metrics, 'http_reqs', 'rate');
      const failedReqRate = getMetricValue(metrics, 'http_req_failed', 'rate') * 100;
      const checkInfo = getChecks(data.root_group);
      const vusMax = getMetricValue(metrics, 'vus', 'max');

      const overallStatus = failedReqRate === 0 && checkInfo.passRate === 100 ? 'PASSED' : 'FAILED';
      const statusColor = overallStatus === 'PASSED' ? 'var(--pass-color)' : 'var(--fail-color)';

      return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            :root {
                --primary-color: #F97316;
                --primary-light: #FFF7ED;
                --text-color: #374151;
                --text-light: #6B7280;
                --border-color: #E5E7EB;
                --pass-color: #10B981;
                --fail-color: #EF4444;
                --bg-color: #F9FAFB;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: var(--bg-color);
                color: var(--text-color);
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 1200px;
                margin: auto;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            header {
                background-color: var(--primary-light);
                border-bottom: 1px solid var(--border-color);
                padding: 20px 30px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            header h1 {
                margin: 0;
                font-size: 24px;
                color: var(--primary-color);
            }
            .print-button {
                background-color: var(--primary-color);
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            }
            .print-button:hover {
                opacity: 0.9;
            }
            main {
                padding: 30px;
            }
            .kpi-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .kpi-card {
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 20px;
                text-align: center;
            }
            .kpi-card .value {
                font-size: 36px;
                font-weight: bold;
                color: var(--primary-color);
            }
            .kpi-card .label {
                font-size: 14px;
                color: var(--text-light);
                margin-top: 5px;
            }
            .section-title {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 5px;
                border-bottom: 2px solid var(--primary-color);
                padding-bottom: 5px;
                display: inline-block;
            }
            .section-description {
                font-size: 14px;
                color: var(--text-light);
                margin-top: 0;
                margin-bottom: 15px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            th, td {
                padding: 12px 15px;
                text-align: left;
                border-bottom: 1px solid var(--border-color);
            }
            th {
                background-color: #F3F4F6;
                font-weight: bold;
            }
            .progress-bar-container {
                width: 100%;
                background-color: var(--border-color);
                border-radius: 4px;
                height: 20px;
                overflow: hidden;
            }
            .progress-bar {
                height: 100%;
                color: white;
                text-align: center;
                line-height: 20px;
                font-size: 12px;
                font-weight: bold;
            }
            .pass { background-color: var(--pass-color); }

            @media print {
                body { padding: 0; }
                .container { box-shadow: none; border: none; }
                .print-button { display: none; }
                header { background-color: #fff !important; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <div>
                    <h1>Performance Test Report</h1>
                    <p style="margin: 5px 0 0; color: var(--text-light);">${title}</p>
                </div>
                <div>
                    <button onclick="window.print()" class="print-button">Print to PDF</button>
                </div>
            </header>
            <main>
                <div>
                    <h2 class="section-title">Key Performance Indicators (KPIs)</h2>
                    <p class="section-description">Poin-poin data terpenting yang merangkum hasil keseluruhan test.</p>
                    <div class="kpi-grid">
                        <div class="kpi-card">
                            <div class="value">${formatDuration(reqDuration)}</div>
                            <div class="label">P(95) Response Time</div>
                        </div>
                        <div class="kpi-card">
                            <div class="value">${reqsPerSecond.toFixed(2)}/s</div>
                            <div class="label">Requests Per Second</div>
                        </div>
                        <div class="kpi-card">
                            <div class="value">${failedReqRate.toFixed(2)}%</div>
                            <div class="label">Request Failure Rate</div>
                        </div>
                        <div class="kpi-card">
                            <div class="value">${vusMax}</div>
                            <div class="label">Max Virtual Users</div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 class="section-title">Detailed Metrics</h2>
                    <p class="section-description">Rincian waktu respon server. P(90) dan P(95) adalah indikator terbaik untuk pengalaman mayoritas user.</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Avg</th>
                                <th>Min</th>
                                <th>Max</th>
                                <th>P(90)</th>
                                <th>P(95)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Request Duration</td>
                                <td>${formatDuration(getMetricValue(metrics, 'http_req_duration', 'avg'))}</td>
                                <td>${formatDuration(getMetricValue(metrics, 'http_req_duration', 'min'))}</td>
                                <td>${formatDuration(getMetricValue(metrics, 'http_req_duration', 'max'))}</td>
                                <td>${formatDuration(getMetricValue(metrics, 'http_req_duration', 'p(90)'))}</td>
                                <td>${formatDuration(getMetricValue(metrics, 'http_req_duration', 'p(95)'))}</td>
                            </tr>
                            <tr>
                                <td>Waiting (TTFB)</td>
                                <td>${formatDuration(getMetricValue(metrics, 'http_req_waiting', 'avg'))}</td>
                                <td>${formatDuration(getMetricValue(metrics, 'http_req_waiting', 'min'))}</td>
                                <td>${formatDuration(getMetricValue(metrics, 'http_req_waiting', 'max'))}</td>
                                <td>${formatDuration(getMetricValue(metrics, 'http_req_waiting', 'p(90)'))}</td>
                                <td>${formatDuration(getMetricValue(metrics, 'http_req_waiting', 'p(95)'))}</td>
                            </tr>
                             <tr>
                                <td>Iteration Duration</td>
                                <td>${formatDuration(getMetricValue(metrics, 'iteration_duration', 'avg'))}</td>
                                <td>${formatDuration(getMetricValue(metrics, 'iteration_duration', 'min'))}</td>
                                <td>${formatDuration(getMetricValue(metrics, 'iteration_duration', 'max'))}</td>
                                <td>${formatDuration(getMetricValue(metrics, 'iteration_duration', 'p(90)'))}</td>
                                <td>${formatDuration(getMetricValue(metrics, 'iteration_duration', 'p(95)'))}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div>
                    <h2 class="section-title">Checks Summary</h2>
                    <p class="section-description">Hasil validasi custom yang Anda definisikan di script (misal: 'status is 200').</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Check Name</th>
                                <th style="width: 200px;">Pass Rate</th>
                                <th style="width: 100px;">Passes</th>
                                <th style="width: 100px;">Fails</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(checkInfo.checks).map(([name, check]) => `
                                <tr>
                                    <td>${name}</td>
                                    <td>
                                        <div class="progress-bar-container">
                                            <div class="progress-bar pass" style="width: ${check.passRate.toFixed(2)}%;">${check.passRate.toFixed(2)}%</div>
                                        </div>
                                    </td>
                                    <td>${check.passes}</td>
                                    <td>${check.fails}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    </body>
    </html>
      `;
  } catch (e) {
      console.error("Error generating HTML report:", e);
      return `<h1>Error Generating Report</h1><p>${e.message}</p>`;
  }
}