const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, value] = line.split('=');
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

console.log('Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  try {
    // 1. Users
    const { data: users, count: usersCount, error: usersErr } = await supabase
      .from('users')
      .select('*', { count: 'exact' });
    if (usersErr) console.error('Users error:', usersErr);
    else {
      console.log('\n--- USERS ---');
      console.log('Total Users:', usersCount);
      console.log('Samples:', users.slice(0, 5).map(u => ({ id: u.id, email: u.email, full_name: u.full_name })));
    }

    // 2. Surprises
    const { data: surprises, count: surprisesCount, error: surprisesErr } = await supabase
      .from('surprises')
      .select('*', { count: 'exact' });
    if (surprisesErr) console.error('Surprises error:', surprisesErr);
    else {
      console.log('\n--- SURPRISES ---');
      console.log('Total Surprises:', surprisesCount);
      console.log('Samples:', surprises.slice(0, 3).map(s => ({ id: s.id, recipient: s.recipient_name, occasion: s.occasion, plan: s.plan_type, status: s.status })));
    }

    // 3. Orders
    const { data: orders, count: ordersCount, error: ordersErr } = await supabase
      .from('orders')
      .select('*', { count: 'exact' });
    if (ordersErr) console.error('Orders error:', ordersErr);
    else {
      console.log('\n--- ORDERS ---');
      console.log('Total Orders:', ordersCount);
      console.log('Samples:', orders.slice(0, 3).map(o => ({ id: o.id, amount: o.amount, status: o.payment_status, created: o.created_at })));
    }

    // 4. Surprise Views
    const { count: viewsCount, error: viewsErr } = await supabase
      .from('surprise_views')
      .select('*', { count: 'exact', head: true });
    if (viewsErr) console.error('Views error:', viewsErr);
    else {
      console.log('\n--- SURPRISE VIEWS ---');
      console.log('Total Views:', viewsCount);
    }
  } catch (err) {
    console.error('Execution error:', err);
  }
}

checkDb();
