"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Module } from "@/types/module";
import {
  createModule,
  getPublicApiUrl,
  lookupDictionary,
  updateModule,
  uploadFile,
  type DictionaryDefinition,
} from "@/lib/api";

interface TermCard {
  id: string;
  term: string;
  definition: string;
  image?: string;
}

interface ModuleFormProps {
  initialData?: Module;
  mode: "create" | "edit";
}

export default function ModuleForm({ initialData, mode }: ModuleFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCardId, setUploadingCardId] = useState<string | null>(null);
  const [lookupCardId, setLookupCardId] = useState<string | null>(null);
  const [lookupOptions, setLookupOptions] = useState<Record<string, DictionaryDefinition[]>>({});
  const [lookupErrors, setLookupErrors] = useState<Record<string, string>>({});
  
  // Инициализация карточек
  const [cards, setCards] = useState<TermCard[]>(() => {
    if (initialData?.terms && initialData.terms.length > 0) {
      return initialData.terms.map(t => ({
        id: t.id,
        term: t.term,
        definition: t.definition,
        image: t.image
      }));
    }
    return [
      { id: "1", term: "", definition: "" },
      { id: "2", term: "", definition: "" },
    ];
  });

  const addCard = () => {
    setCards([
      ...cards,
      { id: Date.now().toString(), term: "", definition: "" },
    ]);
  };

  const removeCard = (id: string) => {
    if (cards.length > 0) {
      setCards(cards.filter((card) => card.id !== id));
    }
  };

  const updateCard = (id: string, field: "term" | "definition" | "image", value: string) => {
    setCards((currentCards) =>
      currentCards.map((card) =>
        card.id === id ? { ...card, [field]: value } : card
      )
    );
  };

  const applyDefinition = (cardId: string, definition: string) => {
    updateCard(cardId, "definition", definition);
    setLookupOptions((options) => {
      const nextOptions = { ...options };
      delete nextOptions[cardId];
      return nextOptions;
    });
    setLookupErrors((errors) => {
      const nextErrors = { ...errors };
      delete nextErrors[cardId];
      return nextErrors;
    });
  };

  const handleDictionaryLookup = async (card: TermCard) => {
    const term = card.term.trim();

    if (!term) {
      setLookupErrors((errors) => ({
        ...errors,
        [card.id]: "Введите термин",
      }));
      return;
    }

    setLookupCardId(card.id);
    setLookupErrors((errors) => {
      const nextErrors = { ...errors };
      delete nextErrors[card.id];
      return nextErrors;
    });

    try {
      const result = await lookupDictionary(term);
      const definitions = result.definitions.filter((definition) => definition.text);

      if (definitions.length === 0 || !result.suggestedDefinition) {
        setLookupOptions((options) => {
          const nextOptions = { ...options };
          delete nextOptions[card.id];
          return nextOptions;
        });
        setLookupErrors((errors) => ({
          ...errors,
          [card.id]: "Определение не найдено",
        }));
        return;
      }

      if (!card.definition.trim() && definitions.length === 1) {
        applyDefinition(card.id, result.suggestedDefinition);
        return;
      }

      setLookupOptions((options) => ({
        ...options,
        [card.id]: definitions.slice(0, 5),
      }));
    } catch (error) {
      console.error("Dictionary lookup failed", error);
      setLookupErrors((errors) => ({
        ...errors,
        [card.id]: "Не удалось получить определение",
      }));
    } finally {
      setLookupCardId(null);
    }
  };

  const handleImageClick = (cardId: string) => {
    setUploadingCardId(cardId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingCardId) {
      try {
        const { url } = await uploadFile(file);
        const fullUrl = getPublicApiUrl(url);
        updateCard(uploadingCardId, "image", fullUrl);
      } catch (error) {
        console.error("Upload failed", error);
        alert("Ошибка загрузки изображения");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadingCardId(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Пожалуйста, введите название модуля");
      return;
    }

    // Фильтруем пустые карточки
    const validTerms = cards.filter(c => c.term.trim() || c.definition.trim()).map(c => ({
      term: c.term,
      definition: c.definition,
      image: c.image
    }));

    if (validTerms.length < 2) {
      alert("Добавьте как минимум 2 термина");
      return;
    }

    setIsSaving(true);

    try {
      const moduleData = {
        title,
        description,
        terms: validTerms
      };

      if (mode === "create") {
        await createModule(moduleData);
        router.push("/");
        router.refresh(); // Обновляем список модулей на главной
      } else if (initialData?.id) {
        await updateModule(initialData.id, moduleData);
        router.push(`/module/${initialData.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to save module:", error);
      alert("Ошибка при сохранении модуля");
    } finally {
      setIsSaving(false);
    }
  };

  const moduleInputClassName =
    "input w-full rounded-2xl border border-transparent bg-[#111233] px-5 text-lg font-medium text-white placeholder:text-[#98a2ca] transition-[border-color,box-shadow,background-color] duration-150 hover:bg-[#15183d] focus:bg-[#1d2149] focus:border-[#a9b0ff] focus:shadow-[0_0_0_1px_rgba(169,176,255,0.45)] focus:outline-none";

  const moduleTextareaClassName =
    "textarea w-full min-h-[100px] rounded-2xl border border-transparent bg-[#111233] px-5 py-4 text-base text-white placeholder:text-[#98a2ca] transition-[border-color,box-shadow,background-color] duration-150 hover:bg-[#15183d] focus:bg-[#1d2149] focus:border-[#a9b0ff] focus:shadow-[0_0_0_1px_rgba(169,176,255,0.45)] focus:outline-none";

  const termInputClassName =
    "input w-full rounded-xl border border-transparent bg-[#0f1130] px-4 text-lg font-semibold text-white placeholder:text-[#98a2ca] transition-[border-color,box-shadow,background-color] duration-150 hover:bg-[#14173a] focus:bg-[#1a1f45] focus:border-[#a9b0ff] focus:shadow-[0_0_0_1px_rgba(169,176,255,0.45)] focus:outline-none";

  return (
    <div className="max-w-5xl mx-auto">
      {/* Хедер формы с действиями */}
      <div className="flex items-center justify-between mb-8 sticky top-[64px] z-10 bg-base-100/95 backdrop-blur py-4">
        {mode === "edit" ? (
           <Link href={`/module/${initialData?.id}`} className="btn btn-primary btn-sm px-6 rounded-full font-bold">
             Назад к модулю
           </Link>
        ) : (
           <h1 className="text-2xl font-bold text-white">Создать новый модуль</h1>
        )}
        
        <button 
          className="btn btn-primary btn-sm px-8 rounded-full font-bold"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            mode === "create" ? "Создать" : "Готово"
          )}
        </button>
      </div>

      {/* Форма описания модуля */}
      <div className="space-y-4 mb-12">
        <div className="form-control">
          <label className="label pl-0 pb-1" hidden={mode === "create"}>
             <span className="label-text text-neutral-content text-xs font-bold uppercase">Название</span>
          </label>
          <input
            type="text"
            placeholder="Название" // Для create
            className={moduleInputClassName}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-control">
          <textarea
            placeholder="Добавьте описание..."
            className={moduleTextareaClassName}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      {/* Инструменты списка */}
      <div className="flex justify-end mb-6">
         {/* Можно добавить доп действия */}
      </div>

      {/* Список карточек */}
      <div className="space-y-6">
        {cards.map((card, index) => (
          <div key={card.id} className="card bg-base-300/50 border border-neutral/20">
            <div className="card-body p-6">
              {/* Хедер карточки */}
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
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className={termInputClassName}
                      value={card.term}
                      onChange={(e) => updateCard(card.id, "term", e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn h-12 min-h-12 w-12 rounded-xl border-transparent bg-[#1d2149] p-0 text-[#dce0ff] hover:bg-[#293064]"
                      onClick={() => handleDictionaryLookup(card)}
                      disabled={lookupCardId === card.id}
                      title="Найти определение"
                      aria-label="Найти определение"
                    >
                      {lookupCardId === card.id ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <label className="label px-0 pt-2">
                    <span className="label-text-alt text-neutral-content uppercase tracking-wider text-xs font-bold">Термин</span>
                  </label>
                </div>

                {/* Определение */}
                <div className="flex-1 form-control w-full">
                  <input
                    type="text"
                    className={termInputClassName}
                    value={card.definition}
                    onChange={(e) => updateCard(card.id, "definition", e.target.value)}
                  />
                  <label className="label px-0 pt-2">
                     <span className="label-text-alt text-neutral-content uppercase tracking-wider text-xs font-bold">Определение</span>
                  </label>
                  {lookupErrors[card.id] ? (
                    <div className="text-xs font-semibold text-error">{lookupErrors[card.id]}</div>
                  ) : null}
                </div>

                {/* Загрузка изображения */}
                <div className="flex-none pt-1">
                   <button 
                     className="w-24 h-20 border-2 border-dashed border-neutral/30 hover:border-neutral/60 rounded-lg flex flex-col items-center justify-center gap-1 text-neutral-content hover:text-white transition-colors overflow-hidden relative"
                     onClick={() => handleImageClick(card.id)}
                   >
                      {card.image ? (
                        <>
                            <img src={card.image} alt="term" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                               </svg>
                            </div>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[10px] uppercase font-bold tracking-wide">Изображение</span>
                        </>
                      )}
                   </button>
                </div>
              </div>

              {lookupOptions[card.id]?.length ? (
                <div className="mt-4 rounded-lg border border-neutral/20 bg-[#0f1130] p-3">
                  <div className="mb-2 text-xs font-bold uppercase text-neutral-content">Выберите определение</div>
                  <div className="space-y-2">
                    {lookupOptions[card.id].map((definition, definitionIndex) => (
                      <button
                        type="button"
                        key={`${definition.text}-${definitionIndex}`}
                        className="block w-full rounded-md px-3 py-2 text-left text-sm text-white hover:bg-[#1d2149]"
                        onClick={() => applyDefinition(card.id, definition.text)}
                      >
                        <span className="font-semibold text-[#a9b0ff]">
                          {definition.partOfSpeech || definition.source}
                        </span>
                        <span className="ml-2">{definition.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
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

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
}
