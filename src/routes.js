import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import MeetupController from './app/controllers/MeetupController';
import SubscriptionController from './app/controllers/SubscriptionController';
import MeetupListController from './app/controllers/MeetupListController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

routes.post('/meetup', MeetupController.store);
routes.get('/meetup', MeetupController.index);
routes.put('/users', UserController.update);

routes.put('/meetup/:id', MeetupController.update);
routes.delete('/meetup/:id', MeetupController.delete);
routes.get('/meetupList', MeetupListController.index);
routes.get('/subscriptions', SubscriptionController.index);
routes.post('/meetup/:id/subscriptions', SubscriptionController.store);
routes.delete('/meetup/:id/subscriptions', SubscriptionController.delete);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
