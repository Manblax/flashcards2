"use client";

import { useState } from "react";

interface TermCard {
  id: string;
  term: string;
  definition: string;
}

export default function CreatePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<TermCard[]>([
    { id: "1", term: "", definition: "" },
    { id: "2", term: "", definition: "" },
  ]);

  const addCard = () => {
    setCards([
      ...cards,
      { id: Date.now().toString(), term: "", definition: "" },
    ]);
  };

  const removeCard = (id: string) => {
    if (cards.length > 1) {
      setCards(cards.filter((card) => card.id !== id));
    }
  };

  const updateCard = (id: string, field: "term" | "definition", value: string) => {
    setCards(
      cards.map((card) =>
        card.id === id ? { ...card, [field]: value } : card
      )
    );
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Заголовок страницы */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Создать новый модуль</h1>
          <button className="btn btn-primary px-8">Создать</button>
        </div>

        {/* Форма описания модуля */}
        <div className="space-y-4 mb-12">
          <div className="form-control">
            <input
              type="text"
              placeholder="Название"
              className="input input-bordered w-full bg-base-300/50 border-neutral/20 focus:border-primary/50 text-lg font-medium placeholder:text-neutral-content/50"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-control">
            <textarea
              placeholder="Добавьте описание..."
              className="textarea textarea-bordered w-full bg-base-300/50 border-neutral/20 focus:border-primary/50 text-base min-h-[100px] placeholder:text-neutral-content/50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Инструменты списка (удаление всех, настройки и т.д. - заглушка под дизайн) */}
        <div className="flex justify-end mb-6">
           <button className="btn btn-ghost btn-circle btn-sm text-neutral-content hover:text-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
           </button>
        </div>

        {/* Список карточек */}
        <div className="space-y-6">
          {cards.map((card, index) => (
            <div key={card.id} className="card bg-base-300/50 border border-neutral/20">
              <div className="card-body p-6">
                {/* Хедер карточки: Номер и действия */}
                <div className="flex justify-between items-center mb-4 border-b border-neutral/10 pb-4">
                  <span className="text-neutral-content font-medium">{index + 1}</span>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-ghost btn-xs btn-circle text-neutral-content cursor-move">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    <button 
                      className="btn btn-ghost btn-xs btn-circle text-neutral-content hover:text-error"
                      onClick={() => removeCard(card.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Поля ввода */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Термин */}
                  <div className="flex-1 form-control w-full">
                    <input
                      type="text"
                      className="input input-ghost w-full border-b-2 border-transparent border-b-neutral/30 focus:border-b-warning focus:bg-base-200/50 rounded-none px-0 text-white placeholder:text-neutral-content/50 transition-all"
                      value={card.term}
                      onChange={(e) => updateCard(card.id, "term", e.target.value)}
                    />
                    <label className="label px-0 pt-2">
                      <span className="label-text-alt text-neutral-content uppercase tracking-wider text-xs font-bold">Термин</span>
                    </label>
                  </div>

                  {/* Определение */}
                  <div className="flex-1 form-control w-full">
                    <input
                      type="text"
                      className="input input-ghost w-full border-b-2 border-transparent border-b-neutral/30 focus:border-b-warning focus:bg-base-200/50 rounded-none px-0 text-white placeholder:text-neutral-content/50 transition-all"
                      value={card.definition}
                      onChange={(e) => updateCard(card.id, "definition", e.target.value)}
                    />
                    <label className="label px-0 pt-2">
                       <span className="label-text-alt text-neutral-content uppercase tracking-wider text-xs font-bold">Определение</span>
                    </label>
                  </div>

                  {/* Загрузка изображения */}
                  <div className="flex-none">
                     <button className="w-20 h-20 border-2 border-dashed border-neutral/30 hover:border-neutral/60 rounded-lg flex flex-col items-center justify-center gap-1 text-neutral-content hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] uppercase font-bold">Изобр...</span>
                     </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Кнопка добавления карточки */}
        <div className="flex justify-center mt-12 mb-20">
          <button 
            className="btn btn-lg bg-base-300 hover:bg-base-200 text-white border-neutral/20 min-w-[200px]"
            onClick={addCard}
          >
            <span className="font-bold text-lg">+ Добавить карточку</span>
          </button>
        </div>
      </div>
    </div>
  );
}
