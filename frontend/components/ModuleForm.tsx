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
  const [activeLookupCardId, setActiveLookupCardId] = useState<string | null>(null);
  const [lookupOptions, setLookupOptions] = useState<Record<string, DictionaryDefinition[]>>({});
  const [lookupErrors, setLookupErrors] = useState<Record<string, string>>({});
  const [lookupTerms, setLookupTerms] = useState<Record<string, string>>({});
  
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

  const updateTerm = (id: string, value: string) => {
    updateCard(id, "term", value);
    setLookupOptions((options) => {
      const nextOptions = { ...options };
      delete nextOptions[id];
      return nextOptions;
    });
    setLookupErrors((errors) => {
      const nextErrors = { ...errors };
      delete nextErrors[id];
      return nextErrors;
    });
    setLookupTerms((terms) => {
      const nextTerms = { ...terms };
      delete nextTerms[id];
      return nextTerms;
    });
  };

  const applyDefinition = (cardId: string, definition: string) => {
    updateCard(cardId, "definition", definition);
    setActiveLookupCardId(null);
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
    setActiveLookupCardId(card.id);

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

      if (definitions.length === 0) {
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

      setLookupOptions((options) => ({
        ...options,
        [card.id]: definitions.slice(0, 5),
      }));
      setLookupTerms((terms) => ({
        ...terms,
        [card.id]: term,
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

  const openDefinitionDropdown = (card: TermCard) => {
    const term = card.term.trim();

    setActiveLookupCardId(card.id);

    if (!term || lookupCardId === card.id) {
      return;
    }

    if (lookupTerms[card.id] === term && lookupOptions[card.id]?.length) {
      return;
    }

    void handleDictionaryLookup(card);
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
    "input h-14 min-h-14 w-full rounded-xl border border-transparent bg-[#090821] px-5 text-lg font-medium text-white placeholder:text-[#98a2ca] transition-[border-color,box-shadow,background-color] duration-150 hover:bg-[#0d0d2a] focus:bg-[#161824] focus:border-[#a9b0ff] focus:shadow-[0_0_0_1px_rgba(169,176,255,0.45)] focus:outline-none";

  const definitionInputClassName =
    "input h-16 min-h-16 w-full rounded-2xl border-2 border-[#a9b0ff] bg-[#171925] px-6 text-xl font-medium text-white placeholder:text-[#98a2ca] transition-[border-color,box-shadow,background-color] duration-150 focus:bg-[#171925] focus:border-[#a9b0ff] focus:shadow-none focus:outline-none";

  return (
    <div className="max-w-5xl mx-auto">
      {/* Хедер формы с действиями */}
      <div className="flex items-center justify-between mb-8 sticky top-[64px] z-10 bg-base-100/95 backdrop-blur py-4">
        {mode === "edit" ? (
           <Link href={`/module/${initialData?.id}`} className="btn btn-primary btn-sm px-6 rounded-full font-semibold">
             Назад к модулю
           </Link>
        ) : (
           <h1 className="text-2xl font-bold text-white">Создать новый модуль</h1>
        )}
        
        <button 
          className="btn btn-primary btn-sm px-8 rounded-full font-semibold"
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
             <span className="label-text text-neutral-content text-xs font-semibold uppercase">Название</span>
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
          <div key={card.id} className="card rounded-[22px] border border-transparent bg-[#303956]">
            <div className="card-body p-6 sm:p-7">
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
                  <input
                    type="text"
                    className={termInputClassName}
                    value={card.term}
                    onChange={(e) => updateTerm(card.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        openDefinitionDropdown(card);
                      }
                    }}
                  />
                  <label className="label px-0 pt-2">
                    <span className="label-text-alt text-neutral-content uppercase tracking-wider text-xs font-semibold">Термин</span>
                  </label>
                </div>

                {/* Определение */}
                <div className="flex-1 form-control w-full relative">
                  <div className="relative">
                    <input
                      type="text"
                      className={
                        activeLookupCardId === card.id &&
                        (lookupCardId === card.id ||
                          lookupErrors[card.id] ||
                          lookupOptions[card.id]?.length)
                          ? definitionInputClassName
                          : termInputClassName
                      }
                      value={card.definition}
                      onChange={(e) => updateCard(card.id, "definition", e.target.value)}
                      onFocus={() => openDefinitionDropdown(card)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setActiveLookupCardId(null);
                        }
                      }}
                    />
                    {lookupCardId === card.id ? (
                      <span className="loading loading-spinner loading-xs absolute right-4 top-1/2 -translate-y-1/2 text-[#dce0ff]"></span>
                    ) : null}
                  </div>
                  <label className="label px-0 pt-2">
                    <span className="label-text-alt text-neutral-content uppercase tracking-wider text-xs font-semibold">
                      Определение
                      {activeLookupCardId === card.id && lookupOptions[card.id]?.length
                        ? ` (${lookupOptions[card.id].length}/1850)`
                        : ""}
                    </span>
                    {activeLookupCardId === card.id &&
                    (lookupCardId === card.id ||
                      lookupErrors[card.id] ||
                      lookupOptions[card.id]?.length) ? (
                      <span className="label-text-alt text-[#a9b0ff] uppercase tracking-wider text-xs font-semibold">
                        Английский
                      </span>
                    ) : null}
                  </label>

                  {activeLookupCardId === card.id &&
                  (lookupCardId === card.id ||
                    lookupErrors[card.id] ||
                    lookupOptions[card.id]?.length) ? (
                    <div className="z-30 mt-8 w-full rounded-none bg-transparent p-0">
                      {lookupCardId === card.id ? (
                        <div className="flex min-h-14 items-center gap-2 rounded-xl border border-[#d8dbef] px-5 py-4 text-base font-normal text-white">
                          <span className="loading loading-spinner loading-xs"></span>
                          Поиск определений...
                        </div>
                      ) : lookupErrors[card.id] ? (
                        <div className="rounded-xl border border-error/70 px-5 py-4 text-base font-normal text-error">
                          {lookupErrors[card.id]}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {lookupOptions[card.id].map((definition, definitionIndex) => (
                            <button
                              type="button"
                              key={`${definition.text}-${definitionIndex}`}
                              className="block min-h-14 w-full rounded-xl border border-[#d8dbef] px-5 py-4 text-left text-base font-normal leading-relaxed text-white transition-colors hover:bg-[#171925] focus:bg-[#171925] focus:outline-none"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => applyDefinition(card.id, definition.text)}
                            >
                              <span>{definition.text}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
                          <span className="text-[10px] uppercase font-semibold tracking-wide">Изображение</span>
                        </>
                      )}
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
          <span className="font-semibold text-lg">+ Добавить карточку</span>
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
