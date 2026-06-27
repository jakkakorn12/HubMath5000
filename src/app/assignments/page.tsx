import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { AssignmentCategory } from "@/lib/supabase/types";

const categoryLabel: Record<AssignmentCategory, string> = {
  practice:   "งานฝึก / สอบย่อย",
  midterm:    "กลางภาค",
  final:      "ปลายภาค",
  competency: "สมรรถนะ",
};

const categoryColor: Record<AssignmentCategory, string> = {
  practice:   "bg-blue-50 border-blue-200",
  midterm:    "bg-yellow-50 border-yellow-200",
  final:      "bg-red-50 border-red-200",
  competency: "bg-green-50 border-green-200",
};

const termLabel: Record<number, string> = {
  1: "ครึ่งแรก",
  2: "ครึ่งหลัง",
};

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject_id?: string }>;
}) {
  const { subject_id } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!subject_id) redirect("/dashboard");

  const { data: subject } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", subject_id)
    .single();

  const { data: assignments } = await supabase
    .from("assignments")
    .select("*")
    .eq("subject_id", subject_id)
    .order("term")
    .order("category")
    .order("created_at");

  const { data: submissions } = await supabase
    .from("submissions")
    .select("assignment_id, score")
    .eq("student_id", user.id);

  const subMap = new Map(submissions?.map((s) => [s.assignment_id, s.score]) ?? []);

  // จัดกลุ่ม term → category → assignments
  const grouped: Record<number, Record<string, typeof assignments>> = {};
  for (const a of assignments ?? []) {
    if (!grouped[a.term]) grouped[a.term] = {};
    if (!grouped[a.term][a.category]) grouped[a.term][a.category] = [];
    grouped[a.term][a.category]!.push(a);
  }

  // คำนวณคะแนนรวมแต่ละ term
  function termTotal(term: number) {
    const list = (assignments ?? []).filter((a) => a.term === term);
    const maxTotal = list.reduce((s, a) => s + a.max_score, 0);
    const scored = list.reduce((s, a) => {
      const sc = subMap.get(a.id);
      return sc != null ? s + sc : s;
    }, 0);
    const submitted = list.filter((a) => subMap.has(a.id)).length;
    return { maxTotal, scored, submitted, total: list.length };
  }

  const subjectTypeLabel: Record<string, string> = {
    basic: "พื้นฐาน", advanced: "เพิ่มเติม", elective: "เลือก",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">← กลับหน้าหลัก</Link>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-800">
            {subject?.name}{" "}
            <span className="text-gray-400 font-normal text-sm">
              ({subjectTypeLabel[subject?.type ?? ""]})
            </span>
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {[1, 2].map((term) => {
          const termData = grouped[term];
          if (!termData) return null;
          const { maxTotal, scored, submitted, total } = termTotal(term);

          return (
            <div key={term}>
              {/* หัว term */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-700">{termLabel[term]}</h2>
                <div className="text-sm text-gray-500">
                  ส่งแล้ว {submitted}/{total} ชิ้น •{" "}
                  <span className="font-semibold text-gray-700">
                    รวม {scored}/{maxTotal} คะแนน
                  </span>
                </div>
              </div>

              {/* กลุ่มตามประเภท */}
              <div className="space-y-4">
                {(["practice", "midterm", "competency", "final"] as AssignmentCategory[]).map((cat) => {
                  const items = termData[cat];
                  if (!items || items.length === 0) return null;

                  const catMax = items.reduce((s, a) => s + a.max_score, 0);
                  const catScore = items.reduce((s, a) => {
                    const sc = subMap.get(a.id);
                    return sc != null ? s + sc : s;
                  }, 0);

                  return (
                    <div key={cat} className={`rounded-xl border p-4 ${categoryColor[cat]}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-700 text-sm">
                          {categoryLabel[cat]}
                        </span>
                        <span className="text-sm font-bold text-gray-600">
                          รวม {catScore}/{catMax}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {items.map((a) => {
                          const score = subMap.get(a.id);
                          return (
                            <div
                              key={a.id}
                              className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow-sm"
                            >
                              <span className="text-sm text-gray-700">{a.title}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400">/{a.max_score}</span>
                                {score != null ? (
                                  <span className="text-sm font-bold text-green-600 w-8 text-right">
                                    {score}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-300 w-8 text-right">—</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
