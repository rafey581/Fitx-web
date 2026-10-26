"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/field";
import { ActionForm } from "@/components/ui/action-form";
import { inputClass } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveMenusAction } from "@/server/actions/menus";
import { LinkType } from "@/generated/prisma/enums";

export type MenuManagerItem = {
  /** Client key — equals the DB id for existing rows. */
  key: string;
  label: string;
  linkType: LinkType;
  pageId: string | null;
  url: string | null;
  newTab: boolean;
  parentKey: string | null;
};

export type PageOption = { id: string; title: string; slug: string };

type MenuKind = "header" | "footer";

const newItem = (): MenuManagerItem => ({
  key: crypto.randomUUID(),
  label: "",
  linkType: LinkType.URL,
  pageId: null,
  url: "",
  newTab: false,
  parentKey: null,
});

function MenuEditor({
  kind,
  items,
  setItems,
  pages,
}: {
  kind: MenuKind;
  items: MenuManagerItem[];
  setItems: (updater: (items: MenuManagerItem[]) => MenuManagerItem[]) => void;
  pages: PageOption[];
}) {
  const update = (key: string, patch: Partial<MenuManagerItem>) =>
    setItems((list) =>
      list.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );

  const remove = (key: string) =>
    setItems((list) => list.filter((item) => item.key !== key));

  const move = (key: string, direction: -1 | 1) =>
    setItems((list) => {
      const index = list.findIndex((item) => item.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const add = () => setItems((list) => [...list, newItem()]);

  // Only items without a parent are eligible parents (one level of nesting).
  const parentOptions = items.filter((item) => item.parentKey === null);

  return (
    <section className="rounded-brand border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-ink">
            {kind === "header" ? "Header menu" : "Footer menu"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {items.length} link{items.length === 1 ? "" : "s"}. Use parent to
            nest a link one level deep (dropdown).
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="btn btn-outline px-4 py-2 text-[0.7rem]"
        >
          + Add link
        </button>
      </div>

      {items.length === 0 ? (
        <p className="mt-5 rounded-brand border border-dashed border-black/20 p-6 text-center text-sm text-muted">
          No links yet — add one above.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {items.map((item, index) => (
            <li
              key={item.key}
              className="rounded-brand border border-black/10 bg-black/[0.02] p-4"
            >
              <div className="grid items-start gap-3 sm:grid-cols-[1fr_140px_1fr_auto]">
                <input
                  type="text"
                  value={item.label}
                  onChange={(event) =>
                    update(item.key, { label: event.target.value })
                  }
                  placeholder="Link label"
                  aria-label="Link label"
                  className={inputClass}
                />
                <select
                  value={item.linkType}
                  onChange={(event) =>
                    update(item.key, {
                      linkType: event.target.value as LinkType,
                    })
                  }
                  aria-label="Link type"
                  className={inputClass}
                >
                  <option value={LinkType.PAGE}>Page</option>
                  <option value={LinkType.URL}>Custom URL</option>
                </select>

                {item.linkType === LinkType.PAGE ? (
                  <select
                    value={item.pageId ?? ""}
                    onChange={(event) =>
                      update(item.key, { pageId: event.target.value || null })
                    }
                    aria-label="Page"
                    className={inputClass}
                  >
                    <option value="">Select a page…</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.title} (
                        {page.slug === "home" ? "/" : `/${page.slug}`})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={item.url ?? ""}
                    onChange={(event) =>
                      update(item.key, { url: event.target.value })
                    }
                    placeholder="https://… or /path"
                    aria-label="URL"
                    className={inputClass}
                  />
                )}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(item.key, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="grid h-8 w-8 place-items-center rounded-full border border-black/10 text-sm disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(item.key, 1)}
                    disabled={index === items.length - 1}
                    aria-label="Move down"
                    className="grid h-8 w-8 place-items-center rounded-full border border-black/10 text-sm disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.key)}
                    aria-label="Remove link"
                    className="grid h-8 w-8 place-items-center rounded-full border border-red-200 text-sm text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={item.newTab}
                    onChange={(event) =>
                      update(item.key, { newTab: event.target.checked })
                    }
                    className="h-3.5 w-3.5"
                  />
                  Open in new tab
                </label>
                <label className="flex items-center gap-2 text-xs text-muted">
                  Parent
                  <select
                    value={item.parentKey ?? ""}
                    onChange={(event) =>
                      update(item.key, {
                        parentKey: event.target.value || null,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="">(top level)</option>
                    {parentOptions
                      .filter((option) => option.key !== item.key)
                      .map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label || "Untitled link"}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function MenusManager({
  header,
  footer,
  pages,
}: {
  header: MenuManagerItem[];
  footer: MenuManagerItem[];
  pages: PageOption[];
}) {
  const [headerItems, setHeaderItems] = useState(header);
  const [footerItems, setFooterItems] = useState(footer);

  return (
    <ActionForm action={saveMenusAction} className="space-y-6">
      {(state) => (
        <>
          {state.error ? <Alert variant="error">{state.error}</Alert> : null}
          {state.message ? (
            <Alert variant="success">{state.message}</Alert>
          ) : null}
          {state.fieldErrors?.header || state.fieldErrors?.footer ? (
            <Alert variant="error">
              {state.fieldErrors?.header?.[0] ?? state.fieldErrors?.footer?.[0]}
            </Alert>
          ) : null}

          <input
            type="hidden"
            name="header"
            value={JSON.stringify(headerItems)}
          />
          <input
            type="hidden"
            name="footer"
            value={JSON.stringify(footerItems)}
          />

          <div className="grid gap-6 xl:grid-cols-2">
            <MenuEditor
              kind="header"
              items={headerItems}
              setItems={setHeaderItems}
              pages={pages}
            />
            <MenuEditor
              kind="footer"
              items={footerItems}
              setItems={setFooterItems}
              pages={pages}
            />
          </div>

          <div>
            <SubmitButton pendingLabel="Saving…">Save menus</SubmitButton>
            <p className="mt-2 text-xs text-muted">
              Changes apply to the public header and footer immediately after
              saving.
            </p>
          </div>
        </>
      )}
    </ActionForm>
  );
}
