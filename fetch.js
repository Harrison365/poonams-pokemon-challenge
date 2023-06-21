const axios = require("axios");

function getPokemonArrays() {
  const promiseArray = [];

  for (let i = 1; i < 152; i++) {
    promiseArray.push(axios.get(`https://pokeapi.co/api/v2/pokemon/${i}`));
  }

  return Promise.all(promiseArray).then((res) => {
    const allInfo = {};
    const pokemonInfoArray = [];
    const pokemonTypesArray = [];
    const pokemonMovesArray = [];
    res.forEach(({ data }) => {
      //Info
      const pokeArray = [
        data.name,
        data.height,
        data.weight,
        data.sprites.front_default,
      ];
      pokemonInfoArray.push(pokeArray);
      //Types
      const types = [];
      data.types.forEach(({ type }) => {
        types.push(type.name);
      });
      pokemonTypesArray.push(types);
      //Moves
      const moves = [];
      data.moves.forEach(({ move }) => {
        moves.push(move.name);
      });
      pokemonMovesArray.push(moves);
    });
    allInfo.info = pokemonInfoArray;
    allInfo.types = pokemonTypesArray;
    allInfo.moves = pokemonMovesArray;
    return allInfo;
  });
}

module.exports = getPokemonArrays;
