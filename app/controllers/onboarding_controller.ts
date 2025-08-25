import type { HttpContext } from '@adonisjs/core/http'

import User from '#models/user'

export default class OnboardingController {

  async store({ request, response, auth }: HttpContext) {
    const { data } = request.all();

    const user = await User.find(auth.user!.id);

    if (!user) {
      return response.status(404).send({
        status: 'error',
        message: 'User question not found',
      })
    }

    if (!data.onboarding_answers || Object.keys(data.onboarding_answers).length === 0) {
      return response.status(400).send({
        status: 'error',
        message: 'Onboarding answers are required',
      });
    }

    user.onboarding_answers = data.onboarding_answers;
    user.is_onboarding_complete = true;
    await user.save();

    return response.status(200).send({
      status: 'success',
      message: 'Request completed successfully',
    });
  }
}
