create or replace function get_tags_with_group_all(
  search text,
  page integer,
  page_size integer
)
returns json
language sql
as $$
  select json_build_object(
    'total', (
      select count(*)
      from tag t
      join tag_group tg on tg.id = t.tag_group_id
      where t.name ilike '%' || search || '%'
    ),
    'items', (
      select json_agg(item)
      from (
        select
          t.id,
          t.name || ' (' || tg.name || ')' as title
        from tag t
        join tag_group tg on tg.id = t.tag_group_id
        where t.name ilike '%' || search || '%'
        order by t.name
        limit page_size
        offset (page - 1) * page_size
      ) as item
    )
  );
$$;
