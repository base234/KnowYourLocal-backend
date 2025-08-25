import type { HttpContext } from '@adonisjs/core/http'

import Customer from '#models/customer'
import CustomerTransformer from '#transformers/customer_transformer'

export default class CustomerController {
  async index({ response }: HttpContext) {

    const customers = await Customer.all();

    return response.json({
      status: 'success',
      data: await CustomerTransformer.collection(customers),
    });
  }

  async show({ response, params }: HttpContext) {
    const customer = await Customer.query().where('uuid', params.id).first();

    if (!customer) {
      return response.status(402).json({
        status: 'error',
        message: 'Customer not found',
      });
    }

    return response.json({
      status: 'success',
      data: await CustomerTransformer.transform(customer),
    });
  }
}
