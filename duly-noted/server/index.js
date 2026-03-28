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
    deleteNote: async (_, { id }, { user }) => {
      const data = await readData();
      data.notes = data.notes.filter(n => n.id !== id || (n.userId && user && n.userId !== user.id));
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
          notes = notes.filter(n => n.id !== id);
        } else if (type === 'TOGGLE' && payload) {
          const id = payload;
          notes = notes.map(n => n.id === id ? { ...n, archived: !n.archived, updatedAt: new Date().toISOString() } : n);
        }
      }
      data.notes = notes;
      await writeData(data);
      // return notes relevant to the user
      if (user) return notes.filter(n => !n.userId || n.userId === user.id);
      return notes.filter(n => !n.userId);
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
    const data = await readData();
    res.json({ notes: data.notes });
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

  // Apollo server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();

  // expressMiddleware handles per-request context; we parse JSON body first
  app.use('/graphql', bodyParser.json(), expressMiddleware(server, {
    context: async ({ req }) => {
      const auth = req.headers?.authorization;
      if (!auth) return { user: null };
      const token = auth.replace('Bearer ', '');
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        return { user: payload };
      } catch (e) {
        return { user: null };
      }
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
