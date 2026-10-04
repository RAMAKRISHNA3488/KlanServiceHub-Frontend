import { Hono } from 'hono';
import auth from '@/features/auth/server/route';
import members from '@/features/members/server/route';
import projects from '@/features/projects/server/route';
import tasks from '@/features/tasks/server/route';
import workspaces from '@/features/workspaces/server/route';
export const runtime = 'nodejs';
const app = new Hono().basePath('/api');
const routes = app
    .route('/auth', auth)
    .route('/members', members)
    .route('/projects', projects)
    .route('/tasks', tasks)
    .route('/workspaces', workspaces);
export const GET = (req) => app.fetch(req);
export const POST = (req) => app.fetch(req);
export const PATCH = (req) => app.fetch(req);
export const DELETE = (req) => app.fetch(req);

