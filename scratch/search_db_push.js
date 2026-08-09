const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\Lalit\\.gemini\\antigravity\\brain\\bb5b5e86-268e-4fc3-9036-a8b6ec03fdd2\\.system_generated\\logs\\transcript.jsonl';

async function run() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Searching for db push execution results...");
  
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const step = JSON.parse(line);
      const contentStr = JSON.stringify(step);
      if (contentStr.includes('db push')) {
        console.log(`\n--- Step ${step.step_index} (${step.created_at}) ---`);
        console.log("Content:", step.content);
        if (step.tool_calls) {
          console.log("Tool Calls:", JSON.stringify(step.tool_calls, null, 2));
        }
      }
    } catch (e) {}
  }
}

run();
