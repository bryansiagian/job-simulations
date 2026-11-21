
import express from 'express';
import Database from 'better-sqlite3';

const app = express();
const PORT = 3001;

const VALID_STATUSES = [
  'backlog',
  'in-progress',
  'complete',
];

app.use(express.json());

// Allow requests from React frontend.
app.use((req, res, next) => {
  res.header(
    'Access-Control-Allow-Origin',
    'http://localhost:3000'
  );

  res.header(
    'Access-Control-Allow-Methods',
    'GET, PUT, OPTIONS'
  );

  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

// Initialize SQLite database.
const db = new Database('./clients.db');

// Get all clients ordered by status and priority.
const listClients = () => db.prepare(`
  SELECT *
  FROM clients
  ORDER BY
    CASE status
      WHEN 'backlog' THEN 0
      WHEN 'in-progress' THEN 1
      WHEN 'complete' THEN 2
      ELSE 3
    END,
    priority ASC,
    id ASC
`).all();

// Prepared statements.
const getClient = db.prepare(
  'SELECT * FROM clients WHERE id = ?'
);

const updateClient = db.prepare(`
  UPDATE clients
  SET status = ?, priority = ?
  WHERE id = ?
`);

// Validation helpers.
const isValidId = id =>
  Number.isSafeInteger(id) && id > 0;

const isValidPriority = value =>
  Number.isSafeInteger(value) && value > 0;

// API health information.
app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'SHIPTIVITY API. Read documentation to see API docs',
  });
});

/**
 * GET /api/v1/clients
 *
 * Get all clients.
 * Optionally filter by status.
 */
app.get('/api/v1/clients', (req, res) => {
  const { status } = req.query;

  if (
    status !== undefined &&
    !VALID_STATUSES.includes(status)
  ) {
    return res.status(400).json({
      message: 'Invalid status provided.',
      long_message:
        'Status can only be backlog, in-progress, or complete.',
    });
  }

  if (status !== undefined) {
    const clients = db.prepare(`
      SELECT *
      FROM clients
      WHERE status = ?
      ORDER BY priority ASC, id ASC
    `).all(status);

    return res.status(200).json(clients);
  }

  return res.status(200).json(listClients());
});

/**
 * GET /api/v1/clients/:id
 *
 * Get a single client.
 */
app.get('/api/v1/clients/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!isValidId(id)) {
    return res.status(400).json({
      message: 'Client id must be a positive integer.',
    });
  }

  const client = getClient.get(id);

  if (!client) {
    return res.status(404).json({
      message: 'Client not found.',
    });
  }

  return res.status(200).json(client);
});

/**
 * Move or reorder a client.
 *
 * All affected priorities are updated
 * inside a single database transaction.
 */
const moveClient = db.transaction((
  id,
  requestedStatus,
  requestedPriority
) => {
  const clients = listClients();

  const movingClient = clients.find(
    client => client.id === id
  );

  if (!movingClient) {
    throw new Error('Client not found.');
  }

  const destinationStatus =
    requestedStatus === undefined
      ? movingClient.status
      : requestedStatus;

  // No changes requested.
  if (
    destinationStatus === movingClient.status &&
    requestedPriority === undefined
  ) {
    return clients;
  }

  // Prepare separate arrays for each swimlane.
  const lanes = Object.fromEntries(
    VALID_STATUSES.map(status => [status, []])
  );

  // Remove moving client from its previous position.
  for (const client of clients) {
    if (!lanes[client.status]) {
      throw new Error('Unexpected stored client status.');
    }

    if (client.id !== id) {
      lanes[client.status].push(client);
    }
  }

  const targetLane = lanes[destinationStatus];

  // Append at the bottom if priority is not provided.
  const targetPriority =
    requestedPriority === undefined
      ? targetLane.length + 1
      : requestedPriority;

  const insertIndex = Math.min(
    targetLane.length,
    targetPriority - 1
  );

  // Insert client into the requested swimlane.
  targetLane.splice(insertIndex, 0, {
    ...movingClient,
    status: destinationStatus,
  });

  // Recalculate priorities for all affected clients.
  for (const status of VALID_STATUSES) {
    lanes[status].forEach((client, index) => {
      const newPriority = index + 1;

      if (
        client.status !== status ||
        client.priority !== newPriority
      ) {
        updateClient.run(
          status,
          newPriority,
          client.id
        );
      }
    });
  }

  return listClients();
});

/**
 * PUT /api/v1/clients/:id
 *
 * Update client status and/or priority.
 *
 * Request body:
 * {
 *   "status": "complete",
 *   "priority": 2
 * }
 */
app.put('/api/v1/clients/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!isValidId(id)) {
    return res.status(400).json({
      message: 'Client id must be a positive integer.',
    });
  }

  if (!getClient.get(id)) {
    return res.status(404).json({
      message: 'Client not found.',
    });
  }

  const body = req.body;

  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
    return res.status(400).json({
      message: 'Request body must be a JSON object.',
    });
  }

  const { status, priority } = body;

  if (
    status !== undefined &&
    !VALID_STATUSES.includes(status)
  ) {
    return res.status(400).json({
      message: 'Invalid status provided.',
    });
  }

  if (
    priority !== undefined &&
    !isValidPriority(priority)
  ) {
    return res.status(400).json({
      message: 'Priority must be a positive integer.',
    });
  }

  try {
    const clients = moveClient(
      id,
      status,
      priority
    );

    return res.status(200).json(clients);
  } catch (error) {
    console.error('Unable to update client:', error);

    return res.status(500).json({
      message: 'Unable to update client.',
    });
  }
});

// Start Express server.
const server = app.listen(PORT, () => {
  console.log(
    `Shiptivitas API running on http://localhost:${PORT}`
  );
});

// Close database gracefully.
let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;

  shuttingDown = true;

  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
