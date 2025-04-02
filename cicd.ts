import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

/**
 * Interface for CI pipeline status
 */
export interface CIPipeline {
  id: string;
  name: string;
  provider: CIProvider;
  project: string;
  branch?: string;
  status: CIStatus;
  url: string;
  lastRun?: {
    id: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
  };
  stages?: CIStage[];
}

/**
 * Interface for CI stage
 */
export interface CIStage {
  name: string;
  status: CIStatus;
  startTime?: Date;
  endTime?: Date;
  jobs?: CIJob[];
}

/**
 * Interface for CI job
 */
export interface CIJob {
  name: string;
  status: CIStatus;
  startTime?: Date;
  endTime?: Date;
  logs?: string;
}

/**
 * CI status enum
 */
export enum CIStatus {
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  RUNNING = 'running',
  PENDING = 'pending',
  CANCELED = 'canceled',
  UNKNOWN = 'unknown'
}

/**
 * CI provider enum
 */
export enum CIProvider {
  GITHUB_ACTIONS = 'github-actions',
  JENKINS = 'jenkins',
  GITLAB_CI = 'gitlab-ci',
  CIRCLECI = 'circleci',
  TRAVIS_CI = 'travis-ci',
  AZURE_DEVOPS = 'azure-devops'
}

/**
 * Interface for deployment environment
 */
export interface DeploymentEnvironment {
  id: string;
  name: string;
  type: EnvironmentType;
  status: DeploymentStatus;
  url?: string;
  lastDeployed?: Date;
  version?: string;
  services?: DeploymentService[];
}

/**
 * Interface for deployment service
 */
export interface DeploymentService {
  name: string;
  status: DeploymentStatus;
  version?: string;
  lastUpdated?: Date;
  healthEndpoint?: string;
  metrics?: {
    cpu?: number;
    memory?: number;
    requestRate?: number;
    errorRate?: number;
  };
}

/**
 * Environment type enum
 */
export enum EnvironmentType {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing'
}

/**
 * Deployment status enum
 */
export enum DeploymentStatus {
  DEPLOYED = 'deployed',
  DEPLOYING = 'deploying',
  FAILED = 'failed',
  IDLE = 'idle',
  ROLLING_BACK = 'rolling-back',
  ROLLED_BACK = 'rolled-back'
}

/**
 * Interface for quality metrics from SonarQube/SonarCloud
 */
export interface QualityMetrics {
  projectKey: string;
  url: string;
  qualityGate: {
    status: 'passed' | 'failed' | 'warning';
    conditions: Array<{
      metric: string;
      value: number;
      threshold: number;
      status: 'passed' | 'failed' | 'warning';
    }>;
  };
  measures: {
    bugs?: number;
    vulnerabilities?: number;
    codeSmells?: number;
    security_hotspots?: number;
    coverage?: number;
    duplicated_lines_density?: number;
    lines_of_code?: number;
  };
  lastAnalysis?: Date;
}

/**
 * CI/CD Tracker Options
 */
export interface CICDTrackerOptions {
  refreshInterval?: number; // in milliseconds, defaults to 60000 (1 minute)
  dataDir?: string; // Directory to store CI/CD data
  enableNotifications?: boolean; // Whether to emit events for notifications
}

/**
 * CI/CD and Deployment Tracker
 * 
 * This module tracks CI/CD pipelines, deployments, and quality metrics
 * from various providers like GitHub Actions, Jenkins, GitLab CI, etc.
 */
export class CICDTracker extends EventEmitter {
  private pipelines: Map<string, CIPipeline> = new Map();
  private environments: Map<string, DeploymentEnvironment> = new Map();
  private qualityMetrics: Map<string, QualityMetrics> = new Map();
  private refreshInterval: number;
  private dataDir: string;
  private enableNotifications: boolean;
  private refreshTimer?: NodeJS.Timeout;
  private providers: Map<string, CIProvider> = new Map();
  
  constructor(options: CICDTrackerOptions = {}) {
    super();
    
    this.refreshInterval = options.refreshInterval || 60000; // Default to 1 minute
    this.dataDir = options.dataDir || '.aui-data/cicd';
    this.enableNotifications = options.enableNotifications || true;
  }
  
  /**
   * Initialize the CI/CD tracker
   */
  async initialize(): Promise<void> {
    // Ensure data directory exists
    await fs.mkdir(this.dataDir, { recursive: true });
    
    // Load saved data
    await this.loadData();
    
    // Start refresh timer
    this.startRefreshTimer();
    
    console.log('CI/CD Tracker initialized');
  }
  
  /**
   * Add a CI provider
   */
  async addProvider(
    type: CIProvider,
    config: Record<string, any>
  ): Promise<void> {
    const providerId = `${type}-${Date.now()}`;
    this.providers.set(providerId, type);
    
    // Save provider configuration
    await this.saveProviderConfig(providerId, config);
    
    // Trigger an immediate refresh
    await this.refreshData();
    
    console.log(`Added CI provider: ${type}`);
  }
  
