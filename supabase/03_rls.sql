-- ============================================================
-- Phase 1: Row Level Security (RLS)
-- นักเรียนเข้าถึงเฉพาะข้อมูลของตัวเองและวิชาที่ลงทะเบียน
-- ============================================================

-- เปิด RLS ทุกตาราง
alter table subjects         enable row level security;
alter table sections         enable row level security;
alter table students         enable row level security;
alter table student_sections enable row level security;
alter table assignments      enable row level security;
alter table submissions      enable row level security;

-- -------------------------------------------------------
-- subjects: เห็นเฉพาะวิชาที่ตัวเองลงทะเบียน
-- -------------------------------------------------------
create policy "students see their subjects" on subjects
  for select using (
    id in (
      select s.subject_id
      from sections s
      join student_sections ss on ss.section_id = s.id
      where ss.student_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- sections: เห็นเฉพาะห้องที่ตัวเองอยู่
-- -------------------------------------------------------
create policy "students see their sections" on sections
  for select using (
    id in (
      select section_id from student_sections
      where student_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- students: เห็นเฉพาะ profile ตัวเอง / แก้ไขได้เฉพาะตัวเอง
-- -------------------------------------------------------
create policy "students see own profile" on students
  for select using (id = auth.uid());

create policy "students insert own profile" on students
  for insert with check (id = auth.uid());

create policy "students update own profile" on students
  for update using (id = auth.uid());

-- -------------------------------------------------------
-- student_sections: เห็นเฉพาะของตัวเอง
-- -------------------------------------------------------
create policy "students see own enrollments" on student_sections
  for select using (student_id = auth.uid());

-- -------------------------------------------------------
-- assignments: เห็นเฉพาะงานของวิชาที่ตัวเองลงทะเบียน
-- -------------------------------------------------------
create policy "students see assignments of their subjects" on assignments
  for select using (
    subject_id in (
      select s.subject_id
      from sections s
      join student_sections ss on ss.section_id = s.id
      where ss.student_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- submissions: เห็น/สร้าง/แก้ไขเฉพาะของตัวเอง
-- -------------------------------------------------------
create policy "students see own submissions" on submissions
  for select using (student_id = auth.uid());

create policy "students insert own submissions" on submissions
  for insert with check (student_id = auth.uid());

create policy "students update own submissions" on submissions
  for update using (student_id = auth.uid());
