import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class Customer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string
  @beforeCreate()
  static assignUuid(customer: Customer) {
    customer.uuid = crypto.randomUUID()
  }

  @column()
  declare user_id: number | null
  @belongsTo(() => User, { foreignKey: 'user_id' })
  declare user: BelongsTo<typeof User>

  @column()
  declare username: string | null

  @column()
  declare first_name: string | null

  @column()
  declare last_name: string | null

  @column()
  declare email: string

  @column()
  declare phone_number: string

  @column()
  declare is_event_created: boolean

  @column()
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  public async full_name() {
    return this.first_name + ' ' + this.last_name;
  }
}