  /**
   * Remove a CI provider
   */
  async removeProvider(providerId: string): Promise<boolean> {
    if (!this.providers.has(providerId)) {
      return false;
    }
    
    this.providers.delete(providerId);
    
    // Remove provider configuration
    await this.removeProviderConfig(providerId);
    
    // Remove associated pipelines
    const pipelinesToRemove: string[] = [];
    for (const [pipelineId, pipeline] of this.pipelines.entries()) {
      if (pipeline.provider.toString().startsWith(providerId)) {
        pipelinesToRemove.push(pipelineId);
      }
    }
    
    for (const pipelineId of pipelinesToRemove) {
      this.pipelines.delete(pipelineId);
    }
    
    await this.saveData();
    return true;
  }
  
  /**
   * Get all CI pipelines
   */
  getPipelines(): CIPipeline[] {
    return Array.from(this.pipelines.values());
  }
  
  /**
   * Get a specific CI pipeline
   */
  getPipeline(id: string): CIPipeline | undefined {
    return this.pipelines.get(id);
  }
  
  /**
   * Get pipelines for a specific provider
   */
  getPipelinesByProvider(provider: CIProvider): CIPipeline[] {
    return this.getPipelines().filter(p => p.provider === provider);
  }
  
  /**
   * Get all deployment environments
   */
  getEnvironments(): DeploymentEnvironment[] {
    return Array.from(this.environments.values());
  }
  
  /**
   * Get a specific deployment environment
   */
  getEnvironment(id: string): DeploymentEnvironment | undefined {
    return this.environments.get(id);
  }
  
  /**
   * Get environments by type
   */
  getEnvironmentsByType(type: EnvironmentType): DeploymentEnvironment[] {
    return this.getEnvironments().filter(e => e.type === type);
  }
  
  /**
   * Get quality metrics for all projects
   */
  getQualityMetrics(): QualityMetrics[] {
    return Array.from(this.qualityMetrics.values());
  }
  
  /**
   * Get quality metrics for a specific project
   */
  getQualityMetricsForProject(projectKey: string): QualityMetrics | undefined {
    return this.qualityMetrics.get(projectKey);
  }
  
  /**
   * Get aggregated quality metrics across all projects
   */
  getAggregatedQualityMetrics(): {
    totalProjects: number;
    passedQualityGates: number;
    failedQualityGates: number;
    warningQualityGates: number;
    averageCoverage: number;
    totalBugs: number;
    totalVulnerabilities: number;
    totalCodeSmells: number;
  } {
    const metrics = this.getQualityMetrics();
    const aggregated = {
      totalProjects: metrics.length,
      passedQualityGates: 0,
      failedQualityGates: 0,
      warningQualityGates: 0,
      averageCoverage: 0,
      totalBugs: 0,
      totalVulnerabilities: 0,
      totalCodeSmells: 0
    };
    
    let coverageSum = 0;
    let projectsWithCoverage = 0;
    
    for (const metric of metrics) {
      // Count quality gates
      if (metric.qualityGate.status === 'passed') {
        aggregated.passedQualityGates++;
      } else if (metric.qualityGate.status === 'failed') {
        aggregated.failedQualityGates++;
      } else {
        aggregated.warningQualityGates++;
      }
      
      // Sum bugs, vulnerabilities, code smells
      aggregated.totalBugs += metric.measures.bugs || 0;
      aggregated.totalVulnerabilities += metric.measures.vulnerabilities || 0;
      aggregated.totalCodeSmells += metric.measures.codeSmells || 0;
      
      // Calculate average coverage
      if (metric.measures.coverage !== undefined) {
        coverageSum += metric.measures.coverage;
        projectsWithCoverage++;
      }
    }
    
    if (projectsWithCoverage > 0) {
      aggregated.averageCoverage = coverageSum / projectsWithCoverage;
    }
    
    return aggregated;
  }
  
  /**
   * Add or update a CI pipeline
   */
  async updatePipeline(pipeline: CIPipeline): Promise<void> {
    const existing = this.pipelines.get(pipeline.id);
    const isStatusChanged = existing && existing.status !== pipeline.status;
    
    this.pipelines.set(pipeline.id, pipeline);
    await this.saveData();
    
    // Emit events if status changed
    if (isStatusChanged && this.enableNotifications) {
      this.emit('pipeline:statusChanged', {
        pipeline,
        previousStatus: existing?.status,
        newStatus: pipeline.status
      });
      
      if (pipeline.status === CIStatus.SUCCEEDED) {
        this.emit('pipeline:succeeded', pipeline);
      } else if (pipeline.status === CIStatus.FAILED) {
        this.emit('pipeline:failed', pipeline);
      }
    }
  }
  
