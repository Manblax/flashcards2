import { Module, Term } from "@/types/module";

const sampleTerms: Term[] = [
  { id: "t1", term: "mashed potato", definition: "potatoes that have been boiled and crushed until they are smooth", isFavorite: true },
  { id: "t2", term: "cranberry", definition: "a small, round, red fruit with a sour taste" },
  { id: "t3", term: "solidify", definition: "to change from being a liquid or gas to a solid form, or to make something do this" },
  { id: "t4", term: "elongated", definition: "longer and thinner than usual" },
  { id: "t5", term: "starchy", definition: "containing a lot of starch (крахмалистый)" },
  { id: "t6", term: "ingrained", definition: "(of beliefs) so firmly held that they are not likely to change (укоренившийся)" },
  { id: "t7", term: "savoury", definition: "Savoury food is salty or spicy and not sweet in taste (пикантный)" },
  { id: "t8", term: "blessing", definition: "благословение" },
];

// Генерируем моковые данные для модулей
export const generateMockModules = (count: number): Module[] => {
  const modules: Module[] = [];
  const currentDate = new Date();

  const lessonGroups = [
    { prefix: "Lesson 443 - 445", count: 12 },
    { prefix: "Lesson 441 - 442", count: 12 },
    { prefix: "Lesson 440", count: 12 },
    { prefix: "Lesson 439", count: 20 },
    { prefix: "Lesson 438", count: 26 },
    { prefix: "Lesson 435 - 437", count: 30 },
    { prefix: "Lesson 367 - 368", count: 28 },
    { prefix: "Lesson 363 - 366", count: 21 },
    { prefix: "Lesson 361 - 362", count: 31 },
    { prefix: "Lesson 360", count: 8 },
    { prefix: "Lesson 359", count: 23 },
  ];

  for (let i = 0; i < Math.min(count, lessonGroups.length); i++) {
    const createdDate = new Date(currentDate);
    createdDate.setDate(createdDate.getDate() - i * 2);

    modules.push({
      id: `module-${i + 1}`,
      title: lessonGroups[i].prefix,
      description: "Описание модуля с полезными терминами для изучения английского языка.",
      termCount: lessonGroups[i].count,
      author: "manblax",
      createdAt: createdDate,
      updatedAt: createdDate,
      // Добавляем термины во все модули для демо
      terms: sampleTerms,
    });
  }

  // Добавляем дополнительные модули
  for (let i = lessonGroups.length; i < count; i++) {
    const createdDate = new Date(currentDate);
    createdDate.setDate(createdDate.getDate() - i * 2);

    modules.push({
      id: `module-${i + 1}`,
      title: `Lesson ${440 - i}`,
      termCount: Math.floor(Math.random() * 30) + 8,
      author: "manblax",
      createdAt: createdDate,
      updatedAt: createdDate,
      terms: sampleTerms,
    });
  }

  return modules;
};

// Экспортируем статический список модулей
export const mockModules = generateMockModules(100);
