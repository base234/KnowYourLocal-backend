import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import LocalTypes from './local_types.js'
import User from './user.js'

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
  declare local_type_id: number | null
  @belongsTo(() => LocalTypes, { foreignKey: 'local_type_id' })
  declare local_type: BelongsTo<typeof LocalTypes>

  @column()
  declare user_id: number | null
  @belongsTo(() => User, { foreignKey: 'user_id' })
  declare user: BelongsTo<typeof User>

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

}
