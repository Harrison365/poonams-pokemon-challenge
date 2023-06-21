\c pokemon_challenge

SELECT
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
  p.pokemon_id;