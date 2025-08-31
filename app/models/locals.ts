import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import LocalTypes from './local_types.js'
import Customer from './customer.js'
import Messages from './messages.js'

export default class Locals extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string
  @beforeCreate()
  static assignUuid(local: Locals) {
    local.uuid = crypto.randomUUID()
  }

  @column()
  declare customer_id: number | null
  @belongsTo(() => Customer, { foreignKey: 'customer_id' })
  declare customer: BelongsTo<typeof Customer>

  @column()
  declare local_type_id: number | null
  @belongsTo(() => LocalTypes, { foreignKey: 'local_type_id' })
  declare local_type: BelongsTo<typeof LocalTypes>

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare co_ordinates: string | null

  @column()
  declare location_search_query: string | null

  @column()
  declare radius: number | null

  @hasMany(() => Messages, { foreignKey: 'local_id' })
  declare messages: HasMany<typeof Messages>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true })
  declare updatedAt: DateTime
}
