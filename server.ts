import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const dbPath = process.env.DATABASE_PATH || "crm.db";
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT,
    last_name TEXT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    jobTitle TEXT,
    status TEXT DEFAULT 'lead',
    value REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER,
    name TEXT NOT NULL,
    value REAL DEFAULT 0,
    stage TEXT DEFAULT 'Prospecting',
    close_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER,
    deal_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    reminder_offset INTEGER,
    due_date DATETIME,
    completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    FOREIGN KEY (deal_id) REFERENCES deals(id)
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER,
    deal_id INTEGER,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    FOREIGN KEY (deal_id) REFERENCES deals(id)
  );

  CREATE TABLE IF NOT EXISTS segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT 'indigo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contact_segments (
    contact_id INTEGER,
    segment_id INTEGER,
    PRIMARY KEY (contact_id, segment_id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    FOREIGN KEY (segment_id) REFERENCES segments(id)
  );

  CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT,
    email TEXT UNIQUE
  );
`);

// Seed team members if empty
const members = db.prepare("SELECT COUNT(*) as count FROM team_members").get() as any;
if (members.count === 0) {
  const seedMembers = [
    ['Alex Rivera', 'Sales Manager', 'alex@example.com'],
    ['Sarah Chen', 'Account Executive', 'sarah@example.com'],
    ['Marcus Thorne', 'Growth Lead', 'marcus@example.com']
  ];
  const stmt = db.prepare("INSERT INTO team_members (name, role, email) VALUES (?, ?, ?)");
  seedMembers.forEach(m => stmt.run(m));
}

// Migration for existing contacts if they only have 'name'
try {
  db.exec("ALTER TABLE contacts ADD COLUMN first_name TEXT");
  db.exec("ALTER TABLE contacts ADD COLUMN last_name TEXT");
} catch (e) {
  // Column might already exist
}

try {
  db.exec("ALTER TABLE tasks ADD COLUMN deal_id INTEGER");
} catch (e) {}

try {
  db.exec("ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium'");
} catch (e) {}

try {
  db.exec("ALTER TABLE tasks ADD COLUMN reminder_offset INTEGER");
} catch (e) {}

try {
  db.exec("ALTER TABLE notes ADD COLUMN deal_id INTEGER");
} catch (e) {}

// Seed data
const contactCount = db.prepare("SELECT count(*) as count FROM contacts").get() as { count: number };
if (contactCount.count === 0) {
  const insertContact = db.prepare(
    "INSERT INTO contacts (first_name, last_name, name, email, phone, company, jobTitle, status, value) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  insertContact.run("Sarah", "Jenkins", "Sarah Jenkins", "sarah@vertex.io", "555-0123", "Vertex AI", "CTO", "negotiation", 25000);
  insertContact.run("Michael", "Chen", "Michael Chen", "mchen@cloudscale.com", "555-0456", "CloudScale", "VP Engineering", "lead", 12000);
}

const dealCount = db.prepare("SELECT count(*) as count FROM deals").get() as { count: number };
if (dealCount.count === 0) {
  const insertDeal = db.prepare("INSERT INTO deals (contact_id, name, value, stage, close_date) VALUES (?, ?, ?, ?, ?)");
  insertDeal.run(1, "Enterprise License", 25000, "Negotiation", "2026-06-01");
  insertDeal.run(2, "Cloud Migration Pack", 12000, "Prospecting", "2026-07-15");
}

app.use(express.json());

// API Routes
app.get("/api/contacts", (req, res) => {
  const contacts = db.prepare("SELECT * FROM contacts ORDER BY created_at DESC").all();
  res.json(contacts);
});

app.post("/api/contacts", (req, res) => {
  const { first_name, last_name, email, phone, company, jobTitle, status, value } = req.body;
  const name = `${first_name} ${last_name}`.trim();
  const info = db.prepare(
    "INSERT INTO contacts (first_name, last_name, name, email, phone, company, jobTitle, status, value) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(first_name, last_name, name, email, phone, company, jobTitle, status, value);
  res.json({ id: info.lastInsertRowid });
});

app.patch("/api/contacts/:id", (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.first_name || updates.last_name) {
    const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(id) as any;
    const fn = updates.first_name !== undefined ? updates.first_name : contact.first_name;
    const ln = updates.last_name !== undefined ? updates.last_name : contact.last_name;
    updates.name = `${fn} ${ln}`.trim();
  }
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(", ");
  const values = Object.values(updates);
  db.prepare(`UPDATE contacts SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values, id);
  res.json({ success: true });
});

app.delete("/api/contacts/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM contact_segments WHERE contact_id = ?").run(id);
  db.prepare("DELETE FROM tasks WHERE contact_id = ?").run(id);
  db.prepare("DELETE FROM notes WHERE contact_id = ?").run(id);
  db.prepare("DELETE FROM deals WHERE contact_id = ?").run(id);
  db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
  res.json({ success: true });
});

app.get("/api/deals", (req, res) => {
  const deals = db.prepare(`
    SELECT deals.*, contacts.name as contact_name 
    FROM deals 
    LEFT JOIN contacts ON deals.contact_id = contacts.id 
    ORDER BY deals.created_at DESC
  `).all();
  res.json(deals);
});

