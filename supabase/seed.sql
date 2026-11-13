-- Sample people for a local Supabase database (`supabase db reset`).
-- Emails are example.com documentation addresses. Password for each account: demo-password
-- Keep these rows aligned with src/lib/store/seed.ts. Google ids are left empty.

create extension if not exists pgcrypto with schema extensions;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'student@example.com', extensions.crypt('demo-password', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"account_type":"student"}', '{"full_name":"Demo Student"}', now(), now(), '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'applicant@example.com', extensions.crypt('demo-password', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"account_type":"teacher","hiring_status":"submitted"}', '{"full_name":"Demo Applicant"}', now(), now(), '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'interview@example.com', extensions.crypt('demo-password', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"account_type":"teacher","hiring_status":"interview_scheduled"}', '{"full_name":"Demo Interview"}', now(), now(), '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'candidate@example.com', extensions.crypt('demo-password', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"account_type":"teacher","hiring_status":"assessed"}', '{"full_name":"Demo Candidate"}', now(), now(), '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'teacher@example.com', extensions.crypt('demo-password', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"account_type":"teacher","hiring_status":"approved"}', '{"full_name":"Demo Teacher"}', now(), now(), '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'studio.admin@example.com', extensions.crypt('demo-password', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"account_type":"admin"}', '{"full_name":"Demo Admin"}', now(), now(), '', '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select id, id, jsonb_build_object('sub', id::text, 'email', email), 'email', id::text, now(), now(), now()
from auth.users
where email like '%@example.com'
on conflict do nothing;

insert into public.profiles (id, email, full_name, account_type)
values
  ('11111111-1111-4111-8111-111111111111', 'student@example.com', 'Demo Student', 'student'),
  ('22222222-2222-4222-8222-222222222222', 'applicant@example.com', 'Demo Applicant', 'teacher'),
  ('33333333-3333-4333-8333-333333333333', 'interview@example.com', 'Demo Interview', 'teacher'),
  ('44444444-4444-4444-8444-444444444444', 'candidate@example.com', 'Demo Candidate', 'teacher'),
  ('55555555-5555-4555-8555-555555555555', 'teacher@example.com', 'Demo Teacher', 'teacher'),
  ('66666666-6666-4666-8666-666666666666', 'studio.admin@example.com', 'Demo Admin', 'admin')
on conflict (id) do nothing;

insert into public.teacher_applications (id, user_id, full_name, email, phone, education, experience, requested_grades, statement, hiring_status)
values
  ('22222222-2222-4222-8222-222222222201', '22222222-2222-4222-8222-222222222222', 'Demo Applicant', 'applicant@example.com', '+251 000 000 002', 'BEd Mathematics, sample university', 'Two years tutoring small groups.', array[9, 10], 'I want to teach the grades I have studied most carefully, starting with grade 9.', 'submitted'),
  ('33333333-3333-4333-8333-333333333301', '33333333-3333-4333-8333-333333333333', 'Demo Interview', 'interview@example.com', '+251 000 000 003', 'BSc Mathematics', 'Classroom teaching assistant.', array[9], 'Grade 9 is the year I most want to teach.', 'interview_scheduled'),
  ('44444444-4444-4444-8444-444444444401', '44444444-4444-4444-8444-444444444444', 'Demo Candidate', 'candidate@example.com', '+251 000 000 004', 'MSc Mathematics', 'Taught grades 9 through 12 in a school setting.', array[9, 10, 11, 12], 'I am applying to be assessed for every grade.', 'assessed'),
  ('55555555-5555-4555-8555-555555555501', '55555555-5555-4555-8555-555555555555', 'Demo Teacher', 'teacher@example.com', '+251 000 000 005', 'BEd Mathematics', 'Four years teaching grade 9 and grade 10.', array[9, 10], 'I teach the first two grades of high-school mathematics.', 'approved')
on conflict (id) do nothing;

insert into public.interviews (id, application_id, scheduled_at, interviewer_email, notes)
values ('33333333-3333-4333-8333-333333333302', '33333333-3333-4333-8333-333333333301', now() + interval '3 days', '', '')
on conflict (id) do nothing;

insert into public.assessments (id, application_id, scores, sample_lesson_notes)
values
  ('44444444-4444-4444-8444-444444444402', '44444444-4444-4444-8444-444444444401', '{"9":92,"10":88,"11":86,"12":74}'::jsonb, 'Explained a grade 9 equation by working one example, then letting the student finish the next.'),
  ('55555555-5555-4555-8555-555555555502', '55555555-5555-4555-8555-555555555501', '{"9":81,"10":76}'::jsonb, 'Clear worked example for linear equations.')
on conflict (id) do nothing;

insert into public.teacher_grade_approvals (id, teacher_id, application_id, grade, all_four, source, opted_in)
values
  ('55555555-5555-4555-8555-555555555511', '55555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555501', 9, false, 'rule', true),
  ('55555555-5555-4555-8555-555555555512', '55555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555501', 10, false, 'rule', false)
on conflict (id) do nothing;

insert into public.student_enrollments (id, student_id, grade, active)
values ('11111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111', 9, true)
on conflict (id) do nothing;

insert into public.sessions (id, grade, teacher_id, title, starts_at, ends_at, meet_link, meet_source, status, created_by)
values (
  '55555555-5555-4555-8555-555555555521', 9, '55555555-5555-4555-8555-555555555555', 'Grade 9 equations',
  now() + interval '2 days', now() + interval '2 days 1 hour', 'https://meet.google.com/demo-grade-nine', 'manual', 'scheduled',
  '55555555-5555-4555-8555-555555555555'
)
on conflict (id) do nothing;

insert into public.assignments (id, grade, teacher_id, title, instructions, due_at)
values (
  '55555555-5555-4555-8555-555555555531', 9, '55555555-5555-4555-8555-555555555555', 'Practice set 1',
  'Solve the eight linear equations from the lesson. Show each step.', now() + interval '6 days'
)
on conflict (id) do nothing;
