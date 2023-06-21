const getPokemonArrays = require("./fetch");
const db = require("./connection");
const format = require("pg-format");

function seed() {
  let pokemonObj = {};
  let typeLookup = {};
  return db
    .query(`DROP TABLE IF EXISTS type_junction;`)
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS pokemon_info;`);
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS pokemon_types;`);
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS pokemon_moves;`);
    })
    .then(() => {
      return db.query(`CREATE TABLE pokemon_info (
    pokemon_id SERIAL PRIMARY KEY, pokemon_name VARCHAR NOT NULL, height INT NOT NULL, weight INT NOT NULL, sprite VARCHAR NOT NULL);
    `);
    })
    .then(() => {
      return getPokemonArrays();
    })
    .then((pokemonData) => {
      pokemonObj = pokemonData;

      const pokemonInputString = format(
        `INSERT INTO pokemon_info(pokemon_name, height, weight, sprite) VALUES %L RETURNING *;`,
        pokemonObj.info
      );
      return db.query(pokemonInputString);
    })
    .then(() => {
      return db.query(`CREATE TABLE pokemon_types (
        type_id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL);`);
    })
    .then(() => {
      const types = new Set(pokemonObj.types.flat());
      const arrayTypes = [...types].map((type, index) => {
        typeLookup[type] = index + 1;
        return [type];
      });

      const typeTableInsert = format(
        `INSERT INTO pokemon_types (type) VALUES %L;`,
        arrayTypes
      );
      return db.query(typeTableInsert);
    })
    .then(() => {
      return db.query(`CREATE TABLE pokemon_moves (
        move_id SERIAL PRIMARY KEY,
        move VARCHAR(20) NOT NULL);`);
    })
    .then(() => {
      const moves = new Set(pokemonObj.moves.flat());
      const arrayMoves = [...moves].map((move) => {
        return [move];
      });

      const moveTableInsert = format(
        `INSERT INTO pokemon_moves (move) VALUES %L;`,
        arrayMoves
      );
      return db.query(moveTableInsert);
    })
    .then(() => {
      return db.query(
        `CREATE TABLE type_junction (type_junction_id SERIAL PRIMARY KEY, pokemon_id INT REFERENCES pokemon_info(pokemon_id), type_id INT REFERENCES pokemon_types(type_id));`
      );
    })
    .then(() => {
      console.log(typeLookup);
      const formattedTypes = [];
      const typeNumbers = pokemonObj.types.forEach((pokemonsTypes, index) => {
        pokemonsTypes.forEach((type) => {
          formattedTypes.push([index + 1, typeLookup[type]]);
        });
      });
      const insertJunctionStr = format(
        `INSERT INTO type_junction (pokemon_id, type_id) VALUES %L`,
        formattedTypes
      );
      return db.query(insertJunctionStr);
    })
    .then(() => {
      return db.query(
        `SELECT pokemon_info.pokemon_name, pokemon_info.height, pokemon_info.weight, pokemon_info.sprite, ARRAY_AGG(pokemon_types.type) AS types FROM pokemon_info JOIN type_junction ON pokemon_info.pokemon_id = type_junction.pokemon_id JOIN pokemon_types ON type_junction.type_id = pokemon_types.type_id GROUP BY
        pokemon_info.pokemon_name,pokemon_info.height,
        pokemon_info.weight,
        pokemon_info.sprite;`
      );
    })
    .then((res) => {
      console.log(res.rows);
    });
}
//now same for moves
module.exports = { seed };
