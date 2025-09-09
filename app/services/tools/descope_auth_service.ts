import DescopeClient, { type DescopeClient as DescopeClientType } from '@descope/node-sdk'
import env from '#start/env'

export type DescopeSessionUser = {
  userId: string
  email?: string
  name?: string
}

export class DescopeAuthService {
  private static instance: DescopeAuthService
  private descope: DescopeClientType

  private constructor() {
    const projectId = env.get('DESCOPE_PROJECT_ID')
    const config: { projectId: string} = { projectId }
    try {
        this.descope = DescopeClient(config);
    }
    catch (error) {
        console.error('Error initializing Descope client', error)
        throw error
    }
  }

  static getInstance(): DescopeAuthService {
    if (!DescopeAuthService.instance) {
      DescopeAuthService.instance = new DescopeAuthService()
    }
    return DescopeAuthService.instance
  }

  async validateSessionToken(sessionToken: string) {
    return this.descope.validateSession(sessionToken)
  }
}


