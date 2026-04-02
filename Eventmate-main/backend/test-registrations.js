const jwt = require('jsonwebtoken');
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool();

async function test() {
  const { rows } = await pool.query("SELECT id FROM users WHERE role='Organizer' LIMIT 1");
  if (rows.length === 0) {
    console.log("No organizer found");
    return;
  }
  const orgId = rows[0].id;
  const token = jwt.sign({ id: orgId, role: 'Organizer' }, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
  
  const res = await fetch('http://localhost:3001/events/organizer/registrations', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.text();
  console.log(res.status, data);
}
test().catch(console.error).finally(() => pool.end());