  /**
   * Add or update a deployment environment
   */
  async updateEnvironment(environment: DeploymentEnvironment): Promise<void> {
    const existing = this.environments.get(environment.id);
    const isStatusChanged = existing && existing.status !== environment.status;
    
    this.environments.set(environment.id, environment);
    await this.saveData();
    
    // Emit events if status changed
    if (isStatusChanged && this.enableNotifications) {
      this.emit('environment:statusChanged', {
        environment,
        previousStatus: existing?.status,
        newStatus: environment.status
      });
      
      if (environment.status === DeploymentStatus.DEPLOYED) {
        this.emit('environment:deployed', environment);
      } else if (environment.status === DeploymentStatus.FAILED) {
        this.emit('environment:failed', environment);
      }
    }
  }
  
  /**
   * Update quality metrics for a project
   */
  async updateQualityMetrics(metrics: QualityMetrics): Promise<void> {
    const existing = this.qualityMetrics.get(metrics.projectKey);
    const isGateStatusChanged = existing && existing.qualityGate.status !== metrics.qualityGate.status;
    
    this.qualityMetrics.set(metrics.projectKey, metrics);
    await this.saveData();
    
    // Emit events if quality gate status changed
    if (isGateStatusChanged && this.enableNotifications) {
      this.emit('qualityGate:statusChanged', {
        project: metrics.projectKey,
        previousStatus: existing?.qualityGate.status,
        newStatus: metrics.qualityGate.status
      });
      
      if (metrics.qualityGate.status === 'failed') {
        this.emit('qualityGate:failed', metrics);
      }
    }
  }
  
