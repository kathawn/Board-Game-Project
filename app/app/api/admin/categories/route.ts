import { requireStaff } from "@/lib/auth/staff";
import { adminCategories } from "@/lib/admin/categories";
import type { CategorySort, CategoryTab } from "@/lib/admin/types";

const TABS: CategoryTab[] = ["", "co-san-pham", "trong"];
const SORTS: CategorySort[] = ["ten", "san-pham", "doanh-thu"];

/** Quản lý danh mục (mở rộng UC-15, FR-ADM-03) — chỉ Admin.
 * GET ?q=&tab=(co-san-pham|trong)&sort=(ten|san-pham|doanh-thu)&page= → một trang danh mục + số đếm theo tab.
 * POST {ten} → tạo danh mục rỗng. */
export async function GET(request: Request) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  const sp = new URL(request.url).searchParams;
  const tab = (sp.get("tab") ?? "") as CategoryTab;
  const sort = (sp.get("sort") ?? "ten") as CategorySort;
  const page = await adminCategories.query({
    q: sp.get("q") ?? "",
    tab: TABS.includes(tab) ? tab : "",
    sort: SORTS.includes(sort) ? sort : "ten",
    page: Number(sp.get("page")) || 1,
  });
  return Response.json({ ok: true, ...page });
}

export async function POST(request: Request) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }
  const ten = (body as { ten?: unknown })?.ten;
  if (typeof ten !== "string") return Response.json({ error: "Thiếu tên danh mục." }, { status: 400 });

  const result = await adminCategories.create(ten);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, ten: result.ten }, { status: 201 });
}
