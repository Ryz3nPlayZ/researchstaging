import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Download, Table, BarChart3, FileText, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Plot from 'react-plotly.js';
import { parse } from 'papaparse';

export const AnalysisResults = ({ result, onClose }) => {
  const [activeTab, setActiveTab] = useState('table');
  const [chartType, setChartType] = useState('auto');

  if (!result) {
    return null;
  }

  // Parse output intelligently
  const parsedData = useMemo(() => {
    const output = result.output || '';
    const trimmed = output.trim();

    // Try to detect CSV format
    if (trimmed.includes(',') || trimmed.includes('\t')) {
      try {
        const parsed = parse(trimmed, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });
        if (parsed.data && parsed.data.length > 0) {
          return {
            type: 'csv',
            data: parsed.data,
            headers: parsed.meta.fields || [],
          };
        }
      } catch (e) {
        // Not CSV, continue
      }
    }

    // Try to detect JSON format
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const jsonData = JSON.parse(trimmed);
        return {
          type: 'json',
          data: jsonData,
        };
      } catch (e) {
        // Not JSON, continue
      }
    }

    // Detect chart hints from code/output
    const lowerOutput = trimmed.toLowerCase();
    if (lowerOutput.includes('plt.plot(') || lowerOutput.includes('plot(') || lowerOutput.includes('ggplot(')) {
      return {
        type: 'chart-hint',
        chartType: 'line',
        data: trimmed,
      };
    }
    if (lowerOutput.includes('plt.bar(') || lowerOutput.includes('barplot(')) {
      return {
        type: 'chart-hint',
        chartType: 'bar',
        data: trimmed,
      };
    }
    if (lowerOutput.includes('plt.scatter(') || lowerOutput.includes('plot.*type.*p'))) {
      return {
        type: 'chart-hint',
        chartType: 'scatter',
        data: trimmed,
      };
    }
    if (lowerOutput.includes('plt.hist(') || lowerOutput.includes('hist(')) {
      return {
        type: 'chart-hint',
        chartType: 'histogram',
        data: trimmed,
      };
    }

    // Default to text
    return {
      type: 'text',
      data: trimmed,
    };
  }, [result.output]);

  // Determine available views
  const availableViews = useMemo(() => {
    const views = ['text'];

    if (parsedData.type === 'csv' && parsedData.data.length > 0) {
      views.push('table', 'chart');
    } else if (parsedData.type === 'chart-hint') {
      views.push('chart');
    }

    return views;
  }, [parsedData]);

  // Generate chart data from CSV
  const chartData = useMemo(() => {
    if (parsedData.type !== 'csv' || !parsedData.data.length) {
      return null;
    }

    const headers = parsedData.headers;
    const data = parsedData.data;
    const detectedType = chartType === 'auto' ? parsedData.chartType || 'scatter' : chartType;

    // Try to find numeric columns
    const numericColumns = headers.filter(h =>
      data.some(row => typeof row[h] === 'number')
    );

    if (numericColumns.length < 1) {
      return null;
    }

    // Generate traces based on chart type
    const traces = [];

    if (detectedType === 'line' || detectedType === 'scatter') {
      // First numeric column as Y, first column as X
      const xCol = headers[0];
      const yCols = numericColumns.slice(0, 5); // Limit to 5 series

      yCols.forEach((yCol, idx) => {
        traces.push({
          x: data.map(row => row[xCol]),
          y: data.map(row => row[yCol]),
          mode: detectedType === 'line' ? 'lines+markers' : 'markers',
          name: yCol,
          type: 'scatter',
        });
      });
    } else if (detectedType === 'bar') {
      // Bar chart
      const labelCol = headers[0];
      const valueCol = numericColumns[0];

      traces.push({
        x: data.map(row => row[labelCol]),
        y: data.map(row => row[valueCol]),
        type: 'bar',
        name: valueCol,
      });
    } else if (detectedType === 'histogram') {
      // Histogram
      const valueCol = numericColumns[0];

      traces.push({
        x: data.map(row => row[valueCol]),
        type: 'histogram',
        name: valueCol,
      });
    }

    return traces;
  }, [parsedData, chartType]);

  // Handle downloads
  const handleDownload = (format) => {
    try {
      let content, filename, mimeType;

      if (format === 'csv' && parsedData.type === 'csv') {
        // Convert back to CSV
        content = [parsedData.headers.join(','), ...parsedData.data.map(row =>
          parsedData.headers.map(h => row[h] ?? '').join(',')
        )].join('\n');
        filename = `analysis-results-${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else if (format === 'png') {
        // For PNG, we use Plotly's export
        const plotDiv = document.getElementById('plotly-chart');
        if (plotDiv && window.Plotly) {
          window.Plotly.toImage(plotDiv, { format: 'png', width: 800, height: 600 })
            .then(url => {
              const link = document.createElement('a');
              link.href = url;
              link.download = `analysis-chart-${Date.now()}.png`;
              link.click();
            });
          return;
        } else {
          toast.error('Chart export not available');
          return;
        }
      } else {
        // Default: text download
        content = result.output || '';
        filename = `analysis-output-${Date.now()}.txt`;
        mimeType = 'text/plain';
      }

      // Create download link
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed: ' + error.message);
    }
  };

  // Format execution time
  const formatTime = (seconds) => {
    if (seconds < 1) {
      return `${Math.round(seconds * 1000)}ms`;
    }
    return `${seconds.toFixed(2)}s`;
  };

  // Set default tab based on available views
  React.useEffect(() => {
    if (availableViews.includes('table') && activeTab === 'text') {
      setActiveTab('table');
    }
  }, [availableViews, activeTab]);

  return (
    <Card className="fixed inset-4 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          {result.success ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <div>
            <h3 className="font-semibold">Analysis Results</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatTime(result.execution_time)}</span>
              {result.finding_id && (
                <>
                  <span>•</span>
                  <Badge variant="secondary" className="text-xs">
                    Saved to Memory
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {availableViews.includes('table') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('csv')}
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          )}
          {availableViews.includes('chart') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('png')}
            >
              <Download className="h-4 w-4 mr-1" />
              PNG
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload('txt')}
          >
            <Download className="h-4 w-4 mr-1" />
            Raw
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            {availableViews.includes('table') && (
              <TabsTrigger value="table">
                <Table className="h-4 w-4 mr-1" />
                Table
              </TabsTrigger>
            )}
            {availableViews.includes('chart') && (
              <TabsTrigger value="chart">
                <BarChart3 className="h-4 w-4 mr-1" />
                Chart
              </TabsTrigger>
            )}
            <TabsTrigger value="text">
              <FileText className="h-4 w-4 mr-1" />
              Output
            </TabsTrigger>
          </TabsList>

          {/* Table View */}
          {availableViews.includes('table') && (
            <TabsContent value="table" className="mt-0">
              <div className="rounded-md border">
                <ScrollArea className="h-[500px]">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        {parsedData.headers.map((header, idx) => (
                          <th
                            key={idx}
                            className="px-4 py-2 text-left font-medium whitespace-nowrap"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.data.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className={rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/50'}
                        >
                          {parsedData.headers.map((header, colIdx) => (
                            <td
                              key={colIdx}
                              className="px-4 py-2 whitespace-nowrap"
                            >
                              {row[header] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>

              {parsedData.data.length > 10 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Showing {parsedData.data.length} rows
                </p>
              )}
            </TabsContent>
          )}

          {/* Chart View */}
          {availableViews.includes('chart') && (
            <TabsContent value="chart" className="mt-0">
              {chartType !== 'auto' && (
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Chart Type:</label>
                  <div className="flex gap-2">
                    {['auto', 'line', 'bar', 'scatter', 'histogram'].map(type => (
                      <Button
                        key={type}
                        variant={chartType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartType(type)}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {chartData ? (
                <div id="plotly-chart" className="w-full h-[500px]">
                  <Plot
                    data={chartData}
                    layout={{
                      responsive: true,
                      autosize: true,
                      margin: { l: 50, r: 50, t: 50, b: 50 },
                    }}
                    config={{
                      responsive: true,
                      displayModeBar: true,
                      displaylogo: false,
                    }}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No numeric data available for charting</p>
                  <p className="text-xs mt-2">Try selecting a different view</p>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Text View */}
          <TabsContent value="text" className="mt-0">
            <Card className="p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono overflow-x-auto">
                {result.output || '(no output)'}
              </pre>
            </Card>

            {result.error && (
              <Card className="p-4 mt-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                  Errors
                </p>
                <pre className="text-sm whitespace-pre-wrap font-mono text-red-700 dark:text-red-300">
                  {result.error}
                </pre>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </Card>
  );
};

export default AnalysisResults;
