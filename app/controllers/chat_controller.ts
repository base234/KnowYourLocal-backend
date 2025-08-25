// app/Controllers/Http/ChatController.ts
import { HttpContextContract, Response } from '@adonisjs/core/http'
import OpenAI from 'openai'
import axios from 'axios'

export default class ChatController {

  public async createChat({ request, response }: HttpContextContract) {
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

  async streamText({ request, response }: HttpContextContract) {
    const { data } = request.body();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // response.header('Content-Type', 'text/event-stream')
    // response.header('Cache-Control', 'no-cache')

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
        }
      }
    ];

    let input: any = [
      {
        role: "user",
        content: data.text,
      },
    ];

    let aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      tools,
      messages: input
    })

    let functionCall: any = null;
    let functionCallArguments: any = null;
    let toolCallExecuted = false;
    let toolCallResult = null;
    let allToolCalls: any[] = [];

    // Check if there are function calls in the response
    if (aiResponse.choices[0].message.tool_calls && aiResponse.choices[0].message.tool_calls.length > 0) {
      allToolCalls = aiResponse.choices[0].message.tool_calls;
      toolCallExecuted = true;

      console.log(`🔧 ${allToolCalls.length} TOOL CALL(S) DETECTED:`);
      allToolCalls.forEach((call, index) => {
        console.log(`Tool ${index + 1}: ${call.function.name}`);
        console.log(`Arguments:`, JSON.parse(call.function.arguments));
      });
    } else {
      console.log("📝 NO TOOL CALL - Direct response from AI");
    }

    // Add the AI response to input
    input.push({
      role: 'assistant',
      content: aiResponse.choices[0].message.content,
      tool_calls: aiResponse.choices[0].message.tool_calls
    });

    // Execute all tool calls if any exist
    if (allToolCalls.length > 0) {
      console.log("⚡ EXECUTING TOOL CALLS...");

      // Execute each tool call and collect results
      for (let i = 0; i < allToolCalls.length; i++) {
        const toolCall = allToolCalls[i];
        const toolCallArgs = JSON.parse(toolCall.function.arguments);

        console.log(`🔄 Executing tool ${i + 1}: ${toolCall.function.name}`);

        let result;
        try {
          switch (toolCall.function.name) {
            case 'get_pokemon_info':
              result = await this.getPokemonInfo(toolCallArgs.pokemon_name);
              break;
            case 'greet_hello_world':
              result = await this.greetHelloWorld(toolCallArgs.greeting);
              break;
            default:
              result = { error: `Unknown function: ${toolCall.function.name}` };
          }

          console.log(`✅ Tool ${i + 1} result:`, result);

          // Add tool result to conversation
          input.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          });

        } catch (error) {
          console.error(`❌ Error executing tool ${i + 1}:`, error);
          input.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: error.message })
          });
        }
      }

      console.log("🔄 SENDING FINAL REQUEST WITH ALL TOOL RESULTS...");
      console.log("Final input:", JSON.stringify(input, null, 2));

      input.push({
        role: 'user',
        content: 'Avoid markdown formatting in your response for texts. Instead use HTML tags to format your response. Do not say what you are doing, just do it. Do not mention the tool call in the response.'
      });

      aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: input,
        tools
      })

      console.log("🎯 FINAL AI RESPONSE AFTER TOOL CALLS:", JSON.stringify(aiResponse.choices[0].message, null, 2));
    }

    // Prepare response with clear tool call information
    const responseData = {
      status: 'success',
      message: 'Chat processed successfully',
      data: {
        ai_response: aiResponse.choices[0].message,
        tool_call_info: {
          tool_call_executed: toolCallExecuted,
          total_tools_called: allToolCalls.length,
          tools_executed: allToolCalls.map(call => ({
            function_name: call.function.name,
            function_arguments: JSON.parse(call.function.arguments)
          })),
          final_response_after_tool_call: toolCallExecuted
        }
      }
    };

    console.log("📤 FINAL RESPONSE:", JSON.stringify(responseData, null, 2));

    return response.status(200).send(responseData);
  }

  public async getPokemonInfo(pokemonName: string) {
    try {
      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`)
      const pokemon = response.data

      return {
        name: pokemon.name,
        id: pokemon.id,
        height: pokemon.height,
        weight: pokemon.weight,
        types: pokemon.types.map((type: any) => type.type.name),
        abilities: pokemon.abilities.map((ability: any) => ability.ability.name),
        stats: pokemon.stats.map((stat: any) => ({
          name: stat.stat.name,
          value: stat.base_stat
        })),
        sprite: pokemon.sprites.front_default
      }
    } catch (error) {
      console.error('Error fetching Pokemon info:', error)
      return {
        name: pokemonName,
        error: 'Failed to fetch Pokemon information'
      }
    }
  }

  public async greetHelloWorld(greeting: string) {
    return greeting + " Hello World to you too!";
  }

  private async executeFunction(functionName: string, args: any) {
    switch (functionName) {
      case 'print_hello_world':
        return { message: 'Hello World! 🌍' }

      case 'get_weather':
        // Using OpenWeatherMap API (you'll need to get an API key)
        // For demo purposes, returning mock data
        return {
          location: args.location,
          temperature: '22°C',
          condition: 'Sunny',
          humidity: '60%',
          wind: '10 km/h'
        }

      case 'calculate_math':
        const { operation, a, b } = args
        let result: number

        switch (operation) {
          case 'add':
            result = a + b
            break
          case 'subtract':
            result = a - b
            break
          case 'multiply':
            result = a * b
            break
          case 'divide':
            result = b !== 0 ? a / b : NaN
            break
          case 'power':
            result = Math.pow(a, b)
            break
          default:
            throw new Error('Invalid operation')
        }

        return {
          operation,
          operand1: a,
          operand2: b,
          result,
          expression: `${a} ${this.getOperationSymbol(operation)} ${b} = ${result} `
        }

      case 'get_pokemon_info':
        try {
          const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${args.pokemon_name.toLowerCase()}`)
          const pokemon = response.data

          return {
            name: pokemon.name,
            id: pokemon.id,
            height: pokemon.height,
            weight: pokemon.weight,
            types: pokemon.types.map((type: any) => type.type.name),
            abilities: pokemon.abilities.map((ability: any) => ability.ability.name),
            stats: pokemon.stats.map((stat: any) => ({
              name: stat.stat.name,
              value: stat.base_stat
            })),
            sprite: pokemon.sprites.front_default
          }
        } catch (error) {
          throw new Error(`Pokemon "${args.pokemon_name}" not found`)
        }

      default:
        throw new Error('Unknown function')
    }
  }

  private getOperationSymbol(operation: string): string {
    const symbols = {
      add: '+',
      subtract: '-',
      multiply: '*',
      divide: '/',
      power: '^'
    }
    return symbols[operation as keyof typeof symbols] || operation
  }
}
