update public.problems
set code_requirements = '[{"type":"while_loop"},{"type":"forbidden_keywords","values":["for"]}]'::jsonb
where id = '평가7-1-08 1부터 n까지 합';
