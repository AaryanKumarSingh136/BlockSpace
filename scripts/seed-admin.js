const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadEnvFile(path.join(__dirname, '..', '.env.local'));
loadEnvFile(path.join(__dirname, '..', '.env.example'));

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required. Set it in .env.local or as an environment variable.');
  process.exit(1);
}

const adminEmail = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@blockspace.test';
const adminPassword = process.argv[3] || process.env.ADMIN_PASSWORD || 'Admin123!';
const adminName = process.env.ADMIN_NAME || 'Blockspace Admin';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['member', 'manager', 'orgAdmin', 'superAdmin'], default: 'member' },
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  club_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
  dept_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  joined_at: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seedAdmin() {
  await mongoose.connect(MONGODB_URI, { autoIndex: false });

  const normalizedEmail = adminEmail.toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    console.log(`Admin account already exists: ${normalizedEmail}`);
    console.log('If you need to reset the password, update the record directly in MongoDB.');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await User.create({
    name: adminName,
    email: normalizedEmail,
    passwordHash,
    role: 'superAdmin',
  });

  console.log('Created admin account successfully:');
  console.log(`  email: ${admin.email}`);
  console.log(`  password: ${adminPassword}`);
  console.log('Use this account to sign in as an administrator.');
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Failed to create admin account:', err);
  process.exit(1);
});
