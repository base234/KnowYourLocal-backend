import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary().notNullable();
      table.string('uuid').notNullable().unique();

      table.integer('user_id').unsigned();
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

      table.string('username').nullable().unique();

      table.string('first_name').notNullable();

      table.string('last_name').notNullable();

      table.string('email', 254).notNullable().unique();

      table.string('phone_number').nullable().unique();

      table.boolean('is_event_created').defaultTo(false);

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
