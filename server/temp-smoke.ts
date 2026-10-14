process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/careerpilot-test';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.PORT = '5001';

const { MongoMemoryServer } = await import('mongodb-memory-server');
const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri();

const { connectDatabase, closeDatabase } = await import('./src/config/db.ts');
await connectDatabase();

const { app } = await import('./src/app.ts');
const request = (await import('supertest')).default;
const agent = request.agent(app);

const health = await request(app).get('/api/health');
const register = await agent.post('/api/auth/register').send({ name: 'Alice', email: 'alice@example.com', password: 'Password123!' });
const me = await agent.get('/api/auth/me');

console.log(JSON.stringify({ health: health.status, registerStatus: register.status, email: me.body.user?.email, role: me.body.user?.role }, null, 2));

await closeDatabase();
await mongo.stop();