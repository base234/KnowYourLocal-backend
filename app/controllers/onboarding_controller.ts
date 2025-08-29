import type { HttpContext } from '@adonisjs/core/http'
import Locals from '#models/locals';
import LocalsTransformer from '#transformers/locals_transformer';
import Customer from '#models/customer';
import User from '#models/user';
import LocalTypes from '#models/local_types';

export default class OnboardingController {

  async createLocal({ request, response, auth }: HttpContext) {
    const { data } = request.all();

    const userId: number | undefined = auth.user?.id;
    const customerId: number | undefined = auth.user?.customer?.id;

    if (!userId || !customerId) {
      return response.status(400).send({
        status: 'error',
        message: 'User not found',
      })
    }

    const localType = await LocalTypes.query().where('uuid', data.local_type_id).first();

    if (!localType) {
      return response.status(400).send({
        status: 'error',
        message: 'Local type not found',
      })
    }

    const new_local = await Locals.create({
      customer_id: customerId,
      local_type_id: localType.id,
      name: data.local_name,
      description: data.description,
      co_ordinates: data.co_ordinates,
      location_search_query: data.location_search_query,
      radius: data.radius,
    })

    if (!new_local) {
      return response.status(400).send({
        status: 'error',
        message: 'Failed to create local',
      })
    }

    await User.query().where('id', userId).update({ is_onboarding_complete: 1 });
    await Customer.query().where('id', customerId).update({ is_event_created: 1 });

    return response.status(200).send({
      status: 'success',
      message: 'Local created successfully',
      data: await LocalsTransformer.transform(new_local),
    })
  }
}