app.post("/api/deals", (req, res) => {
  const { contact_id, name, value, stage, close_date } = req.body;
  const info = db.prepare(
    "INSERT INTO deals (contact_id, name, value, stage, close_date) VALUES (?, ?, ?, ?, ?)"
  ).run(contact_id, name, value, stage, close_date);
  res.json({ id: info.lastInsertRowid });
});

app.patch("/api/deals/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(", ");
  const values = Object.values(updates);
  db.prepare(`UPDATE deals SET ${fields} WHERE id = ?`).run(...values, id);
  res.json({ success: true });
});

app.delete("/api/deals/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM tasks WHERE deal_id = ?").run(id);
  db.prepare("DELETE FROM notes WHERE deal_id = ?").run(id);
  db.prepare("DELETE FROM deals WHERE id = ?").run(id);
  res.json({ success: true });
});

app.get("/api/contacts/:id/notes", (req, res) => {
  const notes = db.prepare("SELECT * FROM notes WHERE contact_id = ? ORDER BY created_at DESC").all(req.params.id);
  res.json(notes);
});

app.post("/api/contacts/:id/notes", (req, res) => {
  const { content } = req.body;
  db.prepare("INSERT INTO notes (contact_id, content) VALUES (?, ?)").run(req.params.id, content);
  res.json({ success: true });
});

app.get("/api/deals/:id/notes", (req, res) => {
  const notes = db.prepare("SELECT * FROM notes WHERE deal_id = ? ORDER BY created_at DESC").all(req.params.id);
  res.json(notes);
});

app.post("/api/deals/:id/notes", (req, res) => {
  const { content } = req.body;
  db.prepare("INSERT INTO notes (deal_id, content) VALUES (?, ?)").run(req.params.id, content);
  res.json({ success: true });
});

// Segments
app.get("/api/segments", (req, res) => {
  const segments = db.prepare("SELECT * FROM segments ORDER BY name ASC").all();
  res.json(segments);
});

// Team Members
app.get("/api/team", (req, res) => {
  const team = db.prepare("SELECT * FROM team_members ORDER BY name ASC").all();
  res.json(team);
});

app.post("/api/segments", (req, res) => {
  const { name, description, color } = req.body;
  const info = db.prepare("INSERT INTO segments (name, description, color) VALUES (?, ?, ?)").run(name, description, color || 'indigo');
  res.json({ id: info.lastInsertRowid });
});

app.delete("/api/segments/:id", (req, res) => {
  db.prepare("DELETE FROM contact_segments WHERE segment_id = ?").run(req.params.id);
  db.prepare("DELETE FROM segments WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.get("/api/contact-segments", (req, res) => {
  const links = db.prepare("SELECT * FROM contact_segments").all();
  res.json(links);
});

app.post("/api/contact-segments", (req, res) => {
  const { contact_id, segment_id } = req.body;
  try {
    db.prepare("INSERT INTO contact_segments (contact_id, segment_id) VALUES (?, ?)").run(contact_id, segment_id);
  } catch (e) {
    // Ignore duplicates
  }
  res.json({ success: true });
});

app.delete("/api/contact-segments/:contact_id/:segment_id", (req, res) => {
  const { contact_id, segment_id } = req.params;
  db.prepare("DELETE FROM contact_segments WHERE contact_id = ? AND segment_id = ?").run(contact_id, segment_id);
  res.json({ success: true });
});

app.get("/api/tasks", (req, res) => {
  const tasks = db.prepare(`
    SELECT tasks.*, contacts.name as contact_name, deals.name as deal_name 
    FROM tasks 
    LEFT JOIN contacts ON tasks.contact_id = contacts.id 
    LEFT JOIN deals ON tasks.deal_id = deals.id
    ORDER BY tasks.due_date ASC
  `).all();
  res.json(tasks);
});

app.post("/api/tasks", (req, res) => {
  const { title, description, due_date, contact_id, deal_id, priority, reminder_offset } = req.body;
  db.prepare("INSERT INTO tasks (title, description, due_date, contact_id, deal_id, priority, reminder_offset) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    title, description, due_date, contact_id, deal_id, priority || 'medium', reminder_offset
  );
  res.json({ success: true });
});

app.patch("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  db.prepare("UPDATE tasks SET completed = ? WHERE id = ?").run(completed ? 1 : 0, id);
  res.json({ success: true });
});

// Gemini AI Insights
app.post("/api/ai/insights", async (req, res) => {
  try {
    const { contactId } = req.body;
    const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(contactId);
    const notes = db.prepare("SELECT * FROM notes WHERE contact_id = ?").all(contactId);
    const tasks = db.prepare("SELECT * FROM tasks WHERE contact_id = ?").all(contactId);

    if (!contact) return res.status(404).json({ error: "Contact not found" });

    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
    
    const context = `
      Contact: ${contact.name} (${contact.jobTitle} at ${contact.company})
      Status: ${contact.status}
      Deal Value: $${contact.value}
      
      Notes:
      ${notes.map(n => `- [${n.created_at}] ${n.content}`).join("\n")}
      
      Pending Tasks:
      ${tasks.filter(t => !t.completed).map(t => `- ${t.title} (Due: ${t.due_date})`).join("\n")}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a strategic CRM assistant. Analyze this contact and provide:
        1. A 2-sentence summary of the relationship.
        2. A recommended next step to move the deal forward.
        3. A suggested outreach message (email/LinkedIn).
        Format the output in a clean Markdown structure with sections.
        
        Context:
        ${context}
      `
    });

    res.json({ insights: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate AI insights" });
  }
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
