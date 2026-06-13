begin;

alter table public.submissions
drop constraint if exists submissions_status_check;

alter table public.submissions
add constraint submissions_status_check
check (
  status in (
    'queued',
    'judging',
    'accepted',
    'wrong_answer',
    'runtime_error',
    'compile_error',
    'time_limit',
    'system_error',
    'code_requirement_failed'
  )
);

commit;
