import { HttpContext } from '@adonisjs/core/http'
import Locals from '#models/locals'
import LocalsTransformer from '#transformers/locals_transformer'
import LocalTypes from '#models/local_types';

export default class LocalsController {
  async index({ response }: HttpContext) {
    const locals = await Locals.all();
    return response.status(200).json({
      status: 'success',
      data: await LocalsTransformer.collection(locals),
    });
  }

  async show({ response, params }: HttpContext) {
    const local = await Locals.query().where('uuid', params.id).first();

    if (!local) {
      return response.status(404).json({
        status: 'error',
        message: 'Local not found',
      });
    }

    return response.status(200).json({
      status: 'success',
      message: 'Local fetched successfully',
      data: await LocalsTransformer.transform(local),
    });
  }

  async store({ request, response, auth }: HttpContext) {
    const { data } = request.all();

    const customer_id = auth.user!.customer?.id;

    const localType = await LocalTypes.query().where('uuid', data.local_type_id).first();

    if (!localType) {
      return response.status(400).send({
        status: 'error',
        message: 'Local type not found',
      })
    }

    const local = await Locals.query().where('uuid', data.id).first();

    if (local) {
      return response.status(400).json({
        status: 'error',
        message: 'Local already exists',
      });
    }

    const new_local = await Locals.create({
      local_type_id: localType.id,
      customer_id: customer_id,
      name: data.local_name,
      description: data.description,
      co_ordinates: data.co_ordinates,
      location_search_query: data.location_search_query,
      radius: data.radius,
    })

    if (!new_local) {
      return response.status(400).json({
        status: 'error',
        message: 'Failed to create local',
      });
    }

    return response.status(201).json({
      status: 'success',
      message: 'Local created successfully',
      data: await LocalsTransformer.transform(new_local),
    });
  }
}
