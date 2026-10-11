const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let users = [];
let nextId = 1;

const seedDefaultAdmin = () => {
  if (users.some((user) => user.email.toLowerCase() === 'admin@lab.com')) {
    return;
  }

  users.push({
    id: nextId++,
    name: 'System Admin',
    email: 'admin@lab.com',
    password: 'admin123',
    role: 'admin',
  });
};

seedDefaultAdmin();

const findUserById = (id) => users.find((u) => u.id === id);
const findUserByEmail = (email) =>
  users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());

const sanitizeUser = (user) => {
  const { password, ...safe } = user;
  return safe;
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/api/users', (req, res) => {
  res.json(users.map(sanitizeUser));
});

app.post('/api/users', (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'Email already registered.' });
  }

  let normalizedRole = 'user';
  if (role === 'admin') normalizedRole = 'admin';
  else if (role === 'staff') normalizedRole = 'staff';

  const newUser = {
    id: nextId++,
    name,
    email,
    password,
    role: normalizedRole,
  };

  users.push(newUser);
  res.status(201).json(sanitizeUser(newUser));
});

app.get('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  const user = findUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json(sanitizeUser(user));
});

app.put('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  const { name, email, password, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  const user = findUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const existing = findUserByEmail(email);
  if (existing && existing.id !== id) {
    return res.status(409).json({ error: 'Email already registered.' });
  }

  user.name = name;
  user.email = email;
  if (password) user.password = password;
  if (role === 'admin') user.role = 'admin';
  else if (role === 'staff') user.role = 'staff';
  else if (role === 'user') user.role = 'user';

  res.json(sanitizeUser(user));
});

app.delete('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  users.splice(index, 1);
  res.status(204).send();
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  let redirectTo = '/user.html';
  if (user.role === 'admin') redirectTo = '/admin.html';
  else if (user.role === 'staff') redirectTo = '/staff.html';

  res.json({
    message: 'Login successful',
    user: sanitizeUser(user),
    redirectTo,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Login page: http://localhost:${PORT}/login.html`);
});
