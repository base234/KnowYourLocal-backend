import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine';
import mail from '@adonisjs/mail/services/main';

import User from '#models/user'
import UserTransformer from '#transformers/user_transformer';
import Role from '#models/role';
import Customer from '#models/customer';
import { DateTime } from 'luxon';

export default class AuthController {

  async register({ request, response }: HttpContext) {
    const { data } = request.all();

    const rules = vine.object({
      role: vine.string(),
      first_name: vine.string(),
      last_name: vine.string(),
      email: vine.string().email().normalizeEmail(),
      password: vine.string(),
    })
    const state = {
      role: data.role,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password: data.password,
    }

    await vine.validate({ schema: rules, data: state });

    const isEmailExists = await User.query().where('email', state.email).first();
    if (isEmailExists) {
      return response.status(400).send({
        status: 'error',
        message: 'Email already exists!',
      })
    }

    const role = await Role.query().where('type', state.role).first();

    const user = await User.create({
      first_name: state.first_name,
      last_name: state.last_name,
      email: state.email,
      password: state.password,
      role_id: role?.id,
    });

    if (role?.type === 'customer') {
      await Customer.create({
        user_id: user.id,
        first_name: state.first_name,
        last_name: state.last_name,
        email: state.email,
      });
    }

    const tokenData = await User.accessTokens.create(user, ['*'], { name: 'auth_register', expiresIn: '7 days' });

    if (!tokenData) {
      return response.status(500).send({
        status: 'error',
        message: 'Something went wrong!',
      })
    }

    return response.status(200).send({
      status: 'success',
      message: 'Registered successfully',
    })
  }

  async login({ request, response }: HttpContext) {
    const { data } = request.all();

    const rules = vine.object({
      emailOrUsername: vine.string(),
      password: vine.string(),
    })

    const state = {
      emailOrUsername: data.emailOrUsername,
      password: data.password,
    }

    await vine.validate({ schema: rules, data: state })

    let user = null;
    if (data.emailOrUsername.includes('@')) {
      user = await User.verifyCredentials(data.emailOrUsername, data.password);
    } else {
      const username = await User.query().where('username', data.emailOrUsername).first();
      if (username) {
        user = await User.verifyCredentials(username.email, data.password);
      } else {
        return response.status(401).send({
          status: 'error',
          message: 'Invalid credentials!',
        });
      }
    }

    const tokenData = await User.accessTokens.create(user, ['*'], { name: 'auth_login', expiresIn: '7 days' });

    if (!tokenData) {
      return response.status(500).send({
        status: 'error',
        message: 'Failed to login user!',
      })
    }

    return response.status(200).send({
      status: 'success',
      message: 'Logged in successfully',
      token: tokenData.value!.release(),
      data: await UserTransformer.transform(user),
    });
  }

  async logout({ auth, response }: HttpContext) {
    const user = auth.user!
    await User.accessTokens.delete(user, user.currentAccessToken.identifier);

    return response.status(200).send({
      status: 'success',
      message: 'Logged out successfully',
    });
  }

  async checkEmail({ request, response }: HttpContext) {
    const { data } = request.all();

    const rules = vine.object({
      email: vine.string().email().normalizeEmail(),
    })

    const state = {
      email: data.email,
    }

    await vine.validate({ schema: rules, data: state })

    const user = await User.findBy('email', state.email);

    if (!user) {
      return response.status(200).send({
        status: 'error',
        message: 'Email not found!',
      })
    }

    return response.status(404).send({
      status: 'success',
      message: 'Email already exists!',
    })
  }

  async verifyUser({ request, response }: HttpContext) {
    const { data } = request.all();

    const rules = vine.object({
      emailOrUsername: vine.string(),
    })

    const state = {
      emailOrUsername: data.emailOrUsername,
    }

    await vine.validate({ schema: rules, data: state })

    let user = null;
    if (data.emailOrUsername.includes('@')) {
      user = await User.findBy('email', data.emailOrUsername);
    } else {
      user = await User.findBy('username', data.emailOrUsername);
    }

    if (!user) {
      return response.status(404).send({
        status: 'error',
        message: 'Wrong Email or Username!',
      })
    }

    return response.status(200).send({
      status: 'success',
      message: 'Success',
    })
  }

  async requestLoginCode({ request, response }: HttpContext) {
    const { data } = request.all();

    const rules = vine.object({
      emailOrUsername: vine.string(),
    })

    const state = {
      emailOrUsername: data.emailOrUsername,
    }

    await vine.validate({ schema: rules, data: state })

    let user = null;
    if (data.emailOrUsername.includes('@')) {
      user = await User.findBy('email', data.emailOrUsername);
    } else {
      user = await User.findBy('username', data.emailOrUsername);
    }

    if (!user) {
      return response.status(404).send({
        status: 'error',
        message: 'Wrong Email or Username!',
      })
    }

    const signinCode = Array.from({ length: 6 }, () => {
      const isNumber = Math.random() < 0.5;
      return isNumber
        ? Math.floor(Math.random() * 10).toString()
        : String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }).join('');

    await user.merge({
      signin_code: signinCode,
      signin_code_expires_at: DateTime.now().plus({ minutes: 10 }),
    }).save();

    // Send email with signin code
    try {
      await mail.send((message: any) => {
        message
          .from('noreply@vulcan.com')
          .to(user.email)
          .subject('Your Signin Code')
          .html(`<h1>Your Signin Code is ${signinCode}</h1>`)
      })
    } catch (error) {
      console.log(error)
      return response.status(400).send({
        status: 'error',
        message: 'Failed to send email!',
      })
    }

    return response.status(200).send({
      status: 'success',
      message: 'Success',
    });
  }

  async verifyLoginCode({ request, response }: HttpContext) {
    const { data } = request.all();

    const rules = vine.object({
      emailOrUsername: vine.string(),
      verificationCode: vine.string(),
    })

    const state = {
      emailOrUsername: data.emailOrUsername,
      verificationCode: data.verificationCode,
    }

    await vine.validate({ schema: rules, data: state })

    let user = null;
    if (data.emailOrUsername.includes('@')) {
      user = await User.findBy('email', data.emailOrUsername);
    } else {
      user = await User.findBy('username', data.emailOrUsername);
    }

    if (!user) {
      return response.status(404).send({
        status: 'error',
        message: 'Wrong Email or Username!',
      })
    }

    if (user.signin_code !== state.verificationCode || user.signin_code_expires_at < DateTime.now()) {
      return response.status(404).send({
        status: 'error',
        message: 'Invalid code!',
      })
    }

    const tokenData = await User.accessTokens.create(user, ['*'], { name: 'auth_login', expiresIn: '7 days' });

    return response.status(200).send({
      status: 'success',
      message: 'Success',
      token: tokenData.value!.release(),
      data: await UserTransformer.transform(user),
    })
  }

  async me({ response, auth }: HttpContext) {
    await auth.check();

    if (!auth.isAuthenticated) {
      return response.status(401).send({
        status: 'error',
        message: 'Unauthorized!',
      })
    }

    const user_data = auth.user!

    return response.status(200).send({
      status: 'success',
      data: await UserTransformer.transform(user_data),
    });
  }
}
