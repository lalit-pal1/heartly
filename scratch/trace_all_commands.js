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

  console.log(`Total steps parsed: ${steps.length}`);
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step.tool_calls && step.tool_calls.length > 0) {
      for (const tc of step.tool_calls) {
        if (tc.name === 'run_command') {
          const cmd = tc.args.CommandLine || '';
          if (cmd.includes('db push') || cmd.includes('supabase link')) {
            console.log(`\n--- Step ${step.step_index} (${step.created_at}) ---`);
            console.log("Command:", cmd);
            // Print the system response step if it follows
            const nextStep = steps[i + 1];
            if (nextStep && nextStep.source === 'SYSTEM') {
              console.log("System response:", nextStep.content);
            } else {
              // Find the next system response with priority/type
              const responseStep = steps.slice(i+1, i+10).find(s => s.source === 'SYSTEM' || (s.type === 'USER_INPUT' && s.content.includes('SYSTEM_MESSAGE')));
              if (responseStep) {
                console.log("Found Response:", responseStep.content);
              }
            }
          }
        }
      }
    }
  }
}

run();
