/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import { middleware } from './kernel.js'
import router from '@adonisjs/core/services/router'

import AuthController from '#controllers/auth_controller';
import OnboardingController from '#controllers/onboarding_controller';
import CustomerController from '#controllers/customer_controller';
import LocalTypesController from '#controllers/local_types_controller';
import LocalsController from '#controllers/locals_controller';
import transmit from '@adonisjs/transmit/services/main'
import ChatController from '#controllers/chat_controller';
transmit.registerRoutes()


// Root Route
router.get('/', async () => {
  return {
    message: 'Welcome to Adonis Backend API Infrastructure',
  }
})

// Auth Controller
router.post('/auth/check-email', [AuthController, 'checkEmail']).as('auth.checkEmail');
router.post('/auth/verify-user', [AuthController, 'verifyUser']).as('auth.verifyUser');
router.post('/auth/register', [AuthController, 'register']).as('auth.register');
router.post('/auth/login', [AuthController, 'login']).as('auth.login');
router.post('/auth/login/request-code', [AuthController, 'requestLoginCode']).as('auth.requestLoginCode');
router.post('/auth/login/verify-code', [AuthController, 'verifyLoginCode']).as('auth.verifyLoginCode');
// router.delete('/auth/logout', [AuthController, 'logout']).as('auth.logout').use(middleware.auth());
router.get('/auth/me', [AuthController, 'me']).as('auth.me');

// Onboarding Controller
router.group(() => {
  router.post('/onboarding/create-local', [OnboardingController, 'createLocal']).as('onboarding.createLocal');
}).use(middleware.auth());


router.get('/ping-transmit', () => {
  transmit.broadcast('global', { message: 'hello world' })
})

// Local Types CRUD Routes
router.group(() => {
  router.get('/local-types', [LocalTypesController, 'index']).as('local-types.index');
  router.get('/local-types/:id', [LocalTypesController, 'show']).as('local-types.show');
}).use(middleware.auth());

// Locals CRUD Routes
router.group(() => {
  router.get('/locals', [LocalsController, 'index']).as('locals.index');
  router.get('/locals/:id', [LocalsController, 'show']).as('locals.show');
  router.post('/locals', [LocalsController, 'store']).as('locals.store');
}).use(middleware.auth());

router.post('/chats', [ChatController, 'createChat']).as('chat.createChat');
router.post('/chats/stream-text', [ChatController, 'streamText']).as('chat.streamText');


