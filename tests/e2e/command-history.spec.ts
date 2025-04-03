import { CommandHistoryAnalyzer, CommandHistoryEntry, CommandPattern, AutomationSuggestion } from './command-history.spec';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('child_process');
// NOTE: You might need to install types for default-shell: `npm install --save-dev @types/default-shell` or `yarn add --dev @types/default-shell`
// If default-shell is not installed, run: `npm install default-shell` or `yarn add default-shell`
jest.mock('default-shell', () => 'bash'); // Mock default shell

const execAsync = promisify(exec);
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedExec = exec as jest.MockedFunction<typeof exec>;

// Helper function to create realistic delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('CommandHistoryAnalyzer E2E Tests', () => {
  let analyzer: CommandHistoryAnalyzer;
  const testDataDir = path.join(os.tmpdir(), `aui-test-data-${Date.now()}`);
  const historyFilePath = path.join(testDataDir, 'history.json');
  const patternsFilePath = path.join(testDataDir, 'patterns.json');
  const suggestionsFilePath = path.join(testDataDir, 'suggestions.json');
  const shellHistoryPath = path.join(os.homedir(), '.bash_history'); // Assuming bash for mock

  beforeEach(async () => {
    // Reset mocks and create a fresh analyzer instance for each test
    jest.clearAllMocks();

    // Mock fs operations for the test directory
    mockedFs.mkdir.mockResolvedValue(undefined);
    mockedFs.writeFile.mockResolvedValue(undefined);
    // Simulate file not found initially for loading
    mockedFs.readFile.mockRejectedValue({ code: 'ENOENT' });

    // Mock shell history reading
    mockedFs.readFile.calledWith(shellHistoryPath, 'utf-8').mockResolvedValue(''); // Start with empty shell history

    analyzer = new CommandHistoryAnalyzer(testDataDir);
    // We need to explicitly call initialize in tests where it's needed
  });

  afterEach(async () => {
    // Clean up test data directory (optional, as it's in tmpdir)
    // You might want to add actual cleanup logic if needed, e.g., using fs.rm
  });

  // --- Test Cases ---

  test('should initialize correctly, create data directory, and load empty data', async () => {
    await analyzer.initialize();

    expect(mockedFs.mkdir).toHaveBeenCalledWith(testDataDir, { recursive: true });
    expect(mockedFs.readFile).toHaveBeenCalledWith(historyFilePath, 'utf-8');
    expect(mockedFs.readFile).toHaveBeenCalledWith(patternsFilePath, 'utf-8');
    expect(mockedFs.readFile).toHaveBeenCalledWith(suggestionsFilePath, 'utf-8');
    expect(mockedFs.readFile).toHaveBeenCalledWith(shellHistoryPath, 'utf-8'); // Called during import
    expect(analyzer.getHistoryEntries()).toEqual([]);
    expect(analyzer.getCommandPatterns()).toEqual([]);
    expect(analyzer.getAutomationSuggestions()).toEqual([]);
  });

  test('should record a command, save it, and update history', async () => {
    await analyzer.initialize(); // Needed to load/create files first
    const command = 'npm install';
    const directory = '/path/to/project';
    const exitCode = 0;
    const output = 'Installed packages.';
    const duration = 1500;

    const entry = await analyzer.recordCommand(command, directory, exitCode, output, duration);

    expect(entry.command).toBe(command);
    expect(entry.directory).toBe(directory);
    expect(entry.exitCode).toBe(exitCode);
    expect(entry.output).toBe(output);
    expect(entry.duration).toBe(duration);
    expect(entry.timestamp).toBeInstanceOf(Date);

    const history = analyzer.getHistoryEntries();
    expect(history).toHaveLength(1);
    expect(history[0]).toEqual(entry);

    // Check if data was saved
    expect(mockedFs.writeFile).toHaveBeenCalledWith(
        historyFilePath,
        expect.stringContaining(command), // Check if the command is in the saved string
        'utf-8'
    );
    // analyzePatterns is called, so patterns/suggestions might also be saved
    expect(mockedFs.writeFile).toHaveBeenCalledWith(patternsFilePath, '[]', 'utf-8');
    expect(mockedFs.writeFile).toHaveBeenCalledWith(suggestionsFilePath, '[]', 'utf-8');
  });

   test('should retrieve history entries sorted by timestamp (newest first)', async () => {
    await analyzer.initialize();
    await analyzer.recordCommand('cmd1', '/dir1');
    await delay(10); // Ensure distinct timestamps
    await analyzer.recordCommand('cmd2', '/dir2');
    await delay(10);
    await analyzer.recordCommand('cmd3', '/dir1');

    const history = analyzer.getHistoryEntries();
    expect(history).toHaveLength(3);
    expect(history[0].command).toBe('cmd3');
    expect(history[1].command).toBe('cmd2');
    expect(history[2].command).toBe('cmd1');
  });

  test('should filter history entries by command or directory', async () => {
    await analyzer.initialize();
    await analyzer.recordCommand('npm install', '/projectA');
    await delay(10);
    await analyzer.recordCommand('npm test', '/projectB');
    await delay(10);
    await analyzer.recordCommand('git status', '/projectA');

    const npmHistory = analyzer.getHistoryEntries(100, 'npm');
    expect(npmHistory).toHaveLength(2);
    expect(npmHistory.every(e => e.command.includes('npm'))).toBe(true);

    const projectAHistory = analyzer.getHistoryEntries(100, 'projecta'); // Case-insensitive
    expect(projectAHistory).toHaveLength(2);
    expect(projectAHistory.every(e => e.directory?.includes('projectA'))).toBe(true);
  });

  test('should detect a simple command sequence pattern', async () => {
    await analyzer.initialize();
    // Sequence: git pull -> npm install -> npm run dev
    const sequence = ['git pull', 'npm install', 'npm run dev'];
    for (let i = 0; i < 3; i++) {
        for (const cmd of sequence) {
            await analyzer.recordCommand(cmd, '/project');
            await delay(5);
        }
        // Add some noise
        await analyzer.recordCommand('ls -la', '/project');
        await delay(5);
    }

    // analyzePatterns is called implicitly after each recordCommand,
    // but we call it explicitly ensure the latest state is analyzed if needed,
    // although in this setup it might be redundant.
    analyzer.analyzePatterns();

    const patterns = analyzer.getCommandPatterns();
    // Expecting the 3-command sequence pattern
    expect(patterns.length).toBeGreaterThanOrEqual(1);

    const detectedPattern = patterns.find(p => p.commands.join('|') === sequence.join('|'));
    expect(detectedPattern).toBeDefined();
    expect(detectedPattern?.commands).toEqual(sequence);
    expect(detectedPattern?.frequency).toBe(3);
    expect(detectedPattern?.name).toContain('Git to dev Workflow'); // Based on generatePatternName
    expect(detectedPattern?.tags).toEqual(expect.arrayContaining(['git', 'npm', 'automation']));
  });

   test('should generate automation suggestions for frequent patterns', async () => {
    await analyzer.initialize();
    const sequence = ['docker build . -t myapp', 'docker push myapp:latest'];
     // Record the sequence 5 times (above frequency threshold of 3)
    for (let i = 0; i < 5; i++) {
        for (const cmd of sequence) {
            await analyzer.recordCommand(cmd, '/app');
            await delay(5);
        }
    }

    analyzer.analyzePatterns(); // Trigger analysis

    const suggestions = analyzer.getAutomationSuggestions();
    expect(suggestions.length).toBeGreaterThanOrEqual(1);

    const suggestion = suggestions.find(s => s.commands.join('|') === sequence.join('|'));
    expect(suggestion).toBeDefined();
    expect(suggestion?.name).toContain('Docker Workflow');
    expect(suggestion?.commands).toEqual(sequence);
    expect(suggestion?.frequency).toBe(5); // The pattern frequency should be 5
    expect(suggestion?.confidence).toBeGreaterThan(50); // Expect reasonable confidence
    expect(suggestion?.shellScript).toContain('#!/bin/bash'); // Assuming bash mock
    expect(suggestion?.shellScript).toContain(sequence[0]);
    expect(suggestion?.shellScript).toContain(sequence[1]);
    expect(suggestion?.npmScript).toBeUndefined(); // No npm commands
  });

   test('should generate correct shell script for bash/zsh', async () => {
        // Analyzer is already mocked to use 'bash'
        await analyzer.initialize();
        const pattern: CommandPattern = {
            id: 'test-pattern',
            name: 'Test Bash Script',
            description: 'Test desc',
            commands: ['echo "Step 1"', 'sleep 1', 'echo "Step 2"'],
            frequency: 3,
            lastUsed: new Date(),
            tags: ['test'],
        };
        const script = analyzer.generateShellScript(pattern);
        expect(script).toContain('#!/bin/bash');
        expect(script).toContain('# Test Bash Script');
        expect(script).toContain('set -e');
        expect(script).toContain('echo "Running: echo \\"Step 1\\""');
        expect(script).toContain('echo "Step 1"');
        expect(script).toContain('echo "Running: sleep 1"');
        expect(script).toContain('sleep 1');
        expect(script).toContain('echo "Running: echo \\"Step 2\\""');
        expect(script).toContain('echo "Step 2"');
        expect(script).toContain('echo "Done!"');
    });

    // Add similar test for powershell if needed, mocking detectShellType accordingly

    test('should generate correct npm script', async () => {
        await analyzer.initialize();
         const pattern: CommandPattern = {
            id: 'npm-pattern',
            name: 'Test NPM Script',
            description: 'Test desc',
            commands: ['npm install', 'npm run build', 'npm test'],
            frequency: 5,
            lastUsed: new Date(),
            tags: ['npm', 'build', 'test'],
        };
        const script = analyzer.generateNpmScript(pattern);
        expect(script).toBe('npm install && npm run build && npm test');
    });

    test('should execute a script successfully (mocked)', async () => {
        await analyzer.initialize();
        const pattern: CommandPattern = {
            id: 'exec-pattern',
            name: 'Test Exec',
            description: 'Test exec desc',
            commands: ['echo "Executing"'],
            frequency: 1,
            lastUsed: new Date(),
            tags: [],
        };

        // Mock exec behavior for success
        mockedExec.mockImplementation((command, options, callback) => {
            // Check if it's trying to execute the script
            if (command.includes('aui-script-exec-pattern.sh')) {
                 // Simulate success
                 callback?.(null, 'Script output', ''); // (error, stdout, stderr)
            } else {
                callback?.(new Error('Unexpected command'), '', '');
            }
            // Return a dummy child process object
             return { } as any;
        });


        // Mock script file writing and deletion
        const scriptPath = path.join(os.tmpdir(), `aui-script-${pattern.id}.sh`);
        mockedFs.writeFile.mockResolvedValue(undefined);
        mockedFs.chmod.mockResolvedValue(undefined); // For bash/zsh
        mockedFs.unlink.mockResolvedValue(undefined);

        const result = await analyzer.executeScript(pattern);

        expect(mockedFs.writeFile).toHaveBeenCalledWith(scriptPath, expect.any(String), 'utf-8');
        expect(mockedFs.chmod).toHaveBeenCalledWith(scriptPath, 0o755); // Ensure executable
        expect(mockedExec).toHaveBeenCalledWith(`bash "${scriptPath}"`, expect.any(Function));
        expect(mockedFs.unlink).toHaveBeenCalledWith(scriptPath);
        expect(result.success).toBe(true);
        expect(result.output).toBe('Script output');
        expect(result.error).toBeUndefined();
    });

     test('should handle script execution failure (mocked)', async () => {
        await analyzer.initialize();
        const pattern: CommandPattern = {
            id: 'fail-pattern',
            name: 'Test Fail Exec',
            description: 'Test fail desc',
            commands: ['exit 1'],
            frequency: 1,
            lastUsed: new Date(),
            tags: [],
        };

        // Mock exec behavior for failure
        const mockError = new Error('Command failed');
        (mockError as any).code = 1; // Add exit code if needed
         mockedExec.mockImplementation((command, options, callback) => {
            if (command.includes('aui-script-fail-pattern.sh')) {
                 // Simulate failure
                 callback?.(mockError, '', 'Error details'); // (error, stdout, stderr)
            } else {
                 callback?.(new Error('Unexpected command'), '', '');
            }
            return {} as any;
        });


        const scriptPath = path.join(os.tmpdir(), `aui-script-${pattern.id}.sh`);
        mockedFs.writeFile.mockResolvedValue(undefined);
        mockedFs.chmod.mockResolvedValue(undefined);
        mockedFs.unlink.mockResolvedValue(undefined); // Unlink might still be called

        const result = await analyzer.executeScript(pattern);

        expect(result.success).toBe(false);
        expect(result.output).toBe('');
        expect(result.error).toContain('Command failed');
         // Check that the error object from exec is converted to string
        expect(result.error).toBe(mockError.toString());
        // Ensure cleanup is attempted even on failure
        expect(mockedFs.unlink).toHaveBeenCalledWith(scriptPath);
    });


    test('should import history from bash history file', async () => {
        const bashHistoryContent = `
#1678886400
echo "Hello"
#1678886405
ls -l
#1678886410
git status
cd ..
exit
`;
        mockedFs.readFile.calledWith(shellHistoryPath, 'utf-8').mockResolvedValue(bashHistoryContent);

        // Initialize AFTER setting up the mock for readFile
        analyzer = new CommandHistoryAnalyzer(testDataDir);
        await analyzer.initialize();

        const history = analyzer.getHistoryEntries();
        // Expecting 3 entries (echo, ls, git status) - cd and exit are ignored
        expect(history).toHaveLength(3);
        expect(history[0].command).toBe('git status'); // Sorted newest first
        expect(history[1].command).toBe('ls -l');
        expect(history[2].command).toBe('echo "Hello"');
        expect(history.some(e => e.command === 'cd ..')).toBe(false);
        expect(history.some(e => e.command === 'exit')).toBe(false);

        // Check if the imported data was saved
        expect(mockedFs.writeFile).toHaveBeenCalledWith(
            historyFilePath,
            expect.stringContaining('git status'),
            'utf-8'
        );
    });

     // Add similar tests for zsh and powershell history formats if needed

     test('should correctly load previously saved data on initialization', async () => {
        // 1. Setup initial state and save it
        const initialHistory = [{ command: 'initial_cmd', timestamp: new Date(Date.now() - 10000), directory: '/initial' }];
        const initialPatterns = [{ id: 'p1', name: 'Initial Pattern', commands: ['cmd1'], frequency: 5, lastUsed: new Date(Date.now() - 5000), tags:[] }];
        const initialSuggestions = [{ id: 's1', name: 'Initial Suggestion', commands: ['cmd1'], confidence: 80, shellScript: '', estimatedTimeSaved: 10 }];

        mockedFs.readFile.calledWith(historyFilePath, 'utf-8').mockResolvedValue(JSON.stringify(initialHistory));
        mockedFs.readFile.calledWith(patternsFilePath, 'utf-8').mockResolvedValue(JSON.stringify(initialPatterns));
        mockedFs.readFile.calledWith(suggestionsFilePath, 'utf-8').mockResolvedValue(JSON.stringify(initialSuggestions));
        mockedFs.readFile.calledWith(shellHistoryPath, 'utf-8').mockResolvedValue(''); // No shell history import for this test

        // 2. Create a new analyzer instance and initialize
        const newAnalyzer = new CommandHistoryAnalyzer(testDataDir);
        await newAnalyzer.initialize();

        // 3. Verify the loaded data
        const loadedHistory = newAnalyzer.getHistoryEntries();
        expect(loadedHistory).toHaveLength(1);
        expect(loadedHistory[0].command).toBe('initial_cmd');
        // Timestamps are deserialized as strings, then converted back to Dates
        expect(loadedHistory[0].timestamp).toEqual(initialHistory[0].timestamp);


        const loadedPatterns = newAnalyzer.getCommandPatterns();
        expect(loadedPatterns).toHaveLength(1);
        expect(loadedPatterns[0].id).toBe('p1');
        expect(loadedPatterns[0].name).toBe('Initial Pattern');
        expect(loadedPatterns[0].lastUsed).toEqual(initialPatterns[0].lastUsed);


        const loadedSuggestions = newAnalyzer.getAutomationSuggestions();
        // NOTE: Suggestions are currently recalculated during analyzePatterns, which is called during recordCommand.
        // If initialize doesn't trigger analysis, suggestions might load but then get overridden.
        // The current implementation recalculates suggestions in analyzePatterns, let's test that flow instead.
        // For now, let's check if suggestions load, assuming analyzePatterns isn't called immediately on init
         expect(loadedSuggestions).toHaveLength(1); // This depends on whether analyzePatterns runs on init implicitly
         expect(loadedSuggestions[0].id).toBe('s1'); // This check might fail if suggestions are recalculated


        // To properly test loading AND recalculation:
        // Record a new command after loading to trigger analyzePatterns
        await newAnalyzer.recordCommand('new_cmd', '/new');
        const recalculatedSuggestions = newAnalyzer.getAutomationSuggestions();
        // Now assert based on expected recalculation logic
        // For example, if the initial pattern should create a suggestion:
        // expect(recalculatedSuggestions.some(s => s.id === 'suggestion-p1')).toBe(true);
    });

    test('should handle errors during file operations gracefully', async () => {
        // Mock readFile to throw an error other than ENOENT during load
        mockedFs.readFile.mockRejectedValue(new Error('Disk Read Error'));

        // Initialization should catch the error and log it (check console mock if needed)
        await expect(analyzer.initialize()).resolves.toBeUndefined(); // Should not throw
        // Check that the internal state is empty/default
        expect(analyzer.getHistoryEntries()).toEqual([]);

        // Mock writeFile to throw an error during save
        mockedFs.writeFile.mockRejectedValue(new Error('Disk Write Error'));
        // Recording should still update in-memory state but fail to save (and log error)
         await expect(analyzer.recordCommand('cmd1', '/dir')).resolves.toBeDefined(); // Should still return entry
         expect(analyzer.getHistoryEntries()).toHaveLength(1); // In-memory state updated

        // We can potentially mock console.error to check if errors were logged
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await analyzer.initialize(); // Trigger load error again
        await analyzer.recordCommand('cmd2', '/dir'); // Trigger save error again
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load'), expect.any(Error));
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to save'), expect.any(Error));
        consoleErrorSpy.mockRestore();

    });

    // Fix for linter error: 'error' is of type 'unknown'.
    test('executeScript should handle unknown error types', async () => {
        await analyzer.initialize();
        const pattern: CommandPattern = { id: 'error-pattern', name: 'Error Test', commands: ['fail'], frequency: 1, lastUsed: new Date(), tags: [] };

        // Mock exec to throw a non-Error object
         mockedExec.mockImplementation((command, options, callback) => {
             if (command.includes('aui-script-error-pattern.sh')) {
                  // Simulate failure with a non-standard error
                  callback?.('some error string', '', ''); // Pass a string instead of Error object
             } else {
                  callback?.(new Error('Unexpected command'), '', '');
             }
            return {} as any;
         });

        const scriptPath = path.join(os.tmpdir(), `aui-script-${pattern.id}.sh`);
        mockedFs.writeFile.mockResolvedValue(undefined);
        mockedFs.chmod.mockResolvedValue(undefined);
        mockedFs.unlink.mockResolvedValue(undefined);

        const result = await analyzer.executeScript(pattern);

        expect(result.success).toBe(false);
        expect(result.output).toBe('');
        // Ensure error.toString() is called safely
        expect(result.error).toBe('some error string');
    });

});
