begin;

update public.test_cases test_case
set is_sample = false
where test_case.is_sample = true
  and (
    select count(*)
    from public.test_cases sibling
    where sibling.problem_id = test_case.problem_id
  ) = 1;

commit;
