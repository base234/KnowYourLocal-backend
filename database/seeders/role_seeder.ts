import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role from '#models/role'

export default class extends BaseSeeder {
  async run() {
    await Role.createMany([
      {
        type: 'super_admin',
        description: 'Super Admin role',
      },
      {
        type: 'admin',
        description: 'Admin role',
      },
      {
        type: 'customer',
        description: 'Customer role',
      },
    ])
  }
}
