import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary().notNullable();
      table.string('uuid').notNullable().unique();

      table.string('message_by').notNullable();

      table.integer('user_id').unsigned();
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

      table.integer('customer_id').unsigned();
      table.foreign('customer_id').references('id').inTable('customers').onDelete('CASCADE');

      table.integer('local_id').unsigned();
      table.foreign('local_id').references('id').inTable('locals').onDelete('CASCADE');

      table.text('message').notNullable();
      table.json('metadata').nullable();

      table.text('message_prompt').nullable();
      table.text('message_summary').nullable();

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