  /**
   * Start the refresh timer
   */
  private startRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      this.refreshData().catch(err => {
        console.error('Failed to refresh CI/CD data:', err);
      });
    }, this.refreshInterval);
  }
  
  /**
   * Stop the refresh timer
   */
  stopRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }
  
  /**
   * Refresh data from all providers
   */
  async refreshData(): Promise<void> {
    // Refresh pipeline data from each provider
    for (const [providerId, providerType] of this.providers.entries()) {
      const config = await this.loadProviderConfig(providerId);
      
      if (!config) {
        console.warn(`No configuration found for provider ${providerId}`);
        continue;
      }
      
      try {
        // Fetch pipeline data based on provider type
        switch (providerType) {
          case CIProvider.GITHUB_ACTIONS:
            await this.refreshGitHubActions(providerId, config);
            break;
            
          case CIProvider.JENKINS:
            await this.refreshJenkins(providerId, config);
            break;
            
          case CIProvider.GITLAB_CI:
            await this.refreshGitLabCI(providerId, config);
            break;
            
          case CIProvider.CIRCLECI:
            await this.refreshCircleCI(providerId, config);
            break;
            
          case CIProvider.TRAVIS_CI:
            await this.refreshTravisCI(providerId, config);
            break;
            
          case CIProvider.AZURE_DEVOPS:
            await this.refreshAzureDevOps(providerId, config);
            break;
            
          default:
            console.warn(`Unsupported provider type: ${providerType}`);
        }
      } catch (error) {
        console.error(`Failed to refresh data for provider ${providerId}:`, error);
      }
    }
    
    // Refresh quality metrics if SonarQube/SonarCloud is configured
    await this.refreshQualityMetrics();
    
    // Save updated data
    await this.saveData();
  }
  
  /**
   * Refresh data from GitHub Actions
   */
  private async refreshGitHubActions(
    providerId: string,
    config: Record<string, any>
  ): Promise<void> {
    const { owner, repo, token } = config;
    
    if (!owner || !repo) {
      throw new Error('GitHub Actions provider requires owner and repo');
    }
    
    try {
      // Fetch workflows
      const workflowsResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/actions/workflows`,
        {
          headers: token ? { Authorization: `token ${token}` } : undefined
        }
      );
      
      const workflows = workflowsResponse.data.workflows;
      
      // For each workflow, fetch the most recent run
      for (const workflow of workflows) {
        const runsResponse = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow.id}/runs?per_page=1`,
          {
            headers: token ? { Authorization: `token ${token}` } : undefined
          }
        );
        
        if (runsResponse.data.workflow_runs.length > 0) {
          const run = runsResponse.data.workflow_runs[0];
          
          // Map GitHub status to our status enum
          let status: CIStatus;
          switch (run.status) {
            case 'completed':
              status = run.conclusion === 'success' ? CIStatus.SUCCEEDED :
                run.conclusion === 'cancelled' ? CIStatus.CANCELED :
                CIStatus.FAILED;
              break;
            case 'in_progress':
              status = CIStatus.RUNNING;
              break;
            case 'queued':
              status = CIStatus.PENDING;
              break;
            default:
              status = CIStatus.UNKNOWN;
          }
          
          const pipelineId = `${providerId}-${workflow.id}`;
          
          // Create pipeline object
          const pipeline: CIPipeline = {
            id: pipelineId,
            name: workflow.name,
            provider: CIProvider.GITHUB_ACTIONS,
            project: `${owner}/${repo}`,
            branch: run.head_branch,
            status,
            url: run.html_url,
            lastRun: {
              id: run.id.toString(),
              startTime: new Date(run.created_at),
              endTime: run.completed_at ? new Date(run.completed_at) : undefined,
              duration: run.completed_at ? 
                (new Date(run.completed_at).getTime() - new Date(run.created_at).getTime()) / 1000 : 
                undefined
            }
          };
          
          // Update pipeline
          await this.updatePipeline(pipeline);
        }
      }
    } catch (error) {
      console.error('Error fetching GitHub Actions data:', error);
      throw error;
    }
  }
  
  /**
   * Refresh data from Jenkins
   */
  private async refreshJenkins(
    providerId: string,
    config: Record<string, any>
  ): Promise<void> {
    const { url, username, apiToken, jobs } = config;
    
    if (!url) {
      throw new Error('Jenkins provider requires url');
    }
    
    const auth = username && apiToken ? { username, password: apiToken } : undefined;
    
    try {
      // If specific jobs are provided, fetch those
      if (jobs && Array.isArray(jobs)) {
        for (const jobName of jobs) {
          await this.fetchJenkinsJob(providerId, url, jobName, auth);
        }
      } else {
        // Otherwise, fetch all jobs
        const response = await axios.get(`${url}/api/json?tree=jobs[name,url]`, { auth });
        
        for (const job of response.data.jobs) {
          await this.fetchJenkinsJob(providerId, url, job.name, auth);
        }
      }
    } catch (error) {
      console.error('Error fetching Jenkins data:', error);
      throw error;
    }
  }
  
  /**
   * Fetch data for a specific Jenkins job
   */
  private async fetchJenkinsJob(
    providerId: string,
    jenkinsUrl: string,
    jobName: string,
    auth?: { username: string; password: string }
  ): Promise<void> {
    try {
      // Fetch job details
      const jobResponse = await axios.get(
        `${jenkinsUrl}/job/${jobName}/api/json?tree=builds[number,result,timestamp,duration,url]`,
        { auth }
      );
      
      if (jobResponse.data.builds && jobResponse.data.builds.length > 0) {
        const latestBuild = jobResponse.data.builds[0];
        
        // Map Jenkins status to our status enum
        let status: CIStatus;
        switch (latestBuild.result) {
          case 'SUCCESS':
            status = CIStatus.SUCCEEDED;
            break;
          case 'FAILURE':
            status = CIStatus.FAILED;
            break;
          case 'ABORTED':
            status = CIStatus.CANCELED;
            break;
          case null:
            status = CIStatus.RUNNING; // Null result typically means still running
            break;
          default:
            status = CIStatus.UNKNOWN;
        }
        
        const pipelineId = `${providerId}-${jobName}`;
        
        // Create pipeline object
        const pipeline: CIPipeline = {
          id: pipelineId,
          name: jobName,
          provider: CIProvider.JENKINS,
          project: jobName.split('/')[0], // First part of job name as project
          status,
          url: latestBuild.url,
          lastRun: {
            id: latestBuild.number.toString(),
            startTime: new Date(latestBuild.timestamp),
            // Duration is in milliseconds in Jenkins
            endTime: latestBuild.result ? new Date(latestBuild.timestamp + latestBuild.duration) : undefined,
            duration: latestBuild.duration / 1000 // Convert to seconds
          }
        };
        
        // Update pipeline
        await this.updatePipeline(pipeline);
      }
    } catch (error) {
      console.error(`Error fetching Jenkins job ${jobName}:`, error);
      throw error;
    }
  }
  
  /**
   * Refresh data from GitLab CI
   */
  private async refreshGitLabCI(
    providerId: string,
    config: Record<string, any>
  ): Promise<void> {
    const { url, token, projectId } = config;
    
    if (!url || !projectId) {
      throw new Error('GitLab CI provider requires url and projectId');
    }
    
    try {
      // Fetch pipelines
      const pipelinesResponse = await axios.get(
        `${url}/api/v4/projects/${projectId}/pipelines`,
        {
          headers: token ? { 'PRIVATE-TOKEN': token } : undefined
        }
      );
      
      for (const gitlabPipeline of pipelinesResponse.data) {
        // Fetch pipeline details
        const pipelineDetailsResponse = await axios.get(
          `${url}/api/v4/projects/${projectId}/pipelines/${gitlabPipeline.id}`,
          {
            headers: token ? { 'PRIVATE-TOKEN': token } : undefined
          }
        );
        
        const pipelineDetails = pipelineDetailsResponse.data;
        
        // Map GitLab status to our status enum
        let status: CIStatus;
        switch (pipelineDetails.status) {
          case 'success':
            status = CIStatus.SUCCEEDED;
            break;
          case 'failed':
            status = CIStatus.FAILED;
            break;
          case 'running':
            status = CIStatus.RUNNING;
            break;
          case 'pending':
            status = CIStatus.PENDING;
            break;
          case 'canceled':
            status = CIStatus.CANCELED;
            break;
          default:
            status = CIStatus.UNKNOWN;
        }
        
        const pipelineId = `${providerId}-${build.id}`;
        
        // Create pipeline object
        const pipeline: CIPipeline = {
          id: pipelineId,
          name: `${repo} #${build.number}`,
          provider: CIProvider.TRAVIS_CI,
          project: `${owner}/${repo}`,
          branch: build.branch.name,
          status,
          url: `https://travis-ci.org/${owner}/${repo}/builds/${build.id}`,
          lastRun: {
            id: build.id.toString(),
            startTime: new Date(build.started_at),
            endTime: build.finished_at ? new Date(build.finished_at) : undefined,
            duration: build.duration
          }
        };
        
        // Update pipeline
        await this.updatePipeline(pipeline);
      }
    } catch (error) {
      console.error('Error fetching Travis CI data:', error);
      throw error;
    }
  }
  
  /**
   * Refresh data from Azure DevOps
   */
  private async refreshAzureDevOps(
    providerId: string,
    config: Record<string, any>
  ): Promise<void> {
    const { organization, project, token } = config;
    
    if (!organization || !project || !token) {
      throw new Error('Azure DevOps provider requires organization, project, and token');
    }
    
    try {
      // Base64 encode the token for Basic authentication
      const base64Token = Buffer.from(`:${token}`).toString('base64');
      
      // Fetch build definitions (pipelines)
      const definitionsResponse = await axios.get(
        `https://dev.azure.com/${organization}/${project}/_apis/build/definitions?api-version=6.0`,
        {
          headers: { Authorization: `Basic ${base64Token}` }
        }
      );
      
      for (const definition of definitionsResponse.data.value) {
        // Fetch recent builds for this definition
        const buildsResponse = await axios.get(
          `https://dev.azure.com/${organization}/${project}/_apis/build/builds?definitions=${definition.id}&$top=1&api-version=6.0`,
          {
            headers: { Authorization: `Basic ${base64Token}` }
          }
        );
        
        if (buildsResponse.data.count > 0) {
          const latestBuild = buildsResponse.data.value[0];
          
          // Map Azure DevOps status to our status enum
          let status: CIStatus;
          switch (latestBuild.result) {
            case 'succeeded':
              status = CIStatus.SUCCEEDED;
              break;
            case 'failed':
            case 'partiallySucceeded':
              status = CIStatus.FAILED;
              break;
            case 'canceled':
              status = CIStatus.CANCELED;
              break;
            case null:
              status = latestBuild.status === 'inProgress' ? 
                CIStatus.RUNNING : 
                CIStatus.PENDING;
              break;
            default:
              status = CIStatus.UNKNOWN;
          }
          
          const pipelineId = `${providerId}-${definition.id}`;
          
          // Create pipeline object
          const pipeline: CIPipeline = {
            id: pipelineId,
            name: definition.name,
            provider: CIProvider.AZURE_DEVOPS,
            project: project,
            branch: latestBuild.sourceBranch,
            status,
            url: latestBuild._links.web.href,
            lastRun: {
              id: latestBuild.id.toString(),
              startTime: new Date(latestBuild.startTime),
              endTime: latestBuild.finishTime ? new Date(latestBuild.finishTime) : undefined,
              duration: latestBuild.finishTime ? 
                (new Date(latestBuild.finishTime).getTime() - new Date(latestBuild.startTime).getTime()) / 1000 : 
                undefined
            }
          };
          
          // Update pipeline
          await this.updatePipeline(pipeline);
        }
      }
    } catch (error) {
      console.error('Error fetching Azure DevOps data:', error);
      throw error;
    }
  }
  
  /**
   * Refresh quality metrics from SonarQube/SonarCloud
   */
  private async refreshQualityMetrics(): Promise<void> {
    // Load SonarQube/SonarCloud configuration
    const configPath = path.join(this.dataDir, 'sonar-config.json');
    
    try {
      const configExists = await fs.access(configPath).then(() => true).catch(() => false);
      
      if (!configExists) {
        return; // No SonarQube configuration
      }
      
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      
      if (!config.url || !config.token) {
        return; // Invalid configuration
      }
      
      // Determine if this is SonarCloud or SonarQube
      const isSonarCloud = config.url.includes('sonarcloud.io');
      
      // Fetch projects
      const projectsResponse = await axios.get(
        `${config.url}/api/components/search?qualifiers=TRK`,
        {
          headers: { Authorization: `Bearer ${config.token}` }
        }
      );
      
      for (const project of projectsResponse.data.components) {
        // Fetch quality gate status
        const qualityGateResponse = await axios.get(
          `${config.url}/api/qualitygates/project_status?projectKey=${project.key}`,
          {
            headers: { Authorization: `Bearer ${config.token}` }
          }
        );
        
        // Fetch measures
        const measuresResponse = await axios.get(
          `${config.url}/api/measures/component?component=${project.key}&metricKeys=bugs,vulnerabilities,code_smells,security_hotspots,coverage,duplicated_lines_density,ncloc`,
          {
            headers: { Authorization: `Bearer ${config.token}` }
          }
        );
        
        const measures: Record<string, number> = {};
        
        for (const measure of measuresResponse.data.component.measures) {
          measures[measure.metric] = parseFloat(measure.value);
        }
        
        // Create quality metrics object
        const metrics: QualityMetrics = {
          projectKey: project.key,
          url: `${config.url}/dashboard?id=${project.key}`,
          qualityGate: {
            status: qualityGateResponse.data.projectStatus.status.toLowerCase() as 'passed' | 'failed' | 'warning',
            conditions: qualityGateResponse.data.projectStatus.conditions.map((condition: any) => ({
              metric: condition.metricKey,
              value: parseFloat(condition.actualValue),
              threshold: parseFloat(condition.errorThreshold),
              status: condition.status.toLowerCase() as 'passed' | 'failed' | 'warning'
            }))
          },
          measures: {
            bugs: measures.bugs,
            vulnerabilities: measures.vulnerabilities,
            codeSmells: measures.code_smells,
            security_hotspots: measures.security_hotspots,
            coverage: measures.coverage,
            duplicated_lines_density: measures.duplicated_lines_density,
            lines_of_code: measures.ncloc
          },
          lastAnalysis: new Date() // SonarQube API doesn't provide this directly
        };
        
        // Update quality metrics
        await this.updateQualityMetrics(metrics);
      }
    } catch (error) {
      console.error('Error fetching quality metrics:', error);
    }
  }
  
  /**
   * Configure SonarQube/SonarCloud integration
   */
  async configureSonarIntegration(
    url: string,
    token: string
  ): Promise<void> {
    const configPath = path.join(this.dataDir, 'sonar-config.json');
    
    await fs.writeFile(
      configPath,
      JSON.stringify({ url, token }),
      'utf-8'
    );
    
    // Trigger an immediate refresh
    await this.refreshQualityMetrics();
    
    console.log('SonarQube/SonarCloud integration configured');
  }
  
  /**
   * Configure a deployment environment
   */
  async configureEnvironment(
    environment: DeploymentEnvironment
  ): Promise<void> {
    await this.updateEnvironment(environment);
    console.log(`Environment "${environment.name}" configured`);
  }
  
  /**
   * Load saved data
   */
  private async loadData(): Promise<void> {
    try {
      // Load pipelines
      const pipelinesPath = path.join(this.dataDir, 'pipelines.json');
      const pipelinesExists = await fs.access(pipelinesPath).then(() => true).catch(() => false);
      
      if (pipelinesExists) {
        const pipelinesData = await fs.readFile(pipelinesPath, 'utf-8');
        const pipelines = JSON.parse(pipelinesData);
        
        for (const pipeline of pipelines) {
          // Convert date strings to Date objects
          if (pipeline.lastRun) {
            pipeline.lastRun.startTime = new Date(pipeline.lastRun.startTime);
            
            if (pipeline.lastRun.endTime) {
              pipeline.lastRun.endTime = new Date(pipeline.lastRun.endTime);
            }
          }
          
          if (pipeline.stages) {
            for (const stage of pipeline.stages) {
              if (stage.startTime) {
                stage.startTime = new Date(stage.startTime);
              }
              
              if (stage.endTime) {
                stage.endTime = new Date(stage.endTime);
              }
              
              if (stage.jobs) {
                for (const job of stage.jobs) {
                  if (job.startTime) {
                    job.startTime = new Date(job.startTime);
                  }
                  
                  if (job.endTime) {
                    job.endTime = new Date(job.endTime);
                  }
                }
              }
            }
          }
          
          this.pipelines.set(pipeline.id, pipeline);
        }
      }
      
      // Load environments
      const environmentsPath = path.join(this.dataDir, 'environments.json');
      const environmentsExists = await fs.access(environmentsPath).then(() => true).catch(() => false);
      
      if (environmentsExists) {
        const environmentsData = await fs.readFile(environmentsPath, 'utf-8');
        const environments = JSON.parse(environmentsData);
        
        for (const environment of environments) {
          // Convert date strings to Date objects
          if (environment.lastDeployed) {
            environment.lastDeployed = new Date(environment.lastDeployed);
          }
          
          if (environment.services) {
            for (const service of environment.services) {
              if (service.lastUpdated) {
                service.lastUpdated = new Date(service.lastUpdated);
              }
            }
          }
          
          this.environments.set(environment.id, environment);
        }
      }
      
      // Load quality metrics
      const metricsPath = path.join(this.dataDir, 'quality-metrics.json');
      const metricsExists = await fs.access(metricsPath).then(() => true).catch(() => false);
      
      if (metricsExists) {
        const metricsData = await fs.readFile(metricsPath, 'utf-8');
        const metrics = JSON.parse(metricsData);
        
        for (const metric of metrics) {
          // Convert date strings to Date objects
          if (metric.lastAnalysis) {
            metric.lastAnalysis = new Date(metric.lastAnalysis);
          }
          
          this.qualityMetrics.set(metric.projectKey, metric);
        }
      }
      
      // Load providers
      const providersPath = path.join(this.dataDir, 'providers.json');
      const providersExists = await fs.access(providersPath).then(() => true).catch(() => false);
      
      if (providersExists) {
        const providersData = await fs.readFile(providersPath, 'utf-8');
        const providers = JSON.parse(providersData);
        
        for (const [id, type] of Object.entries(providers)) {
          this.providers.set(id, type as CIProvider);
        }
      }
    } catch (error) {
      console.error('Failed to load CI/CD data:', error);
    }
  }
  
  /**
   * Save data to disk
   */
  private async saveData(): Promise<void> {
    try {
      // Save pipelines
      await fs.writeFile(
        path.join(this.dataDir, 'pipelines.json'),
        JSON.stringify(Array.from(this.pipelines.values())),
        'utf-8'
      );
      
      // Save environments
      await fs.writeFile(
        path.join(this.dataDir, 'environments.json'),
        JSON.stringify(Array.from(this.environments.values())),
        'utf-8'
      );
      
      // Save quality metrics
      await fs.writeFile(
        path.join(this.dataDir, 'quality-metrics.json'),
        JSON.stringify(Array.from(this.qualityMetrics.values())),
        'utf-8'
      );
      
      // Save providers
      await fs.writeFile(
        path.join(this.dataDir, 'providers.json'),
        JSON.stringify(Object.fromEntries(this.providers)),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save CI/CD data:', error);
    }
  }
  
  /**
   * Save provider configuration
   */
  private async saveProviderConfig(
    providerId: string,
    config: Record<string, any>
  ): Promise<void> {
    const configDir = path.join(this.dataDir, 'provider-configs');
    await fs.mkdir(configDir, { recursive: true });
    
    await fs.writeFile(
      path.join(configDir, `${providerId}.json`),
      JSON.stringify(config),
      'utf-8'
    );
  }
  
  /**
   * Load provider configuration
   */
  private async loadProviderConfig(
    providerId: string
  ): Promise<Record<string, any> | null> {
    const configPath = path.join(this.dataDir, 'provider-configs', `${providerId}.json`);
    
    try {
      const configExists = await fs.access(configPath).then(() => true).catch(() => false);
      
      if (!configExists) {
        return null;
      }
      
      const configData = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.error(`Failed to load provider config for ${providerId}:`, error);
      return null;
    }
  }
  
  /**
   * Remove provider configuration
   */
  private async removeProviderConfig(
    providerId: string
  ): Promise<void> {
    const configPath = path.join(this.dataDir, 'provider-configs', `${providerId}.json`);
    
    try {
      const configExists = await fs.access(configPath).then(() => true).catch(() => false);
      
      if (configExists) {
        await fs.unlink(configPath);
      }
    } catch (error) {
      console.error(`Failed to remove provider config for ${providerId}:`, error);
    }
  }
  
  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    this.stopRefreshTimer();
    
    // Save data before disposing
    await this.saveData();
    
    // Remove all listeners
    this.removeAllListeners();
  }
}

            status = CIStatus.UNKNOWN;
        }
        
        // Fetch jobs to get stages
        const jobsResponse = await axios.get(
          `${url}/api/v4/projects/${projectId}/pipelines/${gitlabPipeline.id}/jobs`,
          {
            headers: token ? { 'PRIVATE-TOKEN': token } : undefined
          }
        );
        
        // Group jobs by stage
        const stages = new Map<string, CIStage>();
        
        for (const job of jobsResponse.data) {
          if (!stages.has(job.stage)) {
            // Map job status to our status enum
            let jobStatus: CIStatus;
            switch (job.status) {
              case 'success':
                jobStatus = CIStatus.SUCCEEDED;
                break;
              case 'failed':
                jobStatus = CIStatus.FAILED;
                break;
              case 'running':
                jobStatus = CIStatus.RUNNING;
                break;
              case 'pending':
                jobStatus = CIStatus.PENDING;
                break;
              case 'canceled':
                jobStatus = CIStatus.CANCELED;
                break;
              default:
                jobStatus = CIStatus.UNKNOWN;
            }
            
            stages.set(job.stage, {
              name: job.stage,
              status: jobStatus,
              startTime: job.started_at ? new Date(job.started_at) : undefined,
              endTime: job.finished_at ? new Date(job.finished_at) : undefined,
              jobs: []
            });
          }
          
          const stage = stages.get(job.stage)!;
          
          // Map job status to our status enum
          let jobStatus: CIStatus;
          switch (job.status) {
            case 'success':
              jobStatus = CIStatus.SUCCEEDED;
              break;
            case 'failed':
              jobStatus = CIStatus.FAILED;
              break;
            case 'running':
              jobStatus = CIStatus.RUNNING;
              break;
            case 'pending':
              jobStatus = CIStatus.PENDING;
              break;
            case 'canceled':
              jobStatus = CIStatus.CANCELED;
              break;
            default:
              jobStatus = CIStatus.UNKNOWN;
          }
          
          stage.jobs!.push({
            name: job.name,
            status: jobStatus,
            startTime: job.started_at ? new Date(job.started_at) : undefined,
            endTime: job.finished_at ? new Date(job.finished_at) : undefined
          });
        }
        
        const pipelineId = `${providerId}-${pipelineDetails.id}`;
        
        // Create pipeline object
        const pipeline: CIPipeline = {
          id: pipelineId,
          name: `Pipeline #${pipelineDetails.id}`,
          provider: CIProvider.GITLAB_CI,
          project: pipelineDetails.project_id.toString(),
          branch: pipelineDetails.ref,
          status,
          url: pipelineDetails.web_url,
          lastRun: {
            id: pipelineDetails.id.toString(),
            startTime: new Date(pipelineDetails.created_at),
            endTime: pipelineDetails.finished_at ? new Date(pipelineDetails.finished_at) : undefined,
            duration: pipelineDetails.duration
          },
          stages: Array.from(stages.values())
        };
        
        // Update pipeline
        await this.updatePipeline(pipeline);
      }
    } catch (error) {
      console.error('Error fetching GitLab CI data:', error);
      throw error;
    }
  }
  
  /**
   * Refresh data from CircleCI
   */
  private async refreshCircleCI(
    providerId: string,
    config: Record<string, any>
  ): Promise<void> {
    const { token, vcsType, owner, repo } = config;
    
    if (!token || !vcsType || !owner || !repo) {
      throw new Error('CircleCI provider requires token, vcsType, owner, and repo');
    }
    
    try {
      // Fetch recent pipelines
      const response = await axios.get(
        `https://circleci.com/api/v1.1/project/${vcsType}/${owner}/${repo}?limit=10&shallow=true`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      for (const build of response.data) {
        // Map CircleCI status to our status enum
        let status: CIStatus;
        switch (build.status) {
          case 'success':
            status = CIStatus.SUCCEEDED;
            break;
          case 'failed':
            status = CIStatus.FAILED;
            break;
          case 'running':
            status = CIStatus.RUNNING;
            break;
          case 'queued':
            status = CIStatus.PENDING;
            break;
          case 'canceled':
          case 'cancelled':
            status = CIStatus.CANCELED;
            break;
          default:
            status = CIStatus.UNKNOWN;
        }
        
        const pipelineId = `${providerId}-${build.build_num}`;
        
        // Create pipeline object
        const pipeline: CIPipeline = {
          id: pipelineId,
          name: `${repo} #${build.build_num}`,
          provider: CIProvider.CIRCLECI,
          project: `${owner}/${repo}`,
          branch: build.branch,
          status,
          url: build.build_url,
          lastRun: {
            id: build.build_num.toString(),
            startTime: new Date(build.start_time || build.queued_at),
            endTime: build.stop_time ? new Date(build.stop_time) : undefined,
            duration: build.build_time_millis ? build.build_time_millis / 1000 : undefined // Convert to seconds
          }
        };
        
        // Update pipeline
        await this.updatePipeline(pipeline);
      }
    } catch (error) {
      console.error('Error fetching CircleCI data:', error);
      throw error;
    }
  }
  
  /**
   * Refresh data from Travis CI
   */
  private async refreshTravisCI(
    providerId: string,
    config: Record<string, any>
  ): Promise<void> {
    const { token, owner, repo } = config;
    
    if (!token || !owner || !repo) {
      throw new Error('Travis CI provider requires token, owner, and repo');
    }
    
    try {
      // Fetch recent builds
      const response = await axios.get(
        `https://api.travis-ci.org/repo/${encodeURIComponent(`${owner}/${repo}`)}/builds?limit=10`,
        {
          headers: {
            Authorization: `token ${token}`,
            'Travis-API-Version': '3'
          }
        }
      );
      
      for (const build of response.data.builds) {
        // Map Travis CI status to our status enum
        let status: CIStatus;
        switch (build.state) {
          case 'passed':
            status = CIStatus.SUCCEEDED;
            break;
          case 'failed':
            status = CIStatus.FAILED;
            break;
          case 'started':
            status = CIStatus.RUNNING;
            break;
          case 'created':
            status = CIStatus.PENDING;
            break;
          case 'canceled':
            status = CIStatus.CANCELED;
            break;
          default:import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

/**
 * Interface for CI pipeline status
 */
export interface CIPipeline {
  id: string;
  name: string;
  provider: CIProvider;
  project: string;
  branch?: string;
  status: CIStatus;
  url: string;
  lastRun?: {
    id: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
  };
  stages?: CIStage[];
}

/**
 * Interface for CI stage
 */
export interface CIStage {
  name: string;
  status: CIStatus;
  startTime?: Date;
  endTime?: Date;
  jobs?: CIJob[];
}

/**
 * Interface for CI job
 */
export interface CIJob {
  name: string;
  status: CIStatus;
  startTime?: Date;
  endTime?: Date;
  logs?: string;
}

/**
 * CI status enum
 */
export enum CIStatus {
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  RUNNING = 'running',
  PENDING = 'pending',
  CANCELED = 'canceled',
  UNKNOWN = 'unknown'
}

/**
 * CI provider enum
 */
export enum CIProvider {
  GITHUB_ACTIONS = 'github-actions',
  JENKINS = 'jenkins',
  GITLAB_CI = 'gitlab-ci',
  CIRCLECI = 'circleci',
  TRAVIS_CI = 'travis-ci',