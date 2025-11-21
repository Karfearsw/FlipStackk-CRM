export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: WidgetConfig;
  data?: any;
}

export type WidgetType = 
  | 'stats-card'
  | 'chart-line'
  | 'chart-bar'
  | 'chart-pie'
  | 'table'
  | 'activity-feed'
  | 'deal-pipeline'
  | 'upcoming-calls'
  | 'summary-metrics'
  | 'custom-metric';

export interface WidgetConfig {
  dataSource?: string;
  timeRange?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  metric?: string;
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  filters?: Record<string, any>;
  refreshInterval?: number;
  colorScheme?: string;
  showLegend?: boolean;
  showGrid?: boolean;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetTemplate {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  defaultConfig: WidgetConfig;
  defaultSize: { width: number; height: number };
}

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    type: 'stats-card',
    name: 'Stats Card',
    description: 'Display key metrics with trend indicators',
    icon: 'TrendingUp',
    defaultConfig: {
      metric: 'leads',
      timeRange: 'week'
    },
    defaultSize: { width: 1, height: 1 }
  },
  {
    type: 'chart-line',
    name: 'Line Chart',
    description: 'Trend analysis over time',
    icon: 'LineChart',
    defaultConfig: {
      chartType: 'line',
      timeRange: 'month',
      showLegend: true,
      showGrid: true
    },
    defaultSize: { width: 2, height: 2 }
  },
  {
    type: 'chart-bar',
    name: 'Bar Chart',
    description: 'Compare data across categories',
    icon: 'BarChart3',
    defaultConfig: {
      chartType: 'bar',
      timeRange: 'month',
      showLegend: true
    },
    defaultSize: { width: 2, height: 2 }
  },
  {
    type: 'chart-pie',
    name: 'Pie Chart',
    description: 'Show data distribution',
    icon: 'PieChart',
    defaultConfig: {
      chartType: 'pie',
      timeRange: 'month',
      showLegend: true
    },
    defaultSize: { width: 2, height: 2 }
  },
  {
    type: 'table',
    name: 'Data Table',
    description: 'Display tabular data',
    icon: 'Table',
    defaultConfig: {
      dataSource: 'leads',
      timeRange: 'week'
    },
    defaultSize: { width: 3, height: 2 }
  },
  {
    type: 'activity-feed',
    name: 'Activity Feed',
    description: 'Recent activities and updates',
    icon: 'Activity',
    defaultConfig: {
      timeRange: 'week'
    },
    defaultSize: { width: 2, height: 3 }
  },
  {
    type: 'deal-pipeline',
    name: 'Deal Pipeline',
    description: 'Visualize deal progression',
    icon: 'Pipeline',
    defaultConfig: {
      timeRange: 'month'
    },
    defaultSize: { width: 4, height: 2 }
  },
  {
    type: 'upcoming-calls',
    name: 'Upcoming Calls',
    description: 'Scheduled calls and appointments',
    icon: 'PhoneCall',
    defaultConfig: {
      timeRange: 'week'
    },
    defaultSize: { width: 2, height: 2 }
  },
  {
    type: 'summary-metrics',
    name: 'Summary Metrics',
    description: 'Comprehensive performance overview',
    icon: 'BarChart4',
    defaultConfig: {
      timeRange: 'month'
    },
    defaultSize: { width: 4, height: 2 }
  },
  {
    type: 'custom-metric',
    name: 'Custom Metric',
    description: 'Create your own metric visualization',
    icon: 'Settings',
    defaultConfig: {
      metric: 'custom',
      timeRange: 'week'
    },
    defaultSize: { width: 2, height: 1 }
  }
];