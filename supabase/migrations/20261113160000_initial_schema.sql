-- High-school tutoring studio. Apply with the Supabase CLI or SQL editor.
-- Authorization data lives in app_metadata, never in user-editable user_metadata.

create schema if not exists app_private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  account_type text not null check (account_type in ('student', 'teacher', 'admin')),
  created_at timestamptz not null default now()
);

create table public.teacher_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  education text not null,
  experience text not null,
  requested_grades int[] not null,
  statement text not null,
  hiring_status text not null default 'submitted' check (
    hiring_status in (
      'submitted', 'interview_scheduled', 'interviewed', 'assessment_in_progress',
      'assessed', 'approved', 'on_hold', 'rejected'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint requested_grades_ok check (
    cardinality(requested_grades) >= 1 and requested_grades <@ array[9, 10, 11, 12]::int[]
  )
);

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.teacher_applications (id) on delete cascade,
  scheduled_at timestamptz not null,
  interviewer_email text not null default '',
  notes text not null default '',
  outcome text check (outcome in ('advance', 'hold', 'reject')),
  created_at timestamptz not null default now()
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.teacher_applications (id) on delete cascade,
  scores jsonb not null default '{}'::jsonb,
  sample_lesson_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scores_are_object check (jsonb_typeof(scores) = 'object')
);

create table public.teacher_grade_approvals (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  application_id uuid references public.teacher_applications (id) on delete set null,
  grade int not null check (grade between 9 and 12),
  all_four boolean not null default false,
  source text not null check (source in ('rule', 'override')),
  reason text,
  opted_in boolean not null default false,
  created_at timestamptz not null default now(),
  unique (teacher_id, grade)
);

create table public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  grade int not null check (grade between 9 and 12),
  active boolean not null default true,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create unique index student_one_active_grade on public.student_enrollments (student_id) where active;

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  grade int not null check (grade between 9 and 12),
  teacher_id uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  meet_link text,
  meet_source text not null check (meet_source in ('manual', 'google')),
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'completed')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  constraint session_time_ok check (ends_at > starts_at)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  grade int not null check (grade between 9 and 12),
  teacher_id uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  instructions text not null default '',
  due_at timestamptz,
  classroom_course_id text,
  classroom_coursework_id text,
  created_at timestamptz not null default now()
);

create index sessions_grade_starts_idx on public.sessions (grade, starts_at);
create index assignments_grade_idx on public.assignments (grade);
create index applications_status_idx on public.teacher_applications (hiring_status);

create or replace function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function app_private.account_type()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select auth.jwt() -> 'app_metadata' ->> 'account_type';
$$;

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, account_type)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_app_meta_data ->> 'account_type', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app_private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.teacher_applications enable row level security;
alter table public.interviews enable row level security;
alter table public.assessments enable row level security;
alter table public.teacher_grade_approvals enable row level security;
alter table public.student_enrollments enable row level security;
alter table public.sessions enable row level security;
alter table public.assignments enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select app_private.is_admin()));

create policy applications_select on public.teacher_applications
  for select to authenticated
  using (user_id = (select auth.uid()) or (select app_private.is_admin()));

create policy interviews_select on public.interviews
  for select to authenticated
  using ((select app_private.is_admin()));

create policy assessments_select on public.assessments
  for select to authenticated
  using ((select app_private.is_admin()));

create policy approvals_select on public.teacher_grade_approvals
  for select to authenticated
  using (teacher_id = (select auth.uid()) or (select app_private.is_admin()));

create policy enrollments_select on public.student_enrollments
  for select to authenticated
  using (student_id = (select auth.uid()) or (select app_private.is_admin()));

create policy sessions_select on public.sessions
  for select to authenticated
  using (
    (select app_private.is_admin())
    or teacher_id = (select auth.uid())
    or (
      (select app_private.account_type()) = 'student'
      and grade = (
        select e.grade from public.student_enrollments e
        where e.student_id = (select auth.uid()) and e.active
        limit 1
      )
    )
  );

create policy assignments_select on public.assignments
  for select to authenticated
  using (
    (select app_private.is_admin())
    or teacher_id = (select auth.uid())
    or (
      (select app_private.account_type()) = 'student'
      and grade = (
        select e.grade from public.student_enrollments e
        where e.student_id = (select auth.uid()) and e.active
        limit 1
      )
    )
  );

revoke all on schema app_private from public;
revoke all on function app_private.is_admin() from public;
revoke all on function app_private.account_type() from public;
revoke all on function app_private.handle_new_user() from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant usage on schema app_private to authenticated;
    grant execute on function app_private.is_admin() to authenticated;
    grant execute on function app_private.account_type() to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant usage on schema app_private to supabase_auth_admin;
    grant execute on function app_private.handle_new_user() to supabase_auth_admin;
  end if;
end $$;
