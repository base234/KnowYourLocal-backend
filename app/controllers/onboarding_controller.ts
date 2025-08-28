import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Locals from '#models/locals';
import Customer from '#models/customer';
import LocalTypes from '#models/local_types';

export default class OnboardingController {

//   async store({ request, response, auth }: HttpContext) {
  async store({ request, response }: HttpContext) {
    const { data } = request.all();
    const results = []
    // const user = await User.find(auth.user!.id);

    // if (!user) {
    //   return response.status(404).send({
    //     status: 'error',
    //     message: 'User question not found',
    //   })
    // }

    // if (!data.onboarding_answers || Object.keys(data.onboarding_answers).length === 0) {
    //   return response.status(400).send({
    //     status: 'error',
    //     message: 'Onboarding answers are required',
    //   });
    // }

    // Validate local creation if local data is provided
    if (data.local) {
      const localData = {
        ...data.local,
        // user_id: user.uuid // Use user's UUID for validation
      }


      // New one
      if (!localData.name) {
        return response.badRequest({
          message: 'Name is required'
        })
      }
      if (!localData.user_id) {
        return response.badRequest({
          message: 'User ID is required'
        })
      }
      const user = await User.query().where('uuid', localData.user_id).first()
      if (!user) {
        return response.badRequest({
          message: 'User not found'
        })
      }
      localData.user_id = user.id

      // Validate local_type_id exists if provided
      if (localData.local_type_id) {
        const localType = await LocalTypes.find(localData.local_type_id)
        if (!localType) {
          return response.badRequest({
            message: 'Invalid local type ID'
          })
        }
      }

      const local = await Locals.create(localData)
      results.push(local)
      if (data.onboarding_answers) {
        user.onboarding_answers = data.onboarding_answers;
        user.is_onboarding_complete = true;
        await user.save();
      }

      const customer = await Customer.find(user.id)
      if (customer) {
        customer.is_event_created = true;
        await customer.save();
      }
    }

    return response.status(200).send({
      status: 'success',
      message: 'Request completed successfully',
      local: results.length > 0 ? results[0] : null
    });
  }
}
