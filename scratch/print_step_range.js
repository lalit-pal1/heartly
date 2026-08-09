const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\Lalit\\.gemini\\antigravity\\brain\\bb5b5e86-268e-4fc3-9036-a8b6ec03fdd2\\.system_generated\\logs\\transcript_full.jsonl';

async function run() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const steps = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      steps.push(JSON.parse(line));
    } catch(e) {}
  }

  const range = steps.filter(s => s.step_index >= 2585 && s.step_index <= 2610);
  for (const step of range) {
    console.log(`\n--- Step ${step.step_index} (${step.source}, ${step.type}) ---`);
    console.log("Content:", step.content);
    if (step.tool_calls) {
      console.log("Tool Calls:", JSON.stringify(step.tool_calls, null, 2));
    }
  }
}

run();
