"use client";

import { useMemo, useState } from "react";

const presets = [
  "Осенний парк",
  "Школьный двор",
  "Лесная прогулка",
  "Деревня",
  "Вокзал",
];

export default function Home() {
  const [theme, setTheme] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [grade, setGrade] = useState("2");
  const [difficulty, setDifficulty] = useState("Средняя");
  const [style, setStyle] = useState("Реалистичная иллюстрация");
  const [checking, setChecking] = useState(true);
  const [generated, setGenerated] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showAnswers, setShowAnswers] = useState(false);

  const addWord = () => {
    const value = draft.trim().replace(/\s+/g, " ");

    if (
      value &&
      words.length < 12 &&
      !words.some((w) => w.toLowerCase() === value.toLowerCase())
    ) {
      setWords([...words, value]);
      setDraft("");
    }
  };

  const promptPreview = useMemo(() => {
    return `Создай ${style.toLowerCase()} для ${grade} класса на тему «${
      theme || "указанная тема"
    }». Естественно размести объекты, соответствующие словам: ${
      words.join(", ") || "слова пока не добавлены"
    }. Не подписывай объекты.`;
  }, [theme, grade, style, words]);

  const generate = async () => {
    if (!theme.trim() || words.length === 0 || generating) return;

    setGenerating(true);
    setError("");
    setImage(null);
    setShowAnswers(false);
    setGenerated(true);

    setTimeout(() => {
      document.getElementById("result")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);

    try {
      const createResponse = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          theme,
          words,
          grade,
          difficulty,
          style,
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(
          createData.error || "Не удалось запустить генерацию."
        );
      }

      const operationId = createData.operationId;

      if (!operationId) {
        throw new Error("Polza не вернула operationId.");
      }

      for (let i = 0; i < 150; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const statusResponse = await fetch(
          `/api/generate-status?operationId=${encodeURIComponent(
            operationId
          )}`,
          {
            cache: "no-store",
          }
        );

        const statusData = await statusResponse.json();

        if (!statusResponse.ok) {
          throw new Error(
            statusData.error || "Не удалось проверить результат."
          );
        }

        if (statusData.status === "completed") {
          if (!statusData.imageUrl) {
            throw new Error(
              "Изображение готово, но ссылка на него не получена."
            );
          }

          setImage(statusData.imageUrl);
          return;
        }

        if (
          statusData.status === "failed" ||
          statusData.status === "cancelled"
        ) {
          throw new Error(
            statusData.error || "Генерация изображения не удалась."
          );
        }
      }

      throw new Error(
        "Генерация занимает дольше обычного. Попробуйте ещё раз."
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Произошла ошибка."
      );
    } finally {
      setGenerating(false);
    }
  };

  const downloadPNG = async () => {
    if (!image) return;

    try {
      const response = await fetch(image);

      if (!response.ok) {
        throw new Error("Не удалось получить изображение.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `slovarnaya-kartochka-${theme || "kartochka"}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch {
      // Если браузер не разрешил скачать файл напрямую,
      // открываем изображение в новой вкладке.
      window.open(image, "_blank");
    }
  };

  const downloadPDF = () => {
    if (!image) return;

    window.print();
  };

  const resetCard = () => {
    setGenerated(false);
    setImage(null);
    setError("");
    setShowAnswers(false);

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 50);
  };

  return (
    <main className="min-h-screen">
      <header className="border-b border-[#e5e9e5] bg-white/90 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e7f0e7] text-xl">
              ✦
            </div>

            <div>
              <div className="font-bold">Словарные карточки</div>
              <div className="text-xs text-gray-500">
                Конструктор для начальной школы
              </div>
            </div>
          </div>

          <button
            className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Мои карточки
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12">
        <div className="max-w-3xl print:hidden">
          <div className="mb-3 inline-flex rounded-full bg-[#e7f0e7] px-3 py-1 text-xs font-semibold text-[#345b38]">
            Обучение через игру
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Создайте карточку,
            <br />
            в которой слова нужно{" "}
            <span className="text-[#4f7f52]">найти</span>.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
            Задайте сюжет и словарные слова — сервис подготовит иллюстрацию и
            задания для детей.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px] print:hidden">
          <div className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-sm">
            <label className="text-sm font-bold">Тема изображения</label>

            <div className="mt-2 flex gap-2">
              <input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Например: осенний парк"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#4f7f52] focus:ring-2 focus:ring-[#dcebdc]"
              />

              <button
                onClick={() =>
                  setTheme(
                    presets[Math.floor(Math.random() * presets.length)]
                  )
                }
                className="rounded-xl border px-4 text-sm hover:bg-gray-50"
              >
                🎲
              </button>
            </div>

            <label className="mt-7 block text-sm font-bold">
              Словарные слова
            </label>

            <div className="mt-2 rounded-xl border border-gray-200 p-3">
              <div className="mb-2 flex flex-wrap gap-2">
                {words.map((w) => (
                  <span
                    key={w}
                    className="rounded-full bg-[#eef5ee] px-3 py-1.5 text-sm"
                  >
                    {w}

                    <button
                      onClick={() =>
                        setWords(words.filter((x) => x !== w))
                      }
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addWord();
                    }
                  }}
                  placeholder={
                    words.length >= 12
                      ? "Максимум 12 слов"
                      : "Введите слово и нажмите Enter"
                  }
                  className="w-full border-0 px-1 py-2 outline-none"
                />

                <button
                  onClick={addWord}
                  disabled={words.length >= 12}
                  className="rounded-lg bg-gray-100 px-3 text-sm disabled:opacity-40"
                >
                  Добавить
                </button>
              </div>

              <div className="mt-2 text-xs text-gray-400">
                {words.length}/12 слов
              </div>
            </div>

            <div className="mt-7 grid gap-6 sm:grid-cols-3">
              <Option title="Класс">
                <div className="flex gap-2">
                  {["1", "2", "3", "4"].map((x) => (
                    <button
                      key={x}
                      onClick={() => setGrade(x)}
                      className={`h-10 w-10 rounded-lg border ${
                        grade === x
                          ? "border-[#4f7f52] bg-[#e7f0e7] font-bold"
                          : "border-gray-200"
                      }`}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </Option>

              <Option title="Сложность">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5"
                >
                  <option>Простая</option>
                  <option>Средняя</option>
                  <option>Сложная</option>
                </select>
              </Option>

              <Option title="Стиль">
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5"
                >
                  <option>Реалистичная иллюстрация</option>
                  <option>Книжная иллюстрация</option>
                  <option>Акварель</option>
                  <option>Цветные карандаши</option>
                </select>
              </Option>
            </div>

            <label className="mt-7 flex cursor-pointer items-center gap-3 rounded-xl bg-[#f7f9f7] p-4">
              <input
                type="checkbox"
                checked={checking}
                onChange={(e) => setChecking(e.target.checked)}
                className="h-4 w-4 accent-[#4f7f52]"
              />

              <span>
                <span className="block text-sm font-semibold">
                  Проверять картинку автоматически
                </span>

                <span className="text-xs text-gray-500">
                  Проверим, что все заданные объекты присутствуют.
                </span>
              </span>
            </label>

            <button
              onClick={generate}
              disabled={
                !theme.trim() || words.length === 0 || generating
              }
              className="mt-6 w-full rounded-xl bg-[#4f7f52] py-4 font-bold text-white shadow-sm transition hover:bg-[#345b38] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {generating
                ? "Создаём карточку…"
                : "Создать карточку"}
            </button>

            <p className="mt-3 text-center text-xs text-gray-400">
              Изображение создаётся с помощью Gemini.
            </p>
          </div>

          <aside className="rounded-3xl border border-[#e2e7e2] bg-[#f1f6f1] p-6">
            <div className="text-sm font-bold">Как это работает</div>

            <div className="mt-5 space-y-5 text-sm">
              <Step
                n="1"
                t="Введите сюжет"
                d="Например, «Осенний парк»."
              />

              <Step
                n="2"
                t="Добавьте слова"
                d="Дети будут искать не написанные слова, а предметы на картинке."
              />

              <Step
                n="3"
                t="Создайте карточку"
                d="ИИ сформирует сцену и учебные задания."
              />
            </div>

            <div className="mt-8 rounded-2xl bg-white p-4 text-xs leading-5 text-gray-500">
              <b className="text-gray-700">Совет:</b> для первой карточки
              добавьте 5–10 слов. Так ребёнку будет легче сосредоточиться на
              поиске.
            </div>
          </aside>
        </div>

        {generated && (
          <section
            id="result"
            className="mt-10 rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-sm print:mt-0 print:border-0 print:p-0 print:shadow-none"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Предпросмотр карточки
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Тема: {theme} · {grade} класс · {difficulty}
                </p>
              </div>

              <span className="rounded-full bg-[#e7f0e7] px-3 py-1 text-xs font-semibold text-[#345b38] print:hidden">
                Демо
              </span>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr] print:block">
              <div className="grid min-h-[430px] place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#edf3e9] via-[#f7f4e8] to-[#e7eee8] p-4 text-center print:min-h-0 print:bg-white print:p-0">
                {image ? (
                  <img
                    src={image}
                    alt={`Иллюстрация: ${theme}`}
                    className="h-auto w-full rounded-xl object-contain print:rounded-none"
                  />
                ) : generating ? (
                  <div className="print:hidden">
                    <div className="text-5xl">✦</div>

                    <p className="mt-5 font-semibold text-gray-700">
                      Создаём иллюстрацию…
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      Это может занять некоторое время.
                    </p>
                  </div>
                ) : error ? (
                  <div className="print:hidden">
                    <p className="font-semibold text-red-700">
                      Не удалось создать карточку
                    </p>

                    <p className="mt-2 max-w-xl text-sm text-gray-600">
                      {error}
                    </p>
                  </div>
                ) : (
                  <div className="print:hidden">
                    <p className="font-semibold text-gray-700">
                      Готовим карточку
                    </p>
                  </div>
                )}
              </div>

              <div className="print:mt-6">
                <h3 className="font-bold">Слова для поиска</h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {words.map((w) => (
                    <span
                      key={w}
                      className="rounded-full border px-3 py-1.5 text-sm"
                    >
                      {w}
                    </span>
                  ))}
                </div>

                <h3 className="mt-7 font-bold">Задания</h3>

                <ol className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
                  <li>
                    1. Найди на картинке все предметы, которые обозначают
                    словарные слова.
                  </li>

                  <li>
                    2. Запиши найденные слова в тетрадь.
                  </li>

                  <li>
                    3. Подчеркни букву, написание которой нужно запомнить.
                  </li>

                  <li>
                    4. Составь предложение с двумя найденными словами.
                  </li>
                </ol>

                {showAnswers && (
                  <div className="mt-6 rounded-2xl border border-[#dcebdc] bg-[#f7faf7] p-4">
                    <div className="font-bold text-[#345b38]">
                      Ответы для учителя
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      На картинке необходимо найти:
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {words.map((word) => (
                        <span
                          key={word}
                          className="rounded-full bg-white px-3 py-1.5 text-sm font-medium"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-7 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 print:hidden">
                  <button
                    onClick={downloadPNG}
                    disabled={!image}
                    className="rounded-xl border py-3 text-sm font-semibold transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Скачать PNG
                  </button>

                  <button
                    onClick={downloadPDF}
                    disabled={!image}
                    className="rounded-xl border py-3 text-sm font-semibold transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Скачать PDF
                  </button>

                  <button
                    onClick={() => setShowAnswers(!showAnswers)}
                    className="rounded-xl bg-[#4f7f52] py-3 text-sm font-semibold text-white transition hover:bg-[#345b38]"
                  >
                    {showAnswers
                      ? "Скрыть ответы"
                      : "Ответы для учителя"}
                  </button>

                  <button
                    onClick={resetCard}
                    className="rounded-xl border border-[#dcebdc] bg-[#f7faf7] py-3 text-sm font-semibold text-[#345b38] transition hover:bg-[#eef5ee]"
                  >
                    Создать новую карточку
                  </button>
                </div>
              </div>
            </div>

            <details className="mt-6 rounded-xl bg-gray-50 p-4 print:hidden">
              <summary className="cursor-pointer text-sm font-semibold">
                Технический предпросмотр промпта
              </summary>

              <pre className="mt-3 whitespace-pre-wrap text-xs leading-5 text-gray-500">
                {promptPreview}
              </pre>
            </details>
          </section>
        )}
      </section>
    </main>
  );
}

function Option({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-bold">{title}</div>
      {children}
    </div>
  );
}

function Step({
  n,
  t,
  d,
}: {
  n: string;
  t: string;
  d: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#dcebdc] text-xs font-bold text-[#345b38]">
        {n}
      </div>

      <div>
        <div className="font-semibold">{t}</div>

        <div className="mt-1 leading-5 text-gray-500">{d}</div>
      </div>
    </div>
  );
}