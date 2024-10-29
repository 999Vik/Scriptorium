// pages/api/code/execute.js

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Promisify exec for async/await usage
const execAsync = promisify(exec);

// Define supported languages and their configurations
const languageConfigs = {
  C: {
    extension: 'c',
    compile: (fileName) => `gcc ${fileName} -o ${fileName.replace('.c', '')}`,
    execute: (fileName) => `./${fileName.replace('.c', '')}`,
  },
  CPP: {
    extension: 'cpp',
    compile: (fileName) => `g++ ${fileName} -o ${fileName.replace('.cpp', '')}`,
    execute: (fileName) => `./${fileName.replace('.cpp', '')}`,
  },
  JAVA: {
    extension: 'java',
    compile: (fileName) => `javac ${fileName}`,
    execute: (fileName) => `java ${fileName.replace('.java', '')}`,
  },
  PYTHON: {
    extension: 'py',
    compile: null, // No compilation needed
    execute: (fileName) => `python3 ${fileName}`,
  },
  JAVASCRIPT: {
    extension: 'js',
    compile: null, // No compilation needed
    execute: (fileName) => `node ${fileName}`,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { code, language, stdin } = req.body;

  // Validate input
  if (!code || !language) {
    return res.status(400).json({ error: 'Missing code or language' });
  }

  const config = languageConfigs[language.toUpperCase()];

  if (!config) {
    return res.status(400).json({ error: 'Unsupported language' });
  }

  // Create a unique temporary file name
  const uniqueId = Date.now();
  const fileName = `temp-${uniqueId}.${config.extension}`;
  const filePath = path.join('/tmp', fileName);

  try {
    // Write the code to the temporary file
    fs.writeFileSync(filePath, code);

    let compileCommand = null;
    let executeCommand = null;

    if (config.compile) {
      compileCommand = config.compile(filePath);
      executeCommand = config.execute(filePath);
    } else {
      executeCommand = config.execute(filePath);
    }

    // Compilation step (if applicable)
    if (compileCommand) {
      try {
        await execAsync(compileCommand, { timeout: 5000 });
      } catch (compileError) {
        // Clean up the temporary file
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: compileError.stderr || 'Compilation failed' });
      }
    }

    // Execution step
    try {
      const { stdout, stderr } = await execAsync(
        executeCommand,
        {
          timeout: 5000, // 5 seconds timeout
          input: stdin || undefined, // Pass stdin if provided
        }
      );

      // Clean up the temporary file and any compiled binaries
      fs.unlinkSync(filePath);
      if (compileCommand) {
        const binaryName = executeCommand.split(' ')[0]; // e.g., './temp-123.c'
        const binaryPath = path.join('/tmp', binaryName.replace('./', ''));
        if (fs.existsSync(binaryPath)) {
          fs.unlinkSync(binaryPath);
        }
        if (language.toUpperCase() === 'JAVA') {
          const classFile = `${binaryName.replace('./', '')}.class`;
          const classPath = path.join('/tmp', classFile);
          if (fs.existsSync(classPath)) {
            fs.unlinkSync(classPath);
          }
        }
      }

      return res.status(200).json({ output: stdout, error: stderr });
    } catch (executionError) {
      // Clean up the temporary file and any compiled binaries
      fs.unlinkSync(filePath);
      if (compileCommand) {
        const binaryName = executeCommand.split(' ')[0];
        const binaryPath = path.join('/tmp', binaryName.replace('./', ''));
        if (fs.existsSync(binaryPath)) {
          fs.unlinkSync(binaryPath);
        }
        if (language.toUpperCase() === 'JAVA') {
          const classFile = `${binaryName.replace('./', '')}.class`;
          const classPath = path.join('/tmp', classFile);
          if (fs.existsSync(classPath)) {
            fs.unlinkSync(classPath);
          }
        }
      }

      // Check if the error was due to a timeout
      if (executionError.killed) {
        return res.status(400).json({ error: 'Execution timed out' });
      }

      return res.status(400).json({ error: executionError.stderr || executionError.message });
    }
  } catch (err) {
    console.error('Error executing code:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
