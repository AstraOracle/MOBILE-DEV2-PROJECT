const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DATA_FILE = path.join(__dirname, 'data.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const PORT = process.env.PORT || 4000;

async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return { notes: [], users: [] };
  }
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getUserFromAuthHeader(authHeader) {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function getUserFromRequest(req) {
  return getUserFromAuthHeader(req.headers?.authorization);
}

function canAccessNote(note, user) {
  if (!note.userId) return true;
  return !!user && note.userId === user.id;
}

function filterNotesForUser(notes, user) {
  return notes.filter(note => canAccessNote(note, user));
}

function updateExistingNote(note, updates = {}) {
  const nextText = typeof updates.text === 'string' ? updates.text : note.text;
  const nextArchived = typeof updates.archived === 'boolean' ? updates.archived : note.archived;

  return {
    ...note,
    text: nextText,
    archived: nextArchived,
    updatedAt: new Date().toISOString(),
  };
}

const typeDefs = `
  type Note {
    id: Float!
    text: String!
    createdAt: String!
    updatedAt: String!
    archived: Boolean!
    userId: String
  }

  type User {
    id: ID!
    username: String!
  }

  type Query {
    me: User
    notes: [Note!]
  }

  input NoteInput {
    id: Float
    text: String!
    archived: Boolean
  }

  input ActionInput {
    type: String!
    payload: String
  }

  type Mutation {
    addNote(input: NoteInput!): Note
    updateNote(input: NoteInput!): Note
    deleteNote(id: Float!): Boolean
    sync(actions: [ActionInput!]!): [Note!]
    register(username: String!, password: String!): String
    login(username: String!, password: String!): String
  }
`;

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) return null;
      return { id: user.id, username: user.username };
    },
    notes: async (_, __, { user }) => {
      const data = await readData();
      if (!user) return data.notes.filter(n => !n.userId); // public notes only
      return data.notes.filter(n => (n.userId ? n.userId === user.id : true));
    }
  },

  Mutation: {
    addNote: async (_, { input }, { user }) => {
      const data = await readData();
      const now = new Date().toISOString();
      const note = {
        id: input.id || Date.now(),
        text: input.text,
        archived: !!input.archived,
        createdAt: now,
        updatedAt: now,
        userId: user ? user.id : null
      };
      // avoid duplicate id
      if (!data.notes.find(n => n.id === note.id)) data.notes.push(note);
      await writeData(data);
      return note;
    },
    updateNote: async (_, { input }, { user }) => {
      const data = await readData();
      const existing = data.notes.find(n => n.id === input.id);
      if (!existing || !canAccessNote(existing, user)) {
        throw new Error('Note not found');
      }

      const updated = updateExistingNote(existing, input);
      data.notes = data.notes.map(n => (n.id === updated.id ? updated : n));
      await writeData(data);
      return updated;
    },
    deleteNote: async (_, { id }, { user }) => {
      const data = await readData();
      data.notes = data.notes.filter(n => n.id !== id || !canAccessNote(n, user));
      await writeData(data);
      return true;
    },
    sync: async (_, { actions }, { user }) => {
      const data = await readData();
      let notes = data.notes || [];
      for (const action of actions) {
        const type = action.type;
        const payload = action.payload ? JSON.parse(action.payload) : null;
        if (type === 'ADD' && payload) {
          const note = {
            id: payload.id || Date.now(),
            text: payload.text || '',
            archived: !!payload.archived,
            createdAt: payload.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: user ? user.id : payload.userId || null
          };
          if (!notes.find(n => n.id === note.id)) notes.push(note);
        } else if (type === 'DELETE' && payload) {
          const id = payload;
          notes = notes.filter(n => n.id !== id || !canAccessNote(n, user));
        } else if (type === 'TOGGLE' && payload) {
          const id = payload;
          notes = notes.map(n => n.id === id && canAccessNote(n, user)
            ? { ...n, archived: !n.archived, updatedAt: new Date().toISOString() }
            : n);
        } else if (type === 'UPDATE' && payload) {
          notes = notes.map(n => n.id === payload.id && canAccessNote(n, user)
            ? updateExistingNote(n, payload)
            : n);
        }
      }
      data.notes = notes;
      await writeData(data);
      // return notes relevant to the user
      return filterNotesForUser(notes, user);
    },
    register: async (_, { username, password }) => {
      const data = await readData();
      const existing = data.users.find(u => u.username === username);
      if (existing) throw new Error('User exists');
      const hash = await bcrypt.hash(password, 10);
      const user = { id: String(Date.now()), username, passwordHash: hash };
      data.users.push(user);
      await writeData(data);
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      return token;
    },
    login: async (_, { username, password }) => {
      const data = await readData();
      const user = data.users.find(u => u.username === username);
      if (!user) throw new Error('Invalid credentials');
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) throw new Error('Invalid credentials');
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      return token;
    }
  }
};

