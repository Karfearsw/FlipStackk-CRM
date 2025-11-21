import { performance } from 'perf_hooks';
import { MarketingAutomationEngine } from '@/lib/marketing-automation/engine';
import { MarketingWorkflow } from '@/lib/marketing-automation/types';

interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  throughput: number;
}

class MarketingAutomationBenchmark {
  private engine: MarketingAutomationEngine;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.engine = new MarketingAutomationEngine();
  }

  async runBenchmarks(): Promise<void> {
    console.log('🚀 Starting Marketing Automation Benchmarks...\n');

    // Workflow registration benchmark
    await this.benchmarkWorkflowRegistration();

    // Workflow execution benchmark
    await this.benchmarkWorkflowExecution();

    // Lead behavior tracking benchmark
    await this.benchmarkLeadBehaviorTracking();

    // Personalization benchmark
    await this.benchmarkPersonalization();

    // Form submission benchmark
    await this.benchmarkFormSubmission();

    // Print summary
    this.printSummary();
  }

  private async benchmarkWorkflowRegistration(): Promise<void> {
    console.log('📋 Benchmarking Workflow Registration...');
    
    const iterations = 1000;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      const workflow: MarketingWorkflow = {
        id: `workflow_${i}`,
        name: `Test Workflow ${i}`,
        description: 'Benchmark workflow',
        trigger: { type: 'form_submission' },
        conditions: [],
        actions: [
          {
            id: `action_${i}`,
            type: 'send_email',
            config: {
              subject: 'Test Email',
              body: 'This is a test email'
            }
          }
        ],
        settings: {
          allowReentry: false,
          exitOnConversion: true,
          maxExecutionsPerLead: 1
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.engine.registerWorkflow(workflow);
      
      const end = performance.now();
      times.push(end - start);
    }

    const result = this.calculateMetrics('Workflow Registration', iterations, times);
    this.results.push(result);
    console.log(`✅ Average: ${result.averageTime.toFixed(2)}ms, Throughput: ${result.throughput.toFixed(0)}/s\n`);
  }

  private async benchmarkWorkflowExecution(): Promise<void> {
    console.log('⚡ Benchmarking Workflow Execution...');
    
    const iterations = 500;
    const times: number[] = [];

    // Register a test workflow first
    const testWorkflow: MarketingWorkflow = {
      id: 'test_execution_workflow',
      name: 'Test Execution Workflow',
      description: 'Benchmark execution workflow',
      trigger: { type: 'form_submission' },
      conditions: [],
      actions: [
        {
          id: 'test_action_1',
          type: 'add_tag',
          config: { tags: ['benchmark_test'] }
        },
        {
          id: 'test_action_2',
          type: 'update_field',
          config: { field: 'status', value: 'processed' }
        }
      ],
      settings: {
        allowReentry: false,
        exitOnConversion: true,
        maxExecutionsPerLead: 1
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.engine.registerWorkflow(testWorkflow);

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        await this.engine.triggerWorkflow('test_execution_workflow', `lead_${i}`, {
          testData: `benchmark_${i}`
        });
      } catch (error) {
        // Ignore errors for benchmarking purposes
      }
      
      const end = performance.now();
      times.push(end - start);
    }

    const result = this.calculateMetrics('Workflow Execution', iterations, times);
    this.results.push(result);
    console.log(`✅ Average: ${result.averageTime.toFixed(2)}ms, Throughput: ${result.throughput.toFixed(0)}/s\n`);
  }

  private async benchmarkLeadBehaviorTracking(): Promise<void> {
    console.log('📊 Benchmarking Lead Behavior Tracking...');
    
    const iterations = 2000;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      await this.engine.trackLeadBehavior({
        id: `behavior_${i}`,
        leadId: `lead_${i % 100}`, // Reuse leads to simulate real scenario
        type: 'page_view',
        source: 'benchmark_test',
        data: { page: `/test-${i}`, time_spent: Math.floor(Math.random() * 300) },
        timestamp: new Date(),
        sessionId: `session_${Math.floor(i / 10)}`
      });
      
      const end = performance.now();
      times.push(end - start);
    }

    const result = this.calculateMetrics('Lead Behavior Tracking', iterations, times);
    this.results.push(result);
    console.log(`✅ Average: ${result.averageTime.toFixed(2)}ms, Throughput: ${result.throughput.toFixed(0)}/s\n`);
  }

  private async benchmarkPersonalization(): Promise<void> {
    console.log('🎯 Benchmarking Personalization Engine...');
    
    const iterations = 1500;
    const times: number[] = [];

    // Register some personalization rules first
    for (let i = 0; i < 10; i++) {
      await this.engine.registerPersonalizationRule({
        id: `personalization_rule_${i}`,
        name: `Test Rule ${i}`,
        segments: [`segment_${i}`],
        conditions: [
          {
            type: 'field_value',
            field: 'property_value',
            operator: 'greater_than',
            value: 100000 * i
          }
        ],
        content: {
          type: 'text',
          content: `Personalized content for rule ${i}`,
          fallback: 'Default content'
        },
        priority: i,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      await this.engine.getPersonalizedContent(`lead_${i % 100}`, 'text', {
        property_value: 100000 * (i % 10)
      });
      
      const end = performance.now();
      times.push(end - start);
    }

    const result = this.calculateMetrics('Personalization', iterations, times);
    this.results.push(result);
    console.log(`✅ Average: ${result.averageTime.toFixed(2)}ms, Throughput: ${result.throughput.toFixed(0)}/s\n`);
  }

  private async benchmarkFormSubmission(): Promise<void> {
    console.log('📝 Benchmarking Form Submission...');
    
    const iterations = 800;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Simulate form submission processing
      const formData = {
        name: `Test User ${i}`,
        email: `user${i}@example.com`,
        phone: `+123456789${i % 10}`,
        propertyAddress: `${i} Main St, City, State`
      };

      // Simulate workflow trigger
      try {
        await this.engine.triggerWorkflow('test_execution_workflow', `form_lead_${i}`, formData);
      } catch (error) {
        // Ignore errors for benchmarking
      }
      
      const end = performance.now();
      times.push(end - start);
    }

    const result = this.calculateMetrics('Form Submission', iterations, times);
    this.results.push(result);
    console.log(`✅ Average: ${result.averageTime.toFixed(2)}ms, Throughput: ${result.throughput.toFixed(0)}/s\n`);
  }

  private calculateMetrics(operation: string, iterations: number, times: number[]): BenchmarkResult {
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const throughput = 1000 / averageTime; // operations per second

    return {
      operation,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      throughput
    };
  }

  private printSummary(): void {
    console.log('\n📈 BENCHMARK SUMMARY');
    console.log('========================\n');

    this.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.operation}`);
      console.log(`   Iterations: ${result.iterations.toLocaleString()}`);
      console.log(`   Total Time: ${result.totalTime.toFixed(2)}ms`);
      console.log(`   Average Time: ${result.averageTime.toFixed(2)}ms`);
      console.log(`   Min Time: ${result.minTime.toFixed(2)}ms`);
      console.log(`   Max Time: ${result.maxTime.toFixed(2)}ms`);
      console.log(`   Throughput: ${result.throughput.toFixed(0)} ops/sec`);
      console.log('');
    });

    // Calculate overall metrics
    const totalOperations = this.results.reduce((sum, result) => sum + result.iterations, 0);
    const totalTime = this.results.reduce((sum, result) => sum + result.totalTime, 0);
    const overallThroughput = totalOperations / (totalTime / 1000);

    console.log('🎯 OVERALL PERFORMANCE');
    console.log('========================');
    console.log(`Total Operations: ${totalOperations.toLocaleString()}`);
    console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`Overall Throughput: ${overallThroughput.toFixed(0)} ops/sec`);

    // Performance recommendations
    console.log('\n💡 PERFORMANCE RECOMMENDATIONS');
    console.log('================================');

    this.results.forEach((result) => {
      if (result.averageTime > 100) {
        console.log(`⚠️  ${result.operation}: Consider optimization - average time > 100ms`);
      } else if (result.averageTime > 50) {
        console.log(`⚡ ${result.operation}: Good performance - room for improvement`);
      } else {
        console.log(`✅ ${result.operation}: Excellent performance`);
      }
    });
  }
}

// Load test configuration
interface LoadTestConfig {
  duration: number; // seconds
  arrivalRate: number; // requests per second
  targetUrl: string;
  endpoints: string[];
}

class LoadTester {
  private config: LoadTestConfig;

  constructor(config: LoadTestConfig) {
    this.config = config;
  }

  async runLoadTest(): Promise<void> {
    console.log(`\n🔥 STARTING LOAD TEST`);
    console.log(`Duration: ${this.config.duration}s`);
    console.log(`Arrival Rate: ${this.config.arrivalRate} req/s`);
    console.log(`Target URL: ${this.config.targetUrl}\n`);

    const startTime = Date.now();
    const results: Array<{ status: number; responseTime: number; timestamp: number; endpoint: string; error?: string }> = [];
    let completedRequests = 0;
    let failedRequests = 0;

    const interval = setInterval(async () => {
      const currentTime = Date.now();
      if (currentTime - startTime >= this.config.duration * 1000) {
        clearInterval(interval);
        this.printLoadTestResults(results, completedRequests, failedRequests);
        return;
      }

      // Send requests
      for (let i = 0; i < this.config.arrivalRate; i++) {
        const endpoint = this.config.endpoints[Math.floor(Math.random() * this.config.endpoints.length)];
        
        try {
          const requestStart = performance.now();
          const response = await fetch(`${this.config.targetUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.generateTestData(endpoint))
          });
          
          const requestEnd = performance.now();
          const responseTime = requestEnd - requestStart;
          
          results.push({
            status: response.status,
            responseTime,
            timestamp: Date.now(),
            endpoint
          });

          if (response.ok) {
            completedRequests++;
          } else {
            failedRequests++;
          }
        } catch (error) {
          failedRequests++;
          results.push({
            status: 0,
            responseTime: 0,
            timestamp: Date.now(),
            endpoint,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }, 1000); // Send requests every second
  }

  private generateTestData(endpoint: string): any {
    switch (endpoint) {
      case '/api/marketing-automation?type=submit-form':
        return {
          formId: 'form_1',
          data: {
            name: `Load Test User ${Date.now()}`,
            email: `loadtest${Date.now()}@example.com`,
            phone: `+123456789${Math.floor(Math.random() * 10)}`,
            propertyAddress: `${Math.floor(Math.random() * 1000)} Test St`
          }
        };
      
      case '/api/marketing-automation?type=workflows':
        return {
          name: `Load Test Workflow ${Date.now()}`,
          description: 'Workflow created during load test',
          trigger: { type: 'form_submission' },
          actions: [{
            id: `action_${Date.now()}`,
            type: 'send_email',
            config: {
              subject: 'Load Test Email',
              body: 'This is a load test email'
            }
          }],
          settings: {
            allowReentry: false,
            exitOnConversion: true,
            maxExecutionsPerLead: 1
          }
        };
      
      default:
        return { test: true, timestamp: Date.now() };
    }
  }

  private printLoadTestResults(results: any[], completed: number, failed: number): void {
    const totalRequests = results.length;
    const successRate = (completed / totalRequests) * 100;
    const avgResponseTime = results.filter(r => r.responseTime > 0).reduce((sum, r) => sum + r.responseTime, 0) / completed;
    const maxResponseTime = Math.max(...results.filter(r => r.responseTime > 0).map(r => r.responseTime));
    const minResponseTime = Math.min(...results.filter(r => r.responseTime > 0).map(r => r.responseTime));

    console.log('\n📊 LOAD TEST RESULTS');
    console.log('====================');
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Completed: ${completed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${minResponseTime.toFixed(2)}ms`);
    console.log(`Max Response Time: ${maxResponseTime.toFixed(2)}ms`);

    // Status code distribution
    const statusCodes = results.reduce((acc, result) => {
      const status = result.status || 0;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log('\nStatus Code Distribution:');
    Object.entries(statusCodes).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Performance recommendations
    console.log('\n💡 PERFORMANCE ANALYSIS');
    console.log('========================');

    if (successRate < 95) {
      console.log('⚠️  Low success rate detected - investigate error causes');
    }

    if (avgResponseTime > 1000) {
      console.log('⚠️  High average response time - consider performance optimization');
    }

    if (maxResponseTime > 5000) {
      console.log('⚠️  Very high maximum response time - check for bottlenecks');
    }

    if (successRate >= 95 && avgResponseTime <= 500) {
      console.log('✅ Excellent performance under load');
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Marketing Automation Performance Benchmark');
  console.log('==============================================\n');

  // Run core benchmarks
  const benchmark = new MarketingAutomationBenchmark();
  await benchmark.runBenchmarks();

  // Run load test (optional, can be disabled for CI)
  if (process.env.RUN_LOAD_TEST === 'true') {
    const loadTestConfig: LoadTestConfig = {
      duration: 30, // 30 seconds
      arrivalRate: 10, // 10 requests per second
      targetUrl: process.env.TARGET_URL || 'http://localhost:3000',
      endpoints: [
        '/api/marketing-automation?type=submit-form',
        '/api/marketing-automation?type=workflows'
      ]
    };

    const loadTester = new LoadTester(loadTestConfig);
    await loadTester.runLoadTest();
  }
}

// Run benchmarks if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { MarketingAutomationBenchmark, LoadTester };