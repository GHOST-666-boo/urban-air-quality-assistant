"use client";

import React from "react";
import type { FamilyMember } from "@/types/air-quality";
import { SENSITIVITIES } from "@/lib/presets";
import { Users, Plus, Trash2 } from "lucide-react";

/** Props accepted by {@link FamilyMembersEditor}. */
interface FamilyMembersEditorProps {
  /** Current list of household members and their health sensitivities. */
  members: FamilyMember[];
  /** Handler invoked to append a new household member row. */
  onAdd: () => void;
  /** Handler invoked to remove a household member row by ID. */
  onRemove: (id: string) => void;
  /** Handler invoked when a member field changes. */
  onUpdate: (id: string, field: keyof FamilyMember, value: string) => void;
}

/**
 * Modular editor for adding, removing, and tagging household members
 * with age groups and respiratory/cardiovascular health sensitivities.
 */
export default function FamilyMembersEditor({
  members,
  onAdd,
  onRemove,
  onUpdate,
}: FamilyMembersEditorProps) {
  return (
    <fieldset className="border-0 p-0 m-0">
      <div className="flex items-center justify-between mb-2">
        <legend className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-300">
          <Users className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
          Household Members ({members.length})
        </legend>
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add another household member"
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          Add Member
        </button>
      </div>

      <div className="space-y-2.5">
        {members.map((member, index) => (
          <div
            key={member.id}
            className="grid grid-cols-12 gap-2 items-center bg-slate-950/70 p-2.5 rounded-xl border border-slate-800"
          >
            <input
              type="text"
              value={member.label}
              onChange={(e) => onUpdate(member.id, "label", e.target.value)}
              aria-label={`Member ${index + 1} role or name`}
              placeholder="Label"
              className="col-span-4 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
            />
            <input
              type="text"
              value={member.ageGroup}
              onChange={(e) => onUpdate(member.id, "ageGroup", e.target.value)}
              aria-label={`Member ${index + 1} age`}
              placeholder="Age"
              className="col-span-3 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
            />
            <select
              value={member.sensitivity}
              onChange={(e) =>
                onUpdate(member.id, "sensitivity", e.target.value)
              }
              aria-label={`Member ${index + 1} health sensitivity`}
              className="col-span-4 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              {SENSITIVITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onRemove(member.id)}
              disabled={members.length <= 1}
              aria-label={`Remove ${member.label || `member ${index + 1}`}`}
              className="col-span-1 flex justify-center text-slate-400 hover:text-rose-400 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
