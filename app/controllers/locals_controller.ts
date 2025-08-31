import { HttpContext } from '@adonisjs/core/http'
import Locals from '#models/locals'
import LocalsTransformer from '#transformers/locals_transformer'
import MessagesTransformer from '#transformers/messages_transformer'
import LocalTypes from '#models/local_types';
import { FoursquareService, GreetingService, PokemonService } from '#services/index';
// @ts-ignore
import OpenAI from 'openai';
import Messages from '#models/messages';

export default class LocalsController {
  private pokemonService = new PokemonService()
  private greetingService = new GreetingService()
  private fourSquareService = new FoursquareService()

  async index({ response }: HttpContext) {
    const locals = await Locals.query().preload('local_type');
    return response.status(200).json({
      status: 'success',
      data: await LocalsTransformer.collection(locals),
    });
  }

  async show({ response, params }: HttpContext) {
    const local = await Locals.query()
      .where('uuid', params.local_id)
      .preload('local_type')
      .first();

    console.log('🔍 Debug - Show method - Local found:', local);
    console.log('🔍 Debug - Show method - Local type:', local?.local_type);

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

  async chats({ request, response, params, auth }: HttpContext) {
    const { data } = request.body();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Step 1: Define available tools
    const tools = [
      {
        type: "function",
        function: {
          name: "get_pokemon_info",
          description: "Get information about a Pokemon",
          parameters: {
            type: "object",
            properties: {
              pokemon_name: {
                type: "string",
                description: "The name of the Pokemon to get information about"
              }
            },
            required: ["pokemon_name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: 'greet_hello_world',
          description: 'Just a greeting response to hello world',
          parameters: {
            type: "object",
            properties: {
              greeting: {
                type: "string",
                description: "The greeting to say"
              }
            },
            required: ["greeting"]
          }
        },
      },
      {
        type: "function",
        function: {
          name: "search_places",
          description: "Get places as per search, longitude and latitude and radius by foursquare",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The query to search for, e.g. 'coffee', 'automobile', 'groceries near petrol pump'"
              },
              ll: {
                type: "string",
                description: "The longitude and latitude of the place to search for, e.g. '24.977006,67.211599'"
              },
              radius: {
                type: "number",
                description: "The radius within the place to search for in meters, e.g. '2000'"
              }
            },
            required: ["query", "ll", "radius"]
          }
        }
      }
    ];

    // Step 2: Start conversation with user message
    const local = await Locals.query()
    .where('uuid', params.local_id)
    .preload('local_type')
    .first();
    const messages = await

    console.log('🔍 Debug - Local found:', local);
    console.log('🔍 Debug - Local type:', local?.local_type);

    if (!local) {
      return response.status(404).json({
        status: 'error',
        message: 'Local not found',
      });
    }

    const localTypeName = local?.local_type?.name;
    const localTypeDescription = local?.local_type?.description;
    const localTypeShortDescription = local?.local_type?.short_description;
    const localName = local?.name;
    const localDescription = local?.description;
    const co_ordinates = local?.co_ordinates;

    const coords = typeof co_ordinates === 'string' ? JSON.parse(co_ordinates) : co_ordinates;
    const ll = coords?.lat + ',' + coords?.lng;
    const radius = local?.radius;

    const initialPrompt = `You are a local location master and a local guide who knows every places and details very well. You will help find places according to the users requirements.

    The query requested by the user is: ${data.text}.

    It's not always the user's query is relevant for what you are told to. Here are some of the rules to follow:
    - If user's greets you with Hello World or near similar, then get back with a greeting tool call.
    - If user's query is about pokemon, then get back with a get pokemon info tool call.
    - If the user's query is not relevant, check if you could provide any basic answers, but mention that you are here to answer any question related to the event category selected by the user.
    - If the user's query is not relevant, but it involves for perfect in tool calling, then call the tool and give the response.

    That being said, below are the details to proceed forward if you find relevant to the user's query.

    The details below will help you to understand the user's requirements and provide the best possible response.

    Here are the details about event category selected by the user:
    - Type of event: ${localTypeName}
    - Event description: ${localTypeDescription}
    - Event short description: ${localTypeShortDescription}

    Here are the details created by the user under the event category above:
    - Title: ${localName}
    - Description: ${localDescription}

    Here is the users current location in co-ordinates: ${ll} and looking for places within ${radius} radius in meters or kilometers based on your common sense and understanding of the value entered.

    Check for any details in user's query that resides to any details like radius, co-ordinates and so on explicitly, then use those.`;

    console.log("🚀 Starting chat with:", initialPrompt);

    await Messages.create({
      message_by: 'user',
      user_id: auth.user?.id,
      customer_id: auth.user?.customer?.id,
      local_id: local.id,
      message: data.text,
      message_prompt: initialPrompt,
      message_summary: null,
    });

    const conversation: any[] = [
      {
        role: "user",
        content: initialPrompt,
      }
    ];
    const toolsUsed: any[] = [];

    console.log("🚀 Starting chat with:", data.text);

    // Step 3: First AI call - AI decides if it needs tools
    console.log("🤖 Calling AI to see if tools are needed...");
    let aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      tools,
      messages: conversation
    });

    const aiMessage = aiResponse.choices[0].message;

    // Step 4: Check if AI wants to use any tools
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      console.log(`🔧 AI wants to use ${aiMessage.tool_calls.length} tool(s)`);

      // Add AI's response to conversation
      conversation.push({
        role: 'assistant',
        content: aiMessage.content,
        tool_calls: aiMessage.tool_calls
      });

      // Step 5: Execute each tool the AI requested
      for (const toolCall of aiMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        console.log(`⚡ Executing tool: ${toolName} with args:`, toolArgs);

        let toolResult;
        try {
          // Execute the specific tool
          switch (toolName) {
            case 'get_pokemon_info':
              toolResult = await this.pokemonService.getPokemonInfo(toolArgs.pokemon_name);
              break;
            case 'greet_hello_world':
              toolResult = await this.greetingService.greetHelloWorld();
              break;
            case 'search_places':
              toolResult = await this.fourSquareService.searchPlaces(
                toolArgs.query,
                toolArgs.ll || undefined,
                toolArgs.radius || undefined
              );
              break;
            default:
              toolResult = { error: `Unknown tool: ${toolName}` };
          }

          console.log(`✅ Tool ${toolName} result:`, toolResult);

          // Add tool result to conversation
          conversation.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            tool_name: toolName,
            content: JSON.stringify(toolResult),
            is_error: false,
          });

          toolsUsed.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            tool_name: toolName,
            content: JSON.stringify(toolResult),
            is_error: false,
          });

        } catch (error) {
          console.error(`❌ Error executing tool ${toolName}:`, error);
          conversation.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            tool_name: toolName,
            content: JSON.stringify({ error: error.message }),
            is_error: true,
            error_message: error.message
          });

          toolsUsed.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            tool_name: toolName,
            content: JSON.stringify({ error: error.message }),
            is_error: false,
          });
        }
      }

      // Step 6: Ask AI to give final response using tool results
      console.log("🔄 Asking AI for final response with tool results...");
      conversation.push({
        role: 'user',
        content: 'Remove any tool calls or tool call results from your responses. Avoid markdown and must format the response with HTML tags.'
      });

      aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: conversation
      });

      console.log("🎯 Final AI response received");
    } else {
      console.log("📝 No tools needed - direct AI response");
    }

    await Messages.create({
      message_by: 'assistant',
      user_id: auth.user?.id,
      customer_id: auth.user?.customer?.id,
      local_id: local.id,
      message: aiResponse.choices[0].message.content,
      metadata: JSON.parse(JSON.stringify({
        tool_calls: toolsUsed,
      })),
      message_prompt: null,
      message_summary: null,
    });

    // Step 7: Send final response
    const finalResponse = {
      status: 'success',
      message: 'Chat processed successfully',
      data: {
        ai_response: aiResponse.choices[0].message,
        conversation_length: conversation.length,
        tools_used: aiMessage.tool_calls ? aiMessage.tool_calls.length : 0,
        conversations: conversation.filter(msg => msg.role === 'assistant' || msg.role === 'tool'),
        tool_calls: aiMessage.tool_calls ? aiMessage.tool_calls.map((call: any) => {
          // Find the corresponding tool result in conversation
          const toolResult = conversation.find(msg =>
            msg.role === 'tool' && msg.tool_call_id === call.id
          );

          return {
            id: call.id,
            name: call.function.name,
            arguments: JSON.parse(call.function.arguments),
            result: toolResult ? JSON.parse(toolResult.content) : null
          };
        }) : []
      }
    };

    console.log("📤 Sending response to user");
    return response.status(200).send(finalResponse);
  }

  async indexChats({ response, params }: HttpContext) {
    const messages = await Messages.query()
      .where('local_id', params.local_id)
      .preload('user')
      .preload('customer')
      .orderBy('created_at', 'desc');

    return response.status(200).json({
      status: 'success',
      message: 'Chats fetched successfully',
      data: await MessagesTransformer.collection(messages),
    });
  }
}
