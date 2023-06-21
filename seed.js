const getPokemonArrays = require("./fetch");
const db = require("./connection");
const format = require("pg-format");

function seed() {
  let pokemonObj = {};
  let typeLookup = {};
  let moveLookup = {};
  //Drop Tables
  return (
    db
      .query(`DROP TABLE IF EXISTS type_junction;`)
      .then(() => {
        return db.query(`DROP TABLE IF EXISTS move_junction;`);
      })
      .then(() => {
        return db.query(`DROP TABLE IF EXISTS pokemon_info;`);
      })
      .then(() => {
        return db.query(`DROP TABLE IF EXISTS pokemon_types;`);
      })
      .then(() => {
        return db.query(`DROP TABLE IF EXISTS pokemon_moves;`);
      })
      //Create pokemon_info Table
      .then(() => {
        return db.query(`CREATE TABLE pokemon_info (
    pokemon_id SERIAL PRIMARY KEY, pokemon_name VARCHAR NOT NULL, height INT NOT NULL, weight INT NOT NULL, sprite VARCHAR NOT NULL);
    `);
      })
      //Fetch Data
      .then(() => {
        return getPokemonArrays();
      })
      //Save it in global scope
      .then((pokemonData) => {
        pokemonObj = pokemonData;
        //Insert pokemon info into pokemon_info table
        const pokemonInputString = format(
          `INSERT INTO pokemon_info(pokemon_name, height, weight, sprite) VALUES %L RETURNING *;`,
          pokemonObj.info
        );
        return db.query(pokemonInputString);
      })
      //Create pokemon_types table
      .then(() => {
        return db.query(`CREATE TABLE pokemon_types (
        type_id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL);`);
      })
      //Populate types lookup and make array of type arrays
      .then(() => {
        const types = new Set(pokemonObj.types.flat());
        const arrayTypes = [...types].map((type, index) => {
          typeLookup[type] = index + 1;
          return [type];
        });
        //Insert types into pokemon_types table
        const typeTableInsert = format(
          `INSERT INTO pokemon_types (type) VALUES %L;`,
          arrayTypes
        );
        return db.query(typeTableInsert);
      })
      //Create pokemon_moves table
      .then(() => {
        return db.query(`CREATE TABLE pokemon_moves (
        move_id SERIAL PRIMARY KEY,
        move VARCHAR(20) NOT NULL);`);
      })
      //Populate moves lookup and make array of move arrays
      .then(() => {
        const moves = new Set(pokemonObj.moves.flat());
        const arrayMoves = [...moves].map((move, index) => {
          moveLookup[move] = index + 1;
          return [move];
        });
        //Insert moves into pokemon_moves table
        const moveTableInsert = format(
          `INSERT INTO pokemon_moves (move) VALUES %L;`,
          arrayMoves
        );
        return db.query(moveTableInsert);
      })
      //Create type_junction table
      .then(() => {
        return db.query(
          `CREATE TABLE type_junction (type_junction_id SERIAL PRIMARY KEY, pokemon_id INT REFERENCES pokemon_info(pokemon_id), type_id INT REFERENCES pokemon_types(type_id));`
        );
      })
      //Populate type_junction table
      .then(() => {
        const formattedTypes = [];
        const typeNumbers = pokemonObj.types.forEach((pokemonsTypes, index) => {
          pokemonsTypes.forEach((type) => {
            formattedTypes.push([index + 1, typeLookup[type]]);
          });
        });
        const insertJunctionStrTypes = format(
          `INSERT INTO type_junction (pokemon_id, type_id) VALUES %L`,
          formattedTypes
        );
        return db.query(insertJunctionStrTypes);
      })
      //Create move_junction table
      .then(() => {
        return db.query(
          `CREATE TABLE move_junction (move_junction_id SERIAL PRIMARY KEY, pokemon_id INT REFERENCES pokemon_info(pokemon_id), move_id INT REFERENCES pokemon_moves(move_id));`
        );
      })
      //Populate move_junction table
      .then(() => {
        const formattedMoves = [];
        const moveNumbers = pokemonObj.moves.forEach((pokemonsMoves, index) => {
          pokemonsMoves.forEach((move) => {
            formattedMoves.push([index + 1, moveLookup[move]]);
          });
        });
        const insertJunctionStrMoves = format(
          `INSERT INTO move_junction (pokemon_id, move_id) VALUES %L`,
          formattedMoves
        );
        return db.query(insertJunctionStrMoves);
      })
      .then(() => {
        return db.query(`SELECT
          p.pokemon_id,
          p.pokemon_name,
          p.height,
          p.weight,
          LEFT(p.sprite, 20) AS sprite,
          ARRAY_AGG(DISTINCT pt.type) AS types,
          ARRAY_AGG(DISTINCT pm.move) AS moves
        FROM
          pokemon_info p
        JOIN
          type_junction tj ON p.pokemon_id = tj.pokemon_id
        JOIN
          pokemon_types pt ON tj.type_id = pt.type_id
        JOIN
          move_junction mj ON p.pokemon_id = mj.pokemon_id
        JOIN
          pokemon_moves pm ON mj.move_id = pm.move_id
        GROUP BY
          p.pokemon_id;`);
      })
      .then((res) => {
        console.log(res.rows);
      })
  );
}

module.exports = { seed };
