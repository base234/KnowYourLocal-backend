import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary().notNullable();
      table.string('uuid').notNullable().unique();

      table.string('username').nullable().unique();

      table.string('first_name').notNullable();

      table.string('last_name').notNullable();

      table.string('email', 254).notNullable().unique();

      table.string('phone_number').nullable().unique();

      table.string('password').notNullable();

      table.boolean('is_email_verified').defaultTo(false);

      table.boolean('is_phone_number_verified').defaultTo(false);

      table.boolean('is_onboarding_complete').defaultTo(false);

      table.json('onboarding_answers').nullable();

      table.boolean('is_banned').defaultTo(false);

      table.string('signin_code').nullable();

      table.datetime('signin_code_expires_at').nullable();

      table.timestamp('created_at').notNullable();

      table.timestamp('updated_at').nullable();
    })
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
