import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'local_types'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary().notNullable();
      table.string('uuid').notNullable().unique();
      table.string('name').notNullable();
      table.text('description').nullable();
      table.string('icon').nullable();

      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at').nullable();
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}