const fs = require('fs');
const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('========================================');
console.log('Medication Reminder PWA Setup');
console.log('========================================\n');

// Generate VAPID keys
console.log('Generating VAPID keys...\n');

exec('npx web-push generate-vapid-keys', (error, stdout, stderr) => {
  if (error) {
    console.error('Error generating VAPID keys:', error);
    process.exit(1);
  }

  const lines = stdout.split('\n');
  let publicKey = '';
  let privateKey = '';

  lines.forEach(line => {
    if (line.includes('Public Key:')) {
      publicKey = line.split('Public Key:')[1].trim();
    }
    if (line.includes('Private Key:')) {
      privateKey = line.split('Private Key:')[1].trim();
    }
  });

  if (!publicKey || !privateKey) {
    console.error('Failed to parse VAPID keys');
    process.exit(1);
  }

  console.log('✅ VAPID keys generated!\n');
  console.log('Public Key:', publicKey);
  console.log('Private Key:', privateKey);
  console.log('');

  rl.question('Enter your email for VAPID subject (e.g., mailto:you@example.com): ', (email) => {
    // Update .env file
    const envContent = `VAPID_PUBLIC_KEY=${publicKey}
VAPID_PRIVATE_KEY=${privateKey}
VAPID_SUBJECT=${email}
`;
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file updated');

    // Update index.html
    let indexHtml = fs.readFileSync('public/index.html', 'utf8');
    indexHtml = indexHtml.replace(
      /const VAPID_PUBLIC_KEY = '[^']*';/,
      `const VAPID_PUBLIC_KEY = '${publicKey}';`
    );
    fs.writeFileSync('public/index.html', indexHtml);
    console.log('✅ public/index.html updated');

    console.log('\n========================================');
    console.log('Setup complete!');
    console.log('========================================\n');
    console.log('Run "npm run dev" to start the development server');
    console.log('Then open http://localhost:8888 in your browser\n');

    rl.close();
  });
});
