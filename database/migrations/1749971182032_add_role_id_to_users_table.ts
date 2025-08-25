import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('role_id').unsigned().notNullable().after('uuid');
      table.foreign('role_id').references('id').inTable('roles').onDelete('CASCADE');
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign('role_id');
      table.dropColumn('role_id')
    })
  }
}
