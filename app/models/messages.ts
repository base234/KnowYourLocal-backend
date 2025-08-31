import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Local from './locals.js'
import Customer from './customer.js'
import User from './user.js'

export default class Messages extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string
  @beforeCreate()
  static assignUuid(messages: Messages) {
    messages.uuid = crypto.randomUUID()
  }

  @column()
  declare message_by: string

  @column()
  declare user_id: number | null
  @belongsTo(() => User, { foreignKey: 'user_id' })
  declare user: BelongsTo<typeof User>

  @column()
  declare customer_id: number | null
  @belongsTo(() => Customer, { foreignKey: 'customer_id' })
  declare customer: BelongsTo<typeof Customer>

  @column()
  declare local_id: number | null
  @belongsTo(() => Local, { foreignKey: 'local_id' })
  declare local: BelongsTo<typeof Local>

  @column()
  declare message: string

  @column()
  declare metadata: JSON | null

  @column()
  declare message_prompt: string | null

  @column()
  declare message_summary: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
