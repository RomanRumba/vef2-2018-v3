/* todo sækja pakka sem vantar  */
const xss = require('xss');

const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

/**
 * Create a note asynchronously.
 *
 * @param {Object} note - Note to create
 * @param {string} note.title - Title of note
 * @param {string} note.text - Text of note
 * @param {string} note.datetime - Datetime of note
 *
 * @returns {Promise} Promise representing the object result of creating the note
 */
async function create({ title, text, datetime } = {}) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query('INSERT INTO notes (datetime, title, text) VALUES ($1,$2,$3) RETURNING id,datetime, title, text', [xss(datetime), xss(title), xss(text)]);
  await client.end();
  return result.rows;
}

/**
 * Read all notes.
 *
 * @returns {Promise} Promise representing an array of all note objects
 */
async function readAll() {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query('SELECT id,title,text,datetime FROM notes');
  await client.end();
  return result.rows;
}

/**
 * Read a single note.
 *
 * @param {number} id - Id of note
 *
 * @returns {Promise} Promise representing the note object or null if not found
 */
async function readOne(id) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query('SELECT id,title,text,datetime FROM notes WHERE id=$1', [xss(id)]);
  await client.end();
  return result.rows;
}

/**
 * Update a note asynchronously.
 *
 * @param {number} id - Id of note to update
 * @param {Object} note - Note to create
 * @param {string} note.title - Title of note
 * @param {string} note.text - Text of note
 * @param {string} note.datetime - Datetime of note
 *
 * @returns {Promise} Promise representing the object result of creating the note
 */
async function update(id, { title, text, datetime } = {}) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query('UPDATE notes SET datetime = $2, title = $3, text = $4 WHERE id = $1 RETURNING id,datetime, title, text', [xss(id), xss(datetime), xss(title), xss(text)]);
  await client.end();
  return result.rows;
}

/**
 * Delete a note asynchronously.
 *
 * @param {number} id - Id of note to delete
 *
 * @returns {Promise} Promise representing the boolean result of creating the note
 */
async function del(id) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query('DELETE FROM notes WHERE id = $1;', [xss(id)]);
  await client.end();
  return result.rows;
}

module.exports = {
  create,
  readAll,
  readOne,
  update,
  del,
};
