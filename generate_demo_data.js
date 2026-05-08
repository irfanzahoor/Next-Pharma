const Datastore = require('@seald-io/nedb');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

// To mimic Electron's appData locally for this script:
const appName = "NextPharma";
const appData = path.join(process.env.HOME || process.env.USERPROFILE, '.config');

const dbDir = path.join(appData, appName, 'server', 'databases');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

console.log('Database directory:', dbDir);

const getDbPath = (name) => path.join(dbDir, `${name}.db`);

const categoriesDB = new Datastore({ filename: getDbPath('categories'), autoload: true });
const inventoryDB = new Datastore({ filename: getDbPath('inventory'), autoload: true });
const customersDB = new Datastore({ filename: getDbPath('customers'), autoload: true });
const transactionsDB = new Datastore({ filename: getDbPath('transactions'), autoload: true });
const usersDB = new Datastore({ filename: getDbPath('users'), autoload: true });

async function seed() {
    console.log("Starting DB seed of 50 items each...");
    
    // 1. Categories
    const categories = [];
    for (let i = 1; i <= 50; i++) {
        categories.push({
            _id: Math.floor(Date.now() / 1000) + i,
            name: `Category ${i}`
        });
    }
    await new Promise((resolve) => categoriesDB.insert(categories, resolve));
    console.log("Categories seeded");

    // 2. Inventory
    const inventory = [];
    for (let i = 1; i <= 50; i++) {
        inventory.push({
            _id: Math.floor(Date.now() / 1000) + i + 100,
            barcode: parseInt(`10000000${i}`),
            expirationDate: `15-May-202${(i % 5) + 5}`,
            price: `${(i * 1.5).toFixed(2)}`,
            category: `${categories[i % categories.length]._id}`,
            quantity: 100 + i,
            name: `Medicine Product ${i}`,
            stock: 1,
            minStock: "10",
            img: ""
        });
    }
    await new Promise((resolve) => inventoryDB.insert(inventory, resolve));
    console.log("Inventory seeded");

    // 3. Customers
    const customers = [];
    for (let i = 1; i <= 50; i++) {
        customers.push({
            _id: `${Math.floor(Date.now() / 1000) + i + 200}`,
            name: `Customer ${i}`,
            phone: `+123456789${i.toString().padStart(2, '0')}`,
            email: `customer${i}@example.com`,
            address: `${i} Main St, City`
        });
    }
    await new Promise((resolve) => customersDB.insert(customers, resolve));
    console.log("Customers seeded");

    // 4. Users
    const users = [];
    const defaultPassword = await bcrypt.hash("password123", 10);
    for (let i = 1; i <= 50; i++) {
        users.push({
            _id: Math.floor(Date.now() / 1000) + i + 300,
            username: `user${i}`,
            fullname: `Staff Member ${i}`,
            password: defaultPassword,
            perm_products: 1,
            perm_categories: 1,
            perm_transactions: 1,
            perm_users: 1,
            perm_settings: 1,
            status: ""
        });
    }
    await new Promise((resolve) => usersDB.insert(users, resolve));
    console.log("Users seeded");

    // 5. Transactions
    const transactions = [];
    for (let i = 1; i <= 50; i++) {
        const item = inventory[i % inventory.length];
        transactions.push({
            _id: `${Math.floor(Date.now() / 1000) + i + 400}`,
            ref_number: `REF-${i.toString().padStart(4, '0')}`,
            status: 1, // completed
            customer: customers[i % customers.length]._id,
            date: new Date().toJSON(),
            items: [{
                id: item._id,
                name: item.name,
                price: item.price,
                quantity: 2,
                total: parseFloat(item.price) * 2
            }],
            total: parseFloat(item.price) * 2,
            paid: parseFloat(item.price) * 2,
            user_id: users[i % users.length]._id,
            till: 1,
            paymentMethod: i % 2 === 0 ? "Cash" : "Card"
        });
    }
    await new Promise((resolve) => transactionsDB.insert(transactions, resolve));
    console.log("Transactions seeded");

    console.log("Done! Seeded 50 items in all databases.");
}

seed().catch(err => console.error(err));
