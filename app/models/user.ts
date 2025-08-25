import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, beforeCreate, belongsTo, hasOne } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import Role from './role.js'
import Customer from './customer.js'
import crypto from 'crypto'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare role_id: number
  @belongsTo(() => Role, { foreignKey: 'role_id' })
  declare role: BelongsTo<typeof Role>

  @column()
  declare username: string | null

  @column()
  declare first_name: string | null

  @column()
  declare last_name: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string
  static get hidden() {
    return ['password']
  }

  @column()
  declare phone_number: string

  @column()
  declare is_email_verified: boolean

  @column()
  declare is_phone_number_verified: boolean

  @column()
  declare is_onboarding_complete: boolean

  @column({
    prepare: (value: object) => JSON.stringify(value),
  })
  declare onboarding_answers: object

  @column()
  declare is_event_created: boolean

  @column()
  declare is_banned: boolean

  @column()
  declare signin_code: string

  @column.dateTime()
  declare signin_code_expires_at: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static assignUuid(user: User) {
    user.uuid = crypto.randomUUID()
  }

  static accessTokens = DbAccessTokensProvider.forModel(User)

  @hasOne(() => Customer, { foreignKey: 'user_id' })
  declare customer: HasOne<typeof Customer>

  public async full_name() {
    if (this.first_name && this.last_name) {
      return this.first_name + ' ' + this.last_name;
    }
    return this.first_name || this.last_name || '';
  }
}
