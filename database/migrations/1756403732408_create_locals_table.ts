import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'locals'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary().notNullable();
      table.string('uuid').notNullable().unique();

      table.integer('customer_id').unsigned();
      table.foreign('customer_id').references('id').inTable('customers').onDelete('CASCADE');

      table.integer('local_type_id').unsigned();
      table.foreign('local_type_id').references('id').inTable('local_types').onDelete('CASCADE');

      table.string('name').notNullable();
      table.text('description').nullable();
      table.json('co_ordinates').nullable();
      table.string('location_search_query').nullable();
      table.integer('radius').nullable();

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
