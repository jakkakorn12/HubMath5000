-- ============================================================
-- Phase 1: Schema Setup
-- รัน script นี้ใน Supabase SQL Editor
-- ============================================================

-- 1. Enum สำหรับประเภทวิชา
create type subject_type as enum ('basic', 'advanced', 'elective');

-- 2. ตาราง subjects (3 วิชา)
create table subjects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null unique,
  type        subject_type not null,
  created_at  timestamptz default now()
);

-- 3. ตาราง sections (ห้องเรียน — แต่ละห้องสังกัดวิชาใดวิชาหนึ่ง)
create table sections (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,          -- เช่น "11", "12", "21"
  subject_id    uuid not null references subjects(id) on delete cascade,
  academic_year text not null default '2567',
  created_at    timestamptz default now(),
  unique(name, subject_id, academic_year)
);

-- 4. ตาราง students (profile เชื่อมกับ auth.users)
create table students (
  id           uuid primary key references auth.users(id) on delete cascade,
  student_code text not null unique,
  full_name    text not null,
  created_at   timestamptz default now()
);

-- 5. ตาราง student_sections (นักเรียน ↔ ห้อง many-to-many)
create table student_sections (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(id) on delete cascade,
  section_id  uuid not null references sections(id) on delete cascade,
  enrolled_at timestamptz default now(),
  unique(student_id, section_id)
);

-- 6. ตาราง assignments (งาน ผูกกับวิชา ใช้ร่วมทุกห้องของวิชานั้น)
create table assignments (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references subjects(id) on delete cascade,
  title       text not null,
  description text,
  due_date    timestamptz,
  max_score   integer not null default 100,
  created_at  timestamptz default now()
);

-- 7. ตาราง submissions (การส่งงานของนักเรียน)
create table submissions (
  id           uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id   uuid not null references students(id) on delete cascade,
  content      text,
  file_url     text,
  score        integer,
  submitted_at timestamptz default now(),
  graded_at    timestamptz,
  unique(assignment_id, student_id)
);

-- Index เพิ่มประสิทธิภาพ
create index idx_sections_subject on sections(subject_id);
create index idx_student_sections_student on student_sections(student_id);
create index idx_student_sections_section on student_sections(section_id);
create index idx_assignments_subject on assignments(subject_id);
create index idx_submissions_assignment on submissions(assignment_id);
create index idx_submissions_student on submissions(student_id);
