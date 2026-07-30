import { DatabaseSync } from 'node:sqlite'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'
import { resetDb, setDb } from '../db/connection.js'
import { runMigrations } from '../db/migrate.js'
import { seedDatabase } from '../db/seed.js'

const app = createApp()
let testDb: DatabaseSync

function setupTestDatabase() {
  resetDb()
  testDb = new DatabaseSync(':memory:')
  testDb.exec('PRAGMA foreign_keys = ON')
  setDb(testDb)
  runMigrations()
  seedDatabase()
}

async function loginAs(email: string, password: string) {
  const response = await request(app).post('/api/auth/login').send({ email, password })
  return response.body.token as string
}

beforeAll(() => {
  setupTestDatabase()
})

beforeEach(() => {
  setupTestDatabase()
})

afterAll(() => {
  resetDb()
})

describe('API smoke tests', () => {
  it('GET /api/health returns connected status', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(response.body.db).toBe('connected')
  })

  it('POST /api/auth/login returns token for valid user and 401 for invalid', async () => {
    const valid = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dev@thoughtfocus.com', password: 'Dev12345' })

    expect(valid.status).toBe(200)
    expect(valid.body.token).toBeTruthy()
    expect(valid.body.user.email).toBe('dev@thoughtfocus.com')

    const invalid = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dev@thoughtfocus.com', password: 'wrong-password' })

    expect(invalid.status).toBe(401)
    expect(invalid.body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('GET /api/artifacts requires authentication', async () => {
    const response = await request(app).get('/api/artifacts')
    expect(response.status).toBe(401)
  })

  it('GET /api/artifacts returns seeded artifacts with file counts', async () => {
    const token = await loginAs('dev@thoughtfocus.com', 'Dev12345')

    const response = await request(app)
      .get('/api/artifacts')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(3)
    expect(response.body.artifacts.map((item: { id: string }) => item.id)).toEqual(
      expect.arrayContaining(['brd', 'arch', 'inbox']),
    )

    const brd = response.body.artifacts.find((item: { id: string }) => item.id === 'brd')
    expect(brd.fileCount).toBe(2)
  })

  it('GET /api/artifacts?folder=docs filters correctly', async () => {
    const token = await loginAs('dev@thoughtfocus.com', 'Dev12345')

    const response = await request(app)
      .get('/api/artifacts?folder=docs')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(2)
    expect(response.body.artifacts.every((item: { folderId: string }) => item.folderId === 'docs')).toBe(
      true,
    )
  })

  it('GET /api/artifacts/brd includes seeded file metadata', async () => {
    const token = await loginAs('dev@thoughtfocus.com', 'Dev12345')

    const response = await request(app)
      .get('/api/artifacts/brd')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.files).toHaveLength(2)
    expect(response.body.files[0].filename).toBeTruthy()
  })

  it('POST /api/artifacts is forbidden for members and allowed for admins', async () => {
    const memberToken = await loginAs('dev@thoughtfocus.com', 'Dev12345')
    const adminToken = await loginAs('admin@thoughtfocus.com', 'Admin1234')

    const forbidden = await request(app)
      .post('/api/artifacts')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        id: 'user-manual',
        folderId: 'docs',
        name: 'User Manual',
        path: 'docs/user-manual/',
        description: 'Usage guide',
        status: 'Draft',
        color: 'var(--accent-function)',
      })

    expect(forbidden.status).toBe(403)

    const created = await request(app)
      .post('/api/artifacts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id: 'user-manual',
        folderId: 'docs',
        name: 'User Manual',
        path: 'docs/user-manual/',
        description: 'Usage guide',
        status: 'Draft',
        color: 'var(--accent-function)',
      })

    expect(created.status).toBe(201)
    expect(created.body.id).toBe('user-manual')
  })

  it('runs migrations idempotently', () => {
    expect(() => {
      runMigrations()
      runMigrations()
    }).not.toThrow()
  })

  it('supports full login to folders and artifacts flow', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dev@thoughtfocus.com', password: 'Dev12345' })

    const token = login.body.token as string

    const folders = await request(app)
      .get('/api/folders')
      .set('Authorization', `Bearer ${token}`)

    const artifacts = await request(app)
      .get('/api/artifacts')
      .set('Authorization', `Bearer ${token}`)

    expect(folders.status).toBe(200)
    expect(folders.body.folders.find((folder: { id: string }) => folder.id === 'docs').artifactCount).toBe(2)
    expect(folders.body.folders.find((folder: { id: string }) => folder.id === 'tools').artifactCount).toBe(1)

    const brd = artifacts.body.artifacts.find((item: { id: string }) => item.id === 'brd')
    expect(brd.fileCount).toBe(2)
  })
})

describe('Signup API smoke tests', () => {
  const validSignup = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@thoughtfocus.com',
    password: 'Secure123',
    confirmPassword: 'Secure123',
  }

  it('POST /api/auth/signup returns 201 and token for valid payload', async () => {
    const response = await request(app).post('/api/auth/signup').send(validSignup)

    expect(response.status).toBe(201)
    expect(response.body.token).toBeTruthy()
    expect(response.body.user.email).toBe('jane.doe@thoughtfocus.com')
    expect(response.body.user.displayName).toBe('Jane Doe')
  })

  it('POST /api/auth/signup returns 409 for duplicate email', async () => {
    await request(app).post('/api/auth/signup').send(validSignup)

    const duplicate = await request(app)
      .post('/api/auth/signup')
      .send({ ...validSignup, firstName: 'John' })

    expect(duplicate.status).toBe(409)
    expect(duplicate.body.error.code).toBe('CONFLICT')
  })

  it('POST /api/auth/signup returns 400 when passwords do not match', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({ ...validSignup, email: 'mismatch@thoughtfocus.com', confirmPassword: 'Different1' })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('signup then login with same credentials returns 200', async () => {
    const email = 'new.user@thoughtfocus.com'
    const password = 'Welcome123'

    const signup = await request(app).post('/api/auth/signup').send({
      firstName: 'New',
      lastName: 'User',
      email,
      password,
      confirmPassword: password,
    })

    expect(signup.status).toBe(201)

    const login = await request(app).post('/api/auth/login').send({ email, password })

    expect(login.status).toBe(200)
    expect(login.body.user.email).toBe(email)
  })
})

describe('Upload API', () => {
  it('POST /api/uploads requires authentication', async () => {
    const response = await request(app).post('/api/uploads')
    expect(response.status).toBe(401)
  })

  it('POST /api/uploads stores files in inbox for members', async () => {
    const token = await loginAs('dev@thoughtfocus.com', 'Dev12345')
    const samplePath = join(tmpdir(), 'artifact-hub-test-upload.txt')
    writeFileSync(samplePath, 'sample artifact content')

    const upload = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('files', samplePath)

    expect(upload.status).toBe(201)
    expect(upload.body.total).toBe(1)
    expect(upload.body.files[0].filename).toBe('artifact-hub-test-upload.txt')

    const inbox = await request(app)
      .get('/api/artifacts/inbox')
      .set('Authorization', `Bearer ${token}`)

    expect(inbox.status).toBe(200)
    expect(inbox.body.files).toHaveLength(1)
    expect(inbox.body.files[0].filename).toBe('artifact-hub-test-upload.txt')
  })

  it('POST /api/uploads rejects empty requests', async () => {
    const token = await loginAs('dev@thoughtfocus.com', 'Dev12345')

    const response = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })
})
