const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\Lalit\\.gemini\\antigravity\\brain\\bb5b5e86-268e-4fc3-9036-a8b6ec03fdd2\\.system_generated\\logs\\transcript.jsonl';

async function run() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Searching for how migrations were applied...");
  
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const step = JSON.parse(line);
      const contentStr = JSON.stringify(step);
      // Let's search for any tool calls that run commands related to "migration" or "run" or "db" or "push"
      if (step.tool_calls && step.tool_calls.length > 0) {
        for (const tc of step.tool_calls) {
          if (tc.name === 'run_command') {
            const cmd = tc.args.CommandLine || '';
            if (cmd.includes('db') || cmd.includes('supabase') || cmd.includes('migration') || cmd.includes('sql')) {
              console.log(`\n--- Step ${step.step_index} (${step.created_at}) ---`);
              console.log("Command:", cmd);
              console.log("Tool Response:", step.status);
            }
          }
        }
      }
    } catch (e) {}
  }
}

run();