async function start() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // REST endpoints for convenience
  app.get('/api/notes', async (req, res) => {
    const user = getUserFromRequest(req);
    const data = await readData();
    res.json({ notes: filterNotesForUser(data.notes, user) });
  });

  app.post('/api/notes', async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      const data = await readData();
      const now = new Date().toISOString();
      const note = {
        id: req.body?.id || Date.now(),
        text: String(req.body?.text || '').trim(),
        archived: !!req.body?.archived,
        createdAt: now,
        updatedAt: now,
        userId: user ? user.id : null,
      };

      if (!note.text) {
        return res.status(400).json({ error: 'Note text is required' });
      }

      if (!data.notes.find(n => n.id === note.id)) {
        data.notes.push(note);
        await writeData(data);
      }

      res.status(201).json({ note });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/notes/:id', async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      const id = Number(req.params.id);
      const data = await readData();
      const existing = data.notes.find(n => n.id === id);

      if (!existing || !canAccessNote(existing, user)) {
        return res.status(404).json({ error: 'Note not found' });
      }

      const note = updateExistingNote(existing, req.body);
      data.notes = data.notes.map(n => (n.id === id ? note : n));
      await writeData(data);
      res.json({ note });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/notes/:id', async (req, res) => {
    try {
      const user = getUserFromRequest(req);
      const id = Number(req.params.id);
      const data = await readData();
      const existing = data.notes.find(n => n.id === id);

      if (!existing || !canAccessNote(existing, user)) {
        return res.status(404).json({ error: 'Note not found' });
      }

      data.notes = data.notes.filter(n => n.id !== id);
      await writeData(data);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/sync', async (req, res) => {
    const actions = Array.isArray(req.body?.actions) ? req.body.actions : [];
    const data = await readData();
    let notes = data.notes || [];
    for (const action of actions) {
      if (!action || !action.type) continue;
      switch (action.type) {
        case 'ADD': {
          const note = action.payload;
          if (note && !notes.find(n => n.id === note.id)) {
            notes.push({
              ...note,
              createdAt: note.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
          break;
        }
        case 'DELETE': {
          const id = action.payload;
          notes = notes.filter(n => n.id !== id);
          break;
        }
        case 'UPDATE': {
          const note = action.payload;
          if (note?.id) {
            notes = notes.map(n => n.id === note.id ? updateExistingNote(n, note) : n);
          }
          break;
        }
        case 'TOGGLE': {
          const id = action.payload;
          notes = notes.map(n => n.id === id ? { ...n, archived: !n.archived, updatedAt: new Date().toISOString() } : n);
          break;
        }
      }
    }
    data.notes = notes;
    await writeData(data);
    res.json({ notes });
  });

  // Auth REST wrappers (optional)
  app.post('/auth/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      const data = await readData();
      const existing = data.users.find(u => u.username === username);
      if (existing) return res.status(400).json({ error: 'User exists' });
      const hash = await bcrypt.hash(password, 10);
      const user = { id: String(Date.now()), username, passwordHash: hash };
      data.users.push(user);
      await writeData(data);
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const data = await readData();
      const user = data.users.find(u => u.username === username);
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/auth/me', async (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({ user: { id: user.id, username: user.username } });
  });

  // Apollo server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();

  // expressMiddleware handles per-request context; we parse JSON body first
  app.use('/graphql', bodyParser.json(), expressMiddleware(server, {
    context: async ({ req }) => {
      return { user: getUserFromRequest(req) };
    }
  }));

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`GraphQL at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

start().catch(err => {
  console.error('Server failed to start', err);
});
