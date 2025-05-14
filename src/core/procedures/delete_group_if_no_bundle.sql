create or replace function delete_group_if_no_bundle(_group_id integer)
returns json
language plpgsql
as $$
declare
  conflicting_bundles json;
begin
  -- Get all bundles associated via bundle_tag → tag → group
 select json_agg(json_build_object(
  'bundle_id', b.id,
  'bundle_name', b.data->>'display_title'
)) into conflicting_bundles
from bundle_tag bt
join tag t on t.id = bt.tag_id
join bundle b on b.id = bt.bundle_id
where t.tag_group_id = _group_id;

  -- If bundles are found, return error
  if conflicting_bundles is not null then
    return json_build_object(
      'error', 'Cannot delete group: some tags are associated with bundles',
      'code', 500,
      'bundles', conflicting_bundles
    );
  end if;

  -- Safe to delete group
  delete from tag_group where id = _group_id;

  return json_build_object('success', true);
exception
  when others then
    return json_build_object('error', sqlerrm, 'code', 500);
end;
$$;