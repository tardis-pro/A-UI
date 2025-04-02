import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import defaultShell from 'default-shell';

const execAsync = promisify(exec);

/**
 * Interface for a command history entry
 */
export interface CommandHistoryEntry {
  command: string;
  timestamp: Date;
  directory?: string;
  exitCode?: number;
  output?: string;
  duration?: number;
}

/**
 * Interface for a command pattern
 */
export interface CommandPattern {
  id: string;
  name: string;
  description: string;
  commands: string[];
  frequency: number;
  lastUsed: Date;
  averageDuration?: number;
  tags: string[];
  autoRun?: boolean;
}

/**
 * Interface for automation suggestion
 */
export interface AutomationSuggestion {
  id: string;
  name: string;
  description: string;
  commands: string[];
  shellScript: string;
  npmScript?: string;
  estimatedTimeSaved: number;
  confidence: number;
}

/**
 * Command History Analyzer monitors and analyzes shell command usage
 */
export class CommandHistoryAnalyzer {
  private historyEntries: CommandHistoryEntry[] = [];
  private commandPatterns: CommandPattern[] = [];
  private automationSuggestions: AutomationSuggestion[] = [];
  private dataDir: string;
  private shellHistoryPath: string;
  private shellType: 'bash' | 'zsh' | 'powershell' | 'cmd' | 'fish' | 'unknown';
  
  constructor(dataDir: string = '.aui-data/command-history') {
    this.dataDir = dataDir;
    this.shellType = this.detectShellType();
    this.shellHistoryPath = this.getShellHistoryPath();
  }
  
  /**
   * Initialize the command history analyzer
   */
  async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Load saved history entries, patterns, and suggestions
      await this.loadData();
      
      // Import history from shell
      await this.importHistoryFromShell();
      
