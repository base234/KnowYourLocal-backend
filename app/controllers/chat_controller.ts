// app/Controllers/Http/ChatController.ts
import { HttpContext, Response } from '@adonisjs/core/http'
import OpenAI from 'openai';
import { PokemonService, GreetingService, MathService, FoursquareService } from '#services/index';

export default class ChatController {
  private pokemonService = new PokemonService()
  private greetingService = new GreetingService()
  private mathService = new MathService()
  private fourSquareService = new FoursquareService()

  public async createChat({ request, response }: HttpContext) {
    const { data } = request.body()

    this.streamChat(data.text, response);

    return response.status(200).send({
      status: 'success',
      message: 'Chat created successfully',
    });

  }

  async streamChat(message: string, response: Response) {
    // Set headers for SSE
    response.header('Content-Type', 'text/event-stream')
    response.header('Cache-Control', 'no-cache')
    response.header('Connection', 'keep-alive')
    response.header('Access-Control-Allow-Origin', '*')
    response.header('Access-Control-Allow-Headers', 'Cache-Control')
    response.header('Access-Control-Allow-Credentials', 'true')

    // Send initial connection message
    response.response.write('data: {"type":"connected","message":"Stream started"}\n\n')
    response.response.flushHeaders()

    const tools = [
      {
        type: "function" as const,
        function: {
          name: "print_hello_world",
          description: "Prints Hello World message",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_weather",
          description: "Get weather information for a specific location",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city and state/country, e.g. San Francisco, CA"
              }
            },
            required: ["location"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "calculate_math",
          description: "Perform mathematical operations",
          parameters: {
            type: "object",
            properties: {
              operation: {
                type: "string",
                enum: ["add", "subtract", "multiply", "divide", "power"],
                description: "The mathematical operation to perform"
              },
              a: {
                type: "number",
                description: "First number"
              },
              b: {
                type: "number",
                description: "Second number"
              }
            },
            required: ["operation", "a", "b"]
          }
        }
      },
      {
        type: "function" as const,
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
      }
    ]

    const messages: any[] = [
      { role: 'user', content: message }
    ]

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'auto',
        stream: true
      })

      let toolCalls: any[] = []
      let currentToolCallIndex = 0

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta
        const finishReason = chunk.choices[0]?.finish_reason

        // Handle content streaming
        if (delta?.content) {
          response.response.write(`data: ${JSON.stringify({
            type: 'content',
            content: delta.content
          })}\n\n`)
        }

        // Handle tool calls
        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const index = toolCall.index || 0

            // Initialize tool call if it doesn't exist
            if (!toolCalls[index]) {
              toolCalls[index] = {
                id: '',
                type: 'function',
                function: {
                  name: '',
                  arguments: ''
                }
              }
            }

            // Update tool call data
            if (toolCall.id) {
              toolCalls[index].id = toolCall.id
            }

            if (toolCall.function) {
              if (toolCall.function.name) {
                toolCalls[index].function.name += toolCall.function.name
              }
              if (toolCall.function.arguments) {
                toolCalls[index].function.arguments += toolCall.function.arguments
              }
            }

            // Send tool call update to frontend
            response.response.write(`data: ${JSON.stringify({
              type: 'tool_call_progress',
              tool_call: {
                id: toolCalls[index].id,
                function_name: toolCalls[index].function.name,
                arguments: toolCalls[index].function.arguments
              }
            })}\n\n`)
          }
        }

        // If stream finished with tool calls, execute them
        if (finishReason === 'tool_calls' && toolCalls.length > 0) {
          // Add assistant message with tool calls to conversation
          messages.push({
            role: 'assistant',
            content: null,
            tool_calls: toolCalls
          })

          // Execute each tool call
          for (const toolCall of toolCalls) {
            if (toolCall.function.name && toolCall.function.arguments) {
              try {
                // Parse arguments
                const args = JSON.parse(toolCall.function.arguments)

                // Send tool execution start notification
                response.response.write(`data: ${JSON.stringify({
                  type: 'tool_call_start',
                  tool_call_id: toolCall.id,
                  function_name: toolCall.function.name,
                  arguments: args
                })}\n\n`)

                // Execute the function
                const result = await this.executeFunction(toolCall.function.name, args)

                // Send tool execution result
                response.response.write(`data: ${JSON.stringify({
                  type: 'tool_call_result',
                  tool_call_id: toolCall.id,
                  function_name: toolCall.function.name,
                  result: result
                })}\n\n`)

                // Add tool result to conversation
                messages.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: JSON.stringify(result)
                })

              } catch (error) {
                console.error('Error executing function:', error)
                response.response.write(`data: ${JSON.stringify({
                  type: 'tool_call_error',
                  tool_call_id: toolCall.id,
                  error: error instanceof Error ? error.message : 'Unknown error'
                })}\n\n`)

                // Add error result to conversation
                messages.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
                })
              }
            }
          }

          // Make final call to get AI's response after tool execution
          try {
            const finalStream = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages,
              stream: true
            })

            for await (const finalChunk of finalStream) {
              const finalDelta = finalChunk.choices[0]?.delta
              const finalFinishReason = finalChunk.choices[0]?.finish_reason

              if (finalDelta?.content) {
                response.response.write(`data: ${JSON.stringify({
                  type: 'final_content',
                  content: finalDelta.content
                })}\n\n`)
              }

              if (finalFinishReason === 'stop') {
                break
              }
            }
          } catch (error) {
            console.error('Error getting final response:', error)
            response.response.write(`data: ${JSON.stringify({
              type: 'error',
              message: 'Error getting final response'
            })}\n\n`)
          }

          break // Exit the main loop after handling tool calls
        }

        // If stream finished normally without tool calls
        if (finishReason === 'stop') {
          break
        }
      }

    } catch (error) {
      console.error('OpenAI API Error:', error)
      response.response.write(`data: ${JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })}\n\n`)
    }

    // Send completion signal
    response.response.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    response.response.end()
  }

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
                description: "The radius within the place to search for, e.g. '2000'"
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
              toolResult = await this.fourSquareService.searchPlaces(toolArgs.query, toolArgs.ll, toolArgs.radius);
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
        content: 'Avoid mentioning the tool results directly in your conversations. Just give a very short explanation just as an initial introductive message. Beside, it is not always necessary to give response using the tool results. You decide when to response or not. Also, add a conclusion message at the end of your response. Use HTML tags for formatting.'
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
