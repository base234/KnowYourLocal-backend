import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import User from '#models/user'
import { DescopeAuthService } from '#services/index'
import DescopeClient from '@descope/node-sdk';
/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(ctx: HttpContext, next: NextFn) {
    const authHeader = ctx.request.header('authorization') || ''
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : ''

    if (!token) {
      return ctx.response.status(401).send({ status: 'error', message: 'Missing bearer token' })
    }

    const descopeClient = DescopeClient({ projectId: 'P31zCvjcYtbIuIGx3vbcVTEv7msh'})
      try {
        const authInfo = await descopeClient.validateSession(token);
        console.log("Successfully validated user session:");
        console.log(authInfo);
      } catch (error) {
        console.log ("Could not validate user session " + error);
      }
  }
}
