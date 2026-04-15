#!/usr/bin/env node
/**
 * Push Notification Test Script
 *
 * Usage:
 *   node scripts/test-push.js                    # Run all tests
 *   node scripts/test-push.js --send <user_id>   # Send test notification to a user
 *   node scripts/test-push.js --list              # List all subscriptions
 */

require('dotenv').config();
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const TESTS = {
  passed: 0,
  failed: 0,
  results: []
};

function log(status, msg) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
  console.log(`  ${icon} ${msg}`);
  if (status === 'PASS') TESTS.passed++;
  if (status === 'FAIL') TESTS.failed++;
  TESTS.results.push({ status, msg });
}

async function testVapidConfig() {
  console.log('\n📋 1. VAPID Configuration');

  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (pub && pub.length > 20) {
    log('PASS', `VAPID_PUBLIC_KEY set (${pub.length} chars)`);
  } else {
    log('FAIL', 'VAPID_PUBLIC_KEY missing or too short');
  }

  if (priv && priv.length > 20) {
    log('PASS', 'VAPID_PRIVATE_KEY set');
  } else {
    log('FAIL', 'VAPID_PRIVATE_KEY missing or too short');
  }

  if (subject && subject.startsWith('mailto:')) {
    log('PASS', `VAPID_SUBJECT: ${subject}`);
  } else {
    log('FAIL', 'VAPID_SUBJECT missing or invalid (must start with mailto:)');
  }

  // Test that keys work together
  try {
    webpush.setVapidDetails(subject || 'mailto:test@test.com', pub, priv);
    log('PASS', 'VAPID keys are valid and compatible');
  } catch (err) {
    log('FAIL', `VAPID keys invalid: ${err.message}`);
  }
}

async function testDatabaseTable() {
  console.log('\n📋 2. Database Table');

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id')
    .limit(1);

  if (error) {
    log('FAIL', `push_subscriptions table error: ${error.message}`);
  } else {
    log('PASS', 'push_subscriptions table exists and is accessible');
  }
}

async function testSubscriptions() {
  console.log('\n📋 3. Stored Subscriptions');

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, created_at');

  if (error) {
    log('FAIL', `Query error: ${error.message}`);
    return [];
  }

  if (data.length === 0) {
    log('INFO', 'No subscriptions found. Subscribe from the browser first.');
  } else {
    log('PASS', `${data.length} subscription(s) found`);
    data.forEach(sub => {
      const provider = sub.endpoint.includes('fcm.googleapis.com') ? 'FCM (Chrome)'
        : sub.endpoint.includes('mozilla.com') ? 'Mozilla (Firefox)'
        : sub.endpoint.includes('windows.com') ? 'WNS (Edge)'
        : 'Unknown';
      console.log(`       user: ${sub.user_id}`);
      console.log(`       provider: ${provider}`);
      console.log(`       created: ${sub.created_at}`);
    });
  }

  return data || [];
}

async function testApiEndpoints() {
  console.log('\n📋 4. API Endpoints');

  // Test VAPID public key endpoint
  try {
    const res = await fetch(`http://localhost:${process.env.PORT || 5001}/api/push/vapid-public-key`);
    const json = await res.json();
    if (res.ok && json.success && json.key) {
      log('PASS', 'GET /api/push/vapid-public-key returns key');
    } else {
      log('FAIL', `GET /api/push/vapid-public-key: ${JSON.stringify(json)}`);
    }
  } catch (err) {
    log('FAIL', `GET /api/push/vapid-public-key: ${err.message} (is the server running?)`);
  }

  // Test subscribe without auth (should fail with 401)
  try {
    const res = await fetch(`http://localhost:${process.env.PORT || 5001}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: 'test', keys: { p256dh: 'x', auth: 'y' } })
    });
    if (res.status === 401 || res.status === 403) {
      log('PASS', 'POST /api/push/subscribe requires authentication');
    } else {
      log('FAIL', `POST /api/push/subscribe returned ${res.status} (expected 401/403)`);
    }
  } catch (err) {
    log('FAIL', `POST /api/push/subscribe: ${err.message}`);
  }
}

async function testSendNotification(userId) {
  console.log('\n📋 5. Send Test Notification');

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (!subs || subs.length === 0) {
    log('FAIL', `No subscriptions found for user ${userId}`);
    return;
  }

  const payload = JSON.stringify({
    title: 'পরীক্ষামূলক বিজ্ঞপ্তি',
    body: 'এটি একটি পরীক্ষামূলক পুশ বিজ্ঞপ্তি। সবকিছু সঠিকভাবে কাজ করছে!',
    url: '/',
    icon: '/icons/icon-192.png'
  });

  let sent = 0, failed = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
    } catch (err) {
      failed++;
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log(`       Subscription expired (${err.statusCode}), should be cleaned up`);
      } else {
        console.log(`       Error: ${err.statusCode || err.message}`);
      }
    }
  }

  if (sent > 0) {
    log('PASS', `Sent ${sent}/${subs.length} notification(s) — check your browser!`);
  } else {
    log('FAIL', `All ${failed} notification(s) failed to send`);
  }
}

async function listSubscriptions() {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log(`\n📋 Push Subscriptions (${data.length} total)\n`);
  if (data.length === 0) {
    console.log('  No subscriptions found.');
    return;
  }

  data.forEach((sub, i) => {
    console.log(`  ${i + 1}. User: ${sub.user_id}`);
    console.log(`     Endpoint: ${sub.endpoint.substring(0, 70)}...`);
    console.log(`     Created: ${sub.created_at}\n`);
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--list') {
    await listSubscriptions();
    process.exit(0);
  }

  if (args[0] === '--send') {
    const userId = args[1];
    if (!userId) {
      console.error('Usage: node scripts/test-push.js --send <user_id>');
      process.exit(1);
    }
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:test@test.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    await testSendNotification(userId);
    process.exit(TESTS.failed > 0 ? 1 : 0);
  }

  // Run all tests
  console.log('🔔 Push Notification Test Suite');
  console.log('================================');

  await testVapidConfig();
  await testDatabaseTable();
  const subs = await testSubscriptions();
  await testApiEndpoints();

  if (subs.length > 0) {
    await testSendNotification(subs[0].user_id);
  }

  // Summary
  console.log('\n================================');
  console.log(`Results: ${TESTS.passed} passed, ${TESTS.failed} failed`);
  if (TESTS.failed === 0) {
    console.log('🎉 All tests passed!');
  }

  process.exit(TESTS.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
