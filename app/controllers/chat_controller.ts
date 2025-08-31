// app/Controllers/Http/ChatController.ts
import { HttpContext, Response } from '@adonisjs/core/http'
// @ts-ignore
import OpenAI from 'openai';
import { PokemonService, GreetingService, MathService, FoursquareService } from '#services/index';

export default class ChatController {
  private pokemonService = new PokemonService()
  private greetingService = new GreetingService()
  private mathService = new MathService()
  private fourSquareService = new FoursquareService()

  async streamText({ request, response }: HttpContext) {
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
    const conversation: any[] = [
      {
        role: "user",
        content: data.text,
      }
    ];

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
        }
      }

      // Step 6: Ask AI to give final response using tool results
      console.log("🔄 Asking AI for final response with tool results...");
      conversation.push({
        role: 'user',
        content: 'Avoid mentioning the tool in your conversations. Just give a very short explanation just as an initial introductive message. Beside, avoid necessity to always give responses using the tool results. Also, add a conclusion message at the end of your response. Use HTML tags for formatting.'
      });

      aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: conversation
      });

      console.log("🎯 Final AI response received");
    } else {
      console.log("📝 No tools needed - direct AI response");
    }

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
}
