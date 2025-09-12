// scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ====== Import models ======
const ItemIncome = require('../models/ItemIncome');   // sesuaikan path
const ItemOutcome = require('../models/ItemOutcome'); // sesuaikan path
const Income = require('../models/Income');           // sesuaikan path
const Outcome = require('../models/Outcome');         // sesuaikan path
const User = require('../models/User');               // sesuaikan path

// ====== CONFIG ======
const MONGO_URI = process.env.MONGO_URI;
const SUPER_ADMIN_USERNAME = 'superadmin';
const SUPER_ADMIN_PASSWORD = 'superadmin123'; // min 6 char
const SUPER_ADMIN_FULLNAME = 'Super Admin';

// Rentang seed transaksi: mulai 1 Agustus 2025 s.d. hari ini (Asia/Jakarta)
const START_DATE_ISO = '2025-08-01T00:00:00.000+07:00';

// List item
const ITEM_INCOME_LIST = ['ganci', 'brosur', 'banner', 'sablon', 'poster'];
const ITEM_OUTCOME_LIST = ['tinta', 'perbaikan', 'logistik', 'kertas', 'bahan sablon', 'akrilik'];

// ====== Helpers ======
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomWhatsApp = () => {
  // Harus sesuai regex: /^08\d{8,11}$/
  const length = randInt(8, 11); // jumlah digit setelah "08"
  let tail = '';
  for (let i = 0; i < length; i++) tail += Math.floor(Math.random() * 10);
  return `08${tail}`;
};

// random waktu pada suatu hari (Asia/Jakarta)
const randomDateInDayJakarta = (date) => {
  // Buat tanggal start (00:00:00+07) & end (23:59:59+07)
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const ts = randInt(start.getTime(), end.getTime());
  return new Date(ts);
};

const nextDay = (d) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + 1);
  return nd;
};

// Upsert by name for items
async function upsertItems(Model, names) {
  const docs = [];
  for (const name of names) {
    const res = await Model.findOneAndUpdate(
      { name },
      { $setOnInsert: { name } },
      { new: true, upsert: true }
    );
    docs.push(res);
  }
  return docs;
}

// ====== Main Seeder ======
(async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      autoIndex: true,
    });
    console.log('Connected.');

    // 1) Upsert Super Admin
    console.log('Upserting super admin user...');
    let superAdmin = await User.findOne({ username: SUPER_ADMIN_USERNAME });
    if (!superAdmin) {
      const hashed = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
      superAdmin = await User.create({
        username: SUPER_ADMIN_USERNAME,
        password: hashed,
        fullName: SUPER_ADMIN_FULLNAME,
        role: 'super_admin',
        contactNumber: randomWhatsApp(),
        photo: ''
      });
      console.log('Super admin created.');
    } else {
      // Pastikan rolenya super_admin & fullname ada
      if (superAdmin.role !== 'super_admin' || superAdmin.fullName !== SUPER_ADMIN_FULLNAME) {
        superAdmin.role = 'super_admin';
        superAdmin.fullName = SUPER_ADMIN_FULLNAME;
        await superAdmin.save();
      }
      console.log('Super admin already exists, using existing.');
    }

    // 2) Upsert Items
    console.log('Upserting ItemIncome & ItemOutcome...');
    const incomeItems = await upsertItems(ItemIncome, ITEM_INCOME_LIST);
    const outcomeItems = await upsertItems(ItemOutcome, ITEM_OUTCOME_LIST);
    console.log(`ItemIncome: ${incomeItems.length} | ItemOutcome: ${outcomeItems.length}`);

    // 3) Generate transactions per-day
    console.log('Generating daily Income & Outcome from Aug 1, 2025 to today (Asia/Jakarta)...');

    const startDate = new Date(START_DATE_ISO);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let cur = new Date(startDate);
    let createdIncomeCount = 0;
    let createdOutcomeCount = 0;

    // Cache ids
    const incomeItemIds = incomeItems.map((d) => d._id);
    const outcomeItemIds = outcomeItems.map((d) => d._id);

    while (cur <= today) {
      // jumlah record acak per hari (0..5)
      const incomeCount = randInt(0, 5);
      const outcomeCount = randInt(0, 5);

      // Income docs
      const incomeDocs = [];
      for (let i = 0; i < incomeCount; i++) {
        const quantity = randInt(1, 10);
        const price = randInt(10_000, 500_000);
        const totalPrice = price * quantity;

        incomeDocs.push({
          price,
          item: incomeItemIds[randInt(0, incomeItemIds.length - 1)],
          quantity,
          totalPrice,
          customerName: `Customer ${randInt(100, 999)}`,
          whatsapp: randomWhatsApp(),
          createdBy: superAdmin._id,
          createdAt: randomDateInDayJakarta(cur),
          updatedAt: new Date()
        });
      }

      // Outcome docs
      const outcomeDocs = [];
      for (let i = 0; i < outcomeCount; i++) {
        const quantity = randInt(1, 10);
        const price = randInt(10_000, 500_000);
        const totalPrice = price * quantity;

        outcomeDocs.push({
          price,
          item: outcomeItemIds[randInt(0, outcomeItemIds.length - 1)],
          quantity,
          totalPrice,
          personInTransaction: `Vendor ${randInt(100, 999)}`,
          whatsapp: randomWhatsApp(),
          receipt: '',
          createdBy: superAdmin._id,
          createdAt: randomDateInDayJakarta(cur),
          updatedAt: new Date()
        });
      }

      if (incomeDocs.length) {
        const res = await Income.insertMany(incomeDocs);
        createdIncomeCount += res.length;
      }
      if (outcomeDocs.length) {
        const res = await Outcome.insertMany(outcomeDocs);
        createdOutcomeCount += res.length;
      }

      cur = nextDay(cur);
    }

    console.log('Done.');
    console.log(`Created Income:  ${createdIncomeCount}`);
    console.log(`Created Outcome: ${createdOutcomeCount}`);

    await mongoose.disconnect();
    console.log('Disconnected. ✅');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
