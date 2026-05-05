const supabase = window.supabase.createClient(
  "https://zappjgtkkruwrnuolkkl.supabase.co/rest/v1/",
  "sb_publishable_YgZVl-xy_A2bXlgX8UOtBA_SDhaSbHl"
);

let currentUser = null;
let currentStudent = null;
let items = [];

// Вход
async function login() {
  const name = document.getElementById("name").value.trim();
  const password = document.getElementById("password").value.trim();

  const { data } = await supabase
    .from("users")
    .select("")
    .eq("name", name)
    .eq("password", password);

  if (!data || data.length === 0) {
    alert("Неверный логин");
    return;
  }

  currentUser = data[0];

  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";

  loadItems();
  loadReport();
}

// Проверка студента
async function checkStudent() {
  const id = document.getElementById("barcode").value;

  const { data } = await supabase
    .from("students")
    .select("")
    .eq("id", id);

  const info = document.getElementById("studentInfo");

  if (!data || data.length === 0) {
    info.innerHTML = "❌ не найден";
    currentStudent = null;
  } else {
    info.innerHTML = "✅ " + data[0].name;
    currentStudent = data[0];
  }
}

// Загрузка товаров
async function loadItems() {
  const { data } = await supabase.from("items").select("");
  items = data;

  const div = document.getElementById("items");
  div.innerHTML = "";

  items.forEach(item => {
    div.innerHTML +=       <div>         ${item.name} (${item.monthly_limit})         <input type="number" id="item_${item.id}" value="0">       </div>    ;
  });
}

// Месяц
function getMonth() {
  return new Date().toISOString().slice(0,7);
}

// Получить отчёт
async function getReportId() {
  const month = getMonth();

  let { data } = await supabase
    .from("reports")
    .select("")
    .eq("month", month);

  if (!data || data.length === 0) {
    const res = await supabase
      .from("reports")
      .insert([{ month }])
      .select();

    return res.data[0].id;
  }

  return data[0].id;
}

// Добавить запись
async function addEntry() {
  if (!currentStudent) {
    alert("Введите ID");
    return;
  }

  const reportId = await getReportId();

  const { data } = await supabase
    .from("entries")
    .insert([{
      report_id: reportId,
      student_id: currentStudent.id,
      secretary_id: currentUser.id
    }])
    .select();

  const entry = data[0];

  for (let item of items) {
    const qty = document.getElementById("item_" + item.id).value;

    if (qty > 0) {
      await supabase.from("entry_items").insert([{
        entry_id: entry.id,
        item_name: item.name,
        quantity: qty
      }]);
    }
  }

  loadReport();
}

// Отчёт
async function loadReport() {
  const { data } = await supabase
    .from("entries")
    .select("*")
    .order("created_at", { ascending: false });

  const list = document.getElementById("report");
  list.innerHTML = "";

  data.forEach(e => {
    const li = document.createElement("li");
    li.textContent = ${e.student_id} | ${e.created_at};
    list.appendChild(li);
  });
}
