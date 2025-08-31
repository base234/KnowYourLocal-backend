import { HttpContext } from '@adonisjs/core/http'
import LocalTypes from '#models/local_types'
import LocalTypesTransformer from '#transformers/local_types_transformer'

export default class LocalTypesController {

  public async index({ response }: HttpContext) {
    const localTypes = await LocalTypes.all();

    console.log(localTypes);

    return response.status(200).json({
      status: 'success',
      message: 'Local types fetched successfully',
      data: await LocalTypesTransformer.collection(localTypes),
    });
  }

  public async show({ response, params }: HttpContext) {
    const localType = await LocalTypes.query().where('uuid', params.id).first();

    if (!localType) {
      return response.status(404).json({
        status: 'error',
        message: 'Local type not found',
      });
    }

    return response.status(200).json({
      status: 'success',
      message: 'Local type fetched successfully',
      data: await LocalTypesTransformer.transform(localType),
    });
  }

}
