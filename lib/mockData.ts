import { Module } from "@/types/module";

// Генерируем моковые данные для модулей
export const generateMockModules = (count: number): Module[] => {
  const modules: Module[] = [];
  const currentDate = new Date();

  // Создаем модули с разными названиями для реалистичности
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
      termCount: lessonGroups[i].count,
      author: "manblax",
      createdAt: createdDate,
      updatedAt: createdDate,
    });
  }

  // Добавляем дополнительные модули если нужно
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
    });
  }

  return modules;
};

// Экспортируем статический список модулей
export const mockModules = generateMockModules(100);

