const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const readline = require('readline');
const { spawn } = require('child_process');

function promptForLogin() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('You are not logged in to Convex. Would you like to login now? (y/N) ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

function runConvexLogin() {
  return new Promise((resolve, reject) => {
    const loginProcess = spawn('npx', ['convex', 'login'], {
      stdio: 'inherit'
    });

    loginProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Login process exited with code ${code}`));
      }
    });

    loginProcess.on('error', (err) => {
      reject(err);
    });
  });
}

async function setupConvexToken() {
  try {
    // Determine the config file path based on OS
    const homeDir = os.homedir();
    const configPath = path.join(homeDir, '.convex', 'config.json');
    
    // Try to read the Convex config file
    let configData;
    try {
      configData = await fs.readFile(configPath, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Config file doesn't exist, ask user to login
        const shouldLogin = await promptForLogin();
        if (shouldLogin) {
          await runConvexLogin();
          // Try reading the config file again after login
          configData = await fs.readFile(configPath, 'utf-8');
        } else {
          console.error('Convex login is required to use this package.');
          process.exit(1);
        }
      } else {
        throw error;
      }
    }

    const { accessToken } = JSON.parse(configData);
    
    if (!accessToken) {
      const shouldLogin = await promptForLogin();
      if (shouldLogin) {
        await runConvexLogin();
        // Try reading the config file again after login
        configData = await fs.readFile(configPath, 'utf-8');
        const newConfig = JSON.parse(configData);
        if (!newConfig.accessToken) {
          throw new Error('No access token found after login');
        }
      } else {
        console.error('Convex login is required to use this package.');
        process.exit(1);
      }
    }

    // Read existing .env file or create new one
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch (error) {
      // File doesn't exist, that's okay
    }

    // Check if CONVEX_ACCESS_TOKEN already exists
    const envLines = envContent.split('\n');
    const tokenExists = envLines.some(line => line.startsWith('CONVEX_ACCESS_TOKEN='));

    if (!tokenExists) {
      // Add the token to .env
      const newEnvContent = `${envContent}\nCONVEX_ACCESS_TOKEN=${accessToken}`.trim();
      await fs.writeFile(envPath, newEnvContent);
      console.log('Added Convex access token to .env file');
    } else {
      console.log('Convex access token already exists in .env file');
    }

  } catch (error) {
    console.error('Error setting up Convex token:', error.message);
    process.exit(1);
  }
}

setupConvexToken(); 