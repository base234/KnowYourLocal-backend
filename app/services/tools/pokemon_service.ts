import axios from 'axios';

export class PokemonService {
  /**
   * Get information about a Pokemon from the PokeAPI
   * @param pokemonName - The name of the Pokemon to get information about
   * @returns Pokemon information including stats, types, abilities, etc.
   */
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
        sprite: pokemon.sprites.front_default,
        is_error: false
      }
    } catch (error) {
      console.error('Error fetching Pokemon info:', error)
      return {
        name: pokemonName,
        is_error: true,
        error_message: 'Failed to fetch Pokemon information',
      }
    }
  }
}