      console.log(`Command History Analyzer initialized with ${this.historyEntries.length} entries`);
    } catch (error) {
      console.error('Failed to initialize Command History Analyzer:', error);
    }
  }
  
  /**
   * Record a new command
   */
  async recordCommand(
    command: string,
    directory: string,
    exitCode: number = 0,
    output: string = '',
    duration: number = 0
  ): Promise<CommandHistoryEntry> {
    const entry: CommandHistoryEntry = {
      command,
      timestamp: new Date(),
      directory,
      exitCode,
      output,
      duration
    };
    
    this.historyEntries.push(entry);
    await this.saveData();
    
    // After recording, analyze for patterns
    this.analyzePatterns();
    
    return entry;
  }
  
  /**
   * Get command history entries
   */
  getHistoryEntries(limit: number = 100, filter?: string): CommandHistoryEntry[] {
    let entries = [...this.historyEntries];
    
    // Apply filter if provided
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      entries = entries.filter(entry => 
        entry.command.toLowerCase().includes(lowerFilter) ||
        entry.directory?.toLowerCase().includes(lowerFilter)
      );
    }
    
    // Sort by timestamp (newest first) and limit
    return entries
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  /**
   * Get command patterns
   */
  getCommandPatterns(): CommandPattern[] {
    return [...this.commandPatterns]
      .sort((a, b) => b.frequency - a.frequency);
  }
  
  /**
   * Get automation suggestions
   */
  getAutomationSuggestions(): AutomationSuggestion[] {
    return [...this.automationSuggestions]
      .sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Generate a shell script for a command pattern
   */
  generateShellScript(pattern: CommandPattern): string {
    let script = '';
    
    switch (this.shellType) {
      case 'bash':
      case 'zsh':
        script = `#!/bin/bash\n\n# ${pattern.name}\n# ${pattern.description}\n\nset -e\n\n`;
        
        for (const command of pattern.commands) {
          script += `echo "Running: ${command}"\n`;
          script += `${command}\n\n`;
        }
        
        script += 'echo "Done!"\n';
        break;
        
      case 'powershell':
        script = `# ${pattern.name}\n# ${pattern.description}\n\n`;
        
        for (const command of pattern.commands) {
          script += `Write-Host "Running: ${command}"\n`;
          script += `${command}\n\n`;
        }
        
        script += 'Write-Host "Done!"\n';
        break;
        
      default:
        script = `# ${pattern.name}\n# ${pattern.description}\n\n`;
        
        for (const command of pattern.commands) {
          script += `# Running: ${command}\n`;
          script += `${command}\n\n`;
        }
        
        script += '# Done!\n';
    }
    
    return script;
  }
  
  /**
   * Generate an npm script for a command pattern
   */
  generateNpmScript(pattern: CommandPattern): string {
    // Simple command joining for npm scripts
    return pattern.commands.join(' && ');
  }
  
  /**
   * Execute a script from a pattern
   */
  async executeScript(pattern: CommandPattern): Promise<{
    success: boolean;
    output: string;
    error?: string;
  }> {
    try {
      // Generate a temporary script file
      const scriptContent = this.generateShellScript(pattern);
      const scriptExt = this.shellType === 'powershell' ? '.ps1' : '.sh';
      const scriptPath = path.join(os.tmpdir(), `aui-script-${pattern.id}${scriptExt}`);
      
      await fs.writeFile(scriptPath, scriptContent, 'utf-8');
      
      // Make the script executable (for Unix-like systems)
      if (this.shellType === 'bash' || this.shellType === 'zsh') {
        await fs.chmod(scriptPath, 0o755);
      }
      
      // Execute the script
      const shellCmd = this.getShellExecuteCommand(scriptPath);
      const { stdout, stderr } = await execAsync(shellCmd);
      
      // Clean up
      await fs.unlink(scriptPath).catch(() => {});
      
      return {
        success: true,
        output: stdout + (stderr ? `\nErrors:\n${stderr}` : '')
      };
    } catch (error) {
      console.error('Failed to execute script:', error);
      return {
        success: false,
        output: '',
        error: error.toString()
      };
    }
  }
  
  /**
   * Detect frequently used command sequences
   */
  analyzePatterns(): void {
    if (this.historyEntries.length < 10) return; // Need more data
    
    // Get recent entries, sorted by timestamp (oldest first)
    const recentEntries = this.historyEntries
      .slice(-200) // Last 200 commands
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Find sequences of 2-5 commands that occur multiple times
    this.detectSequences(recentEntries);
    
    // Identify build and deployment patterns
    this.identifyBuildPatterns(recentEntries);
    
    // Generate automation suggestions
    this.generateAutomationSuggestions();
    
    // Save findings
    this.saveData().catch(err => console.error('Failed to save command patterns:', err));
  }
  
  /**
   * Import command history from shell
   */
  private async importHistoryFromShell(): Promise<void> {
    try {
      if (!this.shellHistoryPath) {
        console.log('Shell history path not found. Skipping import.');
        return;
      }
      
      const historyContent = await fs.readFile(this.shellHistoryPath, 'utf-8');
      const lines = historyContent.split('\n');
      
      // Parse based on shell type
      const entries = this.parseShellHistory(lines);
      
      // Merge with existing entries, avoiding duplicates
      const existingCommands = new Set(this.historyEntries.map(e => e.command));
      const newEntries = entries.filter(e => !existingCommands.has(e.command));
      
      if (newEntries.length > 0) {
        this.historyEntries.push(...newEntries);
        console.log(`Imported ${newEntries.length} commands from shell history`);
        
        await this.saveData();
      }
    } catch (error) {
      console.error('Failed to import shell history:', error);
    }
  }
  
  /**
   * Parse shell history based on shell type
   */
  private parseShellHistory(lines: string[]): CommandHistoryEntry[] {
    const entries: CommandHistoryEntry[] = [];
    
    switch (this.shellType) {
      case 'bash':
        // Format: TIMESTAMP COMMAND
        for (const line of lines) {
          const match = line.match(/^#(\d+)\s+(.+)$/);
          if (match) {
            const timestamp = new Date(parseInt(match[1]) * 1000);
            const command = match[2].trim();
            
            if (command && !this.isIgnoredCommand(command)) {
              entries.push({ command, timestamp });
            }
          }
        }
        break;
        
      case 'zsh':
        // Format: : TIMESTAMP:DURATION;COMMAND
        for (const line of lines) {
          const match = line.match(/^:\s+(\d+):(\d+);(.+)$/);
          if (match) {
            const timestamp = new Date(parseInt(match[1]) * 1000);
            const duration = parseInt(match[2]);
            const command = match[3].trim();
            
            if (command && !this.isIgnoredCommand(command)) {
              entries.push({ command, timestamp, duration });
            }
          }
        }
        break;
        
      case 'powershell':
        // PowerShell history is more complex - simplified for MVP
        for (const line of lines) {
          const command = line.trim();
          if (command && !this.isIgnoredCommand(command)) {
            entries.push({ 
              command, 
              timestamp: new Date() // Since PowerShell history doesn't include timestamps by default
            });
          }
        }
        break;
        
      default:
        // Basic parsing for unknown shell types
        for (const line of lines) {
          const command = line.trim();
          if (command && !this.isIgnoredCommand(command)) {
            entries.push({ 
              command, 
              timestamp: new Date()
            });
          }
        }
    }
    
    return entries;
  }
  
  /**
   * Check if a command should be ignored
   */
  private isIgnoredCommand(command: string): boolean {
    // Ignore very short commands, or commands that are just whitespace
    if (command.trim().length < 2) return true;
    
    // Ignore cd commands
    if (command.trim().startsWith('cd ')) return true;
    
    // Ignore ls/dir commands
    if (command.trim() === 'ls' || command.trim() === 'dir') return true;
    
    // Ignore exit commands
    if (command.trim() === 'exit') return true;
    
    return false;
  }
  
  /**
   * Detect command sequences that occur multiple times
   */
  private detectSequences(entries: CommandHistoryEntry[]): void {
    // Look for sequences of 2-5 commands
    for (let length = 2; length <= 5; length++) {
      const sequences: {[key: string]: {count: number, lastUsed: Date, commands: string[]}} = {};
      
      // Build potential sequences
      for (let i = 0; i <= entries.length - length; i++) {
        const sequence = entries.slice(i, i + length).map(e => e.command);
        const key = sequence.join('|');
        
        if (!sequences[key]) {
          sequences[key] = { 
            count: 0, 
            lastUsed: entries[i + length - 1].timestamp,
            commands: sequence
          };
        }
        
        sequences[key].count++;
        
        // Update last used if newer
        if (entries[i + length - 1].timestamp > sequences[key].lastUsed) {
          sequences[key].lastUsed = entries[i + length - 1].timestamp;
        }
      }
      
      // Filter sequences that appear multiple times
      for (const [key, data] of Object.entries(sequences)) {
        if (data.count >= 2) {
          const existingPattern = this.commandPatterns.find(p => 
            p.commands.join('|') === key
          );
          
          if (existingPattern) {
            // Update existing pattern
            existingPattern.frequency = data.count;
            existingPattern.lastUsed = data.lastUsed;
          } else {
            // Create new pattern
            const patternId = `pattern-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const name = this.generatePatternName(data.commands);
            
            this.commandPatterns.push({
              id: patternId,
              name,
              description: `Sequence of ${length} commands that has been run ${data.count} times`,
              commands: data.commands,
              frequency: data.count,
              lastUsed: data.lastUsed,
              tags: this.generateTags(data.commands),
              autoRun: false
            });
          }
        }
      }
    }
  }
  
  /**
   * Identify build and deployment related patterns
   */
  private identifyBuildPatterns(entries: CommandHistoryEntry[]): void {
    // Look for build, test, deploy commands
    const buildCommands = entries.filter(e => 
      e.command.includes('npm run build') || 
      e.command.includes('yarn build') ||
      e.command.includes('mvn package') ||
      e.command.includes('gradle build')
    );
    
    const testCommands = entries.filter(e => 
      e.command.includes('npm test') || 
      e.command.includes('yarn test') ||
      e.command.includes('mvn test') ||
      e.command.includes('gradle test')
    );
    
    const deployCommands = entries.filter(e => 
      e.command.includes('deploy') ||
      e.command.includes('publish') || 
      e.command.includes('push')
    );
    
    // Check for common build sequence
    if (buildCommands.length > 0 && testCommands.length > 0) {
      // See if test commands often precede build commands
      let count = 0;
      for (let i = 1; i < entries.length; i++) {
        const prevCmd = entries[i-1].command;
        const currCmd = entries[i].command;
        
        if (
          (prevCmd.includes('test') && currCmd.includes('build')) ||
          (prevCmd.includes('build') && currCmd.includes('test'))
        ) {
          count++;
        }
      }
      
      if (count >= 2) {
        const existingPattern = this.commandPatterns.find(p => 
          p.tags.includes('build') && p.tags.includes('test')
        );
        
        if (!existingPattern) {
          const testCmd = testCommands[0].command;
          const buildCmd = buildCommands[0].command;
          
          this.commandPatterns.push({
            id: `build-pattern-${Date.now()}`,
            name: 'Build Process',
            description: 'Common build process: test and build',
            commands: [testCmd, buildCmd],
            frequency: count,
            lastUsed: new Date(),
            tags: ['build', 'test', 'automation'],
            autoRun: false
          });
        }
      }
    }
    
          // Check for deployment sequence
    if (buildCommands.length > 0 && deployCommands.length > 0) {
      // See if build commands often precede deploy commands
      let count = 0;
      for (let i = 1; i < entries.length; i++) {
        const prevCmd = entries[i-1].command;
        const currCmd = entries[i].command;
        
        if (
          (prevCmd.includes('build') && currCmd.includes('deploy')) ||
          (prevCmd.includes('build') && currCmd.includes('publish'))
        ) {
          count++;
        }
      }
      
      if (count >= 2) {
        const existingPattern = this.commandPatterns.find(p => 
          p.tags.includes('build') && p.tags.includes('deploy')
        );
        
        if (!existingPattern) {
          const buildCmd = buildCommands[0].command;
          const deployCmd = deployCommands[0].command;
          
          this.commandPatterns.push({
            id: `deploy-pattern-${Date.now()}`,
            name: 'Deployment Process',
            description: 'Common deployment process: build and deploy',
            commands: [buildCmd, deployCmd],
            frequency: count,
            lastUsed: new Date(),
            tags: ['build', 'deploy', 'automation'],
            autoRun: false
          });
        }
      }
    }
  }
  
  /**
   * Generate automation suggestions based on patterns
   */
  private generateAutomationSuggestions(): void {
    // Clear existing suggestions
    this.automationSuggestions = [];
    
    // Process patterns for automation candidates
    for (const pattern of this.commandPatterns) {
      // Skip patterns that are already auto-run
      if (pattern.autoRun) continue;
      
      // Skip patterns with low frequency
      if (pattern.frequency < 3) continue;
      
      // Generate a shell script for the pattern
      const shellScript = this.generateShellScript(pattern);
      
      // Check if we should suggest npm script
      const hasNpmCommands = pattern.commands.some(cmd => 
        cmd.includes('npm') || cmd.includes('yarn')
      );
      
      let npmScript: string | undefined = undefined;
      if (hasNpmCommands) {
        npmScript = this.generateNpmScript(pattern);
      }
      
      // Estimate time saved (simple heuristic for MVP)
      // Assumption: Each manual command execution takes ~5 seconds of typing
      const estimatedTimeSaved = pattern.commands.length * 5 * pattern.frequency;
      
      // Calculate confidence based on frequency and recency
      // Higher frequency and more recent usage increase confidence
      const daysSinceLastUse = (new Date().getTime() - pattern.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
      const frequencyFactor = Math.min(pattern.frequency / 10, 1); // Cap at 1.0
      const recencyFactor = Math.max(1 - (daysSinceLastUse / 30), 0); // 0 if older than 30 days
      
      const confidence = (frequencyFactor * 0.7 + recencyFactor * 0.3) * 100;
      
      this.automationSuggestions.push({
        id: `suggestion-${pattern.id}`,
        name: pattern.name,
        description: `Automate this sequence that you've run ${pattern.frequency} times`,
        commands: pattern.commands,
        shellScript,
        npmScript,
        estimatedTimeSaved,
        confidence
      });
    }
    
    // Sort by confidence
    this.automationSuggestions.sort((a, b) => b.confidence - a.confidence);
    
    // Keep only the top 10 suggestions
    if (this.automationSuggestions.length > 10) {
      this.automationSuggestions = this.automationSuggestions.slice(0, 10);
    }
  }
  
  /**
   * Generate a name for a command pattern
   */
  private generatePatternName(commands: string[]): string {
    // Extract the primary commands (first word of each command)
    const primaryCommands = commands.map(cmd => {
      const parts = cmd.trim().split(' ');
      return parts[0];
    });
    
    // Check for common patterns
    if (primaryCommands.includes('git')) {
      if (commands.some(cmd => cmd.includes('push'))) {
        return 'Git Push Workflow';
      }
      if (commands.some(cmd => cmd.includes('pull'))) {
        return 'Git Pull Workflow';
      }
      return 'Git Workflow';
    }
    
    if (primaryCommands.includes('npm') || primaryCommands.includes('yarn')) {
      if (commands.some(cmd => cmd.includes('build'))) {
        return 'NPM Build Workflow';
      }
      if (commands.some(cmd => cmd.includes('test'))) {
        return 'NPM Test Workflow';
      }
      return 'NPM Workflow';
    }
    
    if (primaryCommands.includes('docker')) {
      return 'Docker Workflow';
    }
    
    if (primaryCommands.includes('kubectl')) {
      return 'Kubernetes Workflow';
    }
    
    // Generic name based on first and last command
    const firstCmd = primaryCommands[0];
    const lastCmd = primaryCommands[primaryCommands.length - 1];
    
    if (firstCmd === lastCmd) {
      return `${firstCmd.charAt(0).toUpperCase() + firstCmd.slice(1)} Sequence`;
    }
    
    return `${firstCmd.charAt(0).toUpperCase() + firstCmd.slice(1)} to ${lastCmd} Workflow`;
  }
  
  /**
   * Generate tags for a command pattern
   */
  private generateTags(commands: string[]): string[] {
    const tags: Set<string> = new Set();
    
    // Check for common tools and operations
    for (const cmd of commands) {
      const lcCmd = cmd.toLowerCase();
      
      if (lcCmd.includes('git')) tags.add('git');
      if (lcCmd.includes('docker')) tags.add('docker');
      if (lcCmd.includes('kubectl')) tags.add('kubernetes');
      if (lcCmd.includes('npm') || lcCmd.includes('yarn')) tags.add('npm');
      if (lcCmd.includes('build')) tags.add('build');
      if (lcCmd.includes('test')) tags.add('test');
      if (lcCmd.includes('deploy') || lcCmd.includes('publish')) tags.add('deploy');
      if (lcCmd.includes('aws')) tags.add('aws');
      if (lcCmd.includes('gcloud')) tags.add('gcp');
      if (lcCmd.includes('azure')) tags.add('azure');
    }
    
    // Always add automation tag
    tags.add('automation');
    
    return Array.from(tags);
  }
  
  /**
   * Detect shell type based on environment
   */
  private detectShellType(): 'bash' | 'zsh' | 'powershell' | 'cmd' | 'fish' | 'unknown' {
    const shell = process.env.SHELL || defaultShell;
    
    if (shell.includes('bash')) return 'bash';
    if (shell.includes('zsh')) return 'zsh';
    if (shell.includes('powershell') || shell.includes('pwsh')) return 'powershell';
    if (shell.includes('cmd') || shell.includes('cmd.exe')) return 'cmd';
    if (shell.includes('fish')) return 'fish';
    
    // Try to detect platform
    if (process.platform === 'win32') {
      return 'powershell'; // Default to PowerShell on Windows
    }
    
    return 'bash'; // Default to bash on other platforms
  }
  
  /**
   * Get path to shell history file
   */
  private getShellHistoryPath(): string {
    const homeDir = os.homedir();
    
    switch (this.shellType) {
      case 'bash':
        return path.join(homeDir, '.bash_history');
      case 'zsh':
        return path.join(homeDir, '.zsh_history');
      case 'powershell':
        return path.join(homeDir, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'PowerShell', 'PSReadLine', 'ConsoleHost_history.txt');
      case 'fish':
        return path.join(homeDir, '.local', 'share', 'fish', 'fish_history');
      default:
        return '';
    }
  }
  
  /**
   * Get shell execute command for running scripts
   */
  private getShellExecuteCommand(scriptPath: string): string {
    switch (this.shellType) {
      case 'bash':
        return `bash "${scriptPath}"`;
      case 'zsh':
        return `zsh "${scriptPath}"`;
      case 'powershell':
        return `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`;
      case 'cmd':
        return `cmd.exe /c "${scriptPath}"`;
      case 'fish':
        return `fish "${scriptPath}"`;
      default:
        return `sh "${scriptPath}"`;
    }
  }
  
  /**
   * Load saved data
   */
  private async loadData(): Promise<void> {
    try {
      const historyPath = path.join(this.dataDir, 'history.json');
      const patternsPath = path.join(this.dataDir, 'patterns.json');
      const suggestionsPath = path.join(this.dataDir, 'suggestions.json');
      
      // Load history
      try {
        const historyData = await fs.readFile(historyPath, 'utf-8');
        const history = JSON.parse(historyData);
        
        this.historyEntries = history.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
      } catch (error) {
        // History file doesn't exist yet
        this.historyEntries = [];
      }
      
      // Load patterns
      try {
        const patternsData = await fs.readFile(patternsPath, 'utf-8');
        const patterns = JSON.parse(patternsData);
        
        this.commandPatterns = patterns.map((pattern: any) => ({
          ...pattern,
          lastUsed: new Date(pattern.lastUsed)
        }));
      } catch (error) {
        // Patterns file doesn't exist yet
        this.commandPatterns = [];
      }
      
      // Load suggestions
      try {
        const suggestionsData = await fs.readFile(suggestionsPath, 'utf-8');
        this.automationSuggestions = JSON.parse(suggestionsData);
      } catch (error) {
        // Suggestions file doesn't exist yet
        this.automationSuggestions = [];
      }
    } catch (error) {
      console.error('Failed to load command history data:', error);
    }
  }
  
  /**
   * Save data to disk
   */
  private async saveData(): Promise<void> {
    try {
      // Limit history entries to last 1000
      const historyToSave = this.historyEntries.slice(-1000);
      
      // Save history
      await fs.writeFile(
        path.join(this.dataDir, 'history.json'),
        JSON.stringify(historyToSave),
        'utf-8'
      );
      
      // Save patterns
      await fs.writeFile(
        path.join(this.dataDir, 'patterns.json'),
        JSON.stringify(this.commandPatterns),
        'utf-8'
      );
      
      // Save suggestions
      await fs.writeFile(
        path.join(this.dataDir, 'suggestions.json'),
        JSON.stringify(this.automationSuggestions),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save command history data:', error);
    }
  }
}