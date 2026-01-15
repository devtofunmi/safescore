/**
 * Admin User Seeding Script
 *
 * This script creates admin users in Supabase.
 * Run with: npm run seed:admin
 *
 * Requires environment variables:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

// Using CommonJS require for ts-node compatibility with CommonJS module system
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const { createInterface } = require("readline");

dotenv.config({ path: ".env.local" });

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
  );
  console.error("Please set them in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface AdminUser {
  email: string;
  password: string;
  fullName?: string;
}

const DEFAULT_ADMINS: AdminUser[] = [
  {
    email: "admin@safescore.pro",
    password: "ChangeThisPassword123!",
    fullName: "SafeScore Admin",
  },
];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function createAdminUser(admin: AdminUser): Promise<boolean> {
  try {
    console.log(`\n📧 Creating admin user: ${admin.email}`);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(
      (u: { email?: string }) => u.email === admin.email
    );

    if (existingUser) {
      console.log(
        `⚠️  User ${admin.email} already exists. Updating to admin...`
      );

      // Update existing user to admin
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: {
            ...existingUser.user_metadata,
            is_admin: true,
            full_name: admin.fullName || "Admin User",
          },
        }
      );

      if (error) {
        console.error(`❌ Failed to update user: ${error.message}`);
        return false;
      }

      console.log(`✅ User ${admin.email} is now an admin`);
      return true;
    }

    // Create new admin user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: admin.email,
      password: admin.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        is_admin: true,
        full_name: admin.fullName || "Admin User",
        plan_type: "pro", // Admins get pro by default
      },
    });

    if (error) {
      console.error(`❌ Failed to create user: ${error.message}`);
      return false;
    }

    if (data.user) {
      console.log(`✅ Admin user created successfully: ${admin.email}`);
      console.log(`   User ID: ${data.user.id}`);
      return true;
    }

    return false;
  } catch (err: any) {
    console.error(`❌ Error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log("🛡️  SafeScore Admin User Seeding Script\n");
  console.log(
    "This script will create admin users in your Supabase project.\n"
  );

  // Ask if user wants to use defaults or custom
  const useDefaults = await question(
    "Use default admin (admin@safescore.pro)? (y/n): "
  );

  let adminsToCreate: AdminUser[] = [];

  if (
    useDefaults.toLowerCase() === "y" ||
    useDefaults.toLowerCase() === "yes"
  ) {
    adminsToCreate = DEFAULT_ADMINS;
    console.log(`\n📝 Using default admin: ${DEFAULT_ADMINS[0].email}`);
    console.log(`⚠️  Default password: ${DEFAULT_ADMINS[0].password}`);
    console.log(`⚠️  Please change this password after first login!\n`);
  } else {
    // Custom admin creation
    const email = await question("Enter admin email: ");
    const password = await question("Enter admin password: ");
    const fullName = await question("Enter admin full name (optional): ");

    if (!email || !password) {
      console.error("❌ Email and password are required");
      process.exit(1);
    }

    adminsToCreate = [
      {
        email: email.trim(),
        password: password.trim(),
        fullName: fullName.trim() || undefined,
      },
    ];
  }

  // Confirm before proceeding
  console.log("\n📋 Admin users to create:");
  adminsToCreate.forEach((admin) => {
    console.log(`   - ${admin.email}`);
  });

  const confirm = await question("\nProceed with creation? (y/n): ");
  if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "yes") {
    console.log("❌ Cancelled");
    rl.close();
    process.exit(0);
  }

  // Create admin users
  console.log("\n🚀 Creating admin users...\n");
  let successCount = 0;
  let failCount = 0;

  for (const admin of adminsToCreate) {
    const success = await createAdminUser(admin);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary:");
  console.log(`   ✅ Successfully created/updated: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log("=".repeat(50));

  // Verify admins
  console.log("\n🔍 Verifying admin users...\n");
  const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
  const adminUsers =
    allUsers?.users.filter(
      (u: { user_metadata?: { is_admin?: boolean } }) =>
        u.user_metadata?.is_admin === true
    ) || [];

  if (adminUsers.length > 0) {
    console.log("✅ Admin users in database:");
    adminUsers.forEach((user: { email?: string; id?: string }) => {
      console.log(`   - ${user.email} (ID: ${user.id})`);
    });
  } else {
    console.log("⚠️  No admin users found");
  }

  rl.close();
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  rl.close();
  process.exit(1);
});
