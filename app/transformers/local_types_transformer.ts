import LocalTypes from '#models/local_types'

export default class LocalTypesTransformer {
  public static async transform(localType: LocalTypes) {
    return {
      id: localType.uuid,
      icon: localType.icon,
      name: localType.name,
      description: localType.description,
      short_description: localType.short_description,
      created_at: localType.createdAt?.toISO(),
      updated_at: localType.updatedAt?.toISO(),
    }
  }

  public static async collection(localTypes: LocalTypes[]) {
    return Promise.all(localTypes.map(localType => LocalTypesTransformer.transform(localType)))
  }
}
