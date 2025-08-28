import LocalTypes from '#models/local_types'

export default class LocalTypesTransformer {
  static transform(localType: LocalTypes) {
    return {
      id: localType.id,
      uuid: localType.uuid,
      name: localType.name,
      description: localType.description,
      icon: localType.icon,
      created_at: localType.createdAt?.toISO(),
      updated_at: localType.updatedAt?.toISO(),
    }
  }

  static transformMany(localTypes: LocalTypes[]) {
    return localTypes.map(localType => this.transform(localType))
  }
}
